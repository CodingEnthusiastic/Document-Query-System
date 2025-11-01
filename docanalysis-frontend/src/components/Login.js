// src/components/Login.js
import React, { useState, useEffect } from 'react';
import { User, Lock, LogIn, UserPlus } from 'lucide-react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Since authentication is removed, just simulate successful login
    setTimeout(() => {
      // Simulate a token for compatibility with existing code that may check for it
      localStorage.setItem('access_token', 'dummy-token-for-compatibility');
      
      // Call the onLogin callback to update app state
      if (onLogin) onLogin();
      setLoading(false);
    }, 500); // Small delay to simulate processing
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    if (onLogin) onLogin(); // This will update the parent to show login form again
  };

  // Automatically trigger login status since auth is removed
  useEffect(() => {
    if (onLogin) {
      // Clear any existing tokens that might have been set
      localStorage.removeItem('access_token');
      // Simulate a token for compatibility but call onLogin to move to main app
      localStorage.setItem('access_token', 'dummy-token-for-compatibility');
      onLogin();
    }
  }, [onLogin]);

  // Show a temporary message while redirecting
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800">Authentication has been removed. Redirecting to application...</p>
      </div>
    </div>
  );
};

export default Login;