import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../context/AuthContext';
import AccessDeniedView from '../../views/AccessDeniedView';

export default function ProtectedRoute({ children, requiredPermission, moduleName }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          gap: 2
        }}
      >
        <CircularProgress size={36} thickness={4} sx={{ color: '#16a34a' }} />
        <Typography sx={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
          Authenticating secure session...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDeniedView requiredPermission={requiredPermission} moduleName={moduleName} />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredPermission: PropTypes.string,
  moduleName: PropTypes.string
};