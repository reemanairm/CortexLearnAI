import axiosInstance from '../utils/axiosInstance';
import { BASE_URL } from '../utils/apiPaths';

const API_URL = `${BASE_URL}/api/help`;

const submitHelpRequest = async (requestData) => {
    try {
        const response = await axiosInstance.post(API_URL, requestData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to submit help request' };
    }
};

const getMyHelpRequests = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/my-requests`);
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
