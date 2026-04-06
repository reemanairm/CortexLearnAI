import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedAdminRoute = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
                <p>Loading...</p>
            </div>
        );
    }

    // Redirect to dashboard if they are logged in but NOT an admin
    if (user && user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    // If not logged in at all, the ProtectedRoute higher up the flow
    // usually handles this, but just in case:
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedAdminRoute;
