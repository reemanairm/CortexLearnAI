import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const getDashboardData = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.PROGRESS.GET_DASHBOARD);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch dashboard data' };
    }
};

const getChapterProgress = async (docId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.PROGRESS.GET_CHAPTER_PROGRESS(docId));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch chapter progress' };
    }
};

const updateChapterProgress = async (docId, chapId, data) => {
    try {
        const response = await axiosInstance.put(API_PATHS.PROGRESS.UPDATE_CHAPTER_PROGRESS(docId, chapId), data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to update progress' };
    }
};

const progressService = {
    getDashboardData,
    getChapterProgress,
    updateChapterProgress,
};

export default progressService;