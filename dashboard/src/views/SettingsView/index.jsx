import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

// Icons
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import FolderZipRoundedIcon from '@mui/icons-material/FolderZipRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import BookmarkAddRoundedIcon from '@mui/icons-material/BookmarkAddRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DoneRoundedIcon from '@mui/icons-material/DoneRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import RadioButtonCheckedRoundedIcon from '@mui/icons-material/RadioButtonCheckedRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';

// API Services
import {
  getSettings,
  updateSettings,
  testXConnection,
  getSentimentStatus,
  setSentimentEngine,
  reanalyzeSentiment,
  getQueryVersions,
  saveQueryVersion,
  activateQueryVersion,
  updateQueryVersion,
  deleteQueryVersion
} from '../../services/api';

function SettingsView({ onSettingsSaved, onReloadFromDb }) {
  const [tabValue, setTabValue] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [dataSource, setDataSource] = useState('file');
  const [bearerToken, setBearerToken] = useState('');
  const [showBearer, setShowBearer] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [endpoint, setEndpoint] = useState('https://api.twitter.com/2/tweets/search/recent');
  const [defaultQuery, setDefaultQuery] = useState('');
  const [dbInfo, setDbInfo] = useState({ totalPosts: 0, lastSync: '' });

  const [sentimentEngineState, setSentimentEngineState] = useState('vader');
  const [transformerAvailable, setTransformerAvailable] = useState(true);
  const [transformerStatus, setTransformerStatus] = useState('');
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeResult, setReanalyzeResult] = useState(null);

  const [queryVersions, setQueryVersions] = useState([]);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [queryDraft, setQueryDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [titleDraft, setTitleDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [versionActionLoading, setVersionActionLoading] = useState(false);
  const [versionMessage, setVersionMessage] = useState(null);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newQueryText, setNewQueryText] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSetActive, setNewSetActive] = useState(true);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [showAllExclusions, setShowAllExclusions] = useState(false);

  const [testResult, setTestResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [data, sStatus, qVersions] = await Promise.all([
          getSettings(),
          getSentimentStatus().catch(() => ({ activeEngine: 'vader', transformerAvailable: true })),
          getQueryVersions().catch(() => [])
        ]);
        setDataSource(data.data_source || 'file');
        setEndpoint(data.x_api_endpoint || 'https://api.twitter.com/2/tweets/search/recent');
        setDefaultQuery(data.default_query || '');
        setSentimentEngineState(sStatus.activeEngine || 'vader');
        setTransformerAvailable(Boolean(sStatus.transformerAvailable));
        setTransformerStatus(sStatus.transformerStatus || '');
        setDbInfo({
          totalPosts: data.total_posts_in_db || 0,
          lastSync: data.last_sync || new Date().toISOString()
        });
        if (data.x_bearer_token && !data.x_bearer_token.startsWith('TEST_')) {
          setBearerToken(data.x_bearer_token);
        }
        if (Array.isArray(qVersions) && qVersions.length > 0) {
          setQueryVersions(qVersions);
          const activeVer = qVersions.find(v => v.isActive) || qVersions[0];
          setSelectedVersionId(activeVer.id);
          setQueryDraft(activeVer.queryText);
          setTagDraft(activeVer.versionTag);
          setTitleDraft(activeVer.title);
          setDescDraft(activeVer.description || '');
        }
      } catch (err) {
        setErrorMessage(`Could not load settings from backend: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');
    try {
      const payload = {
        data_source: dataSource,
        x_api_endpoint: endpoint,
        default_query: defaultQuery,
        sentiment_engine: sentimentEngineState,
      };
      if (bearerToken) payload.x_bearer_token = bearerToken;
      if (apiKey) payload.x_api_key = apiKey;
      if (apiSecret) payload.x_api_secret = apiSecret;

      const updated = await updateSettings(payload);
      setSaveSuccess(true);
      if (onSettingsSaved) onSettingsSaved(updated);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      setErrorMessage(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchEngine = async (eng) => {
    setSentimentEngineState(eng);
    try {
      await setSentimentEngine(eng);
    } catch (e) {
      console.error("Failed to switch sentiment engine:", e);
    }
  };

  const handleReanalyzeAll = async () => {
    setReanalyzing(true);
    setReanalyzeResult(null);
    setErrorMessage('');
    try {
      const res = await reanalyzeSentiment(sentimentEngineState);
      setReanalyzeResult(res);
      if (onReloadFromDb) onReloadFromDb();
    } catch (err) {
      setErrorMessage(`Sentiment re-analysis failed: ${err.message}`);
    } finally {
      setReanalyzing(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testXConnection({
        bearerToken: bearerToken.trim(),
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim()
      });
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        message: `Connection test error: ${err.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSelectVersion = (id) => {
    const ver = queryVersions.find(v => v.id === id);
    if (!ver) return;
    setSelectedVersionId(id);
    setQueryDraft(ver.queryText);
    setTagDraft(ver.versionTag);
    setTitleDraft(ver.title);
    setDescDraft(ver.description || '');
    setVersionMessage(null);
  };

  const handleCopyQuery = (textToCopy) => {
    const target = textToCopy || queryDraft;
    navigator.clipboard.writeText(target).then(() => {
      setCopiedQuery(true);
      setTimeout(() => setCopiedQuery(false), 2500);
    });
  };

  const handleActivateVersion = async (id) => {
    setVersionActionLoading(true);
    setVersionMessage(null);
    try {
      await activateQueryVersion(id);
      const updatedVersions = await getQueryVersions();
      setQueryVersions(updatedVersions);
      const activeVer = updatedVersions.find(v => v.id === id);
      if (activeVer) {
        setSelectedVersionId(id);
        setQueryDraft(activeVer.queryText);
        setTagDraft(activeVer.versionTag);
        setTitleDraft(activeVer.title);
        setDescDraft(activeVer.description || '');
        setDefaultQuery(activeVer.queryText);
        if (onSettingsSaved) {
          onSettingsSaved({ data_source: dataSource, default_query: activeVer.queryText });
        }
      }
      setVersionMessage({
        type: 'success',
        text: `Query version ${activeVer ? activeVer.versionTag : ''} is now active system-wide!`
      });
      setTimeout(() => setVersionMessage(null), 5000);
    } catch (err) {
      setVersionMessage({ type: 'error', text: `Failed to activate version: ${err.message}` });
    } finally {
      setVersionActionLoading(false);
    }
  };

  const handleUpdateCurrentVersion = async () => {
    if (!selectedVersionId) return;
    setVersionActionLoading(true);
    setVersionMessage(null);
    try {
      await updateQueryVersion({
        id: selectedVersionId,
        versionTag: tagDraft,
        title: titleDraft,
        queryText: queryDraft,
        description: descDraft
      });
      const updatedVersions = await getQueryVersions();
      setQueryVersions(updatedVersions);
      const curr = updatedVersions.find(v => v.id === selectedVersionId);
      if (curr?.isActive) {
        setDefaultQuery(curr.queryText);
        if (onSettingsSaved) {
          onSettingsSaved({ data_source: dataSource, default_query: curr.queryText });
        }
      }
      setVersionMessage({
        type: 'success',
        text: `Version ${tagDraft} updated and persisted successfully!`
      });
      setTimeout(() => setVersionMessage(null), 4000);
    } catch (err) {
      setVersionMessage({ type: 'error', text: `Failed to update version: ${err.message}` });
    } finally {
      setVersionActionLoading(false);
    }
  };

  const handleOpenNewVersionModal = () => {
    let nextTag = 'v1.3';
    const tagMatches = queryVersions
      .map(v => v.versionTag.match(/v(\d+)\.(\d+)/))
      .filter(Boolean)
      .map(m => parseFloat(`${m[1]}.${m[2]}`));
    if (tagMatches.length > 0) {
      const maxVer = Math.max(...tagMatches);
      nextTag = `v${(maxVer + 0.1).toFixed(1)}`;
    }
    setNewTag(nextTag);
    setNewTitle('Updated Punjab AQI Constraints');
    setNewQueryText(queryDraft || defaultQuery);
    setNewDesc('');
    setNewSetActive(true);
    setIsNewModalOpen(true);
  };

  const handleSaveNewVersion = async () => {
    if (!newTag.trim() || !newQueryText.trim()) return;
    setVersionActionLoading(true);
    try {
      const saved = await saveQueryVersion({
        versionTag: newTag.trim(),
        title: newTitle.trim() || 'Custom Search Query',
        queryText: newQueryText.trim(),
        description: newDesc.trim(),
        setActive: newSetActive
      });
      const updatedVersions = await getQueryVersions();
      setQueryVersions(updatedVersions);
      setSelectedVersionId(saved.id);
      setQueryDraft(saved.queryText);
      setTagDraft(saved.versionTag);
      setTitleDraft(saved.title);
      setDescDraft(saved.description || '');
      if (newSetActive) {
        setDefaultQuery(saved.queryText);
        if (onSettingsSaved) {
          onSettingsSaved({ data_source: dataSource, default_query: saved.queryText });
        }
      }
      setIsNewModalOpen(false);
      setVersionMessage({
        type: 'success',
        text: `Successfully created and saved query version ${saved.versionTag}!${newSetActive ? ' (Set as Active)' : ''}`
      });
      setTimeout(() => setVersionMessage(null), 5000);
    } catch (err) {
      setVersionMessage({ type: 'error', text: `Failed to save new version: ${err.message}` });
    } finally {
      setVersionActionLoading(false);
    }
  };

  const handleDeleteVersion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this query version?')) return;
    setVersionActionLoading(true);
    setVersionMessage(null);
    try {
      await deleteQueryVersion(id);
      const updatedVersions = await getQueryVersions();
      setQueryVersions(updatedVersions);
      const fallback = updatedVersions.find(v => v.isActive) || updatedVersions[0];
      if (fallback) {
        setSelectedVersionId(fallback.id);
        setQueryDraft(fallback.queryText);
        setTagDraft(fallback.versionTag);
        setTitleDraft(fallback.title);
        setDescDraft(fallback.description || '');
      }
      setVersionMessage({ type: 'success', text: 'Query version deleted.' });
      setTimeout(() => setVersionMessage(null), 3000);
    } catch (err) {
      setVersionMessage({ type: 'error', text: err.message });
    } finally {
      setVersionActionLoading(false);
    }
  };

  const selectedVersionObj = queryVersions.find(v => v.id === selectedVersionId) || queryVersions[0];

  const parsedTokens = useMemo(() => {
    if (!queryDraft) return { positives: [], locations: [], negatives: [] };
    const tokens = queryDraft.split(/\s+/);
    const negatives = [];
    const positives = [];
    const locations = [];
    const knownLocations = ['lahore', 'gujranwala', 'faisalabad', 'multan', 'sialkot', 'attock', 'rawalpindi', 'islamabad', 'pakistan', 'punjab'];

    tokens.forEach(tok => {
      const clean = tok.replace(/[()"]/g, '').trim();
      if (!clean) return;
      if (clean.startsWith('-')) {
        negatives.push(clean);
      } else if (knownLocations.includes(clean.toLowerCase())) {
        locations.push(clean);
      } else if (['aqi', 'air', 'quality', 'pollution', 'smog', 'clean', 'stubble', 'burning', 'crop', 'residue'].includes(clean.toLowerCase())) {
        positives.push(clean);
      }
    });

    return {
      positives: Array.from(new Set(positives)),
      locations: Array.from(new Set(locations)),
      negatives: Array.from(new Set(negatives))
    };
  }, [queryDraft]);

  const activeVersionObj = useMemo(() => {
    return queryVersions.find(v => v.isActive) || queryVersions[0];
  }, [queryVersions]);

  return (
    <Box sx={{ py: 1 }}>
      {/* Top Feedback Alerts */}
      {saveSuccess && (
        <Alert
          severity="success"
          icon={<CheckCircleRoundedIcon />}
          sx={{ mb: 2.5, borderRadius: '10px' }}
        >
          Settings successfully updated and saved into local SQLite database!
        </Alert>
      )}

      {errorMessage && (
        <Alert
          severity="error"
          sx={{ mb: 2.5, borderRadius: '10px' }}
          onClose={() => setErrorMessage('')}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Main Settings Container */}
      <Card
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Top Header & Live Telemetry Strip */}
        <Box sx={{ p: { xs: 2.5, sm: 3 }, pb: 2.5, borderBottom: '1px solid #f1f5f9' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
            <Box>
              <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: '20px', color: '#0f172a', letterSpacing: '-0.01em' }}>
                System Settings & Configuration
              </Typography>
              <Typography sx={{ fontSize: '13px', color: '#64748b', mt: 0.3 }}>
                EPA Punjab air quality surveillance pipeline, NLP sentiment engine, search parameters, and API integration.
              </Typography>
            </Box>

            {/* Quick-Jump Status Summary Strip */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Tooltip title="Data Source: Click to configure pipeline" arrow>
                <Chip
                  icon={<HubRoundedIcon sx={{ fontSize: '14px !important' }} />}
                  label={dataSource === 'x_api' ? 'Live X API' : 'File Ingestion'}
                  onClick={() => setTabValue(0)}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '11px',
                    borderRadius: '6px',
                    bgcolor: dataSource === 'x_api' ? '#ecfdf5' : '#f1f5f9',
                    color: dataSource === 'x_api' ? '#065f46' : '#334155',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: dataSource === 'x_api' ? '#a7f3d0' : '#e2e8f0',
                    '&:hover': { bgcolor: '#e2e8f0' }
                  }}
                />
              </Tooltip>

              <Tooltip title="NLP Model: Click to view sentiment engines" arrow>
                <Chip
                  icon={<TuneRoundedIcon sx={{ fontSize: '14px !important' }} />}
                  label={sentimentEngineState === 'transformer' ? 'RoBERTa NLP' : 'VADER Lexicon'}
                  onClick={() => setTabValue(0)}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '11px',
                    borderRadius: '6px',
                    bgcolor: '#f5f3ff',
                    color: '#5b21b6',
                    cursor: 'pointer',
                    border: '1px solid #ddd6fe',
                    '&:hover': { bgcolor: '#ede9fe' }
                  }}
                />
              </Tooltip>

              <Tooltip title="Active Query: Click to view constraints" arrow>
                <Chip
                  icon={<CheckCircleRoundedIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} />}
                  label={`Query: ${activeVersionObj?.versionTag || 'v1.1'}`}
                  onClick={() => setTabValue(1)}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '11px',
                    borderRadius: '6px',
                    bgcolor: '#ecfdf5',
                    color: '#047857',
                    cursor: 'pointer',
                    border: '1px solid #a7f3d0',
                    '&:hover': { bgcolor: '#d1fae5' }
                  }}
                />
              </Tooltip>

              <Tooltip title="Local Storage: Click to view database stats" arrow>
                <Chip
                  icon={<StorageRoundedIcon sx={{ fontSize: '14px !important' }} />}
                  label={`${dbInfo.totalPosts} Verified`}
                  onClick={() => setTabValue(3)}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '11px',
                    borderRadius: '6px',
                    bgcolor: '#f8fafc',
                    color: '#475569',
                    cursor: 'pointer',
                    border: '1px solid #cbd5e1',
                    '&:hover': { bgcolor: '#f1f5f9' }
                  }}
                />
              </Tooltip>
            </Box>
          </Box>

          {/* Clean Top Tabs Navigation */}
          <Tabs
            value={tabValue}
            onChange={(e, val) => setTabValue(val)}
            variant="scrollable"
            scrollButtons={false}
            allowScrollButtonsMobile
            sx={{
              mt: 2.5,
              minHeight: '44px',
              borderBottom: '1px solid #e2e8f0',
              '& .MuiTabs-indicator': {
                backgroundColor: '#4f46e5',
                height: '2.5px',
                borderRadius: '2px'
              },
              '& .MuiTab-root': {
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                px: { xs: 1.5, sm: 2.5 },
                fontSize: { xs: '12px', sm: '13px' },
                textTransform: 'none',
                fontWeight: 600,
                minHeight: '44px',
                color: '#64748b',
                '&.Mui-selected': { color: '#4f46e5' }
              }
            }}
          >
            <Tab
              icon={<HubRoundedIcon sx={{ fontSize: '18px' }} />}
              iconPosition="start"
              label={
                <Box component="span" sx={{ display: 'inline' }}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Pipeline &amp; NLP Engine</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Pipeline &amp; AI</Box>
                </Box>
              }
            />
            <Tab
              icon={<TuneRoundedIcon sx={{ fontSize: '18px' }} />}
              iconPosition="start"
              label={
                <Box component="span" sx={{ display: 'inline' }}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Search Query Constraints</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Query Rules</Box>
                </Box>
              }
            />
            <Tab
              icon={<KeyRoundedIcon sx={{ fontSize: '18px' }} />}
              iconPosition="start"
              label={
                <Box component="span" sx={{ display: 'inline' }}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>X (Twitter) API v2</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>X / Twitter API</Box>
                </Box>
              }
            />
            <Tab
              icon={<StorageRoundedIcon sx={{ fontSize: '18px' }} />}
              iconPosition="start"
              label={
                <Box component="span" sx={{ display: 'inline' }}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Storage &amp; Persistence</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Database</Box>
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Tab 0: Pipeline & AI Models */}
        {tabValue === 0 && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            {/* Section 1: Ingestion Mode */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                    Data Ingestion Source
                  </Typography>
                  <Typography sx={{ fontSize: '12.5px', color: '#64748b' }}>
                    Choose whether the monitoring pipeline ingests local batch scrape files or queries live X.com API.
                  </Typography>
                </Box>
                <Chip
                  label={dataSource === 'x_api' ? 'Live X Stream Active' : 'File Ingestion Active'}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '11px',
                    borderRadius: '6px',
                    bgcolor: dataSource === 'x_api' ? '#ecfdf5' : '#eef2ff',
                    color: dataSource === 'x_api' ? '#047857' : '#4338ca',
                    border: '1px solid',
                    borderColor: dataSource === 'x_api' ? '#a7f3d0' : '#c7d2fe'
                  }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {/* File Ingestion Tile */}
                <Box
                  onClick={() => setDataSource('file')}
                  sx={{
                    border: '1.5px solid',
                    borderColor: dataSource === 'file' ? '#4f46e5' : '#e2e8f0',
                    backgroundColor: dataSource === 'file' ? '#faf5ff' : '#ffffff',
                    borderRadius: '12px',
                    p: 2.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': { borderColor: '#818cf8' },
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start'
                  }}
                >
                  <Box sx={{ pt: 0.3, color: dataSource === 'file' ? '#4f46e5' : '#94a3b8' }}>
                    {dataSource === 'file' ? (
                      <RadioButtonCheckedRoundedIcon sx={{ fontSize: '20px' }} />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon sx={{ fontSize: '20px' }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <FolderZipRoundedIcon sx={{ fontSize: '18px', color: dataSource === 'file' ? '#4f46e5' : '#64748b' }} />
                      <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                        File Ingestion Mode (Batch Scrapes)
                      </Typography>
                      <Chip label="Offline Safe" size="small" sx={{ height: '18px', fontSize: '10px', fontWeight: 600, bgcolor: '#f1f5f9', color: '#475569' }} />
                    </Box>
                    <Typography sx={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                      Ingests batch JSON scrape archives (e.g. <code>batch1.json</code>) via drag-and-drop or local file directory import. Runs offline against historical scrapes with zero API rate-limits.
                    </Typography>
                  </Box>
                </Box>

                {/* Live X API Tile */}
                <Box
                  onClick={() => setDataSource('x_api')}
                  sx={{
                    border: '1.5px solid',
                    borderColor: dataSource === 'x_api' ? '#059669' : '#e2e8f0',
                    backgroundColor: dataSource === 'x_api' ? '#f0fdf4' : '#ffffff',
                    borderRadius: '12px',
                    p: 2.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': { borderColor: '#34d399' },
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start'
                  }}
                >
                  <Box sx={{ pt: 0.3, color: dataSource === 'x_api' ? '#059669' : '#94a3b8' }}>
                    {dataSource === 'x_api' ? (
                      <RadioButtonCheckedRoundedIcon sx={{ fontSize: '20px' }} />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon sx={{ fontSize: '20px' }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <LanguageRoundedIcon sx={{ fontSize: '18px', color: dataSource === 'x_api' ? '#059669' : '#64748b' }} />
                      <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                        Live X (Twitter) API v2
                      </Typography>
                      <Chip label="Real-Time" size="small" sx={{ height: '18px', fontSize: '10px', fontWeight: 600, bgcolor: '#dcfce7', color: '#15803d' }} />
                    </Box>
                    <Typography sx={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                      Executes live queries against X API v2 (<code>/2/tweets/search/recent</code>). Fetches real-time smog emergencies and citizen reports directly into the local SQLite database.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Section 2: Sentiment Engine */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                    Sentiment Analysis NLP Engine
                  </Typography>
                  <Typography sx={{ fontSize: '12.5px', color: '#64748b' }}>
                    Select between high-speed regional rule-based scoring or deep RoBERTa transformer neural models.
                  </Typography>
                </Box>
                <Chip
                  label={sentimentEngineState === 'transformer' ? 'Transformer Active' : 'VADER Active'}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '11px',
                    borderRadius: '6px',
                    bgcolor: sentimentEngineState === 'transformer' ? '#f5f3ff' : '#eef2ff',
                    color: sentimentEngineState === 'transformer' ? '#5b21b6' : '#4338ca',
                    border: '1px solid',
                    borderColor: sentimentEngineState === 'transformer' ? '#ddd6fe' : '#c7d2fe'
                  }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {/* VADER Tile */}
                <Box
                  onClick={() => handleSwitchEngine('vader')}
                  sx={{
                    border: '1.5px solid',
                    borderColor: sentimentEngineState === 'vader' ? '#4f46e5' : '#e2e8f0',
                    backgroundColor: sentimentEngineState === 'vader' ? '#faf5ff' : '#ffffff',
                    borderRadius: '12px',
                    p: 2.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': { borderColor: '#818cf8' },
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start'
                  }}
                >
                  <Box sx={{ pt: 0.3, color: sentimentEngineState === 'vader' ? '#4f46e5' : '#94a3b8' }}>
                    {sentimentEngineState === 'vader' ? (
                      <RadioButtonCheckedRoundedIcon sx={{ fontSize: '20px' }} />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon sx={{ fontSize: '20px' }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SpeedRoundedIcon sx={{ fontSize: '18px', color: sentimentEngineState === 'vader' ? '#4f46e5' : '#64748b' }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                          VADER + Regional Lexicon
                        </Typography>
                      </Box>
                      <Chip label="Ultra-Fast (<1ms)" size="small" sx={{ height: '18px', fontSize: '10px', fontWeight: 600, bgcolor: '#f1f5f9', color: '#475569' }} />
                    </Box>
                    <Typography sx={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                      Sub-millisecond latency. Calibrated with <strong>Roman Urdu</strong> (<em>tabahi, ghutan, zehreela</em>), Urdu script keywords, Punjab EPA smog terms, and contextual negation modifiers.
                    </Typography>
                  </Box>
                </Box>

                {/* Transformer Tile */}
                <Box
                  onClick={() => handleSwitchEngine('transformer')}
                  sx={{
                    border: '1.5px solid',
                    borderColor: sentimentEngineState === 'transformer' ? '#4f46e5' : '#e2e8f0',
                    backgroundColor: sentimentEngineState === 'transformer' ? '#faf5ff' : '#ffffff',
                    borderRadius: '12px',
                    p: 2.5,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': { borderColor: '#818cf8' },
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start'
                  }}
                >
                  <Box sx={{ pt: 0.3, color: sentimentEngineState === 'transformer' ? '#4f46e5' : '#94a3b8' }}>
                    {sentimentEngineState === 'transformer' ? (
                      <RadioButtonCheckedRoundedIcon sx={{ fontSize: '20px' }} />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon sx={{ fontSize: '20px' }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoAwesomeRoundedIcon sx={{ fontSize: '18px', color: sentimentEngineState === 'transformer' ? '#4f46e5' : '#64748b' }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                          Local Transformer (RoBERTa)
                        </Typography>
                      </Box>
                      <Chip
                        label={transformerAvailable ? "Model Ready" : "Offline"}
                        size="small"
                        sx={{
                          height: '18px',
                          fontSize: '10px',
                          fontWeight: 600,
                          bgcolor: transformerAvailable ? '#dcfce7' : '#fee2e2',
                          color: transformerAvailable ? '#15803d' : '#991b1b'
                        }}
                      />
                    </Box>
                    <Typography sx={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                      Deep neural model (<code>cardiffnlp/twitter-roberta</code>). Trained on 124M tweets with self-attention for complex sentence structures, irony, and deep public alarm detection.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Re-analyze Action Strip */}
              <Box
                sx={{
                  mt: 2.5,
                  p: 2,
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5
                }}
              >
                <Box sx={{ flex: 1, minWidth: '240px' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                    Recalibrate Database Sentiment
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#64748b' }}>
                    Re-runs <strong>{sentimentEngineState === 'transformer' ? 'RoBERTa Transformer' : 'VADER + Regional Lexicon'}</strong> across all verified posts in your local SQLite store.
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleReanalyzeAll}
                  disabled={reanalyzing}
                  startIcon={reanalyzing ? <CircularProgress size={14} /> : <TuneRoundedIcon sx={{ fontSize: '16px' }} />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '12px',
                    borderColor: '#4f46e5',
                    color: '#4f46e5',
                    borderRadius: '8px',
                    px: 2,
                    py: 0.7,
                    '&:hover': { borderColor: '#3730a3', backgroundColor: '#eef2ff' }
                  }}
                >
                  {reanalyzing ? `Analyzing Posts...` : `Re-analyze All Posts (${sentimentEngineState.toUpperCase()})`}
                </Button>
              </Box>

              {reanalyzeResult && (
                <Alert severity="success" sx={{ borderRadius: '10px', mt: 2, fontSize: '12.5px' }}>
                  Re-analyzed <strong>{reanalyzeResult.totalReanalyzed}</strong> posts with {reanalyzeResult.engine.toUpperCase()}. Average Polarity: <strong>{reanalyzeResult.averageScore}</strong>.
                  {' '}(Critical: {reanalyzeResult.distribution["Critical / Alarmed"] || 0}, Concerned: {reanalyzeResult.distribution["Concerned"] || 0}, Neutral: {reanalyzeResult.distribution["Informative / Neutral"] || 0}, Positive: {reanalyzeResult.distribution["Positive / Solution-Oriented"] || 0})
                </Alert>
              )}
            </Box>

            {/* Bottom Save Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: '1px solid #f1f5f9' }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon sx={{ fontSize: '18px' }} />}
                sx={{
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  borderRadius: '8px',
                  px: 3,
                  py: 0.8,
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#4338ca', boxShadow: 'none' }
                }}
              >
                {saving ? 'Saving...' : 'Save Pipeline Configuration'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Tab 1: Search Query Rules */}
        {tabValue === 1 && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            {/* Version Management Bar */}
            <Box
              sx={{
                mb: 2.5,
                p: { xs: 1.5, sm: 2 },
                borderRadius: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                alignItems: { xs: 'stretch', lg: 'center' },
                justifyContent: 'space-between',
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                  Active Constraint Profile:
                </Typography>
                <FormControl size="small" sx={{ minWidth: 200, flex: { xs: 1, sm: '0 1 320px' } }}>
                  <Select
                    value={selectedVersionId || ''}
                    onChange={(e) => handleSelectVersion(Number(e.target.value))}
                    sx={{
                      fontSize: '12.5px',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      '& .MuiSelect-select': { py: 0.8, textOverflow: 'ellipsis', overflow: 'hidden' },
                    }}
                  >
                    {queryVersions.map((v) => (
                      <MenuItem key={v.id} value={v.id} sx={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong>{v.versionTag}</strong> — {v.title}
                        </span>
                        {v.isActive && (
                          <Chip label="Active Default" size="small" sx={{ height: '18px', fontSize: '10px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, flexShrink: 0 }} />
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedVersionObj?.isActive ? (
                  <Chip
                    icon={<CheckCircleRoundedIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} />}
                    label="Current System Default"
                    size="small"
                    sx={{
                      backgroundColor: '#ecfdf5',
                      color: '#047857',
                      fontWeight: 700,
                      fontSize: '11px',
                      border: '1px solid #a7f3d0',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={versionActionLoading}
                    onClick={() => handleActivateVersion(selectedVersionObj?.id)}
                    startIcon={<CheckCircleRoundedIcon sx={{ fontSize: '15px' }} />}
                    sx={{
                      borderColor: '#059669',
                      color: '#059669',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: '6px',
                      py: 0.4,
                      flexShrink: 0,
                      '&:hover': { backgroundColor: '#f0fdf4', borderColor: '#047857' },
                    }}
                  >
                    Activate As Default
                  </Button>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setIsHistoryModalOpen(true)}
                  startIcon={<HistoryRoundedIcon sx={{ fontSize: '16px' }} />}
                  sx={{
                    textTransform: 'none',
                    fontSize: '12px',
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    borderRadius: '8px',
                    py: 0.6,
                    whiteSpace: 'nowrap',
                    '&:hover': { backgroundColor: '#f1f5f9', borderColor: '#94a3b8' },
                  }}
                >
                  Version History ({queryVersions.length})
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  onClick={handleOpenNewVersionModal}
                  startIcon={<BookmarkAddRoundedIcon sx={{ fontSize: '16px' }} />}
                  sx={{
                    background: 'linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)',
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '12px',
                    borderRadius: '8px',
                    py: 0.6,
                    boxShadow: '0 4px 10px rgba(94, 114, 228, 0.25)',
                    whiteSpace: 'nowrap',
                    '&:hover': { background: 'linear-gradient(310deg, #5263cf 0%, #7353cc 100%)' },
                  }}
                >
                  + Save As New Version
                </Button>
              </Box>
            </Box>

            {versionMessage && (
              <Alert
                severity={versionMessage.type}
                sx={{ mb: 2.5, borderRadius: '8px', fontSize: '12px' }}
                onClose={() => setVersionMessage(null)}
              >
                {versionMessage.text}
              </Alert>
            )}

            {/* Query Editor Box */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Boolean Search String (X API / Pipeline Query Syntax)
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#94a3b8' }}>
                  Updated: {selectedVersionObj ? new Date(selectedVersionObj.updatedAt).toLocaleDateString() : ''}
                </Typography>
              </Box>

              <Box
                component="textarea"
                value={queryDraft}
                onChange={(e) => setQueryDraft(e.target.value)}
                rows={4}
                sx={{
                  width: '100%',
                  p: 2,
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '12px',
                  lineHeight: 1.6,
                  color: '#1e293b',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                  '&:focus': {
                    borderColor: '#4f46e5',
                    boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.12)'
                  }
                }}
              />

              <Box
                sx={{
                  mt: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                <Typography sx={{ fontSize: '11.5px', color: '#64748b' }}>
                  Length: <strong>{queryDraft.length}</strong> characters • Estimated cost: <strong>~{Math.round(queryDraft.split(/\s+/).length * 1.3)}</strong> API tokens
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleCopyQuery()}
                    startIcon={copiedQuery ? <DoneRoundedIcon sx={{ fontSize: '15px' }} /> : <ContentCopyRoundedIcon sx={{ fontSize: '15px' }} />}
                    sx={{
                      textTransform: 'none',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      borderColor: copiedQuery ? '#059669' : '#cbd5e1',
                      color: copiedQuery ? '#059669' : '#475569',
                      backgroundColor: copiedQuery ? '#ecfdf5' : 'transparent',
                      py: 0.4
                    }}
                  >
                    {copiedQuery ? 'Copied to Clipboard' : 'Copy Query'}
                  </Button>

                  <Button
                    size="small"
                    variant="contained"
                    disabled={versionActionLoading}
                    onClick={handleUpdateCurrentVersion}
                    startIcon={<SaveRoundedIcon sx={{ fontSize: '15px' }} />}
                    sx={{
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      textTransform: 'none',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      py: 0.4,
                      boxShadow: 'none',
                      '&:hover': { backgroundColor: '#4338ca', boxShadow: 'none' }
                    }}
                  >
                    Save Changes to {tagDraft}
                  </Button>

                  {selectedVersionObj && !selectedVersionObj.isActive && queryVersions.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteVersion(selectedVersionObj.id)}
                      sx={{ color: '#ef4444', '&:hover': { backgroundColor: '#fee2e2' } }}
                      title="Delete this query profile"
                    >
                      <DeleteOutlineRoundedIcon sx={{ fontSize: '18px' }} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Parsed Rule Breakdown (Clean, calm presentation) */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                Query Rule Breakdown
              </Typography>

              {/* Keywords */}
              {parsedTokens.positives.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', minWidth: '130px', pt: 0.4 }}>
                    Monitored Topics ({parsedTokens.positives.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, flex: 1 }}>
                    {parsedTokens.positives.map((kw, i) => (
                      <Chip
                        key={i}
                        label={kw}
                        size="small"
                        sx={{
                          height: '22px',
                          fontSize: '11px',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          fontWeight: 500,
                          borderRadius: '6px'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Geographies */}
              {parsedTokens.locations.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', minWidth: '130px', pt: 0.4 }}>
                    Target Geographies ({parsedTokens.locations.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, flex: 1 }}>
                    {parsedTokens.locations.map((loc, i) => (
                      <Chip
                        key={i}
                        label={loc}
                        size="small"
                        sx={{
                          height: '22px',
                          fontSize: '11px',
                          backgroundColor: '#ecfdf5',
                          color: '#065f46',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: '1px solid #a7f3d0'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Exclusions */}
              {parsedTokens.negatives.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', minWidth: '130px', pt: 0.4 }}>
                    Negative Exclusions ({parsedTokens.negatives.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, flex: 1, alignItems: 'center' }}>
                    {(showAllExclusions ? parsedTokens.negatives : parsedTokens.negatives.slice(0, 8)).map((neg, i) => (
                      <Chip
                        key={i}
                        label={neg}
                        size="small"
                        sx={{
                          height: '22px',
                          fontSize: '11px',
                          backgroundColor: '#fef2f2',
                          color: '#991b1b',
                          fontWeight: 500,
                          borderRadius: '6px',
                          border: '1px solid #fecaca'
                        }}
                      />
                    ))}
                    {parsedTokens.negatives.length > 8 && (
                      <Button
                        size="small"
                        onClick={() => setShowAllExclusions(!showAllExclusions)}
                        sx={{ fontSize: '11px', textTransform: 'none', py: 0, px: 1, minWidth: 'auto', color: '#64748b' }}
                      >
                        {showAllExclusions ? 'Show Less' : `+${parsedTokens.negatives.length - 8} more`}
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Tab 2: X (Twitter) API v2 */}
        {tabValue === 2 && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                X (Twitter) API v2 Credentials
              </Typography>
              <Typography sx={{ fontSize: '12.5px', color: '#64748b', mt: 0.3 }}>
                Configure App-Only Bearer Token or Developer Keys to query real-time tweets and surveillance streams.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: '780px' }}>
              {/* Bearer Token */}
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                  X API Bearer Token (App-Only Recommended)
                </Typography>
                <OutlinedInput
                  type={showBearer ? 'text' : 'password'}
                  placeholder="Paste your Twitter Bearer Token (AAAA...)"
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                  fullWidth
                  size="small"
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowBearer(!showBearer)}
                        edge="end"
                      >
                        {showBearer ? <VisibilityOffRoundedIcon sx={{ fontSize: '18px' }} /> : <VisibilityRoundedIcon sx={{ fontSize: '18px' }} />}
                      </IconButton>
                    </InputAdornment>
                  }
                  sx={{
                    fontSize: '13px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4f46e5' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4f46e5' }
                  }}
                />
                <Typography sx={{ fontSize: '11.5px', color: '#64748b', mt: 0.5 }}>
                  Found under Twitter Developer Portal → Projects & Apps → Keys and Tokens → Bearer Token.
                </Typography>
              </Box>

              {/* Endpoint Base URL */}
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                  API Endpoint Base URL
                </Typography>
                <OutlinedInput
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{
                    fontSize: '13px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' }
                  }}
                />
                <Typography sx={{ fontSize: '11.5px', color: '#64748b', mt: 0.5 }}>
                  Standard recent search endpoint: <code>https://api.twitter.com/2/tweets/search/recent</code>
                </Typography>
              </Box>

              {/* Consumer Keys (Optional) */}
              <Box sx={{ pt: 1 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 1 }}>
                  OAuth 1.0a Consumer Credentials (Optional)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: '#64748b', mb: 0.5 }}>
                      Consumer API Key
                    </Typography>
                    <OutlinedInput
                      placeholder="API Key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{
                        fontSize: '13px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc'
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: '#64748b', mb: 0.5 }}>
                      Consumer API Secret
                    </Typography>
                    <OutlinedInput
                      type="password"
                      placeholder="API Secret Key"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{
                        fontSize: '13px',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc'
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Actions & Test Status */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={handleTestConnection}
                  disabled={testing}
                  startIcon={testing ? <CircularProgress size={16} /> : <CheckCircleRoundedIcon sx={{ fontSize: '18px' }} />}
                  sx={{
                    borderColor: '#cbd5e1',
                    color: '#334155',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    borderRadius: '8px',
                    px: 2.5,
                    py: 0.8,
                    '&:hover': {
                      borderColor: '#94a3b8',
                      backgroundColor: '#f8fafc'
                    }
                  }}
                >
                  {testing ? 'Testing Endpoint...' : 'Test Connection'}
                </Button>

                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon sx={{ fontSize: '18px' }} />}
                  sx={{
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    borderRadius: '8px',
                    px: 3,
                    py: 0.8,
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: '#4338ca',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {saving ? 'Saving...' : 'Save API Settings'}
                </Button>
              </Box>

              {testResult && (
                <Alert
                  severity={testResult.success ? 'success' : 'error'}
                  sx={{ borderRadius: '8px', mt: 1, fontSize: '12.5px' }}
                >
                  {testResult.message}
                </Alert>
              )}
            </Box>
          </Box>
        )}

        {/* Tab 3: Database & Storage */}
        {tabValue === 3 && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                Local SQLite Database Telemetry
              </Typography>
              <Typography sx={{ fontSize: '12.5px', color: '#64748b', mt: 0.3 }}>
                Underlying persistence engine, verified posts store, and background synchronization state.
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
              <Box sx={{ p: 2, borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Engine
                </Typography>
                <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', mt: 0.5 }}>
                  SQLite 3
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#059669', fontWeight: 600, mt: 0.3 }}>
                  WAL Mode Active
                </Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Database Path
                </Typography>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', mt: 0.5, wordBreak: 'break-all' }}>
                  data/epa_intelligence.db
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 0.3 }}>
                  Local Storage
                </Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Verified Posts
                </Typography>
                <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#059669', mt: 0.5 }}>
                  {dbInfo.totalPosts}
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 0.3 }}>
                  Stored & Deduplicated
                </Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Last Synchronized
                </Typography>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', mt: 0.5 }}>
                  {new Date(dbInfo.lastSync).toLocaleDateString()}
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 0.3 }}>
                  {new Date(dbInfo.lastSync).toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>

            {onReloadFromDb && (
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Box sx={{ flex: 1, minWidth: '240px' }}>
                  <Typography sx={{ fontSize: '13.5px', fontWeight: 700, color: '#166534' }}>
                    Sync Frontend State with SQLite Store
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#15803d', mt: 0.3 }}>
                    Reload latest verified posts, sentiment labels, and deduplication states from disk into dashboard memory.
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  onClick={onReloadFromDb}
                  startIcon={<SyncRoundedIcon sx={{ fontSize: '18px' }} />}
                  sx={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    px: 2.5,
                    py: 0.7,
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: '#047857',
                      boxShadow: 'none'
                    }
                  }}
                >
                  Sync App Feed With Database
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Card>

      {/* Save New Query Version Modal */}
      <Dialog
        open={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: '16px', color: '#0f172a', pb: 1 }}>
          Save New Query Version
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography sx={{ fontSize: '12px', color: '#64748b' }}>
            Create a new milestone or variation for your search constraints (e.g. seasonal stubble burning, brick kiln blitz, or special festival filters).
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 1.5 }}>
            <TextField
              label="Version Tag"
              size="small"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="v1.3"
              sx={{ '& .MuiInputBase-root': { fontSize: '13px' } }}
            />
            <TextField
              label="Version Title"
              size="small"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Winter Smog Emergency Query"
              sx={{ '& .MuiInputBase-root': { fontSize: '13px' } }}
            />
          </Box>

          <TextField
            label="Changelog / Notes (Optional)"
            size="small"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Explain what was added, modified, or excluded in this version..."
            sx={{ '& .MuiInputBase-root': { fontSize: '12px' } }}
          />

          <TextField
            label="Search Query"
            multiline
            rows={4}
            value={newQueryText}
            onChange={(e) => setNewQueryText(e.target.value)}
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
                fontSize: '11px',
                backgroundColor: '#f8fafc',
              }
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={newSetActive}
                onChange={(e) => setNewSetActive(e.target.checked)}
                sx={{ color: '#059669', '&.Mui-checked': { color: '#059669' } }}
              />
            }
            label={
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Set as Active Default Query immediately
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setIsNewModalOpen(false)}
            sx={{ textTransform: 'none', color: '#64748b' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={versionActionLoading || !newTag.trim() || !newQueryText.trim()}
            onClick={handleSaveNewVersion}
            sx={{
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              px: 3,
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#4338ca', boxShadow: 'none' }
            }}
          >
            Save Version
          </Button>
        </DialogActions>
      </Dialog>

      {/* Query Version History Ledger Modal */}
      <Dialog
        open={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px', p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryRoundedIcon sx={{ color: '#4f46e5', fontSize: '22px' }} />
            <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>
              Query Version History & Evolution Ledger
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setIsHistoryModalOpen(false)}>
            <CloseRoundedIcon sx={{ fontSize: '18px' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography sx={{ fontSize: '12px', color: '#64748b', mb: 2 }}>
            Track how search constraints have evolved over time to adapt to shifting pollution patterns, sports tournament noise, and cross-border debates.
          </Typography>

          <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Version</TableCell>
                  <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Title & Description</TableCell>
                  <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Status</TableCell>
                  <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Date</TableCell>
                  <TableCell align="right" sx={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queryVersions.map((v) => (
                  <TableRow key={v.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                      {v.versionTag}
                    </TableCell>
                    <TableCell sx={{ maxWidth: '300px' }}>
                      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                        {v.title}
                      </Typography>
                      {v.description && (
                        <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
                          {v.description}
                        </Typography>
                      )}
                      <Typography
                        sx={{
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          color: '#8392ab',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '280px',
                          mt: 0.3,
                        }}
                      >
                        {v.queryText}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {v.isActive ? (
                        <Chip label="Active Default" size="small" sx={{ height: '20px', fontSize: '10px', fontWeight: 700, backgroundColor: '#dcfce7', color: '#15803d' }} />
                      ) : (
                        <Chip label="Archived" size="small" sx={{ height: '20px', fontSize: '10px', backgroundColor: '#f1f5f9', color: '#64748b' }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(v.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Button
                          size="small"
                          onClick={() => {
                            handleSelectVersion(v.id);
                            setIsHistoryModalOpen(false);
                          }}
                          sx={{ fontSize: '11px', textTransform: 'none', py: 0.2 }}
                        >
                          Load
                        </Button>
                        {!v.isActive && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              handleActivateVersion(v.id);
                              setIsHistoryModalOpen(false);
                            }}
                            sx={{
                              fontSize: '11px',
                              textTransform: 'none',
                              borderColor: '#059669',
                              color: '#059669',
                              py: 0.2,
                              '&:hover': { backgroundColor: '#f0fdf4' }
                            }}
                          >
                            Activate
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleCopyQuery(v.queryText)}
                          title="Copy query string"
                        >
                          <ContentCopyRoundedIcon sx={{ fontSize: '15px', color: '#64748b' }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setIsHistoryModalOpen(false)}
            sx={{ textTransform: 'none', color: '#64748b' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

SettingsView.propTypes = {
  onSettingsSaved: PropTypes.func,
  onReloadFromDb: PropTypes.func,
};

export default SettingsView;
