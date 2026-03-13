import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './components/Home';
import Order from './components/Order';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import './styles/index.css';

// Protected Route component – requires user to be signed in
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Guest-only route – redirects signed-in users away from auth pages
const GuestOnlyRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }
  
  return user ? <Navigate to={redirectTo} replace /> : children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
      <Route path="/register" element={<GuestOnlyRoute><Register /></GuestOnlyRoute>} />
      <Route 
        path="/order" 
        element={
          <ProtectedRoute>
            <Order />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
