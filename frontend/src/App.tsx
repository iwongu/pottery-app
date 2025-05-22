import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreatePostPage from './pages/CreatePostPage';
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
          <button onClick={handleLogout} style={{ marginRight: '1rem' }}>Logout</button>
        )}
        {token && <Link to="/create-post" style={{ marginRight: '1rem' }}>Create Post</Link>}
      </nav>
      <div className="container" style={{ padding: '0 1rem' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/*<Route path="/create-post" element={<CreatePostPage />} />*/}
           <Route element={<ProtectedRoute />}>
            <Route path="/create-post" element={<CreatePostPage />} />
            {/* Add other protected routes here */}
          </Route>          
          {/* Add more routes here as you build pages */}
        </Routes>
      </div>
    </>
  );
}

export default App;
