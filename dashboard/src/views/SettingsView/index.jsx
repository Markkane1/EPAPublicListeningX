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
import { useArgonController } from '../../context';
import { useAuth } from '../../context/AuthContext';

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
  const [controller] = useArgonController();
  const { darkMode } = controller;
  const { hasPermission } = useAuth();
  const canManageSettings = hasPermission('settings.manage');
  const [tabValue, setTabValue] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [dataSource, setDataSource] = useState('file');
  const [bearerToken, setBearerToken] = useState('');
  const [showBearer, setShowBearer] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [endpoint, setEndpoint] = useState('');
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
        setEndpoint(data.x_api_endpoint || '');
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
        default_query: defaultQuery,
        sentiment_engine: sentimentEngineState,
      };
      if (endpoint) payload.x_api_endpoint = endpoint;
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
    if (!canManageSettings) return;
    try {
      await setSentimentEngine(eng);
      setSentimentEngineState(eng);
    } catch (e) {
      setErrorMessage(`Could not change how posts are scored: ${e.message}`);
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

  const sentimentModeLabel = sentimentEngineState === 'transformer' ? 'Detailed' : 'Standard';

  return (
    <Box sx={{ py: 1 }}>
{saveSuccess && (
        <Alert
          severity="success"
          icon={<CheckCircleRoundedIcon />}
          sx={{ mb: 2.5, borderRadius: '10px' }}
        >
          Settings saved.
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
<Card
        sx={{
          backgroundColor: darkMode ? '#111c44' : '#ffffff',
          borderRadius: '16px',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
<Box sx={{ px: { xs: 2, sm: 3 }, pt: 1.5, pb: 0, borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 1.5 }}>
          <Tabs
            value={tabValue}
            onChange={(e, val) => setTabValue(val)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: '44px',
              maxWidth: '100%',
              '& .MuiTabs-scroller': {
                overflowX: 'auto !important'
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#5e72e4',
                height: '2.5px',
                borderRadius: '2px'
              },
              '& .MuiTab-root': {
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                px: { xs: 1.5, sm: 2.2 },
                fontSize: { xs: '12.5px', sm: '13px' },
                textTransform: 'none',
                fontWeight: 600,
                minHeight: '44px',
                color: darkMode ? '#8898aa' : '#64748b',
                '&.Mui-selected': { color: darkMode ? '#ffffff' : '#5e72e4' }
              }
            }}
          >
            <Tab
              icon={<HubRoundedIcon sx={{ fontSize: '18px' }} />}
              iconPosition="start"
              label={
                <Box component="span" sx={{ display: 'inline' }}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Collection</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Collection</Box>
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
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>X access</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>X access</Box>
                </Box>
              }
            />
            <Tab
              icon={<StorageRoundedIcon sx={{ fontSize: '18px' }} />}
              iconPosition="start"
              label={
                <Box component="span" sx={{ display: 'inline' }}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Storage</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Storage</Box>
                </Box>
              }
            />
          </Tabs>
<Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', flexWrap: 'wrap', gap: 1, py: 1 }}>
            <Tooltip title="Click to choose where posts come from" arrow>
              <Chip
                icon={<HubRoundedIcon sx={{ fontSize: '14px !important' }} />}
                label={dataSource === 'x_api' ? 'Live X' : 'Saved files'}
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

            <Tooltip title="Click to choose how posts are scored" arrow>
              <Chip
                icon={<TuneRoundedIcon sx={{ fontSize: '14px !important' }} />}
                label={sentimentEngineState === 'transformer' ? 'Detailed sentiment' : 'Standard sentiment'}
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

            <Tooltip title="Active Query: Click to inspect constraints" arrow>
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
{tabValue === 0 && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
<Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                    Where posts come from
                  </Typography>
                  <Typography sx={{ fontSize: '12.5px', color: '#64748b' }}>
                    Choose whether posts come from saved files or from live X.
                  </Typography>
                </Box>
                <Chip
                  label={dataSource === 'x_api' ? 'Live X in use' : 'Saved files in use'}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '11px',
                    borderRadius: '6px',
                    bgcolor: dataSource === 'x_api' ? '#ecfdf5' : '#eef2ff',
                    color: dataSource === 'x_api' ? '#047857' : '#4b5fcc',
                    border: '1px solid',
                    borderColor: dataSource === 'x_api' ? '#a7f3d0' : '#c7d2fe'
                  }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
<Box
                  onClick={() => setDataSource('file')}
                  sx={{
                    border: '1.5px solid',
                    borderColor: dataSource === 'file' ? '#5e72e4' : '#e2e8f0',
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
                  <Box sx={{ pt: 0.3, color: dataSource === 'file' ? '#5e72e4' : (darkMode ? '#64748b' : '#94a3b8') }}>
                    {dataSource === 'file' ? (
                      <RadioButtonCheckedRoundedIcon sx={{ fontSize: '20px' }} />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon sx={{ fontSize: '20px' }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <FolderZipRoundedIcon sx={{ fontSize: '18px', color: dataSource === 'file' ? '#5e72e4' : '#64748b' }} />
                      <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                        Saved files
                      </Typography>
                      <Chip label="Offline" size="small" sx={{ height: '18px', fontSize: '10px', fontWeight: 600, bgcolor: '#f1f5f9', color: '#475569' }} />
                    </Box>
                    <Typography sx={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                      Imports posts from files you already have. No live connection is used.
                    </Typography>
                  </Box>
                </Box>
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
                  <Box sx={{ pt: 0.3, color: dataSource === 'x_api' ? '#2dce89' : (darkMode ? '#64748b' : '#94a3b8') }}>
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
                        Live X
                      </Typography>
                      <Chip label="Real-time" size="small" sx={{ height: '18px', fontSize: '10px', fontWeight: 600, bgcolor: '#dcfce7', color: '#15803d' }} />
                    </Box>
                    <Typography sx={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                      Collects new posts from X as they are published.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {dataSource === 'x_api' && !bearerToken && (
                <Alert
                  severity="info"
                  icon={<KeyRoundedIcon />}
                  action={
                    <Button color="inherit" size="small" onClick={() => setTabValue(2)} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '12px' }}>
                      Add token &rarr;
                    </Button>
                  }
                  sx={{ mt: 2, borderRadius: '10px', fontSize: '12px' }}
                >
                  Live X needs an access token before it can collect posts.
                </Alert>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />
<Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                    Sentiment Analysis
                  </Typography>
                  <Typography sx={{ fontSize: '12.5px', color: '#64748b' }}>
                    Choose how reactions in posts are scored.
                  </Typography>
                </Box>
                <Chip
                  label={sentimentEngineState === 'transformer' ? 'Detailed in use' : 'Standard in use'}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '11px',
                    borderRadius: '6px',
                    bgcolor: sentimentEngineState === 'transformer' ? '#f5f3ff' : '#eef2ff',
                    color: sentimentEngineState === 'transformer' ? '#5b21b6' : '#4b5fcc',
                    border: '1px solid',
                    borderColor: sentimentEngineState === 'transformer' ? '#ddd6fe' : '#c7d2fe'
                  }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
<Box
                  onClick={canManageSettings ? () => handleSwitchEngine('vader') : undefined}
                  sx={{
                    border: '1.5px solid',
                    borderColor: sentimentEngineState === 'vader' ? '#5e72e4' : '#e2e8f0',
                    backgroundColor: sentimentEngineState === 'vader' ? '#faf5ff' : '#ffffff',
                    borderRadius: '12px',
                    p: 2.5,
                    cursor: canManageSettings ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    '&:hover': { borderColor: '#818cf8' },
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start'
                  }}
                >
                  <Box sx={{ pt: 0.3, color: sentimentEngineState === 'vader' ? '#5e72e4' : (darkMode ? '#64748b' : '#94a3b8') }}>
                    {sentimentEngineState === 'vader' ? (
                      <RadioButtonCheckedRoundedIcon sx={{ fontSize: '20px' }} />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon sx={{ fontSize: '20px' }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SpeedRoundedIcon sx={{ fontSize: '18px', color: sentimentEngineState === 'vader' ? '#5e72e4' : '#64748b' }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                          Standard
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                      Scores each post as alarmed, concerned, neutral, or positive.
                    </Typography>
                  </Box>
                </Box>
<Box
                  onClick={canManageSettings ? () => handleSwitchEngine('transformer') : undefined}
                  sx={{
                    border: '1.5px solid',
                    borderColor: sentimentEngineState === 'transformer' ? '#5e72e4' : '#e2e8f0',
                    backgroundColor: sentimentEngineState === 'transformer' ? '#faf5ff' : '#ffffff',
                    borderRadius: '12px',
                    p: 2.5,
                    cursor: canManageSettings ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    '&:hover': { borderColor: '#818cf8' },
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start'
                  }}
                >
                  <Box sx={{ pt: 0.3, color: sentimentEngineState === 'transformer' ? '#5e72e4' : (darkMode ? '#64748b' : '#94a3b8') }}>
                    {sentimentEngineState === 'transformer' ? (
                      <RadioButtonCheckedRoundedIcon sx={{ fontSize: '20px' }} />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon sx={{ fontSize: '20px' }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoAwesomeRoundedIcon sx={{ fontSize: '18px', color: sentimentEngineState === 'transformer' ? '#5e72e4' : '#64748b' }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                          Detailed
                        </Typography>
                      </Box>
                      <Chip
                        label={transformerAvailable ? "Available" : "Unavailable"}
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
                      Reads mixed or indirect wording before assigning the same reaction labels.
                    </Typography>
                  </Box>
                </Box>
              </Box>
<Box
                sx={{
                  mt: 2.5,
                  p: 2,
                  borderRadius: '10px',
                  backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5
                }}
              >
                <Box sx={{ flex: 1, minWidth: '240px' }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                    Score posts again
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: '#64748b' }}>
                    Scores every verified post again with the option selected above.
                  </Typography>
                </Box>

                {canManageSettings && (
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
                    borderColor: '#5e72e4',
                    color: '#5e72e4',
                    borderRadius: '8px',
                    px: 2,
                    py: 0.7,
                    '&:hover': { borderColor: '#3730a3', backgroundColor: '#eef2ff' }
                  }}
                >
                  {reanalyzing ? 'Analyzing posts...' : 'Re-analyze all posts'}
                </Button>
                )}
              </Box>

              {reanalyzeResult && (
                <Alert severity="success" sx={{ borderRadius: '10px', mt: 2, fontSize: '12.5px' }}>
                  Re-analyzed <strong>{reanalyzeResult.totalReanalyzed}</strong> posts with {sentimentModeLabel}. Average score: <strong>{reanalyzeResult.averageScore}</strong>.
                  {' '}(Critical: {reanalyzeResult.distribution["Critical / Alarmed"] || 0}, Concerned: {reanalyzeResult.distribution["Concerned"] || 0}, Neutral: {reanalyzeResult.distribution["Informative / Neutral"] || 0}, Positive: {reanalyzeResult.distribution["Positive / Solution-Oriented"] || 0})
                </Alert>
              )}
            </Box>
{canManageSettings && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9' }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon sx={{ fontSize: '18px' }} />}
                sx={{
                  backgroundColor: '#5e72e4',
                  color: '#ffffff',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  borderRadius: '8px',
                  px: 3,
                  py: 0.8,
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#4b5fcc', boxShadow: 'none' }
                }}
              >
                {saving ? 'Saving...' : 'Save settings'}
              </Button>
            </Box>
            )}
          </Box>
        )}
{tabValue === 1 && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
<Box
              sx={{
                mb: 2.5,
                p: { xs: 1.5, sm: 2 },
                borderRadius: '12px',
                backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
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
                      backgroundColor: darkMode ? '#111c44' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#1e293b',
                      borderRadius: '8px',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : undefined },
                      '& .MuiSvgIcon-root': { color: darkMode ? '#94a3b8' : undefined },
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
                ) : canManageSettings ? (
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
                ) : null}
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

                {canManageSettings && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleOpenNewVersionModal}
                  startIcon={<BookmarkAddRoundedIcon sx={{ fontSize: '16px' }} />}
                  sx={{
                    backgroundColor: '#5e72e4',
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '12px',
                    borderRadius: '8px',
                    py: 0.6,
                    boxShadow: 'none',
                    whiteSpace: 'nowrap',
                    '&:hover': { backgroundColor: '#4b5fcc', boxShadow: 'none' },
                  }}
                >
                  + Save As New Version
                </Button>
                )}
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
<Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Search terms
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
                  backgroundColor: darkMode ? '#070d24' : '#f8fafc',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '12px',
                  lineHeight: 1.6,
                  color: darkMode ? '#f8fafc' : '#1e293b',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                  '&:focus': {
                    borderColor: '#5e72e4',
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
                  Length: <strong>{queryDraft.length}</strong> characters
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {selectedVersionObj && queryDraft !== selectedVersionObj.queryText && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setQueryDraft(selectedVersionObj.queryText)}
                      sx={{ textTransform: 'none', fontSize: '11.5px', color: '#64748b' }}
                    >
                      Revert Changes
                    </Button>
                  )}

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

                  {canManageSettings && (
                  <Button
                    size="small"
                    variant="contained"
                    disabled={versionActionLoading}
                    onClick={handleUpdateCurrentVersion}
                    startIcon={<SaveRoundedIcon sx={{ fontSize: '15px' }} />}
                    sx={{
                      backgroundColor: '#5e72e4',
                      color: '#ffffff',
                      textTransform: 'none',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      py: 0.4,
                      boxShadow: 'none',
                      '&:hover': { backgroundColor: '#4b5fcc', boxShadow: 'none' }
                    }}
                  >
                    Save Changes to {tagDraft}
                  </Button>
                  )}

                  {canManageSettings && selectedVersionObj && !selectedVersionObj.isActive && queryVersions.length > 1 && (
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
<Box
              sx={{
                p: 2.5,
                borderRadius: '10px',
                backgroundColor: darkMode ? '#0b1437' : '#ffffff',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#ffffff' : '#0f172a' }}>
                Query Rule Breakdown
              </Typography>
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
{tabValue === 2 && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                X access
              </Typography>
              <Typography sx={{ fontSize: '12.5px', color: '#64748b', mt: 0.3 }}>
                Add the token used to collect new posts from X.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: '780px' }}>
<Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    Access token
                  </Typography>
                  {bearerToken ? (
                    <Chip label="Configured" size="small" sx={{ height: '18px', fontSize: '10px', bgcolor: '#dcfce7', color: '#15803d', fontWeight: 600 }} />
                  ) : (
                    <Chip label="Not Configured" size="small" sx={{ height: '18px', fontSize: '10px', bgcolor: '#f1f5f9', color: '#64748b' }} />
                  )}
                </Box>
                <OutlinedInput
                  type={showBearer ? 'text' : 'password'}
                  placeholder="Paste access token"
                  value={bearerToken}
                  onChange={(e) => setBearerToken(e.target.value)}
                  fullWidth
                  size="small"
                  endAdornment={
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text) setBearerToken(text.trim());
                          } catch (e) {
                            console.warn('Clipboard read error:', e);
                          }
                        }}
                        sx={{ fontSize: '11px', textTransform: 'none', py: 0.2, px: 1, minWidth: 'auto', mr: 0.5, color: '#64748b' }}
                      >
                        Paste
                      </Button>
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
                    backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                    color: darkMode ? '#ffffff' : '#1e293b',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5e72e4' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#5e72e4' }
                  }}
                />
                <Typography sx={{ fontSize: '11.5px', color: '#64748b', mt: 0.5 }}>
                  The token from your X developer account.
                </Typography>
              </Box>
<Box sx={{ pt: 1 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 1 }}>
                  Optional extra keys
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: '#64748b', mb: 0.5 }}>
                      Access key
                    </Typography>
                    <OutlinedInput
                      placeholder="Access key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{
                        fontSize: '13px',
                        borderRadius: '8px',
                        backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                        color: darkMode ? '#ffffff' : '#1e293b',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1' }
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '12px', color: darkMode ? '#cbd5e1' : '#64748b', mb: 0.5 }}>
                      Access secret
                    </Typography>
                    <OutlinedInput
                      type="password"
                      placeholder="Access secret"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      fullWidth
                      size="small"
                      sx={{
                        fontSize: '13px',
                        borderRadius: '8px',
                        backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                        color: darkMode ? '#ffffff' : '#1e293b',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1' }
                      }}
                    />
                  </Box>
                </Box>
              </Box>
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
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : '#94a3b8',
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc'
                    }
                  }}
                >
                  {testing ? 'Checking connection...' : 'Test connection'}
                </Button>

                {canManageSettings && (
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon sx={{ fontSize: '18px' }} />}
                  sx={{
                    backgroundColor: '#5e72e4',
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    borderRadius: '8px',
                    px: 3,
                    py: 0.8,
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: '#4b5fcc',
                      boxShadow: 'none'
                    }
                  }}
                >
                  {saving ? 'Saving...' : 'Save connection'}
                </Button>
                )}
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
{tabValue === 3 && (
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>
                Saved posts
              </Typography>
              <Typography sx={{ fontSize: '12.5px', color: '#64748b', mt: 0.3 }}>
                How many verified posts are stored, and when they were last refreshed.
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
              <Box sx={{ p: 2, borderRadius: '10px', backgroundColor: darkMode ? '#0b1437' : '#f8fafc', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Verified posts
                </Typography>
                <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#2dce89', mt: 0.5 }}>
                  {dbInfo.totalPosts}
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#64748b', mt: 0.3 }}>
                  Ready to review
                </Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: '10px', backgroundColor: darkMode ? '#0b1437' : '#f8fafc', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Last refreshed
                </Typography>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#ffffff' : '#0f172a', mt: 0.5 }}>
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
                  <Typography sx={{ fontSize: '13.5px', fontWeight: 700, color: darkMode ? '#2dce89' : '#166534' }}>
                    Refresh the dashboard
                  </Typography>
                  <Typography sx={{ fontSize: '12px', color: darkMode ? '#cbd5e1' : '#15803d', mt: 0.3 }}>
                    Load the latest saved posts into the dashboard.
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
                  Refresh feed
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Card>
<Dialog
        open={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: { xs: 0.5, sm: 1 },
            backgroundColor: darkMode ? '#111c44' : '#ffffff',
            color: darkMode ? '#ffffff' : '#0f172a',
            backgroundImage: 'none'
          }
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
                backgroundColor: darkMode ? '#070d24' : '#f8fafc',
                color: darkMode ? '#ffffff' : '#1e293b',
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
          {canManageSettings && (
          <Button
            variant="contained"
            disabled={versionActionLoading || !newTag.trim() || !newQueryText.trim()}
            onClick={handleSaveNewVersion}
            sx={{
              backgroundColor: '#5e72e4',
              color: '#ffffff',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              px: 3,
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#4b5fcc', boxShadow: 'none' }
            }}
          >
            Save Version
          </Button>
          )}
        </DialogActions>
      </Dialog>
<Dialog
        open={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: { xs: 0.5, sm: 1 },
            backgroundColor: darkMode ? '#111c44' : '#ffffff',
            color: darkMode ? '#ffffff' : '#0f172a',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryRoundedIcon sx={{ color: '#5e72e4', fontSize: '22px' }} />
            <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: '16px', color: darkMode ? '#ffffff' : '#0f172a' }}>
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

          <TableContainer sx={{ border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0', borderRadius: '10px' }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: darkMode ? '#0b1437' : '#f8fafc' }}>
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
                        {canManageSettings && !v.isActive && (
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
