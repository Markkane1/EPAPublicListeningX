import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import CloudQueueRoundedIcon from '@mui/icons-material/CloudQueueRounded';
import CleaningServicesRoundedIcon from '@mui/icons-material/CleaningServicesRounded';
import DynamicFeedRoundedIcon from '@mui/icons-material/DynamicFeedRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';

import DetailedStatisticsCard, { AnimatedNumber } from 'examples/Cards/StatisticsCards/DetailedStatisticsCard';
import PostCard from 'components/PostCard';
import { useArgonController } from 'context';
import { useAuth } from 'context/AuthContext';
import { getStats, getPosts, getAuditLogs, getCachedStats, getCachedPosts, POSTS_CHUNK_SIZE } from '../../services/api';

function DashboardView({
  stats: propStats = null,
  dataRevision = 0,
  dataSource = 'file',
  onNavigate,
  onOpenIngest,
  onImageClick,
}) {
  const [controller] = useArgonController();
  const { darkMode } = controller || {};
  const { hasPermission } = useAuth();
  const canIngest = hasPermission('posts.ingest');
  const [dateFilter, setDateFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [stats, setStats] = useState(() => propStats || getCachedStats() || null);
  const [recentPosts, setRecentPosts] = useState(() => {
    const cached = getCachedPosts({ sortBy: 'newest', limit: POSTS_CHUNK_SIZE, offset: 0 });
    return cached?.items || [];
  });
  const [auditLog, setAuditLog] = useState([]);
  const [loadingStats, setLoadingStats] = useState(() => !(propStats || getCachedStats()));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const statsParams = {};
      const postParams = { sortBy: 'newest', limit: POSTS_CHUNK_SIZE, offset: 0 };
      if (dateFilter !== 'all') {
        statsParams.date = dateFilter;
        postParams.date = dateFilter;
      }
      if (timeFilter !== 'all') {
        statsParams.timeOfDay = timeFilter;
        postParams.timeOfDay = timeFilter;
      }
      if (!stats) setLoadingStats(true);
      try {
        const [statsRes, postsRes, auditRes] = await Promise.all([
          getStats(statsParams),
          getPosts(postParams),
          getAuditLogs({ limit: 5 }).catch(() => ({ items: [] })),
        ]);
        if (cancelled) return;
        setStats(statsRes);
        setRecentPosts(postsRes.items || []);
        setAuditLog(auditRes.items || []);
        setLoadingStats(false);
      } catch {
        if (!cancelled) {
          setLoadingStats(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dateFilter, timeFilter, dataRevision]);

  const availableDates = stats?.dateCounts || [];
  const filteredDashboardPosts = recentPosts;
  const archiveTotal = stats?.archiveTotalPosts || 0;

  const hasActiveFilters = dateFilter !== 'all' || timeFilter !== 'all';
  const handleResetFilters = () => {
    setDateFilter('all');
    setTimeFilter('all');
  };

  const totalClean = stats?.totalPosts || 0;
  const peakAqi = stats?.peakAqi ?? null;
  const avgAqi = stats?.avgAqi ?? null;
  const hasAqi = peakAqi != null;
  const peakIsHazardous = hasAqi && peakAqi >= 301;
  const avgIsHazardous = hasAqi && Number(avgAqi) >= 301;

  const duplicatesMerged = stats?.duplicatesMerged || 0;
  const noiseRemoved = stats?.noiseRemoved || 0;
  const totalNoise = stats?.activeNoiseCount || noiseRemoved || 0;
  const precisionRate = (totalClean + totalNoise > 0)
    ? ((totalClean / (totalClean + totalNoise)) * 100).toFixed(1)
    : '100.0';
  const totalFiltered = duplicatesMerged + noiseRemoved;
  const totalPipelineProcessed = totalClean + duplicatesMerged + noiseRemoved;
  const purityPct = totalPipelineProcessed > 0 ? Math.round((totalClean / totalPipelineProcessed) * 100) : 100;
  const duplicatePct = totalPipelineProcessed > 0 ? ((duplicatesMerged / totalPipelineProcessed) * 100).toFixed(1) : '0';
  const noisePct = totalPipelineProcessed > 0 ? ((noiseRemoved / totalPipelineProcessed) * 100).toFixed(1) : '0';

  const recentAuditItems = useMemo(() => {
    if (!auditLog || auditLog.length === 0) return [];
    const interesting = auditLog.filter((a) => a.status === 'DUPLICATE_MERGED' || a.status === 'REMOVED');
    if (interesting.length >= 3) {
      return interesting.slice(0, 3);
    }
    return auditLog.slice(0, 3);
  }, [auditLog]);

  const cityCounts = stats?.cityCounts || {};
  const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
  const topCity = stats?.peakAqiCity || (sortedCities.length > 0 ? sortedCities[0][0] : null);

  const topInteractionPosts = useMemo(() => {
    const getInteractions = (p) => {
      if (typeof p.total_engagement === 'number' && p.total_engagement > 0) {
        return p.total_engagement;
      }
      const likes = parseInt(p.likes, 10) || 0;
      const retweets = parseInt(p.retweets, 10) || 0;
      const replies = parseInt(p.replies, 10) || 0;
      const views = parseInt(p.views, 10) || 0;
      return likes + retweets + replies + views;
    };

    return [...filteredDashboardPosts]
      .sort((a, b) => getInteractions(b) - getInteractions(a))
      .slice(0, 12);
  }, [filteredDashboardPosts]);

  return (
    <Box sx={{ py: 2 }}>
      {/* Primary KPI Metrics */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 3,
        }}
      >
        <DetailedStatisticsCard
          delay={0.02}
          loading={loadingStats && !stats}
          title="Clean Posts"
          count={String(totalClean)}
          icon={{
            color: 'success',
            component: <CheckCircleRoundedIcon />,
          }}
          percentage={{
            color: hasActiveFilters ? 'info' : 'success',
            count: hasActiveFilters ? `${Math.round((totalClean / (archiveTotal || 1)) * 100)}%` : `+${precisionRate}%`,
            text: hasActiveFilters ? 'of total posts' : 'precision rate',
          }}
        />

        <DetailedStatisticsCard
          delay={0.06}
          loading={loadingStats && !stats}
          title="Peak Recorded AQI"
          count={hasAqi ? String(peakAqi) : '—'}
          icon={{
            color: 'error',
            component: <WarningAmberRoundedIcon />,
          }}
          percentage={{
            color: peakIsHazardous ? 'error' : 'secondary',
            count: hasAqi ? (peakIsHazardous ? 'Hazardous' : 'Recorded') : 'No AQI yet',
            text: hasActiveFilters ? 'in selected window' : (topCity || 'from posts'),
          }}
        />

        <DetailedStatisticsCard
          delay={0.10}
          loading={loadingStats && !stats}
          title="Average Recorded AQI"
          count={hasAqi ? String(avgAqi) : '—'}
          icon={{
            color: 'warning',
            component: <CloudQueueRoundedIcon />,
          }}
          percentage={{
            color: avgIsHazardous ? 'warning' : 'secondary',
            count: hasAqi ? (avgIsHazardous ? 'Hazardous' : 'Recorded') : 'No AQI yet',
            text: hasActiveFilters ? 'window baseline' : 'from posts with AQI',
          }}
        />

        <DetailedStatisticsCard
          delay={0.14}
          loading={loadingStats && !stats}
          title="Filtered Noise & Dupes"
          count={String(totalFiltered)}
          icon={{
            color: 'info',
            component: <CleaningServicesRoundedIcon />,
          }}
          percentage={{ color: 'secondary', count: `${duplicatesMerged} merged`, text: `${noiseRemoved} excluded` }}
        />
      </Box>

      <Card
        sx={{
          mb: 3,
          p: { xs: 2, sm: 2.5 },
          borderRadius: '16px',
          backgroundColor: darkMode ? '#0f172a' : '#ffffff',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
          boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 16px 0 rgba(103, 116, 142, 0.06)',
        }}
      >
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 10px rgba(22, 163, 74, 0.3)',
                flexShrink: 0,
              }}
            >
              <CalendarMonthRoundedIcon sx={{ fontSize: '20px' }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 700,
                  fontSize: { xs: '15px', sm: '16px' },
                  color: darkMode ? '#ffffff' : '#1e293b',
                  lineHeight: 1.3,
                }}
              >
                Temporal Scope & Air Quality Time Window
              </Typography>
              <Typography sx={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                Filter metrics, peak AQI spikes, and top interactions by date and time of day
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Box
              sx={{
                backgroundColor: hasActiveFilters ? (darkMode ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7') : (darkMode ? '#090e15' : '#f8fafc'),
                border: '1px solid',
                borderColor: hasActiveFilters ? (darkMode ? 'rgba(34, 197, 94, 0.35)' : '#86efac') : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'),
                color: hasActiveFilters ? (darkMode ? '#4ade80' : '#15803d') : (darkMode ? '#94a3b8' : '#64748b'),
                px: 1.4,
                py: 0.5,
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.8,
              }}
            >
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: hasActiveFilters ? '#16a34a' : '#94a3b8',
                }}
              />
              {hasActiveFilters ? (
                <>Showing <AnimatedNumber value={totalClean} /> of <AnimatedNumber value={archiveTotal} /> posts</>
              ) : (
                <>All Time Scope (<AnimatedNumber value={archiveTotal} /> posts)</>
              )}
            </Box>

            {hasActiveFilters && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<RestartAltRoundedIcon sx={{ fontSize: '15px !important' }} />}
                onClick={handleResetFilters}
                sx={{
                  textTransform: 'none',
                  fontSize: '12px',
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 600,
                  color: darkMode ? '#cbd5e1' : '#64748b',
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1',
                  borderRadius: '8px',
                  py: 0.4,
                  px: 1.2,
                  '&:hover': {
                    borderColor: '#f5365c',
                    color: '#f5365c',
                    backgroundColor: darkMode ? 'rgba(245, 54, 92, 0.1)' : '#fff5f5',
                  },
                }}
              >
                Reset Filter
              </Button>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              lg: '1.2fr 1.2fr 2fr',
            },
            gap: 2,
            alignItems: 'center',
          }}
        >
          
          <FormControl fullWidth size="small">
            <InputLabel id="dash-date-label" sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : undefined }}>
              Filter by Date
            </InputLabel>
            <Select
              labelId="dash-date-label"
              value={dateFilter}
              label="Filter by Date"
              onChange={(e) => setDateFilter(e.target.value)}
              startAdornment={
                <CalendarMonthRoundedIcon sx={{ color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '18px', mr: 1, ml: -0.5 }} />
              }
              sx={{
                fontSize: '13px',
                borderRadius: '8px',
                fontFamily: '"Open Sans", sans-serif',
                backgroundColor: darkMode ? '#090e15' : '#f8fafc',
                color: darkMode ? '#ffffff' : undefined,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
                },
              }}
            >
              <MenuItem value="all">All Dates ({archiveTotal} total)</MenuItem>
              {availableDates.map((item) => {
                const [y, m, d] = item.date.split('-');
                const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
                const label = dateObj.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                return (
                  <MenuItem key={item.date} value={item.date}>
                    {label} ({item.count} posts)
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel id="dash-time-label" sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : undefined }}>
              Filter by Time Window
            </InputLabel>
            <Select
              labelId="dash-time-label"
              value={timeFilter}
              label="Filter by Time Window"
              onChange={(e) => setTimeFilter(e.target.value)}
              startAdornment={
                <AccessTimeRoundedIcon sx={{ color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '18px', mr: 1, ml: -0.5 }} />
              }
              sx={{
                fontSize: '13px',
                borderRadius: '8px',
                fontFamily: '"Open Sans", sans-serif',
                backgroundColor: darkMode ? '#090e15' : '#f8fafc',
                color: darkMode ? '#ffffff' : undefined,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
                },
              }}
            >
              <MenuItem value="all">All Hours (24 Hours)</MenuItem>
              <MenuItem value="morning">Morning (06:00 - 12:00)</MenuItem>
              <MenuItem value="afternoon">Afternoon (12:00 - 18:00)</MenuItem>
              <MenuItem value="evening">Evening / Peak Smog (18:00 - 24:00)</MenuItem>
              <MenuItem value="night">Night & Dawn (00:00 - 06:00)</MenuItem>
            </Select>
          </FormControl>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              flexWrap: 'wrap',
            }}
          >
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: darkMode ? '#94a3b8' : '#8392ab', mr: 0.5, display: { xs: 'none', lg: 'inline' } }}>
              Quick Presets:
            </Typography>
            {[
              { label: 'All Time', date: 'all', time: 'all' },
              ...(availableDates.length > 0
                ? [
                    {
                      label: `${new Date(availableDates[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (Peak)`,
                      date: availableDates[0].date,
                      time: 'all',
                    },
                  ]
                : []),
              ...(availableDates.length > 1
                ? [
                    {
                      label: new Date(availableDates[1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      date: availableDates[1].date,
                      time: 'all',
                    },
                  ]
                : []),
              { label: 'Peak Smog (6PM-12AM)', date: 'all', time: 'evening' },
              { label: 'Morning (6AM-12PM)', date: 'all', time: 'morning' },
            ].map((preset) => {
              const isActive = dateFilter === preset.date && timeFilter === preset.time;
              return (
                <Box
                  key={preset.label}
                  onClick={() => {
                    setDateFilter(preset.date);
                    setTimeFilter(preset.time);
                  }}
                  sx={{
                    px: 1.2,
                    py: 0.5,
                    borderRadius: '20px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#16a34a' : (darkMode ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9'),
                    color: isActive ? '#ffffff' : (darkMode ? '#cbd5e1' : '#475569'),
                    border: '1px solid',
                    borderColor: isActive ? '#16a34a' : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'),
                    transition: 'all 0.15s ease-in-out',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      backgroundColor: isActive ? '#15803d' : (darkMode ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'),
                    },
                  }}
                >
                  {preset.label}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Card>

      <Card
        sx={{
          mb: 3,
          p: { xs: 2.5, sm: 3 },
          borderRadius: '16px',
          backgroundColor: darkMode ? '#0f172a' : '#ffffff',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
          boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', lg: 'center' },
            gap: 3,
          }}
        >
          <Box sx={{ maxWidth: '100%', minWidth: 0, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  backgroundColor: darkMode ? '#090e15' : '#f1f5f9',
                  color: darkMode ? '#cbd5e1' : '#334155',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  px: 1.4,
                  py: 0.45,
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.6,
                }}
              >
                <PlaceRoundedIcon sx={{ fontSize: '15px', color: '#16a34a' }} />
                Scope: Punjab, Pakistan
              </Box>
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Open Sans", sans-serif',
                fontWeight: 700,
                color: darkMode ? '#ffffff' : '#1e293b',
                mb: 1,
                fontSize: { xs: '18px', sm: '21px', md: '24px' },
                letterSpacing: '-0.4px',
                wordBreak: 'break-word',
              }}
            >
              {hasAqi ? (
                <>
                  Peak AQI <AnimatedNumber value={peakAqi} />
                  {topCity ? ` in ${topCity}` : ''}
                </>
              ) : (
                'No AQI yet'
              )}
            </Typography>

            <Typography
              sx={{
                fontFamily: '"Open Sans", sans-serif',
                fontSize: '14px',
                color: darkMode ? '#cbd5e1' : '#4a5568',
                lineHeight: 1.6,
                mb: 2,
              }}
            >
              {hasAqi ? (
                <>
                  Peak recorded AQI is <AnimatedNumber value={peakAqi} />
                  {peakIsHazardous ? ' (Hazardous)' : ''}. Average recorded AQI is <AnimatedNumber value={avgAqi} />
                  {avgIsHazardous ? ' (Hazardous)' : ''}.
                  {topCity ? ` Most posts in this window name ${topCity}.` : ''}
                </>
              ) : (
                'No post in this window has a numeric AQI.'
              )}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                flexWrap: 'wrap',
                gap: { xs: 1.2, sm: 2.5 },
                pt: 0.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <WarningAmberRoundedIcon sx={{ fontSize: '18px', color: '#f5365c', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                  Peak AQI: <strong style={{ color: darkMode ? '#ffffff' : '#1e293b' }}>{hasAqi ? <><AnimatedNumber value={peakAqi} />{peakIsHazardous ? ' (Hazardous)' : ''}</> : '—'}</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <PlaceRoundedIcon sx={{ fontSize: '18px', color: '#16a34a', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                  Epicenter: <strong style={{ color: darkMode ? '#ffffff' : '#1e293b' }}>{topCity || '—'}</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <VerifiedRoundedIcon sx={{ fontSize: '18px', color: '#2dce89', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                  Clean Dataset: <strong style={{ color: darkMode ? '#ffffff' : '#1e293b' }}><AnimatedNumber value={totalClean} /> Posts</strong>
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.2,
              width: { xs: '100%', lg: '240px' },
              minWidth: { xs: '100%', lg: '240px' },
              flexShrink: 0,
            }}
          >
            <Button
              variant="contained"
              fullWidth
              onClick={() => onNavigate('posts')}
              startIcon={<DynamicFeedRoundedIcon />}
              sx={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                fontFamily: '"Open Sans", sans-serif',
                fontWeight: 600,
                fontSize: '13px',
                textTransform: 'none',
                borderRadius: '8px',
                px: 2,
                py: 1,
                boxShadow: '0 4px 14px 0 rgba(22, 163, 74, 0.35)',
                '&:hover': {
                  background: '#15803d',
                  boxShadow: '0 6px 18px 0 rgba(22, 163, 74, 0.45)',
                },
              }}
            >
              View All <AnimatedNumber value={totalClean} /> Posts
            </Button>

            {canIngest && (
              <Button
                variant="outlined"
                fullWidth
                onClick={onOpenIngest}
                startIcon={<CloudUploadRoundedIcon />}
                sx={{
                  color: darkMode ? '#cbd5e1' : '#344767',
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1',
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: '13px',
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 2,
                  py: 1,
                  '&:hover': {
                    borderColor: '#94a3b8',
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#f8fafc',
                  },
                }}
              >
                + Ingest Scraped JSON
              </Button>
            )}

            <Button
              variant="text"
              fullWidth
              onClick={() => onNavigate('settings')}
              startIcon={<TuneRoundedIcon />}
              sx={{
                color: darkMode ? '#4ade80' : '#16a34a',
                fontFamily: '"Open Sans", sans-serif',
                fontWeight: 600,
                fontSize: '12.5px',
                textTransform: 'none',
                borderRadius: '8px',
                px: 2,
                py: 0.8,
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(22, 163, 74, 0.15)' : '#f8f9fe',
                },
              }}
            >
              Configure X API Mode
            </Button>
          </Box>
        </Box>
      </Card>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '1fr 2fr',
          },
          gap: 3,
          mb: 4,
        }}
      >
        
        <Card sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: '16px', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7', backgroundColor: darkMode ? '#0f172a' : '#ffffff', boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 20px 0 rgba(0, 0, 0, 0.05)', minWidth: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1, mb: 2 }}>
            <Box>
              <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: '16px', color: darkMode ? '#ffffff' : '#344767' }}>
                Geographic Coverage
              </Typography>
              <Typography sx={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                Posts scoped for Pakistani Punjab
              </Typography>
            </Box>
            <Box
              sx={{
                backgroundColor: darkMode ? 'rgba(17, 113, 239, 0.2)' : '#e7f6fd',
                color: darkMode ? '#38bdf8' : '#1171ef',
                px: 1.2,
                py: 0.3,
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              <AnimatedNumber value={sortedCities.length} /> Districts
            </Box>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
            {sortedCities.length > 0 ? (
              sortedCities.slice(0, 6).map(([city, count]) => {
                const percentage = totalClean > 0 ? Math.round((count / totalClean) * 100) : 0;
                return (
                  <Box key={city}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: darkMode ? '#e2e8f0' : '#344767' }}>
                        {city}
                      </Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#4ade80' : '#16a34a' }}>
                        <AnimatedNumber value={count} /> (<AnimatedNumber value={percentage} />%)
                      </Typography>
                    </Box>
                    <Box sx={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: darkMode ? '#090e15' : '#e9ecef', overflow: 'hidden' }}>
                      <Box
                        sx={{
                          height: '100%',
                          borderRadius: '3px',
                          background: city === 'Lahore' ? 'linear-gradient(310deg, #f5365c 0%, #ec0c38 100%)' : 'linear-gradient(310deg, #1171ef 0%, #11cdef 100%)',
                          width: `${Math.min(100, percentage * 1.2)}%`,
                          transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />
                    </Box>
                  </Box>
                );
              })
            ) : (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                  No regional posts detected in this time window
                </Typography>
              </Box>
            )}
          </Box>
        </Card>

        <Card sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: '16px', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7', backgroundColor: darkMode ? '#0f172a' : '#ffffff', boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 20px 0 rgba(0, 0, 0, 0.05)', minWidth: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, mb: 2 }}>
            <Box>
              <Typography sx={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: '16px', color: darkMode ? '#ffffff' : '#344767' }}>
                Pipeline Cleaning & Deduplication Health
              </Typography>
              <Typography sx={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                Deterministic negative query filtering & duplicate consolidation
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => onNavigate('audit')}
              sx={{
                textTransform: 'none',
                fontFamily: '"Open Sans", sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                color: darkMode ? '#cbd5e1' : '#67748e',
                borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#d2d6da',
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: '#8392ab',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#f8f9fa',
                },
              }}
            >
              View Full Audit ({stats?.auditStatusCounts ? Object.values(stats.auditStatusCounts).reduce((a, b) => a + b, 0) : auditLog.length})
            </Button>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined }} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2,
              mb: 2,
            }}
          >
            <Box sx={{ p: 1.8, borderRadius: '12px', backgroundColor: darkMode ? '#090e15' : '#f8f9fa', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#2dce89', textTransform: 'uppercase' }}>
                Valid Posts
              </Typography>
              <Typography sx={{ fontSize: '22px', fontWeight: 800, color: darkMode ? '#ffffff' : '#344767', my: 0.3 }}>
                <AnimatedNumber value={totalClean} />
              </Typography>
              <Typography sx={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                Passed all negative gates & checks
              </Typography>
            </Box>

            <Box sx={{ p: 1.8, borderRadius: '12px', backgroundColor: darkMode ? '#090e15' : '#f8f9fa', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#fb6340', textTransform: 'uppercase' }}>
                Duplicates Merged
              </Typography>
              <Typography sx={{ fontSize: '22px', fontWeight: 800, color: darkMode ? '#ffffff' : '#344767', my: 0.3 }}>
                <AnimatedNumber value={duplicatesMerged} />
              </Typography>
              <Typography sx={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                Consolidated into parent post
              </Typography>
            </Box>

            <Box sx={{ p: 1.8, borderRadius: '12px', backgroundColor: darkMode ? '#090e15' : '#f8f9fa', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#f5365c', textTransform: 'uppercase' }}>
                Excluded Noise
              </Typography>
              <Typography sx={{ fontSize: '22px', fontWeight: 800, color: darkMode ? '#ffffff' : '#344767', my: 0.3 }}>
                <AnimatedNumber value={noiseRemoved} />
              </Typography>
              <Typography sx={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                Irrelevant chatter & external regions
              </Typography>
            </Box>
          </Box>

          {/* Pipeline Data Purity Rate Gauge */}
          <Box
            sx={{
              p: 1.8,
              borderRadius: '12px',
              backgroundColor: darkMode ? '#090e15' : '#f8f9fa',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: darkMode ? '#e2e8f0' : '#344767' }}>
                  Pipeline Data Purity Rate:
                </Typography>
                <Chip
                  label={`${purityPct}% Purity Yield`}
                  size="small"
                  sx={{
                    height: '22px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: darkMode ? 'rgba(45, 206, 137, 0.2)' : '#e6f8f0',
                    color: darkMode ? '#4ade80' : '#0b5d3b',
                    border: '1px solid #bbf7d0',
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: '11.5px', color: darkMode ? '#94a3b8' : '#8392ab', fontWeight: 600 }}>
                <AnimatedNumber value={totalPipelineProcessed} /> Records Evaluated
              </Typography>
            </Box>

            {/* Segmented Pipeline Bar */}
            <Box
              sx={{
                width: '100%',
                height: '7px',
                borderRadius: '3.5px',
                backgroundColor: darkMode ? '#1a223f' : '#e9ecef',
                display: 'flex',
                overflow: 'hidden',
                mb: 1,
              }}
            >
              <Box sx={{ width: `${purityPct}%`, backgroundColor: '#2dce89', transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} title={`Clean: ${purityPct}%`} />
              <Box sx={{ width: `${duplicatePct}%`, backgroundColor: '#fb6340', transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} title={`Merged: ${duplicatePct}%`} />
              <Box sx={{ width: `${noisePct}%`, backgroundColor: '#f5365c', transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }} title={`Excluded: ${noisePct}%`} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2dce89' }} />
                <Typography sx={{ fontSize: '11px', fontWeight: 600, color: darkMode ? '#cbd5e1' : '#64748b' }}>
                  Verified Clean (<AnimatedNumber value={purityPct} />%)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fb6340' }} />
                <Typography sx={{ fontSize: '11px', fontWeight: 600, color: darkMode ? '#cbd5e1' : '#64748b' }}>
                  Merged Duplicates (<AnimatedNumber value={duplicatePct} />%)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f5365c' }} />
                <Typography sx={{ fontSize: '11px', fontWeight: 600, color: darkMode ? '#cbd5e1' : '#64748b' }}>
                  Excluded Noise (<AnimatedNumber value={noisePct} />%)
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Recent Automated Provenance Audit Stream */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: darkMode ? '#94a3b8' : '#8392ab', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Recent Provenance Audit Decisions:
              </Typography>
              <Button
                size="small"
                onClick={() => onNavigate('audit')}
                sx={{
                  p: 0,
                  minWidth: 0,
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'none',
                  color: darkMode ? '#38bdf8' : '#1171ef',
                  '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
                }}
              >
                Inspect audit trail →
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              {recentAuditItems.map((item, idx) => {
                const isMerged = item.status === 'DUPLICATE_MERGED';
                const isRemoved = item.status === 'REMOVED';

                return (
                  <Box
                    key={item.id || idx}
                    onClick={() => onNavigate('audit')}
                    sx={{
                      p: 1,
                      px: 1.4,
                      borderRadius: '10px',
                      backgroundColor: darkMode ? '#090e15' : '#f8fafc',
                      border: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                        borderColor: isMerged ? '#fed7aa' : isRemoved ? '#fecaca' : '#bbf7d0',
                        transform: 'translateX(2px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                      <Chip
                        label={isMerged ? 'MERGED' : isRemoved ? 'EXCLUDED' : 'VERIFIED'}
                        size="small"
                        sx={{
                          height: '20px',
                          fontSize: '9.5px',
                          fontWeight: 800,
                          backgroundColor: isMerged
                            ? darkMode ? 'rgba(251, 99, 64, 0.2)' : '#fff7ed'
                            : isRemoved
                            ? darkMode ? 'rgba(245, 54, 92, 0.2)' : '#fef2f2'
                            : darkMode ? 'rgba(45, 206, 137, 0.2)' : '#f0fdf4',
                          color: isMerged ? '#ea580c' : isRemoved ? '#e11d48' : '#16a34a',
                          border: `1px solid ${isMerged ? '#fed7aa' : isRemoved ? '#fecdd3' : '#bbf7d0'}`,
                          flexShrink: 0,
                        }}
                      />

                      <Typography
                        noWrap
                        sx={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: darkMode ? '#e2e8f0' : '#334155',
                          flex: 1,
                        }}
                      >
                        {item.reason || item.text || 'Automated deterministic pipeline decision'}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: darkMode ? '#94a3b8' : '#64748b',
                        flexShrink: 0,
                      }}
                    >
                      @{item.author || 'system'}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          
        </Card>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.5,
            mb: 2.5,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 700,
                  color: darkMode ? '#ffffff' : '#344767',
                  fontSize: { xs: '18px', sm: '20px' },
                }}
              >
                Top Intelligence Posts by Public Interaction
              </Typography>
              <Box
                sx={{
                  backgroundColor: darkMode ? 'rgba(22, 163, 74, 0.2)' : 'rgba(22, 163, 74, 0.1)',
                  color: darkMode ? '#b3c5ff' : '#16a34a',
                  px: 1.2,
                  py: 0.3,
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                }}
              >
                TOP {topInteractionPosts.length} ENGAGEMENT
              </Box>
            </Box>
            <Typography sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
              Top viral reports, public warnings, and smog updates ranked by total interactions (Likes, Retweets, Replies, Views)
            </Typography>
          </Box>
          <Button
            variant="text"
            onClick={() => onNavigate('posts')}
            endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: '16px !important' }} />}
            sx={{
              textTransform: 'none',
              fontFamily: '"Open Sans", sans-serif',
              fontWeight: 600,
              color: darkMode ? '#4ade80' : '#16a34a',
              whiteSpace: 'nowrap',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(22, 163, 74, 0.15)' : 'rgba(22, 163, 74, 0.08)',
              },
            }}
          >
            View All Posts (<AnimatedNumber value={totalClean} />)
          </Button>
        </Box>

        {topInteractionPosts.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2.5,
              alignItems: 'stretch',
            }}
          >
            {topInteractionPosts.map((post) => (
              <PostCard key={post.id || post.clean_id} post={post} onImageClick={onImageClick} />
            ))}
          </Box>
        ) : (
          <Card
            sx={{
              p: { xs: 3, sm: 5 },
              textAlign: 'center',
              borderRadius: '16px',
              backgroundColor: darkMode ? '#0f172a' : '#ffffff',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
              boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 16px 0 rgba(103, 116, 142, 0.04)',
            }}
          >
            <FilterAltOffRoundedIcon sx={{ fontSize: '46px', color: darkMode ? '#94a3b8' : '#94a3b8', mb: 1.5 }} />
            <Typography
              sx={{
                fontFamily: '"Open Sans", sans-serif',
                fontWeight: 700,
                fontSize: '16px',
                color: darkMode ? '#ffffff' : '#1e293b',
                mb: 0.5,
              }}
            >
              No Intelligence Posts in This Time Window
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Open Sans", sans-serif',
                fontSize: '13px',
                color: darkMode ? '#94a3b8' : '#64748b',
                maxWidth: '480px',
                mx: 'auto',
                mb: 2.5,
                lineHeight: 1.6,
              }}
            >
              No verified air quality reports matched the selected date ({dateFilter !== 'all' ? dateFilter : 'all'}) and time window ({timeFilter !== 'all' ? timeFilter : 'all'}). Try expanding your scope or resetting the filters.
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={handleResetFilters}
              startIcon={<RestartAltRoundedIcon sx={{ fontSize: '16px !important' }} />}
              sx={{
                textTransform: 'none',
                fontFamily: '"Open Sans", sans-serif',
                fontWeight: 600,
                backgroundColor: '#16a34a',
                color: '#ffffff',
                borderRadius: '8px',
                px: 2.5,
                py: 0.8,
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                '&:hover': {
                  backgroundColor: '#15803d',
                },
              }}
            >
              Reset Temporal Filters
            </Button>
          </Card>
        )}
      </Box>
    </Box>
  );
}

DashboardView.propTypes = {
  dataRevision: PropTypes.number,
  dataSource: PropTypes.string,
  onNavigate: PropTypes.func.isRequired,
  onOpenIngest: PropTypes.func.isRequired,
  onImageClick: PropTypes.func.isRequired,
};

export default DashboardView;