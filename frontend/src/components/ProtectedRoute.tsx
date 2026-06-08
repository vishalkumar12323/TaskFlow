import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children:       React.ReactNode;
  requiredRole?:  'ADMIN';
}

export const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!user)     return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};
