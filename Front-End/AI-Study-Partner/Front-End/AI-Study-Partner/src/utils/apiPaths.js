export const BASE_URL = import.meta.env.VITE_BASE_URL || (import.meta.env.MODE === 'production' ? "" : "");

export const API_PATHS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    GET_PROFILE: "/auth/profile",
    UPDATE_PROFILE: "/auth/profile",
    CHANGE_PASSWORD: "/auth/change-password",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: (token) => `/auth/reset-password/${token}`,
    GOOGLE_AUTH: "/auth/google",
  },

  DOCUMENTS: {
    UPLOAD: "/documents/upload",
    VIDEO_PROCESS: "/documents/video",
    GET_DOCUMENTS: "/documents",
    GET_DOCUMENT_BY_ID: (id) => `/documents/${id}`,
    UPDATE_DOCUMENT: (id) => `/documents/${id}`,
    DELETE_DOCUMENT: (id) => `/documents/${id}`,
  },

  AI: {
    GENERATE_FLASHCARDS: "/aiRoutes/generate-flashcards",
    GENERATE_QUIZ: "/aiRoutes/generate-quiz",
    GENERATE_SUMMARY: "/aiRoutes/generate-summary",
    CHAT: "/aiRoutes/chat",
    EXPLAIN_CONCEPT: "/aiRoutes/explain-concept",
    GET_CHAT_HISTORY: (documentId) => `/aiRoutes/chat-history/${documentId}`,
    DELETE_CHAT_HISTORY: (documentId) => `/aiRoutes/chat-history/${documentId}`,
    CLEAR_ALL_CHAT_HISTORY: "/aiRoutes/chat-history",
    DELETE_CHAT_MESSAGE: (documentId, messageId) => `/aiRoutes/chat-history/${documentId}/message/${messageId}`,
    EDIT_CHAT_MESSAGE: (documentId, messageId) => `/aiRoutes/chat-history/${documentId}/message/${messageId}`,
  },

  FLASHCARDS: {
    GET_ALL_FLASHCARD_SETS: "/flashcard",
    GET_FLASHCARDS_FOR_DOC: (documentId) => `/flashcard/${documentId}`,
    REVIEW_FLASHCARD: (cardId) => `/flashcard/${cardId}/review`,
    TOGGLE_STAR: (cardId) => `/flashcard/${cardId}/star`,
    DELETE_FLASHCARD_SET: (id) => `/flashcard/${id}`,
  },

  QUIZZES: {
    GET_ALL_QUIZZES: "/quizzes",
    GET_QUIZZES_FOR_DOC: (documentId) => `/quizzes/${documentId}`,
    GET_QUIZ_BY_ID: (id) => `/quizzes/quiz/${id}`,
    SUBMIT_QUIZ: (id) => `/quizzes/${id}/submit`,
    GET_QUIZ_RESULTS: (id) => `/quizzes/${id}/results`,
    DELETE_QUIZ: (id) => `/quizzes/${id}`,
  },

  PROGRESS: {
    GET_DASHBOARD: "/progress/dashboard",
    GET_CHAPTER_PROGRESS: (docId) => `/progress/document/${docId}/chapters`,
    UPDATE_CHAPTER_PROGRESS: (docId, chapId) => `/progress/document/${docId}/chapter/${chapId}`,
  },

  HELP: {
    SUBMIT: "/help",
  },
};