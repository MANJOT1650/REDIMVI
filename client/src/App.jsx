import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import CompressImage from './components/CompressImage';
import CompressVideo from './components/CompressVideo';
import ConvertFormat from './components/ConvertFormat';
import ConvertImage from './components/ConvertImage';
import './App.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ThemeToggle />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compress-image"
            element={
              <ProtectedRoute>
                <CompressImage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compress-video"
            element={
              <ProtectedRoute>
                <CompressVideo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/convert"
            element={
              <ProtectedRoute>
                <ConvertFormat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/convert-image"
            element={
              <ProtectedRoute>
                <ConvertImage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
