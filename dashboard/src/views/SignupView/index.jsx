import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useAuth } from '../../context/AuthContext';
import TurnstileWidget from '../../components/TurnstileWidget';

export default function SignupView() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState('DEMO_BYPASS');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('You must acknowledge the terms of intelligence access.');
      return;
    }
    if (!turnstileToken) {
      setErrorMsg('Please complete the Cloudflare Turnstile security check.');
      return;
    }

    setLoading(true);
    try {
      await signup(username.trim().toLowerCase(), email.trim().toLowerCase(), password, fullName.trim(), turnstileToken);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
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
        background: 'linear-gradient(310deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)',
        overflow: 'auto'
      }}
    >
      
      <Box
        sx={{
          position: 'absolute',
          top: '5%',
          right: '15%',
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
          bottom: '5%',
          left: '15%',
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
          maxWidth: '520px',
          width: '100%',
          p: { xs: 3, sm: 4.5 },
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 1,
          my: 3
        }}
      >
        
        <Box sx={{ textAlign: 'center', mb: 2.5 }}>
          <Box
            component="img"
            src="/logo-epa-mark.png"
            alt="EPA Punjab"
            sx={{
              width: '56px',
              height: '56px',
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
            Create Intelligence Account
          </Typography>
          <Typography
            sx={{
              fontSize: '12.5px',
              color: '#64748b',
              mt: 0.5,
              fontWeight: 500
            }}
          >
            Punjab Environmental Protection Agency Portal Access
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.2,
            p: 1.4,
            mb: 2.5,
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px'
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: '18px', color: '#16a34a', mt: 0.2, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '11.5px', color: '#166534', lineHeight: 1.45 }}>
            New accounts receive standard <strong>Public Citizen</strong> observer clearance. EPA supervisors can grant elevated analyst or auditor privileges inside the Role registry.
          </Typography>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '13px' }}>
            {errorMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ mb: 1.8 }}>
            <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', mb: 0.6 }}>
              Full Name
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Engr. Hamza Aslam"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeRoundedIcon sx={{ fontSize: '19px', color: '#94a3b8' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: '10px', fontSize: '13.5px', backgroundColor: '#f8fafc' }
              }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 1.8 }}>
            <Box>
              <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', mb: 0.6 }}>
                Username
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. hamza_env"
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

            <Box>
              <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', mb: 0.6 }}>
                Email Address
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailRoundedIcon sx={{ fontSize: '19px', color: '#94a3b8' }} />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '10px', fontSize: '13.5px', backgroundColor: '#f8fafc' }
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 1.8 }}>
            <Box>
              <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', mb: 0.6 }}>
                Password (min 6 chars)
              </Typography>
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
                  sx: { borderRadius: '10px', fontSize: '13.5px', backgroundColor: '#f8fafc' }
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', mb: 0.6 }}>
                Confirm Password
              </Typography>
              <TextField
                fullWidth
                size="small"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
          </Box>

          <Box sx={{ mb: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  sx={{ color: '#94a3b8', '&.Mui-checked': { color: '#0f766e' } }}
                />
              }
              label={
                <Typography sx={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                  I agree to the environmental data use guidelines and security policy.
                </Typography>
              }
            />
          </Box>

          <Box sx={{ my: 1.5 }}>
            <TurnstileWidget
              onVerify={(token) => setTurnstileToken(token)}
              action="signup"
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <HowToRegRoundedIcon />}
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
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2.5 }}>
            <Typography sx={{ fontSize: '12.5px', color: '#64748b' }}>
              Already registered?{' '}
              <Typography
                component={RouterLink}
                to="/login"
                sx={{
                  color: '#0f766e',
                  fontWeight: 700,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                Sign in to your account
              </Typography>
            </Typography>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}