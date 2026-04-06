import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const getStats = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.ADMIN.STATS);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch admin stats' };
    }
};

const getUsers = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.ADMIN.USERS);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch users' };
    }
};

const deleteUser = async (userId) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.ADMIN.DELETE_USER(userId));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to delete user' };
    }
};

const getDocuments = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.ADMIN.DOCUMENTS);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch documents' };
    }
};

const deleteDocument = async (docId) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.ADMIN.DELETE_DOC(docId));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to delete document' };
    }
};

const getHelpRequests = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.ADMIN.HELP_REQUESTS);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch help requests' };
    }
};

const resolveHelpRequest = async (requestId) => {
    try {
        const response = await axiosInstance.put(API_PATHS.ADMIN.RESOLVE_HELP(requestId));
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
