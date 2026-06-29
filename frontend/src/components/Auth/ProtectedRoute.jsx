import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function ProtectedRoute({ children, roles }) {
  const { user, token } = useSelector(state => state.auth);

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/pos" />;
  }

  return children;
}

export default ProtectedRoute;
