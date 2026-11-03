import React from 'react';
import PropTypes from 'prop-types';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import SouthRoundedIcon from '@mui/icons-material/SouthRounded';
import NorthRoundedIcon from '@mui/icons-material/NorthRounded';
import WhatshotRoundedIcon from '@mui/icons-material/WhatshotRounded';

import { useArgonController } from 'context';

export const SORT_OPTIONS = [
  
  { id: 'newest', label: 'Latest / Most Recent', short: 'Latest', group: 'Recency & Timeline' },
  { id: 'oldest', label: 'Oldest First', short: 'Oldest', group: 'Recency & Timeline' },

  { id: 'engagement', label: 'Most Interactions (Total)', short: 'Most Interactions', group: 'Interactions & Virality' },
  { id: 'likes', label: 'Most Likes / Hearted', short: 'Most Likes', group: 'Interactions & Virality' },
  { id: 'retweets', label: 'Most Reposts / Retweets', short: 'Most Retweets', group: 'Interactions & Virality' },
  { id: 'replies', label: 'Most Discussion / Replies', short: 'Most Replies', group: 'Interactions & Virality' },
  { id: 'views', label: 'Most Impressions / Views', short: 'Most Views', group: 'Interactions & Virality' },

  { id: 'aqi_desc', label: 'Highest AQI (Worst Air)', short: 'Highest AQI', group: 'Air Quality & Severity' },
  { id: 'aqi_asc', label: 'Lowest AQI (Clean Air)', short: 'Lowest AQI', group: 'Air Quality & Severity' },
  { id: 'severity', label: 'Worst Hazard Severity', short: 'Worst Severity', group: 'Air Quality & Severity' },

  { id: 'followers', label: 'Top Author Reach (Followers)', short: 'Top Reach', group: 'Author & Influence' },
  { id: 'verified', label: 'Verified Accounts First', short: 'Verified First', group: 'Author & Influence' },

  { id: 'sentiment_alarm', label: 'Most Critical / Alarmed Sentiment', short: 'Most Alarmed', group: 'Citizen Urgency & Sentiment' },
  { id: 'sentiment_positive', label: 'Most Positive / Solutions Oriented', short: 'Most Positive', group: 'Citizen Urgency & Sentiment' },

  { id: 'media_count', label: 'Most Media Attachments (Photos/Proof)', short: 'Photo Evidence', group: 'Media & Proof' },
];

export const QUICK_SORTS = [
  { id: 'newest', label: 'Latest', icon: '🕒' },
  { id: 'engagement', label: 'Most Interactions', icon: '🔥' },
  { id: 'aqi_desc', label: 'Highest AQI', icon: '⚠️' },
  { id: 'replies', label: 'Most Discussion', icon: '💬' },
  { id: 'likes', label: 'Most Likes', icon: '❤️' },
  { id: 'followers', label: 'Top Reach', icon: '👥' },
  { id: 'sentiment_alarm', label: 'Most Alarmed', icon: '🚨' },
  { id: 'media_count', label: 'Photo Evidence', icon: '📸' },
];

function FilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  totalResults,
  totalAvailable,
  availableCities = [],
  availableCategories = [],
  availableDates = [],
}) {
  const [controller] = useArgonController();
  const { darkMode } = controller || {};

  const handleChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const handleToggleSortOrder = () => {
    const nextOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
    handleChange('sortOrder', nextOrder);
  };

  const activeSortObj = SORT_OPTIONS.find((s) => s.id === filters.sortBy) || SORT_OPTIONS[0];

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.city !== 'all' ||
    filters.severity !== 'all' ||
    filters.category !== 'all' ||
    filters.media !== 'all' ||
    filters.sortBy !== 'newest' ||
    filters.sortOrder === 'asc' ||
    (filters.date && filters.date !== 'all') ||
    (filters.timeOfDay && filters.timeOfDay !== 'all');

  return (
    <Card
      sx={{
        backgroundColor: darkMode ? '#111c44' : '#ffffff',
        borderRadius: '16px',
        p: { xs: 2, sm: 2.5 },
        mb: 3,
        border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
        boxShadow: darkMode ? '0 4px 20px 0 rgba(0, 0, 0, 0.35)' : '0 4px 16px 0 rgba(103, 116, 142, 0.06)',
      }}
    >
      
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: '2fr repeat(5, 1fr)',
          },
          gap: 1.5,
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Box sx={{ gridColumn: { xs: '1', sm: 'span 2', md: 'span 1' } }}>
          <OutlinedInput
            placeholder="Search keywords, #smog, @handles..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '19px' }} />
              </InputAdornment>
            }
            endAdornment={
              filters.search ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleChange('search', '')}
                    edge="end"
                    sx={{ p: 0.5, color: darkMode ? '#94a3b8' : '#94a3b8', '&:hover': { color: darkMode ? '#ffffff' : '#475569' } }}
                  >
                    <ClearRoundedIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
            size="small"
            fullWidth
            sx={{
              fontFamily: '"Open Sans", sans-serif',
              fontSize: '13px',
              borderRadius: '8px',
              backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
              color: darkMode ? '#ffffff' : '#1e293b',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5e72e4' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#5e72e4' },
              '& input': { color: darkMode ? '#ffffff' : 'inherit' },
              '& input::placeholder': { color: darkMode ? '#94a3b8' : undefined, opacity: 1 },
            }}
          />
        </Box>

        <FormControl fullWidth size="small">
          <InputLabel id="city-label" sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : undefined }}>
            City
          </InputLabel>
          <Select
            labelId="city-label"
            value={filters.city || 'all'}
            label="City"
            onChange={(e) => handleChange('city', e.target.value)}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: darkMode ? '#111c44' : '#ffffff',
                  color: darkMode ? '#ffffff' : 'inherit',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                },
              },
            }}
            sx={{
              fontSize: '13px',
              borderRadius: '8px',
              fontFamily: '"Open Sans", sans-serif',
              backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
              color: darkMode ? '#ffffff' : '#344767',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1' },
              '& .MuiSvgIcon-root': { color: darkMode ? '#94a3b8' : '#8392ab' },
            }}
          >
            <MenuItem value="all">All Cities</MenuItem>
            {availableCities.map((city) => (
              <MenuItem key={city.name} value={city.name}>
                {city.name} ({city.count})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel id="sev-label" sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : undefined }}>
            AQI Severity
          </InputLabel>
          <Select
            labelId="sev-label"
            value={filters.severity || 'all'}
            label="AQI Severity"
            onChange={(e) => handleChange('severity', e.target.value)}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: darkMode ? '#111c44' : '#ffffff',
                  color: darkMode ? '#ffffff' : 'inherit',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                },
              },
            }}
            sx={{
              fontSize: '13px',
              borderRadius: '8px',
              fontFamily: '"Open Sans", sans-serif',
              backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
              color: darkMode ? '#ffffff' : '#344767',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1' },
              '& .MuiSvgIcon-root': { color: darkMode ? '#94a3b8' : '#8392ab' },
            }}
          >
            <MenuItem value="all">All Severities</MenuItem>
            <MenuItem value="hazardous">Hazardous (300+)</MenuItem>
            <MenuItem value="very_unhealthy">Very Unhealthy (201-300)</MenuItem>
            <MenuItem value="unhealthy">Unhealthy (151-200)</MenuItem>
            <MenuItem value="sensitive">Sensitive (101-150)</MenuItem>
            <MenuItem value="moderate">Moderate (51-100)</MenuItem>
            <MenuItem value="good">Good (0-50)</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel id="cat-label" sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : undefined }}>
            Category
          </InputLabel>
          <Select
            labelId="cat-label"
            value={filters.category || 'all'}
            label="Category"
            onChange={(e) => handleChange('category', e.target.value)}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: darkMode ? '#111c44' : '#ffffff',
                  color: darkMode ? '#ffffff' : 'inherit',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                },
              },
            }}
            sx={{
              fontSize: '13px',
              borderRadius: '8px',
              fontFamily: '"Open Sans", sans-serif',
              backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
              color: darkMode ? '#ffffff' : '#344767',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1' },
              '& .MuiSvgIcon-root': { color: darkMode ? '#94a3b8' : '#8392ab' },
            }}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {availableCategories.map((cat) => (
              <MenuItem key={cat.name} value={cat.name}>
                {cat.name} ({cat.count})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel id="date-label" sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : undefined }}>
            Date
          </InputLabel>
          <Select
            labelId="date-label"
            value={filters.date || 'all'}
            label="Date"
            onChange={(e) => handleChange('date', e.target.value)}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: darkMode ? '#111c44' : '#ffffff',
                  color: darkMode ? '#ffffff' : 'inherit',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                },
              },
            }}
            sx={{
              fontSize: '13px',
              borderRadius: '8px',
              fontFamily: '"Open Sans", sans-serif',
              backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
              color: darkMode ? '#ffffff' : '#344767',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1' },
              '& .MuiSvgIcon-root': { color: darkMode ? '#94a3b8' : '#8392ab' },
            }}
          >
            <MenuItem value="all">All Dates</MenuItem>
            {availableDates.map((item) => {
              const [y, m, d] = item.date.split('-');
              const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
              const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <MenuItem key={item.date} value={item.date}>
                  {label} ({item.count})
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel id="time-label" sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : undefined }}>
            Time Window
          </InputLabel>
          <Select
            labelId="time-label"
            value={filters.timeOfDay || 'all'}
            label="Time Window"
            onChange={(e) => handleChange('timeOfDay', e.target.value)}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: darkMode ? '#111c44' : '#ffffff',
                  color: darkMode ? '#ffffff' : 'inherit',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                },
              },
            }}
            sx={{
              fontSize: '13px',
              borderRadius: '8px',
              fontFamily: '"Open Sans", sans-serif',
              backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
              color: darkMode ? '#ffffff' : '#344767',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1' },
              '& .MuiSvgIcon-root': { color: darkMode ? '#94a3b8' : '#8392ab' },
            }}
          >
            <MenuItem value="all">All Hours (24h)</MenuItem>
            <MenuItem value="morning">Morning (06:00 - 12:00)</MenuItem>
            <MenuItem value="afternoon">Afternoon (12:00 - 18:00)</MenuItem>
            <MenuItem value="evening">Evening / Peak Smog (18:00 - 24:00)</MenuItem>
            <MenuItem value="night">Night / Dawn (00:00 - 06:00)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box
        sx={{
          backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
          borderRadius: '12px',
          p: { xs: 1.5, sm: 1.8 },
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0.8,
            minWidth: 0,
            flex: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mr: 0.3, flexShrink: 0 }}>
            <SwapVertRoundedIcon sx={{ color: '#5e72e4', fontSize: '18px' }} />
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                color: darkMode ? '#cbd5e1' : '#475569',
                fontFamily: '"Open Sans", sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              Quick Sort:
            </Typography>
          </Box>

          {QUICK_SORTS.map((qs) => {
            const isActive = filters.sortBy === qs.id;
            return (
              <Button
                key={qs.id}
                size="small"
                onClick={() => handleChange('sortBy', qs.id)}
                sx={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontSize: '11.5px',
                  fontWeight: isActive ? 700 : 600,
                  textTransform: 'none',
                  borderRadius: '20px',
                  px: 1.25,
                  py: 0.3,
                  minWidth: 'auto',
                  transition: 'all 0.18s ease-in-out',
                  backgroundColor: isActive ? 'transparent' : (darkMode ? '#111c44' : '#ffffff'),
                  background: isActive ? 'linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)' : (darkMode ? '#111c44' : '#ffffff'),
                  color: isActive ? '#ffffff' : (darkMode ? '#cbd5e1' : '#475569'),
                  border: '1px solid',
                  borderColor: isActive ? 'transparent' : (darkMode ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'),
                  boxShadow: isActive ? '0 3px 8px rgba(94, 114, 228, 0.35)' : 'none',
                  '&:hover': {
                    backgroundColor: isActive ? '#485ec4' : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'),
                    borderColor: isActive ? 'transparent' : '#5e72e4',
                    color: isActive ? '#ffffff' : (darkMode ? '#ffffff' : '#1e293b'),
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <span style={{ marginRight: '4px', fontSize: '12px' }}>{qs.icon}</span>
                {qs.label}
              </Button>
            );
          })}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0,
            justifyContent: { xs: 'flex-start', md: 'flex-end' },
          }}
        >
          <FormControl size="small" sx={{ minWidth: { xs: '180px', sm: '230px' } }}>
            <InputLabel id="all-sort-label" sx={{ fontSize: '12.5px', fontWeight: 600, color: darkMode ? '#94a3b8' : undefined }}>
              All Sorting Options
            </InputLabel>
            <Select
              labelId="all-sort-label"
              value={filters.sortBy || 'newest'}
              label="All Sorting Options"
              onChange={(e) => handleChange('sortBy', e.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: darkMode ? '#111c44' : '#ffffff',
                    color: darkMode ? '#ffffff' : 'inherit',
                    border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                  },
                },
              }}
              sx={{
                fontSize: '12.5px',
                fontWeight: 600,
                borderRadius: '8px',
                fontFamily: '"Open Sans", sans-serif',
                backgroundColor: darkMode ? '#111c44' : '#ffffff',
                color: darkMode ? '#ffffff' : '#344767',
                height: '36px',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1' },
                '& .MuiSvgIcon-root': { color: darkMode ? '#94a3b8' : '#8392ab' },
                '& .MuiSelect-select': { py: '7px', pl: '12px' },
              }}
            >
              
              <ListSubheader sx={{ lineHeight: '28px', fontSize: '11px', fontWeight: 700, color: '#8392ab', bgcolor: '#f8fafc' }}>
                🕒 TIMELINE & RECENCY
              </ListSubheader>
              <MenuItem value="newest" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Latest / Most Recent (Default)
              </MenuItem>
              <MenuItem value="oldest" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Oldest First
              </MenuItem>

              <ListSubheader sx={{ lineHeight: '28px', fontSize: '11px', fontWeight: 700, color: '#8392ab', bgcolor: '#f8fafc' }}>
                🔥 INTERACTIONS & REACH
              </ListSubheader>
              <MenuItem value="engagement" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Most Interactions (Total Engagement)
              </MenuItem>
              <MenuItem value="likes" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Most Likes / Hearted
              </MenuItem>
              <MenuItem value="retweets" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Most Reposts / Retweets
              </MenuItem>
              <MenuItem value="replies" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Most Discussion (Replies & Comments)
              </MenuItem>
              <MenuItem value="views" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Most Impressions / Views
              </MenuItem>

              <ListSubheader sx={{ lineHeight: '28px', fontSize: '11px', fontWeight: 700, color: '#8392ab', bgcolor: '#f8fafc' }}>
                ⚠️ AIR QUALITY & SEVERITY
              </ListSubheader>
              <MenuItem value="aqi_desc" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Highest AQI (Worst Air Pollution)
              </MenuItem>
              <MenuItem value="aqi_asc" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Lowest AQI (Cleanest Air Reported)
              </MenuItem>
              <MenuItem value="severity" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Highest Hazard Severity Level
              </MenuItem>

              <ListSubheader sx={{ lineHeight: '28px', fontSize: '11px', fontWeight: 700, color: '#8392ab', bgcolor: '#f8fafc' }}>
                👥 AUTHOR & INFLUENCE
              </ListSubheader>
              <MenuItem value="followers" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Top Author Reach (Most Followers)
              </MenuItem>
              <MenuItem value="verified" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Verified Accounts First
              </MenuItem>

              <ListSubheader sx={{ lineHeight: '28px', fontSize: '11px', fontWeight: 700, color: '#8392ab', bgcolor: '#f8fafc' }}>
                🚨 CITIZEN URGENCY & SENTIMENT
              </ListSubheader>
              <MenuItem value="sentiment_alarm" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Most Critical / Alarmed Sentiment
              </MenuItem>
              <MenuItem value="sentiment_positive" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Most Positive / Solutions Oriented
              </MenuItem>

              <ListSubheader sx={{ lineHeight: '28px', fontSize: '11px', fontWeight: 700, color: '#8392ab', bgcolor: '#f8fafc' }}>
                📸 MEDIA & PROOF
              </ListSubheader>
              <MenuItem value="media_count" sx={{ fontSize: '12.5px', py: 0.8 }}>
                Most Media Attachments (Photos/Proof)
              </MenuItem>
            </Select>
          </FormControl>

          <Tooltip
            title={
              filters.sortOrder === 'asc'
                ? 'Order: Ascending (Low to High / Old to New). Click to reverse to Descending.'
                : 'Order: Descending (High to Low / New to Old). Click to reverse to Ascending.'
            }
          >
            <Button
              onClick={handleToggleSortOrder}
              size="small"
              variant="outlined"
              sx={{
                height: '36px',
                minWidth: '38px',
                px: 1,
                borderRadius: '8px',
                backgroundColor: darkMode ? '#111c44' : '#ffffff',
                borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1',
                color: darkMode ? '#cbd5e1' : '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                textTransform: 'none',
                fontFamily: '"Open Sans", sans-serif',
                fontSize: '11.5px',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#5e72e4',
                  backgroundColor: darkMode ? 'rgba(94, 114, 228, 0.15)' : '#f1f5f9',
                  color: '#5e72e4',
                },
              }}
            >
              {filters.sortOrder === 'asc' ? (
                <>
                  <NorthRoundedIcon sx={{ fontSize: '16px', color: '#5e72e4' }} />
                  <span style={{ display: 'none', '@media (min-width: 600px)': { display: 'inline' } }}>Asc</span>
                </>
              ) : (
                <>
                  <SouthRoundedIcon sx={{ fontSize: '16px', color: '#5e72e4' }} />
                  <span style={{ display: 'none', '@media (min-width: 600px)': { display: 'inline' } }}>Desc</span>
                </>
              )}
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          pt: 1,
          gap: 1.5,
        }}
      >
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography
            sx={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#8392ab',
              fontFamily: '"Open Sans", sans-serif',
              mr: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            Media Filter:
          </Typography>

          {[
            { id: 'all', label: 'All Posts' },
            { id: 'media', label: 'With Images 🖼️' },
            { id: 'text', label: 'Text Only 📝' },
          ].map((item) => {
            const active = filters.media === item.id;
            return (
              <Button
                key={item.id}
                size="small"
                onClick={() => handleChange('media', item.id)}
                sx={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '20px',
                  px: 1.4,
                  py: 0.3,
                  backgroundColor: active ? '#5e72e4' : (darkMode ? '#0b1437' : '#f8fafc'),
                  color: active ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                  border: '1px solid',
                  borderColor: active ? '#5e72e4' : (darkMode ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'),
                  '&:hover': {
                    backgroundColor: active ? '#4b5fcc' : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'),
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
          <Typography
            sx={{
              fontSize: '11.5px',
              fontWeight: 600,
              color: darkMode ? '#38bdf8' : '#0369a1',
              backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.12)' : '#e0f2fe',
              px: 1.2,
              py: 0.4,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 0.5,
              lineHeight: 1.4,
            }}
          >
            <span>Showing <strong>{totalResults}</strong> of {totalAvailable} posts</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>Sorted: <strong>{activeSortObj.short}</strong> {filters.sortOrder === 'asc' ? '↑ (Asc)' : '↓ (Desc)'}</span>
          </Typography>

          {hasActiveFilters && (
            <Button
              size="small"
              onClick={onResetFilters}
              startIcon={<RestartAltRoundedIcon sx={{ fontSize: '15px !important' }} />}
              sx={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#f5365c',
                textTransform: 'none',
                borderRadius: '6px',
                p: '3px 10px',
                border: '1px solid #fecdd3',
                backgroundColor: '#fff1f2',
                '&:hover': { backgroundColor: '#ffe4e6', borderColor: '#fda4af' },
              }}
            >
              Reset All
            </Button>
          )}
        </Box>
      </Box>
    </Card>
  );
}

FilterBar.propTypes = {
  filters: PropTypes.shape({
    search: PropTypes.string,
    city: PropTypes.string,
    severity: PropTypes.string,
    category: PropTypes.string,
    media: PropTypes.string,
    date: PropTypes.string,
    timeOfDay: PropTypes.string,
    sortBy: PropTypes.string,
    sortOrder: PropTypes.string,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
  totalResults: PropTypes.number.isRequired,
  totalAvailable: PropTypes.number.isRequired,
  availableCities: PropTypes.array,
  availableCategories: PropTypes.array,
  availableDates: PropTypes.array,
};

export default FilterBar;