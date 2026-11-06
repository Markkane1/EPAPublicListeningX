import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';

import { useAuth } from '../../context/AuthContext';
import { useArgonController } from '../../context';
import TurnstileWidget from '../../components/TurnstileWidget';

export default function LoginView() {
  const [controller] = useArgonController();
  const { darkMode } = controller;
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState('');
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
      setErrorMsg('Please complete the Cloudflare Turnstile security verification.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password, turnstileToken);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
      setTurnstileToken('');
    } finally {
      setLoading(false);
    }
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
        background: darkMode
          ? 'linear-gradient(180deg, #090e15 0%, #0f172a 100%)'
          : 'linear-gradient(180deg, #090e15 0%, #0f172a 60%, #064e3b 100%)',
        overflow: 'auto'
      }}
    >
      
      

      <Card
        sx={{
          maxWidth: '480px',
          width: '100%',
          p: { xs: 3, sm: 4.5 },
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backgroundColor: darkMode ? '#0f172a' : 'rgba(255, 255, 255, 0.98)',
                    position: 'relative',
          zIndex: 1
        }}
      >
        
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: '72px',
              height: '72px',
              mx: 'auto',
              mb: 1.75,
              borderRadius: '16px',
              p: 1,
              backgroundColor: '#ffffff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'scale(1.04)' }
            }}
          >
            <Box
              component="img"
              src="/logo-epa-mark.png"
              alt="EPA Punjab"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Open Sans", sans-serif',
              fontWeight: 800,
              fontSize: { xs: '20px', sm: '23px' },
              color: darkMode ? '#ffffff' : '#0f172a',
              letterSpacing: '-0.3px',
              lineHeight: 1.2
            }}
          >
            EPA Punjab Social Listening
          </Typography>
          <Typography
            sx={{
              fontSize: '12.5px',
              color: darkMode ? '#94a3b8' : '#64748b',
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
            <Typography component="label" htmlFor="login-username" sx={{ fontSize: '12.5px', fontWeight: 600, color: darkMode ? '#cbd5e1' : '#334155', mb: 0.8, display: 'block' }}>
              Username or Official Email
            </Typography>
            <TextField
              id="login-username"
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
                sx: { borderRadius: '10px', fontSize: '13.5px', backgroundColor: darkMode ? '#090e15' : '#f8fafc', color: darkMode ? '#ffffff' : '#1e293b', '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : undefined } }
              }}
            />
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
              <Typography component="label" htmlFor="login-password" sx={{ fontSize: '12.5px', fontWeight: 600, color: darkMode ? '#cbd5e1' : '#334155' }}>
                Account Password
              </Typography>
            </Box>
            <TextField
              id="login-password"
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
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? (
                        <VisibilityOffRoundedIcon sx={{ fontSize: '18px', color: '#94a3b8' }} />
                      ) : (
                        <VisibilityRoundedIcon sx={{ fontSize: '18px', color: '#94a3b8' }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: '10px', fontSize: '13.5px', backgroundColor: darkMode ? '#090e15' : '#f8fafc', color: darkMode ? '#ffffff' : '#1e293b', '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : undefined } }
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
                  sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#16a34a' } }}
                />
              }
              label={
                <Typography sx={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 500 }}>
                  Remember credentials
                </Typography>
              }
            />
          </Box>

          <Box sx={{ my: 1.5 }}>
            <TurnstileWidget
              onVerify={(token) => {
                setTurnstileToken(token);
                if (errorMsg && errorMsg.includes('Cloudflare Turnstile')) {
                  setErrorMsg('');
                }
              }}
              onError={() => setErrorMsg('Cloudflare Turnstile security check failed. Please refresh or verify connection.')}
              action="login"
            />
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '13px' }}>
              {errorMsg}
            </Alert>
          )}

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
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              boxShadow: '0 6px 18px rgba(22, 163, 74, 0.35)',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                boxShadow: '0 8px 22px rgba(22, 163, 74, 0.45)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </Button>

          <Box
            sx={{
              mt: 2.5,
              pt: 2,
              borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              textAlign: 'center'
            }}
          >
            <Typography sx={{ fontSize: '12px', color: darkMode ? '#cbd5e1' : '#475569', fontWeight: 500 }}>
              Default Administrator: <strong>admin</strong> &bull; Password: <code>EPAadmin2026!</code>
            </Typography>
            <Typography sx={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', mt: 0.5 }}>
              (Or active password from data/bootstrap-credentials.txt)
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}