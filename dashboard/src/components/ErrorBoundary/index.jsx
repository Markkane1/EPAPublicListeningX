import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    if (console && console.error) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
          <Card
            sx={{
              maxWidth: 680,
              width: '100%',
              p: 3.5,
              borderRadius: '16px',
              border: '1px solid #fecdd3',
              backgroundColor: '#fff1f2',
              boxShadow: '0 8px 24px rgba(225, 29, 72, 0.08)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <ErrorOutlineRoundedIcon sx={{ color: '#e11d48', fontSize: 32 }} />
              <Box>
                <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#9f1239' }}>
                  Something went wrong displaying this view
                </Typography>
                <Typography sx={{ fontSize: '13px', color: '#be123c', mt: 0.2 }}>
                  An unexpected error occurred while rendering the {this.props.componentName || 'component'}.
                </Typography>
              </Box>
            </Box>

            {this.state.error?.message && (
              <Alert severity="error" sx={{ my: 2, borderRadius: '8px', fontSize: '12.5px', wordBreak: 'break-word' }}>
                {this.state.error.message}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
              <Button
                variant="contained"
                onClick={this.handleReset}
                startIcon={<RefreshRoundedIcon />}
                sx={{
                  backgroundColor: '#e11d48',
                  color: '#ffffff',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px',
                  '&:hover': { backgroundColor: '#be123c' },
                }}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                sx={{
                  borderColor: '#f43f5e',
                  color: '#e11d48',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px',
                  '&:hover': { borderColor: '#be123c', backgroundColor: 'rgba(225, 29, 72, 0.04)' },
                }}
              >
                Reload Page
              </Button>
            </Box>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  componentName: PropTypes.string,
  fallback: PropTypes.node,
};
