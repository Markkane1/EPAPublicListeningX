import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useArgonController } from 'context';

import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import ElectricBoltRoundedIcon from '@mui/icons-material/ElectricBoltRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import ImageNotSupportedRoundedIcon from '@mui/icons-material/ImageNotSupportedRounded';
import CollectionsRoundedIcon from '@mui/icons-material/CollectionsRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import WhatshotRoundedIcon from '@mui/icons-material/WhatshotRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { isVideoUrl } from '../../utils/media';
import { sanitizeUrl } from '../../utils/security';

function formatDate(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return isoStr;
  }
}

function formatMetric(num) {
  if (!num && num !== 0) return '0';
  const n = parseInt(num, 10);
  if (isNaN(n)) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function getSeverityBadgeStyle(code) {
  switch (code) {
    case 'hazardous':
      return { bg: 'linear-gradient(310deg, #f5365c 0%, #ec0c38 100%)', color: '#fff', label: 'Hazardous' };
    case 'very_unhealthy':
      return { bg: 'linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)', color: '#fff', label: 'Very Unhealthy' };
    case 'unhealthy':
      return { bg: 'linear-gradient(310deg, #fb6340 0%, #fbb140 100%)', color: '#fff', label: 'Unhealthy' };
    case 'sensitive':
      return { bg: 'linear-gradient(310deg, #ffd600 0%, #be9b00 100%)', color: '#212529', label: 'Sensitive' };
    case 'moderate':
      return { bg: 'linear-gradient(310deg, #11cdef 0%, #1171ef 100%)', color: '#fff', label: 'Moderate' };
    case 'good':
      return { bg: 'linear-gradient(310deg, #2dce89 0%, #2dcecc 100%)', color: '#fff', label: 'Good' };
    default:
      return { bg: '#8392ab', color: '#fff', label: 'Alert' };
  }
}

function renderFormattedText(text) {
  if (!text) return null;
  const parts = text.split(/(\s+|https?:\/\/\S+)/);

  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      return (
        <span
          key={index}
          style={{ color: '#5e72e4', fontWeight: 600, cursor: 'pointer' }}
        >
          {part}
        </span>
      );
    }
    if (part.startsWith('@')) {
      return (
        <span
          key={index}
          style={{ color: '#11cdef', fontWeight: 600, cursor: 'pointer' }}
        >
          {part}
        </span>
      );
    }
    if (part.startsWith('http')) {
      return (
        <a
          key={index}
          href={sanitizeUrl(part)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#5e72e4', textDecoration: 'underline', wordBreak: 'break-all' }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

function PostCard({ post, onImageClick, onExcludePost, sortBy = 'newest', sortOrder = 'desc', rank = null }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [failedImages, setFailedImages] = useState({});
  const [controller] = useArgonController();
  const { darkMode } = controller;

  const {
    authorName,
    authorUsername,
    authorVerified,
    authorAvatar,
    authorFollowers,
    createdAt,
    text = '',
    postUrl,
    aqi_value,
    severity,
    severity_code,
    city_detected,
    category,
    sentiment,
    sentiment_score,
    sentiment_engine,
    emotion,
    mediaUrls = [],
    likes = 0,
    retweets = 0,
    replies = 0,
    views = 0,
    total_engagement,
  } = post;

  const totalInteractions =
    total_engagement != null
      ? total_engagement
      : (parseInt(likes, 10) || 0) + (parseInt(retweets, 10) || 0) + (parseInt(replies, 10) || 0);

  const initials = (authorName || authorUsername || 'U')
    .slice(0, 1)
    .toUpperCase();

  const sevStyle = getSeverityBadgeStyle(severity_code);
  const isLongText = text.length > 180;

  const handleImageError = (index) => {
    setFailedImages((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
        backgroundColor: darkMode ? '#111c44' : '#ffffff',
        boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: darkMode ? '0 16px 36px rgba(0, 0, 0, 0.5)' : '0 12px 28px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 2.5 }, display: 'flex', flexDirection: 'column', flex: 1 }}>
        
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1.5,
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0, flex: 1 }}>
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: darkMode ? '1.5px solid rgba(255, 255, 255, 0.15)' : '1.5px solid #edf2f7',
                  flexShrink: 0,
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(94, 114, 228, 0.25)',
                }}
              >
                {initials}
              </Box>
            )}

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  sx={{
                    fontFamily: '"Open Sans", sans-serif',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: darkMode ? '#ffffff' : '#1e293b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                  }}
                >
                  {authorName || authorUsername || 'Anonymous'}
                </Typography>
                {authorVerified && (
                  <VerifiedRoundedIcon
                    sx={{
                      color: '#11cdef',
                      fontSize: '16px',
                      flexShrink: 0,
                    }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mt: 0.2 }}>
                <Typography
                  sx={{
                    fontFamily: '"Open Sans", sans-serif',
                    fontSize: '11.5px',
                    color: darkMode ? '#94a3b8' : '#8392ab',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  @{authorUsername}
                </Typography>
                {authorFollowers && parseInt(authorFollowers, 10) > 0 && (
                  <Typography
                    sx={{
                      fontFamily: '"Open Sans", sans-serif',
                      fontSize: '11.5px',
                      color: sortBy === 'followers' ? (darkMode ? '#a5b4fc' : '#5e72e4') : (darkMode ? '#64748b' : '#adb5bd'),
                      fontWeight: sortBy === 'followers' ? 700 : 500,
                      whiteSpace: 'nowrap',
                      ...(sortBy === 'followers' && {
                        backgroundColor: darkMode ? 'rgba(94, 114, 228, 0.2)' : '#eff6ff',
                        px: 0.8,
                        py: 0.15,
                        borderRadius: '4px',
                        border: darkMode ? '1px solid rgba(94, 114, 228, 0.4)' : '1px solid #bfdbfe',
                      }),
                    }}
                  >
                    • {formatMetric(authorFollowers)} followers
                  </Typography>
                )}
                <Typography
                  sx={{
                    fontFamily: '"Open Sans", sans-serif',
                    fontSize: '11.5px',
                    color: darkMode ? '#64748b' : '#adb5bd',
                    whiteSpace: 'nowrap',
                  }}
                >
                  • {formatDate(createdAt)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexShrink: 0 }}>
            
            {postUrl && (
              <Button
                component="a"
                href={sanitizeUrl(postUrl)}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                size="small"
                endIcon={<LaunchRoundedIcon sx={{ fontSize: '13px !important' }} />}
                sx={{
                  textTransform: 'none',
                  fontFamily: '"Open Sans", sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: darkMode ? '#a5b4fc' : '#5e72e4',
                  borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1',
                  borderRadius: '6px',
                  px: 1.2,
                  py: 0.3,
                  minWidth: 'auto',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: '#5e72e4',
                    backgroundColor: darkMode ? 'rgba(94, 114, 228, 0.15)' : 'rgba(94, 114, 228, 0.05)',
                  },
                }}
              >
                View on X
              </Button>
            )}

            {onExcludePost && (
              <Tooltip title="Exclude post as noise and return to Noise Pool">
                <IconButton
                  size="small"
                  onClick={() => onExcludePost(post)}
                  sx={{
                    color: darkMode ? '#94a3b8' : '#94a3b8',
                    p: 0.5,
                    borderRadius: '6px',
                    border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0',
                    '&:hover': {
                      color: '#f43f5e',
                      borderColor: '#fca5a5',
                      backgroundColor: darkMode ? 'rgba(225, 29, 72, 0.2)' : '#fff1f2',
                    },
                  }}
                >
                  <DeleteOutlineRoundedIcon sx={{ fontSize: '14px' }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 0.8,
            mb: 1.5,
          }}
        >
          
          {(sortBy === 'engagement' || sortBy === 'interactions') && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.4,
                px: 1,
                py: 0.25,
                borderRadius: '5px',
                background: 'linear-gradient(310deg, #fb6340 0%, #f5365c 100%)',
                color: '#ffffff',
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.3px',
                boxShadow: '0 2px 6px rgba(245, 54, 92, 0.25)',
              }}
            >
              <WhatshotRoundedIcon sx={{ fontSize: '13px' }} />
              {formatMetric(totalInteractions)} INTERACTIONS {rank && rank <= 12 ? `• #${rank}` : ''}
            </Box>
          )}

          {sortBy === 'followers' && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.4,
                px: 1,
                py: 0.25,
                borderRadius: '5px',
                background: 'linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)',
                color: '#ffffff',
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.3px',
                boxShadow: '0 2px 6px rgba(94, 114, 228, 0.25)',
              }}
            >
              👥 {formatMetric(authorFollowers || 0)} REACH {rank && rank <= 12 ? `• #${rank}` : ''}
            </Box>
          )}

          {sortBy === 'media_count' && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.4,
                px: 1,
                py: 0.25,
                borderRadius: '5px',
                background: 'linear-gradient(310deg, #11cdef 0%, #1171ef 100%)',
                color: '#ffffff',
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.3px',
              }}
            >
              <CollectionsRoundedIcon sx={{ fontSize: '13px' }} />
              {post.media_count || (post.mediaUrls?.length || 0)} PHOTOS
            </Box>
          )}

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1,
              py: 0.25,
              borderRadius: '5px',
              background: darkMode ? '#1e293b' : '#344767',
              color: '#ffffff',
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            {city_detected || 'Punjab'}
          </Box>

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1,
              py: 0.25,
              borderRadius: '5px',
              background: sevStyle.bg,
              color: sevStyle.color,
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            {severity || sevStyle.label}
          </Box>

          {aqi_value && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.3,
                px: 1,
                py: 0.25,
                borderRadius: '5px',
                background: severity_code === 'hazardous' ? '#f5365c' : '#fb6340',
                color: '#ffffff',
                fontSize: '10.5px',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                ...((sortBy === 'aqi_desc' || sortBy === 'aqi_asc') && {
                  border: '1.5px solid #ffffff',
                  boxShadow: '0 0 0 2px #f5365c',
                }),
              }}
            >
              <ElectricBoltRoundedIcon sx={{ fontSize: '13px' }} />
              AQI {aqi_value} {((sortBy === 'aqi_desc' || sortBy === 'aqi_asc') && rank && rank <= 12) ? `• #${rank}` : ''}
            </Box>
          )}

          {category && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1,
                py: 0.25,
                borderRadius: '5px',
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                color: darkMode ? '#cbd5e1' : '#475569',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0',
                fontSize: '10.5px',
                fontWeight: 600,
              }}
            >
              {category}
            </Box>
          )}
        </Box>

        <Box sx={{ mb: mediaUrls.length > 0 ? 1.5 : 1 }}>
          <Typography
            sx={{
              fontFamily: '"Open Sans", sans-serif',
              fontSize: '13.5px',
              color: darkMode ? '#e2e8f0' : '#334155',
              lineHeight: 1.55,
              wordBreak: 'break-word',
              ...(!isExpanded && {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }),
            }}
          >
            {renderFormattedText(text)}
          </Typography>

          {isLongText && (
            <Box
              component="span"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{
                display: 'inline-block',
                mt: 0.3,
                fontSize: '12px',
                fontWeight: 700,
                color: darkMode ? '#a5b4fc' : '#5e72e4',
                cursor: 'pointer',
                userSelect: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {isExpanded ? 'Show less' : 'Show more...'}
            </Box>
          )}
        </Box>

        {mediaUrls && mediaUrls.length > 0 && (
          <Box sx={{ mt: 'auto', pt: 1, mb: 1 }}>
            {mediaUrls.length === 1 ? (
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '210px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isVideoUrl(mediaUrls[0]) ? 'default' : 'pointer',
                  border: '1px solid #e2e8f0',
                }}
                onClick={() => !isVideoUrl(mediaUrls[0]) && onImageClick(mediaUrls, 0)}
              >
                {!failedImages[0] ? (
                  isVideoUrl(mediaUrls[0]) ? (
                    <Box sx={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Box
                        component="video"
                        src={mediaUrls[0]}
                        controls
                        playsInline
                        preload="metadata"
                        onError={() => handleImageError(0)}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          display: 'block',
                          zIndex: 1,
                        }}
                      />
                      <Box
                        onClick={(e) => {
                          e.stopPropagation();
                          onImageClick(mediaUrls, 0);
                        }}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 2,
                          backgroundColor: 'rgba(15, 23, 42, 0.75)',
                          backdropFilter: 'blur(4px)',
                          color: '#ffffff',
                          px: 1,
                          py: 0.35,
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.4,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'rgba(15, 23, 42, 0.95)' },
                        }}
                      >
                        <ZoomInRoundedIcon sx={{ fontSize: '14px' }} />
                        Fullscreen
                      </Box>
                    </Box>
                  ) : (
                    <>
                      <Box
                        component="img"
                        src={mediaUrls[0]}
                        alt="Backdrop blur"
                        onError={() => handleImageError(0)}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'blur(14px) brightness(0.65)',
                        }}
                      />
                      <Box
                        component="img"
                        src={mediaUrls[0]}
                        alt="Post visual attachment"
                        onError={() => handleImageError(0)}
                        sx={{
                          position: 'relative',
                          zIndex: 1,
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          display: 'block',
                        }}
                        loading="lazy"
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          zIndex: 2,
                          backgroundColor: 'rgba(15, 23, 42, 0.75)',
                          backdropFilter: 'blur(4px)',
                          color: '#ffffff',
                          px: 1,
                          py: 0.3,
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.4,
                        }}
                      >
                        <ZoomInRoundedIcon sx={{ fontSize: '14px' }} />
                        Full View
                      </Box>
                    </>
                  )
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center', color: '#94a3b8' }}>
                    <ImageNotSupportedRoundedIcon sx={{ fontSize: '28px', mb: 0.5 }} />
                    <Typography sx={{ fontSize: '11px', color: '#94a3b8' }}>
                      Media preview unavailable on X CDN
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 0.8,
                  height: '210px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                {mediaUrls.slice(0, 4).map((url, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      position: 'relative',
                      height: mediaUrls.length === 2 ? '210px' : '102px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e2e8f0',
                    }}
                    onClick={() => onImageClick(mediaUrls, idx)}
                  >
                    {!failedImages[idx] ? (
                      isVideoUrl(url) ? (
                        <>
                          <Box
                            component="video"
                            src={url}
                            muted
                            playsInline
                            preload="metadata"
                            onError={() => handleImageError(idx)}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              backgroundColor: 'rgba(15, 23, 42, 0.75)',
                              backdropFilter: 'blur(4px)',
                              color: '#fff',
                            }}
                          >
                            <PlayArrowRoundedIcon sx={{ fontSize: 20 }} />
                          </Box>
                        </>
                      ) : (
                        <>
                          <Box
                            component="img"
                            src={url}
                            alt="Backdrop blur"
                            onError={() => handleImageError(idx)}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              filter: 'blur(8px) brightness(0.6)',
                            }}
                          />
                          <Box
                            component="img"
                            src={url}
                            alt={`Post attachment ${idx + 1}`}
                            onError={() => handleImageError(idx)}
                            sx={{
                              position: 'relative',
                              zIndex: 1,
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              display: 'block',
                            }}
                            loading="lazy"
                          />
                        </>
                      )
                    ) : (
                      <ImageNotSupportedRoundedIcon sx={{ fontSize: '20px', color: '#64748b' }} />
                    )}

                    {idx === 3 && mediaUrls.length > 4 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          backgroundColor: 'rgba(0,0,0,0.65)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '15px',
                          zIndex: 3,
                        }}
                      >
                        +{mediaUrls.length - 4}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
          backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
          px: { xs: 2, sm: 2.5 },
          py: 1.2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 'auto',
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.2, sm: 2 },
            ...( (sortBy === 'engagement' || sortBy === 'interactions') && {
              backgroundColor: darkMode ? 'rgba(251, 99, 64, 0.15)' : '#fff7ed',
              p: '3px 8px',
              borderRadius: '8px',
              border: darkMode ? '1px solid rgba(251, 99, 64, 0.3)' : '1px solid #ffedd5',
            }),
          }}
        >
          
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
              ...(sortBy === 'likes' && {
                backgroundColor: darkMode ? 'rgba(244, 63, 94, 0.15)' : '#ffe4e6',
                px: 0.8,
                py: 0.25,
                borderRadius: '6px',
                border: darkMode ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid #fecdd3',
              }),
            }}
          >
            <FavoriteRoundedIcon sx={{ color: '#f5365c', fontSize: '15px' }} />
            <Typography
              sx={{
                fontSize: '12.5px',
                fontWeight: sortBy === 'likes' ? 800 : 700,
                color: sortBy === 'likes' ? '#f43f5e' : (darkMode ? '#e2e8f0' : '#344767'),
              }}
            >
              {formatMetric(likes)}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
              ...(sortBy === 'retweets' && {
                backgroundColor: darkMode ? 'rgba(45, 206, 137, 0.15)' : '#dcfce7',
                px: 0.8,
                py: 0.25,
                borderRadius: '6px',
                border: darkMode ? '1px solid rgba(45, 206, 137, 0.3)' : '1px solid #bbf7d0',
              }),
            }}
          >
            <RepeatRoundedIcon sx={{ color: '#2dce89', fontSize: '15px' }} />
            <Typography
              sx={{
                fontSize: '12.5px',
                fontWeight: sortBy === 'retweets' ? 800 : 700,
                color: sortBy === 'retweets' ? '#4ade80' : (darkMode ? '#e2e8f0' : '#344767'),
              }}
            >
              {formatMetric(retweets)}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
              ...(sortBy === 'replies' && {
                backgroundColor: darkMode ? 'rgba(17, 205, 239, 0.15)' : '#e0f2fe',
                px: 0.8,
                py: 0.25,
                borderRadius: '6px',
                border: darkMode ? '1px solid rgba(17, 205, 239, 0.3)' : '1px solid #bae6fd',
              }),
            }}
          >
            <ChatBubbleOutlineRoundedIcon sx={{ color: '#11cdef', fontSize: '15px' }} />
            <Typography
              sx={{
                fontSize: '12.5px',
                fontWeight: sortBy === 'replies' ? 800 : 700,
                color: sortBy === 'replies' ? '#38bdf8' : (darkMode ? '#e2e8f0' : '#344767'),
              }}
            >
              {formatMetric(replies)}
            </Typography>
          </Box>

          {(views > 0 || sortBy === 'views') && (
            <Box
              sx={{
                display: sortBy === 'views' ? 'flex' : { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
                ...(sortBy === 'views' && {
                  backgroundColor: darkMode ? 'rgba(124, 58, 237, 0.15)' : '#ede9fe',
                  px: 0.8,
                  py: 0.25,
                  borderRadius: '6px',
                  border: darkMode ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid #ddd6fe',
                }),
              }}
            >
              <VisibilityRoundedIcon sx={{ color: sortBy === 'views' ? '#7c3aed' : (darkMode ? '#a5b4fc' : '#8392ab'), fontSize: '15px' }} />
              <Typography
                sx={{
                  fontSize: '12.5px',
                  fontWeight: sortBy === 'views' ? 800 : 500,
                  color: sortBy === 'views' ? (darkMode ? '#c084fc' : '#6d28d9') : (darkMode ? '#94a3b8' : '#8392ab'),
                }}
              >
                {formatMetric(views)}
              </Typography>
            </Box>
          )}
        </Box>

        <Tooltip title={emotion ? `Emotion: ${emotion} • Engine: ${sentiment_engine || 'vader'}` : 'Sentiment'}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '10.5px',
              fontWeight: 700,
              backgroundColor: darkMode
                ? (sentiment_score < -0.2 ? 'rgba(239, 68, 68, 0.2)' : sentiment_score > 0.2 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)')
                : (sentiment_score < -0.2 ? '#fee2e2' : sentiment_score > 0.2 ? '#dcfce7' : '#f1f5f9'),
              color: darkMode
                ? (sentiment_score < -0.2 ? '#fca5a5' : sentiment_score > 0.2 ? '#86efac' : '#cbd5e1')
                : (sentiment_score < -0.2 ? '#991b1b' : sentiment_score > 0.2 ? '#166534' : '#475569'),
              px: 1,
              py: 0.25,
              borderRadius: '6px',
              border: darkMode
                ? (sentiment_score < -0.2 ? '1px solid rgba(239, 68, 68, 0.4)' : sentiment_score > 0.2 ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)')
                : `1px solid ${sentiment_score < -0.2 ? '#fecaca' : sentiment_score > 0.2 ? '#bbf7d0' : '#e2e8f0'}`,
              whiteSpace: 'nowrap',
            }}
          >
            <span>{sentiment || 'Neutral'}</span>
            {sentiment_score !== undefined && sentiment_score !== null && (
              <span style={{ opacity: 0.85, fontSize: '9.5px', fontWeight: 600 }}>
                ({sentiment_score > 0 ? `+${Number(sentiment_score).toFixed(2)}` : Number(sentiment_score).toFixed(2)})
              </span>
            )}
          </Box>
        </Tooltip>
      </Box>
    </Card>
  );
}

PostCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string,
    clean_id: PropTypes.string,
    authorName: PropTypes.string,
    authorUsername: PropTypes.string,
    authorVerified: PropTypes.bool,
    authorAvatar: PropTypes.string,
    authorFollowers: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    createdAt: PropTypes.string,
    text: PropTypes.string,
    postUrl: PropTypes.string,
    aqi_value: PropTypes.number,
    severity: PropTypes.string,
    severity_code: PropTypes.string,
    city_detected: PropTypes.string,
    category: PropTypes.string,
    sentiment: PropTypes.string,
    mediaUrls: PropTypes.arrayOf(PropTypes.string),
    likes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    retweets: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    replies: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    views: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onImageClick: PropTypes.func.isRequired,
  onExcludePost: PropTypes.func,
  sortBy: PropTypes.string,
  sortOrder: PropTypes.string,
  rank: PropTypes.number,
};

export default PostCard;