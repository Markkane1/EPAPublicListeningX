import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';

import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';

import { useAuth } from '../../context/AuthContext';
import TurnstileWidget from '../../components/TurnstileWidget';

export default function LoginView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('EPAadmin2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState('DEMO_BYPASS');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Please enter your username or email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }
    if (!turnstileToken) {
      setErrorMsg('Please complete the Cloudflare Turnstile security check.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password, turnstileToken);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (demoUser, demoPass) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setTurnstileToken('DEMO_BYPASS');
    setErrorMsg('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        p: { xs: 2, sm: 3 },
        background: 'linear-gradient(310deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)',
        overflow: 'auto'
      }}
    >
      
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '15%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '15%',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(94, 114, 228, 0.18) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />

      <Card
        sx={{
          maxWidth: '480px',
          width: '100%',
          p: { xs: 3, sm: 4.5 },
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 1
        }}
      >
        
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            component="img"
            src="/logo-epa-mark.png"
            alt="EPA Punjab"
            sx={{
              width: '64px',
              height: '64px',
              mx: 'auto',
              mb: 1.5,
              borderRadius: '12px',
              boxShadow: '0 6px 16px rgba(0,0,0,0.1)'
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Open Sans", sans-serif',
              fontWeight: 800,
              fontSize: { xs: '20px', sm: '23px' },
              color: '#0f172a',
              letterSpacing: '-0.3px',
              lineHeight: 1.2
            }}
          >
            EPA Punjab Social Listening
          </Typography>
          <Typography
            sx={{
              fontSize: '12.5px',
              color: '#64748b',
              mt: 0.5,
              fontWeight: 500
            }}
          >
            Government of the Punjab — Environmental Intelligence Portal
          </Typography>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '13px' }}>
            {errorMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
              Username or Official Email
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. admin or yourname@epa.punjab.gov.pk"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonRoundedIcon sx={{ fontSize: '19px', color: '#94a3b8' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: '10px', fontSize: '13.5px', backgroundColor: '#f8fafc' }
              }}
            />
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
              <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                Account Password
              </Typography>
            </Box>
            <TextField
              fullWidth
              size="small"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockRoundedIcon sx={{ fontSize: '19px', color: '#94a3b8' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <VisibilityOffRoundedIcon sx={{ fontSize: '18px', color: '#94a3b8' }} />
                      ) : (
                        <VisibilityRoundedIcon sx={{ fontSize: '18px', color: '#94a3b8' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: '10px', fontSize: '13.5px', backgroundColor: '#f8fafc' }
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#0f766e' } }}
                />
              }
              label={
                <Typography sx={{ fontSize: '12.5px', color: '#64748b', fontWeight: 500 }}>
                  Remember credentials
                </Typography>
              }
            />
          </Box>

          <Box sx={{ my: 1.5 }}>
            <TurnstileWidget
              onVerify={(token) => setTurnstileToken(token)}
              action="login"
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <LoginRoundedIcon />}
            sx={{
              py: 1.2,
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'none',
              background: 'linear-gradient(310deg, #0f766e 0%, #0d9488 100%)',
              color: '#ffffff',
              boxShadow: '0 6px 18px rgba(15, 118, 110, 0.35)',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'linear-gradient(310deg, #115e59 0%, #0f766e 100%)',
                boxShadow: '0 8px 22px rgba(15, 118, 110, 0.45)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography sx={{ fontSize: '12.5px', color: '#64748b' }}>
              Don't have an account?{' '}
              <Typography
                component={RouterLink}
                to="/signup"
                sx={{
                  color: '#0f766e',
                  fontWeight: 700,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Sign up
              </Typography>
            </Typography>
          </Box>

          <Divider sx={{ my: 2.5 }}>
            <Typography sx={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              One-Click Role Testing Switcher
            </Typography>
          </Divider>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Chip
              icon={<ShieldRoundedIcon sx={{ fontSize: '14px !important' }} />}
              label="Super Admin"
              onClick={() => handleDemoSelect('admin', 'EPAadmin2026!')}
              clickable
              size="small"
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: username === 'admin' ? '#0f766e' : '#f1f5f9',
                color: username === 'admin' ? '#ffffff' : '#334155',
                '&:hover': { backgroundColor: username === 'admin' ? '#115e59' : '#e2e8f0' }
              }}
            />

            <Chip
              icon={<VpnKeyRoundedIcon sx={{ fontSize: '14px !important' }} />}
              label="Lead Analyst"
              onClick={() => handleDemoSelect('analyst', 'EPAanalyst2026!')}
              clickable
              size="small"
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: username === 'analyst' ? '#0284c7' : '#f1f5f9',
                color: username === 'analyst' ? '#ffffff' : '#334155',
                '&:hover': { backgroundColor: username === 'analyst' ? '#0369a1' : '#e2e8f0' }
              }}
            />

            <Chip
              icon={<VpnKeyRoundedIcon sx={{ fontSize: '14px !important' }} />}
              label="Field Auditor"
              onClick={() => handleDemoSelect('auditor', 'EPAauditor2026!')}
              clickable
              size="small"
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: username === 'auditor' ? '#d97706' : '#f1f5f9',
                color: username === 'auditor' ? '#ffffff' : '#334155',
                '&:hover': { backgroundColor: username === 'auditor' ? '#b45309' : '#e2e8f0' }
              }}
            />

            <Chip
              icon={<PersonRoundedIcon sx={{ fontSize: '14px !important' }} />}
              label="Public Citizen"
              onClick={() => handleDemoSelect('viewer', 'EPAviewer2026!')}
              clickable
              size="small"
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: username === 'viewer' ? '#64748b' : '#f1f5f9',
                color: username === 'viewer' ? '#ffffff' : '#334155',
                '&:hover': { backgroundColor: username === 'viewer' ? '#475569' : '#e2e8f0' }
              }}
            />
          </Box>
        </Box>
      </Card>
    </Box>
  );
}