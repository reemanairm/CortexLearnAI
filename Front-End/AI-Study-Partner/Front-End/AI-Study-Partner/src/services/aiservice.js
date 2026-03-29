import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const generateFlashcards = async (documentId, options) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.GENERATE_FLASHCARDS, { documentId, ...options });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to generate flashcards' };
    }
};

const generateQuiz = async (documentId, options) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.GENERATE_QUIZ, { documentId, ...options });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to generate quiz' };
    }
};

const generateSummary = async (documentId) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.GENERATE_SUMMARY, { documentId });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to generate summary' };
    }
};

const chat = async (documentId, message) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.CHAT, { documentId, question: message }); // Removed history from payload
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Chat request failed' };
    }
};

const explainConcept = async (documentId, concept) => {
    try {
        const response = await axiosInstance.post(API_PATHS.AI.EXPLAIN_CONCEPT, { documentId, concept });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to explain concept' };
    }
};

const getChatHistory = async (documentId) => {
    try {
        const response = await axiosInstance.get(API_PATHS.AI.GET_CHAT_HISTORY(documentId));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch chat history' };
    }
};

const deleteChatHistory = async (documentId) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.AI.DELETE_CHAT_HISTORY(documentId));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to delete chat history' };
    }
};

const deleteChatMessage = async (documentId, messageId) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.AI.DELETE_CHAT_MESSAGE(documentId, messageId));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to delete chat message' };
    }
};

const editChatMessage = async (documentId, messageId, newQuestion) => {
    try {
        const response = await axiosInstance.put(API_PATHS.AI.EDIT_CHAT_MESSAGE(documentId, messageId), { question: newQuestion });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to edit chat message' };
    }
};

const aiService = {
    generateFlashcards,
    generateQuiz,
    generateSummary,
    chat,
    explainConcept,
    getChatHistory,
    deleteChatHistory,
    deleteChatMessage,
    editChatMessage
};

export default aiService;