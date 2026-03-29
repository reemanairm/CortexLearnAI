import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const submitHelpRequest = async (requestData) => {
    try {
        const response = await axiosInstance.post(API_PATHS.HELP.SUBMIT, requestData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to submit help request' };
    }
};

const getMyHelpRequests = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.HELP.MY_REQUESTS);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch your help requests' };
    }
};

const helpService = {
    submitHelpRequest,
    getMyHelpRequests
};

export default helpService;
