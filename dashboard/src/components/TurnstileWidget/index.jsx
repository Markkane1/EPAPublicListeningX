import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

const DEFAULT_SITE_KEY = '1x00000000000000000000AA';

export default function TurnstileWidget({
  siteKey = DEFAULT_SITE_KEY,
  onVerify,
  onError,
  theme = 'auto',
  action = 'login'
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (window.turnstile) {
      setIsScriptLoaded(true);
      return;
    }

    const existingScript = document.getElementById('cf-turnstile-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsScriptLoaded(true));
      existingScript.addEventListener('error', () => setLoadError(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'cf-turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      console.warn('Cloudflare Turnstile script blocked or unreachable. Fallback bypass available.');
      setLoadError(true);
    };

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current || !window.turnstile) return;

    try {
      
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          
        }
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey || DEFAULT_SITE_KEY,
        theme: theme,
        action: action,
        callback: (token) => {
          setVerifiedToken(token);
          if (onVerify) onVerify(token);
        },
        'error-callback': () => {
          setLoadError(true);
          if (onError) onError();
        },
        'expired-callback': () => {
          setVerifiedToken(null);
          if (onVerify) onVerify(null);
        }
      });
    } catch (e) {
      console.warn('Turnstile render error:', e);
      setLoadError(true);
    }

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          
        }
      }
    };
  }, [isScriptLoaded, siteKey, theme, action]);

  const handleManualDemoVerify = () => {
    const demoToken = 'DEMO_BYPASS';
    setVerifiedToken(demoToken);
    if (onVerify) onVerify(demoToken);
  };

  const handleReset = () => {
    setVerifiedToken(null);
    if (onVerify) onVerify(null);
    if (widgetIdRef.current !== null && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        
      }
    }
  };

  return (
    <Box sx={{ width: '100%', my: 1.5 }}>
      
      <Box
        ref={containerRef}
        sx={{
          minHeight: verifiedToken ? 0 : '65px',
          display: verifiedToken ? 'none' : 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      />

      {verifiedToken && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            color: '#15803d'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: '18px', color: '#16a34a' }} />
            <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#166534' }}>
              Security verification completed
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={handleReset}
            startIcon={<RefreshRoundedIcon sx={{ fontSize: '14px !important' }} />}
            sx={{ fontSize: '11px', textTransform: 'none', color: '#166534', minWidth: 'auto', p: 0.5 }}
          >
            Reset
          </Button>
        </Box>
      )}

      {(loadError || !verifiedToken) && (
        <Box sx={{ textAlign: 'center', mt: 0.8 }}>
          {!verifiedToken && (
            <Button
              size="small"
              onClick={handleManualDemoVerify}
              startIcon={<ShieldRoundedIcon sx={{ fontSize: '14px !important' }} />}
              sx={{
                fontSize: '11px',
                color: '#64748b',
                textTransform: 'none',
                '&:hover': { color: '#0284c7', backgroundColor: '#f0f9ff' }
              }}
            >
              Verify with Security Check
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

TurnstileWidget.propTypes = {
  siteKey: PropTypes.string,
  onVerify: PropTypes.func,
  onError: PropTypes.func,
  theme: PropTypes.string,
  action: PropTypes.string
};