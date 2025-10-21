// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import VideoGenerator from './components/VideoGenerator';
import PaymentPage from './components/PaymentPage';
import NavBar from './components/NavBar';
import ReferralPage from './components/ReferralPage'; 

const App = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (loading) {
        return <div>Loading authentication...</div>;
    }

    return (
        <Router>
            <NavBar user={user} handleLogout={handleLogout} /> 
            
            <Routes>
                {/* Route for Login/Signup */}
                <Route
                    path="/auth"
                    element={user ? <Navigate to="/generate" replace /> : <AuthForm />}
                />
                
                {/* Protected Routes - PASSING THE USER OBJECT */}
                <Route
                    path="/dashboard"
                    element={user ? <Dashboard user={user} /> : <Navigate to="/auth" replace />}
                />
                <Route
                    path="/generate"
                    element={user ? <VideoGenerator user={user} /> : <Navigate to="/auth" replace />}
                />
                <Route
                    path="/pay"
                    element={user ? <PaymentPage user={user} /> : <Navigate to="/auth" replace />}
                />
                <Route
                    path="/referral"
                    element={user ? <ReferralPage user={user} /> : <Navigate to="/auth" replace />}
                />
                
                {/* Default Route - MODIFIED TO NAVIGATE TO /generate INSTEAD OF /dashboard */}
                <Route
                    path="/"
                    element={<Navigate to={user ? "/generate" : "/auth"} replace />}
                />
            </Routes>
        </Router>
    );
};

export default App;