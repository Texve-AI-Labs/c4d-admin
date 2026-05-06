import axios from 'axios';
import { ASYNC_STORAGE_KEYS, getBaseUrl, KYC_PROCESS } from "./constants";

const showDefaultFailureAlert = (message) => {
    if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(message || "Failure");
    }
};

export const ApiRequestUtils = {
    post: async (apiRoute, body, custID = 0, options = {}) => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'token': token,
            'ngrok-skip-browser-warning' : true,
            'ngrok-skip-browser-warning': '69420',
        }
        if (custID != 0) {
            headers['custID'] = custID;
        }
const { data } = await axios.post(getBaseUrl() + apiRoute, body, {
            headers
        });
        if (!data.success && (data.code === 400 || data.code === 415)) { // Unauthorized request
            if (options?.suppressAlert) return data;
            showDefaultFailureAlert(data?.message);
            return;
        } else {
            return data;
        }
    },

    get: async (apiRoute, custID = 0) => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'token': token,
            'ngrok-skip-browser-warning': '69420',
        }
        if (custID != 0) {
            headers['custID'] = custID;
        }
        const { data } = await axios.get(getBaseUrl() + apiRoute, {
            headers
        });
        if (!data.success && (data.code === 400 || data.code === 415)) { // Unauthorized request
            alert('Failure', data.message, [{
                style: 'default', onPress: () => {
                    // navigation.navigate('Welcome');
                }
            }]);
            return;
        } else {
            return data;
        }
    },

    getWithQueryParam: async (apiRoute, params) => {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(getBaseUrl() + apiRoute, {
            headers: {
                'Content-Type': 'application/json',
                'token': token,
                'custID': 63,
                'ngrok-skip-browser-warning': '69420',
            },
            params: params
        });
        if (!data.success && (data.code === 400 || data.code === 415)) { // Unauthorized request
            alert('Failure', data.message, [{
                style: 'default', onPress: () => {
                    // navigation.navigate('Welcome');
                }
            }]);
            return;
        } else {
            return data;
        }
    },

    update: async (apiRoute, body, custID = 0, options = {}) => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'token': token,
            'ngrok-skip-browser-warning': '69420',
        }
        if (custID != 0) {
            headers['custID'] = custID;
        }
        const { data } = await axios.put(getBaseUrl() + apiRoute, body, {
            headers
        });
        if (!data.success && (data.code === 400 || data.code === 415)) { // Unauthorized request
            if (options?.suppressAlert) return data;
            showDefaultFailureAlert(data?.message);
            return;
        } else {
            return data;
        }
    },

    patch: async (apiRoute, body, custID = 0) => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'token': token,
            'ngrok-skip-browser-warning': '69420',
        }
        if (custID != 0) {
            headers['custID'] = custID;
        }
        const { data } = await axios.patch(getBaseUrl() + apiRoute, body, {
            headers
        });
        if (!data.success && (data.code === 400 || data.code === 415)) {
            alert('Failure', data.message, [{
                style: 'default', onPress: () => {
                    // navigation.navigate('Welcome');
                }
            }]);
            return;
        } else {
            return data;
        }
    },

    delete: async (apiRoute, body) => {
        const token = localStorage.getItem('token');
        const { data } = await axios.delete(getBaseUrl() + apiRoute, {
            headers: {
                'Content-Type': 'application/json',
                'token': token,
                'custID': 63,
                'ngrok-skip-browser-warning': '69420',
            },
            data: body
        });
        if (!data.success && (data.code === 400 || data.code === 415)) { // Unauthorized request
            alert('Failure', data.message, [{
                style: 'default', onPress: () => {
                    // navigation.navigate('Welcome');
                }
            }]);
            return;
        } else {
            return data;
        }

    },
    postDocs: async (apiRoute, body) => {
        const token = localStorage.getItem('token');
        const { data } = await axios.post(getBaseUrl() + apiRoute, body, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'token': token
            }
        });
        if (!data.success && (data.code === 400 || data.code === 415)) { // Unauthorized request
            // Alert.alert('Failure', data.message, [{
            //     style: 'default', onPress: () => {
            //         // navigation.navigate('Welcome');
            //     }
            // }]);
            return;
        } else {
            return data;
        }
    },
    updateDocs: async (apiRoute, body, apiMethod) => {
        const token = localStorage.getItem('token');
        const { data } = await axios.put(getBaseUrl() + apiRoute, body, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'token': token
            }
        });
        console.log('data in POST DOCS :', data);
        if (!data.success && (data.code === 400 || data.code === 415)) { // Unauthorized request
            // Alert.alert('Failure', data.message, [{
            //     style: 'default', onPress: () => {
            //         // navigation.navigate('Welcome');
            //     }
            // }]);
            return;
        } else {
            return data;
        }
    },
    fetchExcelDownload: async (apiRoute, custID = 0, params = {}) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');

        const headers = {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'token': token,
            'ngrok-skip-browser-warning' : true,
            'ngrok-skip-browser-warning': '69420',
        };

        if (custID !== 0) {
            headers['custID'] = custID;
        }

        const response = await axios.get(getBaseUrl() + apiRoute, {
            headers,
            params,          
            responseType: 'blob',
        });

        return response;
    },
   fetchPdfDowload: async (apiRoute) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');

    const response = await axios.get(getBaseUrl() + apiRoute, {
        headers: {
            'token': token,
        },
        responseType: 'blob', 
    });

    return response.data;
},


};

