// src/components/Login.js
import React, { useState } from 'react';
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

    try {
      const url = isLogin 
        ? 'http://localhost:8000/auth/login'
        : 'http://localhost:8000/auth/register';
      
      const data = isLogin 
        ? { username, password }
        : { 
            username, 
            email, 
            password 
          };

      const response = await axios.post(url, data);
      
      // Save token to localStorage
      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      
      // Call the onLogin callback to update app state
      if (onLogin) onLogin();
      
    } catch (err) {
      console.error('Authentication error:', err);
      let errorMessage = 'Authentication failed';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data) {
        errorMessage = JSON.stringify(err.response.data);
      } else {
        errorMessage = err.message || 'An error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    if (onLogin) onLogin(); // This will update the parent to show login form again
  };

  // Check if user is already logged in
  const token = localStorage.getItem('access_token');
  if (token && onLogin) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Authentication</h3>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-green-800">You are logged in! You can now use the document analysis features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {isLogin ? 'Login' : 'Register'}
        </h3>
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {isLogin ? "Need an account? Register" : "Already have an account? Login"}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={!isLogin}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter username"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter password"
          />
        </div>

        {!isLogin && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={!isLogin}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm password"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {isLogin ? 'Logging in...' : 'Registering...'}
            </>
          ) : (
            <>
              {isLogin ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Login
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Register
                </>
              )}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;