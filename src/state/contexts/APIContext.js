import React, { createContext, useContext } from 'react';
import { useHistory } from 'react-router-dom';

import axios from 'axios';

// context imports
import { UsersContext } from './UsersContext';
import { GroomersContext } from './GroomersContext';
import { CustomersContext } from './CustomersContext';
import { FormContext } from './FormContext';

export const APIContext = createContext({});

const APIProvider = ({ children }) => {
  const history = useHistory();
  const { userInfo, setIsRegistered } = useContext(UsersContext);
  const { setCustInfo } = useContext(CustomersContext);

  const {
    setGroomerInfo,
    setGroomerServices,
    setGroomer,
    setAllGroomers,
    setServices,
    service,
  } = useContext(GroomersContext);
  const {
    setIsEditing,
    isEditing,
    setIsDeleted,
    setShowDelModal,
    setIsError,
    setResultInfo,
  } = useContext(FormContext);

  // we will define a bunch of API calls here.
  const apiUrl = `${process.env.REACT_APP_API_URI}`;

  const sleep = time =>
    new Promise(resolve => {
      setTimeout(resolve, time);
    });

  //example of non-auth API call function
  const getExampleData = () => {
    return axios
      .get(`https://jsonplaceholder.typicode.com/photos?albumId=1`)
      .then(response => response.data);
  };

  //reusable GET functions (auth not required)
  const getGroomerServicesByID = id => {
    return axios
      .get(`${process.env.REACT_APP_API_URI}/groomer_services/${id}`)
      .then(res => {
        setGroomerServices(res.data);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const getGroomers = () => {
    return axios
      .get(`${process.env.REACT_APP_API_URI}/groomers`)
      .then(res => {
        setAllGroomers(res.data);
      })
      .catch(err => {
        console.log('Error', err);
      });
  };

  const getGroomerByID = pathway => {
    return axios
      .get(`${process.env.REACT_APP_API_URI}/groomers/${pathway}`)
      .then(res => {
        setGroomer(res.data);
      })
      .catch(err => {
        console.log(err);
      });
  };

  const getLoggedInGroomer = authState => {
    const headers = getAuthHeader(authState);

    return axios
      .get(`${process.env.REACT_APP_API_URI}/groomers/${userInfo.sub}`, {
        headers,
      })
      .then(res => {
        if (res.data) {
          setGroomerInfo(res.data);
          setIsRegistered(true);
        }
      })
      .catch(err => {
        console.log(err);
      });
  };

  //AUTH

  const getAuthHeader = authState => {
    if (!authState.isAuthenticated) {
      throw new Error('Not authenticated');
    }
    return { Authorization: `Bearer ${authState.idToken}` };
  };

  const apiAuthGet = authHeader => {
    return axios.get(`${apiUrl}/profiles`, { headers: authHeader });
  };

  //Various GET (auth) API calls

  const getLatLng = async address => {
    const formatted_address = address.split(' ').join('+');
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/?q=${formatted_address}&format=json`
    );
    const latLng = [res.data[0].lat, res.data[0].lon];
    return latLng;
  };

  const getProfileData = authState => {
    try {
      return apiAuthGet(getAuthHeader(authState)).then(
        response => response.data
      );
    } catch (error) {
      return new Promise(() => {
        console.log(error);
        return [];
      });
    }
  };

  //used to obtain okta user id to set role
  const getUserID = (url, authState) => {
    // here's another way you can compose together your API calls.
    // Note the use of GetAuthHeader here is a little different than in the getProfileData call.
    const headers = getAuthHeader(authState);
    if (!url) {
      throw new Error('No URL provided');
    }
    return axios
      .get(url, { headers })
      .then(res => res.data)
      .catch(err => err);
  };

  //CUSTOMER/PET OWNER GET CALLS
  const getCustomerByID = authState => {
    const headers = getAuthHeader(authState);

    return axios
      .get(`${process.env.REACT_APP_API_URI}/customers/${userInfo.sub}`, {
        headers,
      })
      .then(res => {
        if (res.data) {
          setCustInfo(res.data);
          setIsRegistered(true);
        }
      })
      .catch(err => {
        console.log(err);
      });
  };

  //GROOMER PROFILE FORM FUNCTIONS
  //User can be groomer or pet owner
  const postUserInfo = (url, authState, infoValues) => {
    const headers = getAuthHeader(authState);
    if (!url) {
      throw new Error('No URL provided');
    }
    return axios
      .post(url, infoValues, { headers })
      .then(res => {
        setResultInfo({
          message: `${res.data.message} You will be redirected shortly`,
          type: 'success',
        });
        setTimeout(() => {
          history.go(0);
        }, 4000);
      })
      .catch(err => {
        setResultInfo({ message: err.message, type: 'error' });
      });
  };

  const putUserInfo = async (url, authState, infoValues) => {
    const headers = getAuthHeader(authState);
    if (!url) {
      throw new Error('No URL provided');
    }
    return axios
      .put(url, infoValues, { headers })
      .then(res => {
        setResultInfo({ message: res.data.message, type: 'success' });
      })
      .then(() => {
        setTimeout(() => {
          setResultInfo({ message: null, type: null });
        }, 3000);
      })
      .catch(err => {
        setResultInfo({ message: err.message, type: 'error' });
      });
  };

  const deleteProfile = (
    authState,
    userType,
    userInfo,
    history,
    setStateVar
  ) => {
    const headers = getAuthHeader(authState);

    return axios
      .delete(`${process.env.REACT_APP_API_URI}/${userType}/${userInfo.sub}`, {
        headers,
      })
      .then(res => {
        history.push('/login');
      })
      .catch(err => {
        setStateVar({ message: err.message, type: 'error' });
      });
  };

  //GROOMER SERVICE SPECIFIC FUNCTIONS
  const postGroomerServices = (url, authState, serviceValues, setStateVar) => {
    const headers = getAuthHeader(authState);
    if (!url) {
      throw new Error('No URL provided');
    }
    return axios
      .post(url, serviceValues, { headers })
      .then(res => {
        setStateVar({ message: res.data.message, type: 'success' });
      })
      .catch(err => {
        setStateVar({ message: err.message, type: 'error' });
      });
  };

  const editGroomerServices = (authState, price) => {
    const headers = getAuthHeader(authState);
    return axios
      .put(
        `${process.env.REACT_APP_API_URI}/groomer_services/${userInfo.sub}?service=${service.id}`,
        price,
        { headers }
      )
      .then(res => {
        setIsEditing(!isEditing);
      })
      .catch(err => {
        setIsError(true);
      });
  };

  const deleteService = (authState, service) => {
    const headers = getAuthHeader(authState);

    return axios
      .delete(
        `${process.env.REACT_APP_API_URI}/groomer_services/${userInfo.sub}?service=${service.id}`,
        { headers }
      )
      .then(res => {
        setIsDeleted(true);
        setShowDelModal(false);
      })
      .catch(err => {
        setIsError(true);
      });
  };

  // API call to get all services
  const getServices = () => {
    return axios
      .get(`${process.env.REACT_APP_API_URI}/services`)
      .then(res => {
        setServices(res.data);
      })
      .catch(err => {
        console.log(err);
      });
  };

  /******************************************************************************
   *                      API calls for pets
   ******************************************************************************/

  const addNewPet = (authState, petInfo) => {
    const headers = getAuthHeader(authState);

    return axios
      .post(`${process.env.REACT_APP_API_URI}/pets/${userInfo.sub}`, petInfo, {
        headers,
      })
      .then(res => {
        console.log(res);
      })
      .catch(err => {
        setIsError(true);
      });
  };

  return (
    <APIContext.Provider
      value={{
        sleep,
        getGroomerServicesByID,
        getGroomers,
        getGroomerByID,
        getLoggedInGroomer,
        getExampleData,
        getProfileData,
        getUserID,
        getCustomerByID,
        postUserInfo,
        putUserInfo,
        postGroomerServices,
        editGroomerServices,
        deleteService,
        deleteProfile,
        addNewPet,
        getServices,
        getLatLng,
      }}
    >
      {children}
    </APIContext.Provider>
  );
};

export default APIProvider;
