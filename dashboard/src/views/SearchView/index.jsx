import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Tooltip from '@mui/material/Tooltip';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import WhatshotRoundedIcon from '@mui/icons-material/WhatshotRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import PermIdentityRoundedIcon from '@mui/icons-material/PermIdentityRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import ViewAgendaRoundedIcon from '@mui/icons-material/ViewAgendaRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';

import { useArgonController } from 'context';
import { useAuth } from 'context/AuthContext';
import { searchXApi, getQueryVersions, getPosts } from '../../services/api';
import PostCard from 'components/PostCard';

const TRENDING_TOPICS = [
  { category: 'Smog Emergency • Trending in Punjab', topic: '#SmogEmergency', query: '#SmogEmergency', volume: '28.4K posts' },
  { category: 'Air Quality Index • Trending', topic: 'Lahore AQI 450+', query: 'Lahore AQI', volume: '19.2K posts' },
  { category: 'Government Enforcement • Official', topic: 'Anti-Smog Squad', query: 'Anti-Smog Squad', volume: '12.8K posts' },
  { category: 'Public Health • Trending', topic: '#CleanAirPunjab', query: '#CleanAirPunjab', volume: '9.6K posts' },
  { category: 'Environmental Tracking • Trending', topic: 'Stubble Burning Punjab', query: 'Stubble burning', volume: '8.1K posts' },
  { category: 'Regional Focus • Trending', topic: 'Faisalabad & Gujranwala Air', query: 'Gujranwala air quality', volume: '6.4K posts' },
];

const SEARCH_TABS = [
  { key: 'top', label: 'Top', icon: <WhatshotRoundedIcon sx={{ fontSize: '18px' }} /> },
  { key: 'latest', label: 'Latest', icon: <ScheduleRoundedIcon sx={{ fontSize: '18px' }} /> },
  { key: 'people', label: 'People', icon: <PermIdentityRoundedIcon sx={{ fontSize: '18px' }} /> },
  { key: 'media', label: 'Media', icon: <ImageRoundedIcon sx={{ fontSize: '18px' }} /> },
];

function SearchView({
  archiveTotal = 0,
  dataSource = 'file',
  onImageClick,
  onNavigateSettings,
  onNavigatePosts,
  onFetchSuccess,
}) {
  const [controller] = useArgonController();
  const { darkMode } = controller || {};
  const { hasPermission } = useAuth();
  const canSearchLive = hasPermission('posts.search_x');

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState(() => searchParams.get('q') || searchParams.get('keyword') || '');
  const [activeTab, setActiveTab] = useState('top');
  const [searchMode, setSearchMode] = useState('db');
  const [viewMode, setViewMode] = useState('feed');
  const [batchLimit, setBatchLimit] = useState(50);
  const [isFetching, setIsFetching] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchedTerm, setLastSearchedTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [matchTotal, setMatchTotal] = useState(0);
  const [savedQueries, setSavedQueries] = useState([]);

  useEffect(() => {
    getQueryVersions()
      .then((vers) => {
        if (Array.isArray(vers)) setSavedQueries(vers);
      })
      .catch(() => {});
  }, []);

  const handleSearch = useCallback(async (overrideTerm, overrideTab) => {
    const term = (typeof overrideTerm === 'string' ? overrideTerm : keyword).trim();
    if (!term) return;
    if (searchMode === 'live' && !canSearchLive) return;
    const tab = overrideTab || activeTab;

    setIsFetching(true);
    setFeedback(null);
    setHasSearched(true);
    setLastSearchedTerm(term);

    if (searchMode === 'db') {
      try {
        const tabParams = { search: term, limit: 50, offset: 0 };
        if (tab === 'top') tabParams.sortBy = 'engagement';
        else if (tab === 'latest') tabParams.sortBy = 'newest';
        else if (tab === 'people') tabParams.verified = 1;
        else if (tab === 'media') tabParams.media = 'media';
        const page = await getPosts(tabParams);
        setSearchResults(page.items || []);
        setMatchTotal(page.total || 0);
        setFeedback({
          type: 'success',
          message: `Found ${page.total} posts in local database matching "${term}".`,
          count: page.total,
        });
      } catch (e) {
        setSearchResults([]);
        setMatchTotal(0);
        setFeedback({ type: 'error', message: e.message || 'Database search failed.', count: 0 });
      }
      setIsFetching(false);
      return;
    }

    try {
      const res = await searchXApi({
        keyword: term,
        liveOverride: true,
        maxResults: batchLimit,
        simulateIfMissing: true,
      });

      if (res.success) {
        let results = [];
        if (res.newPosts && res.newPosts.length > 0) {
          results = res.newPosts;
        }

        setSearchResults(results);
        setMatchTotal(results.length);
        const dupCount = res.duplicatesMerged || 0;
        const noiseCount = res.noiseRemoved || 0;
        const verCount = res.verifiedCount || results.length;
        setFeedback({
          type: 'success',
          message: `X.com API query complete: fetched ${res.fetchedCount || 0} posts → ${verCount} verified & saved to database (${dupCount} duplicates merged, ${noiseCount} noise excluded).`,
          count: results.length,
          stats: res.stats,
          duplicatesMerged: dupCount,
          noiseRemoved: noiseCount,
        });

        if (onFetchSuccess) {
          onFetchSuccess(res);
        }
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to complete X API search query.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Search error: ${err.message || 'Unknown network error'}`,
      });
    } finally {
      setIsFetching(false);
    }
  }, [activeTab, batchLimit, canSearchLive, keyword, onFetchSuccess, searchMode]);

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('keyword');
    if (q && q !== lastSearchedTerm) {
      setKeyword(q);
      handleSearch(q);
    }
  }, [searchParams, handleSearch, lastSearchedTerm]);

  const handleClear = () => {
    setKeyword('');
    setHasSearched(false);
    setSearchResults([]);
    setMatchTotal(0);
    setFeedback(null);
    setLastSearchedTerm('');
    if (searchParams.get('q') || searchParams.get('keyword')) {
      setSearchParams({});
    }
  };

  const filteredResults = useMemo(() => {
    if (searchMode === 'db') return searchResults;
    let list = [...searchResults];
    if (activeTab === 'top') {
      list.sort((a, b) => (b.total_engagement || b.totalEngagement || 0) - (a.total_engagement || a.totalEngagement || 0));
    } else if (activeTab === 'latest') {
      list.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
    } else if (activeTab === 'people') {
      list = list.filter((p) => Boolean(p.author_verified || p.authorVerified));
    } else if (activeTab === 'media') {
      list = list.filter((p) => {
        const urls = p.media_urls || p.mediaUrls;
        return (Array.isArray(urls) && urls.length > 0) || Boolean(p.has_media);
      });
    }
    return list;
  }, [searchResults, activeTab, searchMode]);

  return (
    <Box sx={{ py: 1.5, maxWidth: '1000px', mx: 'auto' }}>
      <Box
        sx={{
          backgroundColor: darkMode ? '#0f172a' : '#ffffff',
          borderRadius: '20px',
          p: { xs: 2, sm: 3 },
          border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
          boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(148,163,184,0.08)',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                backgroundColor: '#0f1419',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-label="X"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 800,
                  fontSize: '18px',
                  color: darkMode ? '#ffffff' : '#0f172a',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.2,
                }}
              >
                X.com Search & Pulse Monitor
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                EPA Punjab Environmental Discourse Intelligence
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                display: 'inline-flex',
                p: '3px',
                backgroundColor: darkMode ? '#1e293b' : '#f1f5f9',
                borderRadius: '9999px',
                border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
              }}
            >
              <Button
                size="small"
                onClick={() => setSearchMode('db')}
                startIcon={<StorageRoundedIcon sx={{ fontSize: '15px !important' }} />}
                sx={{
                  textTransform: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '9999px',
                  px: 1.8,
                  py: 0.4,
                  backgroundColor: searchMode === 'db' ? (darkMode ? '#334155' : '#ffffff') : 'transparent',
                  color: searchMode === 'db' ? (darkMode ? '#ffffff' : '#0f172a') : '#64748b',
                  boxShadow: searchMode === 'db' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  '&:hover': { backgroundColor: searchMode === 'db' ? (darkMode ? '#334155' : '#ffffff') : 'transparent' },
                }}
              >
                Database ({archiveTotal})
              </Button>

              {canSearchLive && (
                <Button
                  size="small"
                  onClick={() => setSearchMode('live')}
                  startIcon={<LanguageRoundedIcon sx={{ fontSize: '15px !important' }} />}
                  sx={{
                    textTransform: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    px: 1.8,
                    py: 0.4,
                    backgroundColor: searchMode === 'live' ? '#16a34a' : 'transparent',
                    color: searchMode === 'live' ? '#ffffff' : '#64748b',
                    boxShadow: searchMode === 'live' ? '0 2px 6px rgba(22, 163, 74, 0.35)' : 'none',
                    '&:hover': { backgroundColor: searchMode === 'live' ? '#15803d' : 'transparent' },
                  }}
                >
                  Live X.com API
                </Button>
              )}
            </Box>

            {searchMode === 'live' && (
              <FormControl size="small">
                <Select
                  value={batchLimit}
                  onChange={(e) => setBatchLimit(e.target.value)}
                  sx={{
                    borderRadius: '9999px',
                    fontSize: '12px',
                    height: '32px',
                    backgroundColor: darkMode ? '#1e293b' : '#f1f5f9',
                    border: 'none',
                  }}
                >
                  <MenuItem value={25}>25 Posts</MenuItem>
                  <MenuItem value={50}>50 Posts</MenuItem>
                  <MenuItem value={100}>100 Posts</MenuItem>
                </Select>
              </FormControl>
            )}

            <Tooltip title="Configure X API Credentials">
              <IconButton
                size="small"
                onClick={onNavigateSettings}
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '9999px',
                  border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                  color: '#64748b',
                }}
              >
                <TuneRoundedIcon sx={{ fontSize: '16px' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: darkMode ? '#1e293b' : '#eff3f4',
            borderRadius: '9999px',
            border: '2px solid transparent',
            px: 2,
            py: 0.5,
            transition: 'all 0.2s ease',
            '&:focus-within': {
              backgroundColor: darkMode ? '#0f172a' : '#ffffff',
              borderColor: '#16a34a',
              boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.15)',
            },
          }}
        >
          <SearchRoundedIcon
            sx={{
              color: '#536471',
              fontSize: '22px',
              mr: 1.5,
              flexShrink: 0,
            }}
          />

          <InputBase
            fullWidth
            placeholder="Search keywords, #hashtags, @users, AQI measurements..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
              if (e.key === 'Escape') handleClear();
            }}
            sx={{
              fontFamily: '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '15px',
              fontWeight: 500,
              color: darkMode ? '#ffffff' : '#0f1419',
              py: 0.6,
            }}
          />

          {keyword && (
            <IconButton
              size="small"
              onClick={handleClear}
              sx={{
                width: 22,
                height: 22,
                backgroundColor: '#536471',
                color: '#ffffff',
                p: 0.2,
                mr: 1,
                '&:hover': { backgroundColor: '#0f1419' },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: '14px' }} />
            </IconButton>
          )}

          {(searchMode !== 'live' || canSearchLive) && (
          <Button
            variant="contained"
            onClick={() => handleSearch()}
            disabled={isFetching || !keyword.trim()}
            sx={{
              borderRadius: '9999px',
              backgroundColor: '#0f1419',
              color: '#ffffff',
              textTransform: 'none',
              fontFamily: '"Open Sans", sans-serif',
              fontWeight: 700,
              fontSize: '13.5px',
              px: 2.8,
              py: 0.7,
              flexShrink: 0,
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#272c30', boxShadow: 'none' },
              '&.Mui-disabled': { backgroundColor: '#cbd5e1', color: '#94a3b8' },
            }}
          >
            {isFetching ? <CircularProgress size={16} color="inherit" /> : 'Search'}
          </Button>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eff3f4',
            mt: 2.5,
          }}
        >
          {SEARCH_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Box
                key={tab.key}
                onClick={() => {
                  if (tab.key === activeTab) return;
                  setActiveTab(tab.key);
                  if (searchMode === 'db' && lastSearchedTerm) {
                    handleSearch(lastSearchedTerm, tab.key);
                  }
                }}
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  py: 1.5,
                  cursor: 'pointer',
                  position: 'relative',
                  color: isActive ? (darkMode ? '#ffffff' : '#0f1419') : '#536471',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '14px',
                  fontFamily: '"Open Sans", sans-serif',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(15,20,25,0.03)',
                  },
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      height: '4px',
                      width: '48px',
                      borderRadius: '9999px',
                      backgroundColor: '#16a34a',
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>

        {feedback && (
          <Box sx={{ mt: 2 }}>
            <Alert
              severity={feedback.type}
              onClose={() => setFeedback(null)}
              action={
                feedback.noiseRemoved > 0 ? (
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => navigate('/noise')}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '11.5px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(0,0,0,0.06)',
                      px: 1.2,
                      py: 0.3,
                      whiteSpace: 'nowrap',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.12)' },
                    }}
                  >
                    Inspect {feedback.noiseRemoved} Excluded Noise &rarr;
                  </Button>
                ) : null
              }
              sx={{
                borderRadius: '12px',
                fontSize: '13px',
                fontFamily: '"Open Sans", sans-serif',
                alignItems: 'center',
              }}
            >
              {feedback.message}
            </Alert>
          </Box>
        )}
      </Box>

      {hasSearched ? (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '16px', color: darkMode ? '#ffffff' : '#0f1419' }}>
              Results for &quot;{lastSearchedTerm}&quot; ({searchMode === 'db' ? matchTotal : filteredResults.length} posts)
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  backgroundColor: darkMode ? '#1e293b' : '#f1f5f9',
                  borderRadius: '8px',
                  p: '2px',
                }}
              >
                <Tooltip title="Timeline Feed (X.com Style)">
                  <IconButton
                    size="small"
                    onClick={() => setViewMode('feed')}
                    sx={{
                      borderRadius: '6px',
                      p: 0.6,
                      backgroundColor: viewMode === 'feed' ? (darkMode ? '#334155' : '#ffffff') : 'transparent',
                      color: viewMode === 'feed' ? '#16a34a' : '#64748b',
                      boxShadow: viewMode === 'feed' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    <ViewAgendaRoundedIcon sx={{ fontSize: '18px' }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Grid View">
                  <IconButton
                    size="small"
                    onClick={() => setViewMode('grid')}
                    sx={{
                      borderRadius: '6px',
                      p: 0.6,
                      backgroundColor: viewMode === 'grid' ? (darkMode ? '#334155' : '#ffffff') : 'transparent',
                      color: viewMode === 'grid' ? '#16a34a' : '#64748b',
                      boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    <GridViewRoundedIcon sx={{ fontSize: '18px' }} />
                  </IconButton>
                </Tooltip>
              </Box>

              <Button
                size="small"
                onClick={handleClear}
                sx={{ textTransform: 'none', color: '#64748b', fontSize: '13px' }}
              >
                Clear Search
              </Button>
            </Box>
          </Box>

          {filteredResults.length > 0 ? (
            viewMode === 'feed' ? (
              <Box sx={{ maxWidth: '680px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredResults.map((post) => (
                  <PostCard
                    key={post.id || post.clean_id}
                    post={post}
                    onImageClick={onImageClick}
                  />
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
                {filteredResults.map((post) => (
                  <PostCard
                    key={post.id || post.clean_id}
                    post={post}
                    onImageClick={onImageClick}
                  />
                ))}
              </Box>
            )
          ) : (
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                px: 2,
                backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                borderRadius: '16px',
                border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
              }}
            >
              <Typography sx={{ fontSize: '20px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f1419', mb: 1 }}>
                No results for &quot;{lastSearchedTerm}&quot;
              </Typography>
              <Typography sx={{ fontSize: '14px', color: '#536471', maxWidth: '420px', mx: 'auto' }}>
                Try searching for specific smog terms like #LahoreSmog, AQI measurements, or official handles like @EPAPunjab.
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' }, gap: 2.5 }}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '16px',
              backgroundColor: darkMode ? '#0f172a' : '#ffffff',
              border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
              boxShadow: 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TrendingUpRoundedIcon sx={{ color: '#16a34a', fontSize: '20px' }} />
              <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 800, fontSize: '16px', color: darkMode ? '#ffffff' : '#0f1419' }}>
                Trending in Punjab Environmental Pulse
              </Typography>
            </Box>

            {savedQueries.length > 0 && (
              <Box
                onClick={() => {
                  const q = savedQueries[0].query_text || savedQueries[0].title;
                  setKeyword(q);
                  handleSearch(q);
                }}
                sx={{
                  p: 1.5,
                  mb: 1.5,
                  borderRadius: '12px',
                  backgroundColor: 'rgba(22, 163, 74, 0.08)',
                  border: '1px solid rgba(22, 163, 74, 0.25)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  '&:hover': { backgroundColor: 'rgba(22, 163, 74, 0.12)' },
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                    Active Official Query • {savedQueries[0].version || 'v1.1'}
                  </Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#ffffff' : '#0f1419', mt: 0.3 }}>
                    Official Punjab EPA Air Quality Criteria
                  </Typography>
                </Box>
                <AutoAwesomeRoundedIcon sx={{ color: '#16a34a', fontSize: '20px' }} />
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {TRENDING_TOPICS.map((item, idx) => (
                <Box
                  key={idx}
                  onClick={() => {
                    setKeyword(item.query);
                    handleSearch(item.query);
                  }}
                  sx={{
                    py: 1.2,
                    px: 1.5,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    '&:hover': {
                      backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                    },
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: '11.5px', color: '#536471' }}>
                      {item.category}
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: darkMode ? '#ffffff' : '#0f1419' }}>
                      {item.topic}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#8392ab' }}>
                      {item.volume}
                    </Typography>
                  </Box>
                  <SearchRoundedIcon sx={{ color: '#cbd5e1', fontSize: '18px' }} />
                </Box>
              ))}
            </Box>
          </Card>

          <Card
            sx={{
              p: 2.5,
              borderRadius: '16px',
              backgroundColor: darkMode ? '#0f172a' : '#ffffff',
              border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
              boxShadow: 'none',
              height: 'fit-content',
            }}
          >
            <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 800, fontSize: '15px', color: darkMode ? '#ffffff' : '#0f1419', mb: 1.5 }}>
              X.com Search Directives
            </Typography>

            <Typography sx={{ fontSize: '12.5px', color: '#536471', mb: 2, lineHeight: 1.5 }}>
              Use exact X.com search operators to pinpoint air pollution intelligence across Punjab:
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {[
                { label: '#LahoreSmog', desc: 'Hashtag tracking' },
                { label: 'from:@EPAPunjab', desc: 'Official authority broadcasts' },
                { label: '"AQI 450"', desc: 'Exact phrase match' },
                { label: 'smog (Lahore OR Multan)', desc: 'Boolean logic grouping' },
                { label: '-Delhi -NCR', desc: 'Exclude Indian cross-border noise' },
              ].map((op, idx) => (
                <Box
                  key={idx}
                  onClick={() => {
                    setKeyword(op.label);
                    handleSearch(op.label);
                  }}
                  sx={{
                    p: 1.2,
                    borderRadius: '8px',
                    backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                    border: darkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    '&:hover': {
                      borderColor: '#16a34a',
                    },
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: '#16a34a' }}>
                      {op.label}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
                      {op.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 3, pt: 2, borderTop: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9' }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={onNavigatePosts}
                endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: '16px !important' }} />}
                sx={{
                  textTransform: 'none',
                  borderRadius: '9999px',
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  color: darkMode ? '#ffffff' : '#0f172a',
                  borderColor: darkMode ? 'rgba(255,255,255,0.2)' : '#cbd5e1',
                  py: 0.8,
                  '&:hover': {
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.06)',
                  },
                }}
              >
                Go to Verified Posts Feed ({archiveTotal})
              </Button>
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  );
}

SearchView.propTypes = {
  archiveTotal: PropTypes.number,
  dataSource: PropTypes.string,
  onImageClick: PropTypes.func,
  onNavigateSettings: PropTypes.func,
  onNavigatePosts: PropTypes.func,
  onFetchSuccess: PropTypes.func,
};

export default SearchView;
