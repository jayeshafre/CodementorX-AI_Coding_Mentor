import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Auth Components
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

// Main CodementorX App
import CodementorXApp from './components/CodementorXApp';

// CSS imports
import './App.css';
import './index.css';

// Set up axios defaults
const API_BASE_URL = 'http://localhost:8001';
axios.defaults.baseURL = API_BASE_URL;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Set default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify token with backend
          const response = await axios.get('/api/verify-token/');
          setIsAuthenticated(true);
          setUser(response.data.user);
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleSignupSuccess = (token, userData) => {
    handleLogin(token, userData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
           style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? 
              <Login onLogin={handleLogin} /> : 
              <Navigate to="/dashboard" replace />
            } 
          />
          <Route 
            path="/register" 
            element={
              !isAuthenticated ? 
              <Signup onSignupSuccess={handleSignupSuccess} /> : 
              <Navigate to="/dashboard" replace />
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              !isAuthenticated ? 
              <ForgotPassword onBackToLogin={() => window.location.href = '/login'} /> : 
              <Navigate to="/dashboard" replace />
            } 
          />
          <Route 
            path="/reset-password" 
            element={
              !isAuthenticated ? 
              <ResetPassword onResetSuccess={() => window.location.href = '/login'} /> : 
              <Navigate to="/dashboard" replace />
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/dashboard/*" 
            element={
              isAuthenticated ? 
              <CodementorXApp user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
            } 
          />

          {/* Default Route */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/login" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;