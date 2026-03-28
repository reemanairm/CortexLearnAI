import axiosInstance from '../utils/axiosInstance';
import { BASE_URL } from '../utils/apiPaths';

// Admin endpoints
const API_URL = `${BASE_URL}/api/admin`;

const getStats = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/stats`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch admin stats' };
    }
};

const getUsers = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/users`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch users' };
    }
};

const deleteUser = async (userId) => {
    try {
        const response = await axiosInstance.delete(`${API_URL}/user/${userId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to delete user' };
    }
};

const getDocuments = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/documents`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch documents' };
    }
};

const deleteDocument = async (docId) => {
    try {
        const response = await axiosInstance.delete(`${API_URL}/document/${docId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to delete document' };
    }
};

const getHelpRequests = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/help-requests`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch help requests' };
    }
};

const resolveHelpRequest = async (requestId) => {
    try {
        const response = await axiosInstance.put(`${API_URL}/help-requests/${requestId}/resolve`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to resolve help request' };
    }
};

const adminService = {
    getStats,
    getUsers,
    deleteUser,
    getDocuments,
    deleteDocument,
    getHelpRequests,
    resolveHelpRequest
};

export default adminService;
