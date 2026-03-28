import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthCallback from './pages/auth/AuthCallback';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import DocumentListPage from './pages/documents/DocumentListPage';
import DocumentDetailPage from './pages/documents/DocumentDetailPage';
import FlashcardsListPage from './pages/flashcards/FlashcardsListPage';
import FlashcardPage from './pages/flashcards/FlashcardPage';
import QuizzesListPage from './pages/quizzes/QuizzesListPage';
import QuizTakePage from './pages/quizzes/QuizTakePage';
import QuizResultPage from './pages/quizzes/QuizResultPage';
import ProfilePage from './pages/profile/ProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import HelpHistoryPage from './pages/help/HelpHistoryPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProtectedAdminRoute from './components/auth/ProtectedAdminRoute';
import AppLayout from './components/layout/AppLayout';
import { AuthContext } from './context/AuthContext';

const App = () => {
  const { isAuthenticated, loading, user } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === 'admin' ? "/admin" : "/dashboard"} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:resettoken" element={<ResetPasswordPage />} />

        {/* Protected Routes with Layout */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            }
          />
          <Route
            path="/documents"
            element={
              <AppLayout>
                <DocumentListPage />
              </AppLayout>
            }
          />
          <Route
            path="/documents/:id"
            element={
              <AppLayout>
                <DocumentDetailPage />
              </AppLayout>
            }
          />
          <Route
            path="/flashcards"
            element={
              <AppLayout>
                <FlashcardsListPage />
              </AppLayout>
            }
          />
          <Route
            path="/documents/:id/flashcards"
            element={
              <AppLayout>
                <FlashcardPage />
              </AppLayout>
            }
          />
          <Route
            path="/quizzes"
            element={
              <AppLayout>
                <QuizzesListPage />
              </AppLayout>
            }
          />
          <Route
            path="/quizzes/:quizId"
            element={
              <AppLayout>
                <QuizTakePage />
              </AppLayout>
            }
          />
          <Route
            path="/quizzes/:quizId/results"
            element={
              <AppLayout>
                <QuizResultPage />
              </AppLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            }
          />
          <Route
            path="/help-history"
            element={
              <AppLayout>
                <HelpHistoryPage />
              </AppLayout>
            }
          />
        </Route>

        {/* Admin Only Routes */}
        <Route element={<ProtectedAdminRoute />}>
          <Route
            path="/admin"
            element={
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;

