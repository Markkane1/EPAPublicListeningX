import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

import TravelExploreRoundedIcon from '@mui/icons-material/TravelExploreRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import FolderZipRoundedIcon from '@mui/icons-material/FolderZipRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';

import { useArgonController } from 'context';
import { searchXApi, getQueryVersions } from '../../services/api';

const QUICK_SUGGESTIONS = [
  '#smog Lahore',
  'AQI Gujranwala',
  'Faisalabad air',
  'Multan air quality',
  'Stubble burning Punjab',
  'Clean air Lahore'
];

function DirectSearchCard({
  dataSource = 'file',
  onFetchSuccess,
  onNavigateSettings
}) {
  const [controller] = useArgonController();
  const { darkMode } = controller || {};

  const [keyword, setKeyword] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [feedback, setFeedback] = useState(null); 
  const [forceLive, setForceLive] = useState(dataSource === 'x_api');
  const [savedQueries, setSavedQueries] = useState([]);

  useEffect(() => {
    getQueryVersions()
      .then((vers) => {
        if (Array.isArray(vers)) setSavedQueries(vers);
      })
      .catch(() => {});
  }, []);

  const handleSearch = async (kwToSearch) => {
    const queryTerm = (typeof kwToSearch === 'string' ? kwToSearch : keyword).trim();
    if (!queryTerm) return;

    setIsFetching(true);
    setFeedback(null);

    try {
      const res = await searchXApi({
        keyword: queryTerm,
        liveOverride: forceLive || dataSource === 'x_api',
        maxResults: 20,
        simulateIfMissing: true
      });

      if (res.success) {
        let msg = '';
        if (res.mode === 'x_api') {
          msg = `X API search successful! Fetched ${res.fetchedCount} posts → ${res.verifiedCount} verified & saved to SQLite DB (${res.duplicatesMerged} duplicates merged, ${res.noiseRemoved} noise excluded).`;
          if (res.isSimulated) {
            msg += ' (Executed via dynamic simulated live feed; configure your Twitter Bearer Token in Settings for live production tokens).';
          }
        } else {
          msg = `Local database search returned ${res.fetchedCount} matching posts.`;
        }

        setFeedback({
          type: 'success',
          message: msg,
          stats: res.stats
        });

        if (onFetchSuccess) {
          onFetchSuccess(res);
        }
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to complete search query.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Query failed: ${err.message}`
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Card
      sx={{
        backgroundColor: darkMode ? '#111c44' : '#ffffff',
        borderRadius: '16px',
        p: '20px 24px',
        mb: 3,
        border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e9ecef',
        boxShadow: darkMode ? '0 4px 20px 0 rgba(0, 0, 0, 0.35)' : '0 4px 16px 0 rgba(103, 116, 142, 0.08)',
        background: darkMode ? '#111c44' : 'linear-gradient(135deg, #ffffff 0%, #fbfcfe 100%)',
      }}
    >
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 1.8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box
            sx={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <TravelExploreRoundedIcon sx={{ fontSize: '20px' }} />
          </Box>
          <Box>
            <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: '15px', color: darkMode ? '#ffffff' : '#1e293b' }}>
              Direct Keyword Search & Post Fetching
            </Typography>
            <Typography sx={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
              Fetch, clean, deduplicate, and persist air quality posts directly into local SQLite DB
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Tooltip title="Configure live Twitter credentials or switch mode" arrow>
            <Chip
              icon={dataSource === 'x_api' ? <LanguageRoundedIcon sx={{ fontSize: '15px !important' }} /> : <FolderZipRoundedIcon sx={{ fontSize: '15px !important' }} />}
              label={dataSource === 'x_api' ? 'Active: Live X API' : 'Active: File Ingestion'}
              color={dataSource === 'x_api' ? 'success' : 'default'}
              size="small"
              onClick={onNavigateSettings}
              sx={{
                fontWeight: 600,
                fontSize: '11px',
                cursor: 'pointer',
                borderRadius: '6px',
                height: '26px',
                backgroundColor: darkMode ? (dataSource === 'x_api' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)') : undefined,
                color: darkMode ? (dataSource === 'x_api' ? '#4ade80' : '#cbd5e1') : undefined,
                border: darkMode ? (dataSource === 'x_api' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.12)') : undefined,
                '&:hover': { opacity: 0.9 }
              }}
            />
          </Tooltip>

          {onNavigateSettings && (
            <Button
              size="small"
              variant="text"
              onClick={onNavigateSettings}
              startIcon={<TuneRoundedIcon sx={{ fontSize: '14px' }} />}
              sx={{
                textTransform: 'none',
                fontSize: '11.5px',
                color: '#5e72e4',
                p: '2px 8px',
                minWidth: 'auto',
                fontWeight: 600,
              }}
            >
              Settings
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' }, mb: 1.5 }}>
        <OutlinedInput
          placeholder="Enter keyword or topic (e.g. Lahore smog, AQI Multan, #smog, clean air Punjab)..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
          size="small"
          startAdornment={
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '20px' }} />
            </InputAdornment>
          }
          sx={{
            fontFamily: '"Open Sans", sans-serif',
            fontSize: '13px',
            borderRadius: '10px',
            backgroundColor: darkMode ? '#0b1437' : '#ffffff',
            color: darkMode ? '#ffffff' : '#1e293b',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#d2d6da' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5e72e4' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#5e72e4' },
            '& input': { color: darkMode ? '#ffffff' : 'inherit' },
            '& input::placeholder': { color: darkMode ? '#94a3b8' : undefined, opacity: 1 },
          }}
        />

        <Button
          variant="contained"
          onClick={() => handleSearch()}
          disabled={isFetching || !keyword.trim()}
          startIcon={isFetching ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeRoundedIcon />}
          sx={{
            background: 'linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)',
            color: '#ffffff',
            textTransform: 'none',
            fontFamily: '"Open Sans", sans-serif',
            fontWeight: 600,
            fontSize: '13px',
            borderRadius: '10px',
            px: 3,
            py: 0.8,
            boxShadow: '0 4px 12px rgba(94, 114, 228, 0.25)',
            whiteSpace: 'nowrap',
            '&:hover': {
              background: 'linear-gradient(310deg, #4b5fcc 0%, #6f4ecc 100%)',
            },
          }}
        >
          {isFetching ? 'Fetching & Enriching...' : 'Fetch & Ingest'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: '11.5px', color: darkMode ? '#94a3b8' : '#8392ab', fontWeight: 600, mr: 0.5 }}>
          Quick Queries:
        </Typography>
        {savedQueries.find((q) => q.isActive) && (
          <Tooltip title={`Load Active Query: ${savedQueries.find((q) => q.isActive).title}`}>
            <Chip
              icon={<AutoAwesomeRoundedIcon sx={{ fontSize: '13px !important', color: darkMode ? '#a5b4fc !important' : '#5e72e4 !important' }} />}
              label={`Active EPA Query (${savedQueries.find((q) => q.isActive).versionTag})`}
              size="small"
              clickable
              onClick={() => {
                const activeQ = savedQueries.find((q) => q.isActive);
                setKeyword(activeQ.queryText);
              }}
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: darkMode ? 'rgba(94, 114, 228, 0.2)' : '#e0e7ff',
                color: darkMode ? '#a5b4fc' : '#4338ca',
                borderRadius: '6px',
                height: '22px',
                border: darkMode ? '1px solid rgba(94, 114, 228, 0.35)' : '1px solid #c7d2fe',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(94, 114, 228, 0.3)' : '#c7d2fe',
                },
              }}
            />
          </Tooltip>
        )}
        {QUICK_SUGGESTIONS.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            clickable
            onClick={() => {
              setKeyword(tag);
              handleSearch(tag);
            }}
            sx={{
              fontSize: '11px',
              fontFamily: '"Open Sans", sans-serif',
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
              color: darkMode ? '#cbd5e1' : '#334155',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
              borderRadius: '6px',
              height: '22px',
              transition: 'all 0.15s ease',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(94, 114, 228, 0.2)' : '#e2e8f0',
                color: darkMode ? '#ffffff' : '#5e72e4',
              },
            }}
          />
        ))}
      </Box>

      {feedback && (
        <Alert
          severity={feedback.type}
          icon={feedback.type === 'success' ? <CheckCircleRoundedIcon fontSize="inherit" /> : undefined}
          sx={{
            mt: 2,
            borderRadius: '10px',
            fontSize: '12.5px',
            '& .MuiAlert-message': { width: '100%' },
          }}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}
    </Card>
  );
}

DirectSearchCard.propTypes = {
  dataSource: PropTypes.string,
  onFetchSuccess: PropTypes.func,
  onNavigateSettings: PropTypes.func,
};

export default DirectSearchCard;