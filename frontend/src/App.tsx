import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreatePostPage from './pages/CreatePostPage';
import UserPage from './pages/UserPage'; // Import UserPage
import EditProfilePage from './pages/EditProfilePage'; // Import EditProfilePage
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <>
      <nav style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '1rem' }}>
        <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>
        {!token ? (
          <>
            <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
            <Link to="/register" style={{ marginRight: '1rem' }}>Register</Link>
          </>
        ) : (
          <>
            <button onClick={handleLogout} style={{ marginRight: '1rem' }}>Logout</button>
            {/* Temp link to own profile - replace with actual user ID or /me logic */}
            <Link to="/users/me" style={{ marginRight: '1rem' }}>My Profile</Link> 
          </>
        )}
        {token && <Link to="/create-post" style={{ marginRight: '1rem' }}>Create Post</Link>}
        {/* Temp link to a specific user's profile for testing */}
        <Link to="/users/1" style={{ marginRight: '1rem' }}>User 1 Profile</Link>
      </nav>
      <div className="container" style={{ padding: '0 1rem' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/create-post" element={<CreatePostPage />} />
            <Route path="/users/me/edit" element={<EditProfilePage />} /> 
            {/* Specific route for editing current user's profile */}
          </Route>
          
          {/* UserPage can be public or protected based on app requirements. 
              For now, let's assume it can be public to view profiles, 
              but actions on it (like edit button) will depend on auth state. */}
          <Route path="/users/:userId" element={<UserPage />} />
          
          {/* Add more routes here as you build pages */}
        </Routes>
      </div>
    </>
  );
}

export default App;
