import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

import { getTurnstileSiteKey } from '../../services/api';

const LOCAL_TEST_SITE_KEY = '1x00000000000000000000AA';

function localDevHost() {
  if (!import.meta.env.DEV) return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

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
    if (localDevHost()) {
      setSiteKey(LOCAL_TEST_SITE_KEY);
      return;
    }
    let isMounted = true;
    getTurnstileSiteKey().then((key) => {
      if (!isMounted) return;
      if (key) setSiteKey(key);
      else setLoadError(true);
    }).catch(() => {
      if (isMounted) setLoadError(true);
    });
    return () => { isMounted = false; };
  }, [propSiteKey]);

  useEffect(() => {
    let cancelled = false;
    const markLoaded = () => {
      if (!cancelled) setIsScriptLoaded(true);
    };
    if (window.turnstile) {
      markLoaded();
      return () => { cancelled = true; };
    }

    const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (existingScript) {
      existingScript.addEventListener('load', markLoaded);
      existingScript.addEventListener('error', () => {
        if (!cancelled) setLoadError(true);
      });
      return () => {
        cancelled = true;
        existingScript.removeEventListener('load', markLoaded);
      };
    }

    const script = document.createElement('script');
    script.id = 'cf-turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = markLoaded;
    script.onerror = () => {
      if (!cancelled) setLoadError(true);
    };
    document.head.appendChild(script);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current || !window.turnstile || !siteKey) return;
    const node = containerRef.current;
    setLoadError(false);

    try {
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // A previous strict-mode mount may already have removed it.
        }
        widgetIdRef.current = null;
      }
      node.replaceChildren();

      widgetIdRef.current = window.turnstile.render(node, {
        sitekey: siteKey,
        theme: theme,
        action: action,
        appearance: 'always',
        callback: (token) => {
          setVerifiedToken(token);
          setLoadError(false);
          if (onVerify) onVerify(token);
        },
        'error-callback': () => {
          setVerifiedToken(null);
          setLoadError(true);
          if (onVerify) onVerify(null);
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
      const widgetId = widgetIdRef.current;
      widgetIdRef.current = null;
      if (widgetId !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // Ignore a widget that strict mode already removed.
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
          minHeight: verifiedToken ? 0 : '70px',
          minWidth: verifiedToken ? 0 : '300px',
          width: '100%',
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
            Security check could not load. Refresh the page and try again.
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