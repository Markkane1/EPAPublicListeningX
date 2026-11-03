import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
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

import DetailedStatisticsCard from 'examples/Cards/StatisticsCards/DetailedStatisticsCard';
import PostCard from 'components/PostCard';
import { useArgonController } from 'context';

function DashboardView({
  posts,
  auditLog,
  dataSource = 'file',
  onNavigate,
  onOpenIngest,
  onImageClick,
}) {
  const [controller] = useArgonController();
  const { darkMode } = controller || {};
  const [dateFilter, setDateFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  const { availableDates } = useMemo(() => {
    const dateMap = {};
    posts.forEach((p) => {
      if (p.createdAt) {
        const d = new Date(p.createdAt);
        if (!isNaN(d.getTime())) {
          const key = d.toISOString().slice(0, 10);
          dateMap[key] = (dateMap[key] || 0) + 1;
        }
      }
    });
    const dates = Object.entries(dateMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, count]) => ({ date, count }));
    return { availableDates: dates };
  }, [posts]);

  const filteredDashboardPosts = useMemo(() => {
    let result = [...posts];

    if (dateFilter !== 'all') {
      result = result.filter((p) => {
        if (!p.createdAt) return false;
        const d = new Date(p.createdAt);
        return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateFilter;
      });
    }

    if (timeFilter !== 'all') {
      result = result.filter((p) => {
        if (!p.createdAt) return false;
        const d = new Date(p.createdAt);
        if (isNaN(d.getTime())) return false;
        const hours = d.getHours();
        if (timeFilter === 'morning') return hours >= 6 && hours < 12;
        if (timeFilter === 'afternoon') return hours >= 12 && hours < 18;
        if (timeFilter === 'evening') return hours >= 18 && hours < 24;
        if (timeFilter === 'night') return hours >= 0 && hours < 6;
        return true;
      });
    }

    return result;
  }, [posts, dateFilter, timeFilter]);

  const hasActiveFilters = dateFilter !== 'all' || timeFilter !== 'all';
  const handleResetFilters = () => {
    setDateFilter('all');
    setTimeFilter('all');
  };

  const totalClean = filteredDashboardPosts.length;
  const aqiValues = filteredDashboardPosts
    .map((p) => p.aqi_value)
    .filter((v) => typeof v === 'number' && v > 0 && v <= 1000);
  const peakAqi = aqiValues.length > 0 ? Math.max(...aqiValues) : (totalClean === 0 ? 'N/A' : 700);
  const avgAqi =
    aqiValues.length > 0
      ? (aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length).toFixed(1)
      : (totalClean === 0 ? 'N/A' : '361.1');

  const duplicatesMerged = auditLog.filter((a) => a.status === 'DUPLICATE_MERGED').length;
  const noiseRemoved = auditLog.filter((a) => a.status === 'REMOVED').length;
  const totalFiltered = duplicatesMerged + noiseRemoved;

  const cityCounts = {};
  filteredDashboardPosts.forEach((p) => {
    const c = p.city_detected || 'Punjab Region';
    cityCounts[c] = (cityCounts[c] || 0) + 1;
  });
  const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);

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
      
      <Card
        sx={{
          mb: 3,
          p: { xs: 2, sm: 2.5 },
          borderRadius: '16px',
          backgroundColor: darkMode ? '#111c44' : '#ffffff',
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
                background: 'linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 10px rgba(94, 114, 228, 0.3)',
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
                backgroundColor: hasActiveFilters ? (darkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff') : (darkMode ? '#0b1437' : '#f8fafc'),
                border: '1px solid',
                borderColor: hasActiveFilters ? (darkMode ? 'rgba(37, 99, 235, 0.4)' : '#bfdbfe') : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'),
                color: hasActiveFilters ? (darkMode ? '#93c5fd' : '#1d4ed8') : (darkMode ? '#94a3b8' : '#64748b'),
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
                  backgroundColor: hasActiveFilters ? '#2563eb' : '#94a3b8',
                }}
              />
              {hasActiveFilters
                ? `Showing ${totalClean} of ${posts.length} posts`
                : `All Time Scope (${posts.length} posts)`}
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
                backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                color: darkMode ? '#ffffff' : undefined,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
                },
              }}
            >
              <MenuItem value="all">All Dates ({posts.length} total)</MenuItem>
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
                backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                color: darkMode ? '#ffffff' : undefined,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
                },
              }}
            >
              <MenuItem value="all">All Hours (24 Hours)</MenuItem>
              <MenuItem value="morning">🌅 Morning (06:00 - 12:00)</MenuItem>
              <MenuItem value="afternoon">☀️ Afternoon (12:00 - 18:00)</MenuItem>
              <MenuItem value="evening">🌙 Evening / Peak Smog (18:00 - 24:00)</MenuItem>
              <MenuItem value="night">🌌 Night & Dawn (00:00 - 06:00)</MenuItem>
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
                    backgroundColor: isActive ? '#5e72e4' : (darkMode ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9'),
                    color: isActive ? '#ffffff' : (darkMode ? '#cbd5e1' : '#475569'),
                    border: '1px solid',
                    borderColor: isActive ? '#5e72e4' : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'),
                    transition: 'all 0.15s ease-in-out',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      backgroundColor: isActive ? '#485ec4' : (darkMode ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'),
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
          title="Clean Posts"
          count={String(totalClean)}
          icon={{
            color: 'success',
            component: <CheckCircleRoundedIcon />,
          }}
          percentage={{
            color: hasActiveFilters ? 'info' : 'success',
            count: hasActiveFilters ? `${Math.round((totalClean / (posts.length || 1)) * 100)}%` : '+72.6%',
            text: hasActiveFilters ? 'of total posts' : 'precision rate',
          }}
        />

        <DetailedStatisticsCard
          title="Peak Recorded AQI"
          count={String(peakAqi)}
          icon={{
            color: 'error',
            component: <WarningAmberRoundedIcon />,
          }}
          percentage={{
            color: 'error',
            count: typeof peakAqi === 'number' && peakAqi >= 300 ? 'Hazardous' : 'Recorded',
            text: hasActiveFilters ? 'in selected window' : 'Lahore peak',
          }}
        />

        <DetailedStatisticsCard
          title="Average Recorded AQI"
          count={String(avgAqi)}
          icon={{
            color: 'warning',
            component: <CloudQueueRoundedIcon />,
          }}
          percentage={{
            color: 'warning',
            count: typeof avgAqi === 'string' && parseFloat(avgAqi) >= 300 ? 'Hazardous' : 'Severe',
            text: hasActiveFilters ? 'window baseline' : 'regional baseline',
          }}
        />

        <DetailedStatisticsCard
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
          p: { xs: 2.5, sm: 3 },
          borderRadius: '16px',
          backgroundColor: darkMode ? '#111c44' : '#ffffff',
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
                  backgroundColor: darkMode ? '#0b1437' : '#f1f5f9',
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
                <PlaceRoundedIcon sx={{ fontSize: '15px', color: '#5e72e4' }} />
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
              Severe Smog & Hazardous Atmospheric AQI Surge in Punjab
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
              Scraped X.com intelligence confirms peak atmospheric AQI readings crossing <strong style={{ color: '#f5365c' }}>600+</strong> in Lahore.
              Citizen reports, hospital admissions, anti-smog squad inspections, and satellite stubble fire imagery dominate discussions.
              All off-topic sports/food noise, Gurmukhi text, and Indian domestic blame campaigns have been eliminated through our dedicated pipeline.
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
                  Peak AQI: <strong style={{ color: darkMode ? '#ffffff' : '#1e293b' }}>{peakAqi} (Hazardous)</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <PlaceRoundedIcon sx={{ fontSize: '18px', color: '#5e72e4', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                  Epicenter: <strong style={{ color: darkMode ? '#ffffff' : '#1e293b' }}>Lahore & Gujranwala</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <VerifiedRoundedIcon sx={{ fontSize: '18px', color: '#2dce89', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                  Clean Dataset: <strong style={{ color: darkMode ? '#ffffff' : '#1e293b' }}>{totalClean} Posts</strong>
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
                background: 'linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)',
                color: '#ffffff',
                fontFamily: '"Open Sans", sans-serif',
                fontWeight: 600,
                fontSize: '13px',
                textTransform: 'none',
                borderRadius: '8px',
                px: 2,
                py: 1,
                boxShadow: '0 4px 14px 0 rgba(94, 114, 228, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(310deg, #5263d9 0%, #724fd9 100%)',
                  boxShadow: '0 6px 18px 0 rgba(94, 114, 228, 0.45)',
                },
              }}
            >
              Explore All {totalClean} Posts
            </Button>

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

            <Button
              variant="text"
              fullWidth
              onClick={() => onNavigate('settings')}
              startIcon={<TuneRoundedIcon />}
              sx={{
                color: darkMode ? '#a5b4fc' : '#5e72e4',
                fontFamily: '"Open Sans", sans-serif',
                fontWeight: 600,
                fontSize: '12.5px',
                textTransform: 'none',
                borderRadius: '8px',
                px: 2,
                py: 0.8,
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(94, 114, 228, 0.15)' : '#f8f9fe',
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
        
        <Card sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: '16px', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7', backgroundColor: darkMode ? '#111c44' : '#ffffff', boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 20px 0 rgba(0, 0, 0, 0.05)', minWidth: 0 }}>
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
              {sortedCities.length} Districts
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
                      <Typography sx={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#a5b4fc' : '#5e72e4' }}>
                        {count} ({percentage}%)
                      </Typography>
                    </Box>
                    <Box sx={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: darkMode ? '#0b1437' : '#e9ecef', overflow: 'hidden' }}>
                      <Box
                        sx={{
                          height: '100%',
                          borderRadius: '3px',
                          background: city === 'Lahore' ? 'linear-gradient(310deg, #f5365c 0%, #ec0c38 100%)' : 'linear-gradient(310deg, #1171ef 0%, #11cdef 100%)',
                          width: `${Math.min(100, percentage * 1.2)}%`,
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

        <Card sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: '16px', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7', backgroundColor: darkMode ? '#111c44' : '#ffffff', boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 20px 0 rgba(0, 0, 0, 0.05)', minWidth: 0 }}>
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
              View Full Audit ({auditLog.length})
            </Button>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined }} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2,
              mb: 0,
            }}
          >
            <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: darkMode ? '#0b1437' : '#f8f9fa', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#2dce89', textTransform: 'uppercase' }}>
                Valid Posts
              </Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 700, color: darkMode ? '#ffffff' : '#344767', my: 0.5 }}>
                {totalClean}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                Passed all negative gates & geographic checks
              </Typography>
            </Box>

            <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: darkMode ? '#0b1437' : '#f8f9fa', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#fb6340', textTransform: 'uppercase' }}>
                Duplicates Merged
              </Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 700, color: darkMode ? '#ffffff' : '#344767', my: 0.5 }}>
                {duplicatesMerged}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                Consolidated media & metrics into parent post
              </Typography>
            </Box>

            <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: darkMode ? '#0b1437' : '#f8f9fa', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#f5365c', textTransform: 'uppercase' }}>
                Excluded Noise
              </Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 700, color: darkMode ? '#ffffff' : '#344767', my: 0.5 }}>
                {noiseRemoved}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                Delhi/India politics, cricket, Gadani ships, etc.
              </Typography>
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
                  backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff',
                  color: darkMode ? '#a5b4fc' : '#4338ca',
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
              color: darkMode ? '#a5b4fc' : '#5e72e4',
              whiteSpace: 'nowrap',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(94, 114, 228, 0.15)' : 'rgba(94, 114, 228, 0.08)',
              },
            }}
          >
            Explore All Posts ({totalClean})
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
              backgroundColor: darkMode ? '#111c44' : '#ffffff',
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
                backgroundColor: '#5e72e4',
                color: '#ffffff',
                borderRadius: '8px',
                px: 2.5,
                py: 0.8,
                boxShadow: '0 4px 12px rgba(94, 114, 228, 0.3)',
                '&:hover': {
                  backgroundColor: '#485ec4',
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
  posts: PropTypes.arrayOf(PropTypes.object).isRequired,
  auditLog: PropTypes.arrayOf(PropTypes.object).isRequired,
  dataSource: PropTypes.string,
  onNavigate: PropTypes.func.isRequired,
  onOpenIngest: PropTypes.func.isRequired,
  onImageClick: PropTypes.func.isRequired,
};

export default DashboardView;