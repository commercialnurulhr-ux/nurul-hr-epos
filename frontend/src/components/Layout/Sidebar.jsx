import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import './Sidebar.css';

function Sidebar({ user }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>NURUL HR EPOS</h2>
      </div>

      <nav className="sidebar-nav">
        <Link to="/pos" className="nav-item">
          🛒 Point of Sale
        </Link>

        {(user?.role === 'manager' || user?.role === 'master_admin') && (
          <>
            <Link to="/inventory" className="nav-item">
              📦 Inventory
            </Link>
            <Link to="/accounting" className="nav-item">
              💰 Accounting
            </Link>
            <Link to="/reports" className="nav-item">
              📊 Reports
            </Link>
          </>
        )}

        {user?.role === 'master_admin' && (
          <>
            <Link to="/migration" className="nav-item">
              🔄 GoFrugal Migration
            </Link>
            <Link to="/admin" className="nav-item">
              ⚙️ Administration
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <p>{user?.username}</p>
          <span className="role-badge">{user?.role}</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
