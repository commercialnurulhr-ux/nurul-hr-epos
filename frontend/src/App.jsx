import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Pages
import LoginPage from './pages/Auth/LoginPage';
import POSPage from './pages/POS/POSPage';
import InventoryPage from './pages/Inventory/InventoryPage';
import AccountingPage from './pages/Accounting/AccountingPage';
import ReportsPage from './pages/Reports/ReportsPage';
import AdminPage from './pages/Administration/AdminPage';
import MigrationPage from './pages/Migration/MigrationPage';

// Components
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Styles
import './App.css';

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector(state => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set default API headers
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setIsLoading(false);
  }, [token]);

  if (isLoading) {
    return <div className="loading-screen">Loading NURUL HR EPOS...</div>;
  }

  return (
    <Router>
      {!token ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <div className="app-container">
          <Sidebar user={user} />
          <div className="main-content">
            <Header user={user} />
            <Routes>
              {/* Cashier Routes */}
              <Route
                path="/pos"
                element={
                  <ProtectedRoute roles={['cashier', 'master_admin', 'manager']}>
                    <POSPage />
                  </ProtectedRoute>
                }
              />

              {/* Manager Routes */}
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute roles={['manager', 'master_admin']}>
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/accounting"
                element={
                  <ProtectedRoute roles={['manager', 'master_admin']}>
                    <AccountingPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/reports"
                element={
                  <ProtectedRoute roles={['manager', 'master_admin']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['master_admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/migration"
                element={
                  <ProtectedRoute roles={['master_admin']}>
                    <MigrationPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/pos" />} />
            </Routes>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
