import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import { getTurnstileSiteKey } from '../../services/api';

export default function TurnstileWidget({
  siteKey: propSiteKey,
  onVerify,
  onError,
  theme = 'auto',
  action = 'login'
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [siteKey, setSiteKey] = useState(propSiteKey || '');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (propSiteKey) {
      setSiteKey(propSiteKey);
      return;
    }
    let isMounted = true;
    getTurnstileSiteKey().then((key) => {
      if (isMounted && key) setSiteKey(key);
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [propSiteKey]);

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
    if (!isScriptLoaded || !containerRef.current || !window.turnstile || !siteKey) return;

    try {
      
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          
        }
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
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

      {loadError && (
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Typography sx={{ fontSize: '12px', color: '#dc2626' }}>
            Security check could not load. Please check your network connection or ad-blocker.
          </Typography>
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