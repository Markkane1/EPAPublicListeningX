import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import GppBadRoundedIcon from '@mui/icons-material/GppBadRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SwitchAccountRoundedIcon from '@mui/icons-material/SwitchAccountRounded';
import { useAuth } from '../../context/AuthContext';
import { useArgonController } from '../../context';

export default function AccessDeniedView({ requiredPermission, moduleName = 'this section' }) {
  const [controller] = useArgonController();
  const { darkMode } = controller;
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSwitchAccount = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '65vh',
        p: 2
      }}
    >
      <Card
        sx={{
          maxWidth: '560px',
          width: '100%',
          p: 4,
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          textAlign: 'center',
          border: darkMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fee2e2',
          backgroundColor: darkMode ? '#0f172a' : '#ffffff',
          background: darkMode ? '#0f172a' : 'linear-gradient(180deg, #ffffff 0%, #fffbfb 100%)'
        }}
      >
        <Box
          sx={{
            width: '68px',
            height: '68px',
            mx: 'auto',
            mb: 2.5,
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)'
          }}
        >
          <GppBadRoundedIcon sx={{ fontSize: '38px' }} />
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontFamily: '"Open Sans", sans-serif',
            fontWeight: 700,
            color: darkMode ? '#ffffff' : '#1e293b',
            mb: 1
          }}
        >
          Access Restricted (403)
        </Typography>

        <Typography
          sx={{
            fontSize: '14px',
            color: darkMode ? '#94a3b8' : '#64748b',
            lineHeight: 1.6,
            mb: 2.5
          }}
        >
          Your current account role does not have the required clearance to view or operate {moduleName}.
        </Typography>

        <Box
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: darkMode ? '#090e15' : '#f8fafc',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            borderRadius: '12px',
            textAlign: 'left'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              Active User:
            </Typography>
            <Typography sx={{ fontSize: '13px', color: darkMode ? '#ffffff' : '#1e293b', fontWeight: 700 }}>
              {user?.fullName || user?.username} (@{user?.username})
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
              Assigned Role:
            </Typography>
            <Chip
              label={user?.role?.displayName || user?.role?.name || 'Standard'}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '11px',
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                borderRadius: '6px'
              }}
            />
          </Box>

          {requiredPermission && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                Required Permission:
              </Typography>
              <Chip
                label={requiredPermission}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '11px',
                  backgroundColor: '#fee2e2',
                  color: '#b91c1c',
                  borderRadius: '6px'
                }}
              />
            </Box>
          )}
        </Box>

        <Typography sx={{ fontSize: '12.5px', color: '#94a3b8', mb: 3 }}>
          If your departmental duties require access to this intelligence resource, please contact the Punjab EPA System Administrator to elevate your role.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
            startIcon={<ArrowBackRoundedIcon />}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              px: 2.5,
              borderColor: '#cbd5e1',
              color: '#334155',
              '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f1f5f9' }
            }}
          >
            Back to Dashboard
          </Button>

          <Button
            variant="contained"
            onClick={handleSwitchAccount}
            startIcon={<SwitchAccountRoundedIcon />}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              px: 2.5,
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
              '&:hover': {
                background: '#15803d'
              }
            }}
          >
            Switch Account
          </Button>
        </Box>
      </Card>
    </Box>
  );
}

AccessDeniedView.propTypes = {
  requiredPermission: PropTypes.string,
  moduleName: PropTypes.string
};