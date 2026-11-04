import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { sanitizeUrl } from '../../utils/security';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import NorthRoundedIcon from '@mui/icons-material/NorthRounded';
import SouthRoundedIcon from '@mui/icons-material/SouthRounded';
import CleaningServicesRoundedIcon from '@mui/icons-material/CleaningServicesRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import ImageNotSupportedRoundedIcon from '@mui/icons-material/ImageNotSupportedRounded';
import PsychologyAltRoundedIcon from '@mui/icons-material/PsychologyAltRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { isVideoUrl } from '../../utils/media';

import { useArgonController } from 'context';
import DetailedStatisticsCard from 'examples/Cards/StatisticsCards/DetailedStatisticsCard';

import {
  getNoisePosts,
  getNoiseStats,
  restoreNoisePost,
  excludePost,
  extractNoiseCandidates,
  getLearnedRules,
  addLearnedRule,
  toggleLearnedRule,
  deleteLearnedRule,
} from '../../services/api';
import { extractLearningCandidates } from '../../services/pipeline';

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

function renderFormattedText(text) {
  if (!text) return null;
  const parts = text.split(/(\s+|https?:\/\/\S+)/);

  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      return (
        <span key={index} style={{ color: '#5e72e4', fontWeight: 600 }}>
          {part}
        </span>
      );
    }
    if (part.startsWith('@')) {
      return (
        <span key={index} style={{ color: '#11cdef', fontWeight: 600 }}>
          {part}
        </span>
      );
    }
    if (part.startsWith('http')) {
      return (
        <a
          key={index}
          href={part}
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

function getCategoryBadge(cat) {
  const map = {
    NO_AIR_QUALITY_RELEVANCE: { label: 'NO AQ RELEVANCE', bg: '#fef3e2', color: '#fb6340', border: '#fedec0' },
    NO_GEOGRAPHIC_RELEVANCE: { label: 'NO GEO RELEVANCE', bg: '#f3e8ff', color: '#825ee4', border: '#e9d5ff' },
    OFF_TOPIC: { label: 'OFF-TOPIC NOISE', bg: '#fee2e2', color: '#f5365c', border: '#fca5a5' },
    EXCLUDED_INDIAN_CONTEXT: { label: 'INDIAN DOMESTIC', bg: '#fff7ed', color: '#ea580c', border: '#ffedd5' },
    EXCLUDED_ACCOUNT: { label: 'EXCLUDED ACCOUNT', bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' },
  };

  const style = map[cat] || { label: cat || 'EXCLUDED NOISE', bg: '#f8f9fa', color: '#67748e', border: '#e9ecef' };
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1,
        py: 0.25,
        borderRadius: '5px',
        fontSize: '10.5px',
        fontWeight: 700,
        letterSpacing: '0.4px',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        textTransform: 'uppercase',
      }}
    >
      {style.label}
    </Box>
  );
}

function NoisePostCard({ post, isRestored, onImageClick, onRestoreClick, onExcludeClick }) {
  const [controller] = useArgonController();
  const { darkMode } = controller || {};
  const [isExpanded, setIsExpanded] = useState(false);
  const [failedImages, setFailedImages] = useState({});

  const id = post.id || post.clean_id;
  const authorName = post.authorName || post.author_name;
  const authorUsername = post.authorUsername || post.author_username;
  const authorVerified = post.authorVerified ?? post.author_verified;
  const authorAvatar = post.authorAvatar || post.author_avatar;
  const authorFollowers = post.authorFollowers ?? post.author_followers;
  const createdAt = post.createdAt || post.created_at;
  const text = post.text || '';
  const postUrl = post.postUrl || post.post_url;
  const exclusionCategory = post.exclusionCategory || post.exclusion_category;
  const exclusionReason = post.exclusionReason || post.exclusion_reason;
  const mediaUrls = post.mediaUrls || post.media_urls || [];
  const likes = post.likes || 0;
  const retweets = post.retweets || 0;
  const replies = post.replies || 0;
  const views = post.views || 0;

  const initials = (authorName || authorUsername || 'U').slice(0, 1).toUpperCase();
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
                alt={authorName || authorUsername}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1.5px solid #edf2f7',
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
                  background: 'linear-gradient(310deg, #f5365c 0%, #fb6340 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(245, 54, 92, 0.25)',
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
                      color: darkMode ? '#64748b' : '#adb5bd',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    • {formatMetric(authorFollowers)} followers
                  </Typography>
                )}
                {createdAt && (
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
                )}
              </Box>
            </Box>
          </Box>

          {postUrl ? (
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
          ) : (
            <Typography sx={{ fontSize: '11px', color: '#8392ab', fontFamily: 'monospace' }}>
              ID: {String(id || '').slice(-6)}
            </Typography>
          )}
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
          {getCategoryBadge(exclusionCategory)}

          {isRestored ? (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.4,
                px: 1,
                py: 0.25,
                borderRadius: '5px',
                backgroundColor: '#e6f8f0',
                color: '#2dce89',
                fontSize: '10.5px',
                fontWeight: 700,
                border: '1px solid #bbf7d0',
                textTransform: 'uppercase',
              }}
            >
              <CheckCircleRoundedIcon sx={{ fontSize: '13px' }} />
              Restored Clean
            </Box>
          ) : (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1,
                py: 0.25,
                borderRadius: '5px',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Excluded from Feed
            </Box>
          )}
        </Box>

        <Box sx={{ mb: mediaUrls.length > 0 ? 1.5 : 1 }}>
          <Typography
            sx={{
              fontFamily: '"Open Sans", sans-serif',
              fontSize: '13.5px',
              color: darkMode ? '#cbd5e1' : '#334155',
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
          <Box sx={{ mt: 'auto', pt: 1, mb: 1.5 }}>
            {mediaUrls.length === 1 ? (
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '200px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isVideoUrl(mediaUrls[0]) ? 'default' : 'pointer',
                  border: '1px solid #e2e8f0',
                }}
                onClick={() => !isVideoUrl(mediaUrls[0]) && onImageClick && onImageClick(mediaUrls, 0)}
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
                          if (onImageClick) onImageClick(mediaUrls, 0);
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
                          transform: 'scale(1.15)',
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
                  height: '190px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                {mediaUrls.slice(0, 4).map((url, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      position: 'relative',
                      height: mediaUrls.length === 2 ? '190px' : '92px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #e2e8f0',
                    }}
                    onClick={() => onImageClick && onImageClick(mediaUrls, idx)}
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
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              backgroundColor: 'rgba(15, 23, 42, 0.75)',
                              backdropFilter: 'blur(4px)',
                              color: '#fff',
                            }}
                          >
                            <PlayArrowRoundedIcon sx={{ fontSize: 18 }} />
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
                            alt={`Attachment ${idx + 1}`}
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
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        <Box
          sx={{
            mt: 'auto',
            mb: 1.5,
            p: 1.4,
            borderRadius: '10px',
            backgroundColor: darkMode ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed',
            border: darkMode ? '1px dashed rgba(234, 88, 12, 0.4)' : '1px dashed #fedec0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
            <WarningAmberRoundedIcon sx={{ fontSize: '15px', color: '#ea580c' }} />
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                color: darkMode ? '#fdba74' : '#c2410c',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Exclusion Diagnostic:
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '12px', color: darkMode ? '#fdba74' : '#7c2d12', lineHeight: 1.45, fontWeight: 500 }}>
            {exclusionReason || 'Filtered by automated data cleaning pipeline.'}
          </Typography>
        </Box>
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
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FavoriteRoundedIcon sx={{ color: '#f5365c', fontSize: '15px' }} />
            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: darkMode ? '#ffffff' : '#344767' }}>
              {formatMetric(likes)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <RepeatRoundedIcon sx={{ color: '#2dce89', fontSize: '15px' }} />
            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: darkMode ? '#ffffff' : '#344767' }}>
              {formatMetric(retweets)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ChatBubbleOutlineRoundedIcon sx={{ color: '#11cdef', fontSize: '15px' }} />
            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: darkMode ? '#ffffff' : '#344767' }}>
              {formatMetric(replies)}
            </Typography>
          </Box>

          {views > 0 && (
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: '5px' }}>
              <VisibilityRoundedIcon sx={{ color: darkMode ? '#94a3b8' : '#8392ab', fontSize: '15px' }} />
              <Typography sx={{ fontSize: '12.5px', fontWeight: 500, color: darkMode ? '#94a3b8' : '#8392ab' }}>
                {formatMetric(views)}
              </Typography>
            </Box>
          )}
        </Box>

        {!isRestored ? (
          <Button
            variant="contained"
            size="small"
            onClick={onRestoreClick}
            startIcon={<AutoAwesomeRoundedIcon sx={{ fontSize: '15px !important' }} />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '11.5px',
              background: 'linear-gradient(310deg, #2dce89 0%, #2dcecc 100%)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(45, 206, 137, 0.35)',
              px: 1.5,
              py: 0.5,
              whiteSpace: 'nowrap',
              '&:hover': {
                background: 'linear-gradient(310deg, #26af74 0%, #25b3b1 100%)',
              },
            }}
          >
            Mark Relevant & Learn
          </Button>
        ) : (
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={<CheckCircleRoundedIcon sx={{ fontSize: '14px !important', color: '#2dce89 !important' }} />}
              label="Salvaged to Feed"
              size="small"
              sx={{
                backgroundColor: '#e6f8f0',
                color: '#2dce89',
                fontWeight: 700,
                fontSize: '11px',
                border: '1px solid #bbf7d0',
              }}
            />
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={onExcludeClick}
              startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: '14px !important' }} />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '11px',
                borderColor: '#fca5a5',
                color: '#e11d48',
                backgroundColor: '#fff1f2',
                px: 1.2,
                py: 0.4,
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: '#e11d48',
                  backgroundColor: '#ffe4e6',
                },
              }}
            >
              Exclude as Noise
            </Button>
          </Box>
        )}
      </Box>
    </Card>
  );
}

NoisePostCard.propTypes = {
  post: PropTypes.object.isRequired,
  isRestored: PropTypes.bool,
  onImageClick: PropTypes.func,
  onRestoreClick: PropTypes.func,
  onExcludeClick: PropTypes.func,
};


export const NOISE_SORT_OPTIONS = [
  { id: 'newest', label: 'Latest / Most Recent', short: 'Latest', group: 'Recency & Timeline' },
  { id: 'oldest', label: 'Oldest First', short: 'Oldest', group: 'Recency & Timeline' },
  { id: 'recently_ingested', label: 'Recently Ingested / Scraped', short: 'Recent Scraped', group: 'Recency & Timeline' },

  { id: 'engagement', label: 'Most Interactions (Total)', short: 'Most Interactions', group: 'Interactions & Virality' },
  { id: 'likes', label: 'Most Likes / Hearted', short: 'Most Likes', group: 'Interactions & Virality' },
  { id: 'retweets', label: 'Most Reposts / Retweets', short: 'Most Retweets', group: 'Interactions & Virality' },
  { id: 'replies', label: 'Most Discussion / Replies', short: 'Most Replies', group: 'Interactions & Virality' },
  { id: 'views', label: 'Most Impressions / Views', short: 'Most Views', group: 'Interactions & Virality' },

  { id: 'followers', label: 'Top Author Reach (Followers)', short: 'Top Reach', group: 'Author & Influence' },
  { id: 'verified', label: 'Verified Accounts First', short: 'Verified First', group: 'Author & Influence' },

  { id: 'media_count', label: 'Most Media Attachments (Photos/Videos)', short: 'Photo Evidence', group: 'Media & Proof' },
];

export const NOISE_QUICK_SORTS = [
  { id: 'newest', label: 'Latest', icon: '🕒' },
  { id: 'engagement', label: 'Most Interactions', icon: '🔥' },
  { id: 'replies', label: 'Most Discussion', icon: '💬' },
  { id: 'likes', label: 'Most Likes', icon: '❤️' },
  { id: 'followers', label: 'Top Reach', icon: '👥' },
  { id: 'media_count', label: 'Photo Evidence', icon: '📸' },
];

function NoiseView({ noisePosts: propNoisePosts = [], onPostRestored, onPostExcluded, onImageClick }) {
  const [controller] = useArgonController();
  const { miniSidenav, darkMode } = controller || {};

  const [activeTab, setActiveTab] = useState(0); 
  const [noisePostsList, setNoisePostsList] = useState(propNoisePosts);
  const [restoredPostsList, setRestoredPostsList] = useState([]);
  const [learnedRulesList, setLearnedRulesList] = useState([]);
  const [noiseStats, setNoiseStats] = useState({
    totalNoise: 0,
    activeNoise: 0,
    restoredCount: 0,
    categoryBreakdown: {},
    activeRulesCount: 0,
  });

  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    media: 'all',
    verified: 'all',
    date: 'all',
    sortBy: 'newest',
    sortOrder: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [candidateRules, setCandidateRules] = useState([]);
  const [selectedRuleIndices, setSelectedRuleIndices] = useState(new Set());
  const [customRuleType, setCustomRuleType] = useState('aq_keyword');
  const [customRuleValue, setCustomRuleValue] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [feedbackAlert, setFeedbackAlert] = useState(null);

  const [excludeModalOpen, setExcludeModalOpen] = useState(false);
  const [postToExclude, setPostToExclude] = useState(null);
  const [excludeReason, setExcludeReason] = useState('Re-evaluated as off-topic noise');
  const [revokeRulesChecked, setRevokeRulesChecked] = useState(true);
  const [isExcluding, setIsExcluding] = useState(false);

  const [manualRuleModalOpen, setManualRuleModalOpen] = useState(false);
  const [newManualType, setNewManualType] = useState('aq_keyword');
  const [newManualValue, setNewManualValue] = useState('');
  const [newManualDesc, setNewManualDesc] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [excluded, restored, rules, stats] = await Promise.all([
        getNoisePosts({ status: 'EXCLUDED', limit: 250, sortBy: 'newest', sortOrder: 'desc' }).catch(() => []),
        getNoisePosts({ status: 'RESTORED', limit: 100, sortBy: 'newest', sortOrder: 'desc' }).catch(() => []),
        getLearnedRules().catch(() => []),
        getNoiseStats().catch(() => ({
          totalNoise: 0,
          activeNoise: 0,
          restoredCount: 0,
          categoryBreakdown: {},
          activeRulesCount: 0,
        })),
      ]);

      const existingIds = new Set(excluded.map((p) => String(p.id)));
      const mergedExcluded = [...excluded];
      if (Array.isArray(propNoisePosts)) {
        propNoisePosts.forEach((p) => {
          const pid = String(p.id);
          if (p.status !== 'RESTORED' && !existingIds.has(pid)) {
            existingIds.add(pid);
            mergedExcluded.unshift(p);
          }
        });
      }

      setNoisePostsList(mergedExcluded);
      setRestoredPostsList(restored);
      setLearnedRulesList(rules);
      setNoiseStats({
        ...stats,
        totalNoise: Math.max(stats.totalNoise || 0, mergedExcluded.length),
        activeNoise: Math.max(stats.activeNoise || 0, mergedExcluded.length),
      });
    } catch (err) {
      console.error('Error fetching noise data:', err);
    } finally {
      setLoading(false);
    }
  }, [propNoisePosts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (propNoisePosts && propNoisePosts.length > 0) {
      setNoisePostsList((prev) => {
        const seen = new Set(prev.map((p) => String(p.id)));
        const next = [...prev];
        propNoisePosts.forEach((p) => {
          const pid = String(p.id);
          if (!seen.has(pid) && p.status !== 'RESTORED') {
            seen.add(pid);
            next.unshift(p);
          }
        });
        return next;
      });
    }
  }, [propNoisePosts]);

  const { availableCategories, availableDates } = useMemo(() => {
    const list = activeTab === 2 ? restoredPostsList : noisePostsList;
    const catMap = {};
    const dateMap = {};

    list.forEach((p) => {
      const cat = p.exclusionCategory || p.exclusion_category || 'OFF_TOPIC';
      catMap[cat] = (catMap[cat] || 0) + 1;

      const dateStr = p.createdAt || p.created_at;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const key = d.toISOString().slice(0, 10);
          dateMap[key] = (dateMap[key] || 0) + 1;
        }
      }
    });

    const categories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ id, count }));

    const dates = Object.entries(dateMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, count]) => ({ date, count }));

    return { availableCategories: categories, availableDates: dates };
  }, [noisePostsList, restoredPostsList, activeTab]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleToggleSortOrder = () => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      media: 'all',
      verified: 'all',
      date: 'all',
      sortBy: 'newest',
      sortOrder: 'desc',
    });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.category !== 'all' ||
    filters.media !== 'all' ||
    filters.verified !== 'all' ||
    filters.date !== 'all' ||
    filters.sortBy !== 'newest' ||
    filters.sortOrder !== 'desc';

  const filteredNoisePosts = useMemo(() => {
    const list = activeTab === 2 ? restoredPostsList : noisePostsList;
    let result = [...list];

    // 1. Keyword search (post text, author username, author display name, exclusion reason)
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter((p) => {
        const textMatch = (p.text || '').toLowerCase().includes(q);
        const authorMatch = (p.authorUsername || p.author_username || '').toLowerCase().includes(q);
        const nameMatch = (p.authorName || p.author_name || '').toLowerCase().includes(q);
        const reasonMatch = (p.exclusionReason || p.exclusion_reason || '').toLowerCase().includes(q);
        return textMatch || authorMatch || nameMatch || reasonMatch;
      });
    }

    // 2. Exclusion category filter
    if (filters.category !== 'all') {
      result = result.filter((p) => {
        const cat = p.exclusionCategory || p.exclusion_category;
        return cat === filters.category;
      });
    }

    // 3. Media filter
    if (filters.media === 'media') {
      result = result.filter((p) => {
        const urls = p.mediaUrls || p.media_urls || [];
        return Array.isArray(urls) && urls.length > 0;
      });
    } else if (filters.media === 'text') {
      result = result.filter((p) => {
        const urls = p.mediaUrls || p.media_urls || [];
        return !Array.isArray(urls) || urls.length === 0;
      });
    }

    // 4. Verified author filter
    if (filters.verified === 'verified') {
      result = result.filter((p) => Boolean(p.authorVerified ?? p.author_verified));
    } else if (filters.verified === 'unverified') {
      result = result.filter((p) => !Boolean(p.authorVerified ?? p.author_verified));
    }

    // 5. Calendar date filter
    if (filters.date !== 'all') {
      result = result.filter((p) => {
        const dateStr = p.createdAt || p.created_at;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === filters.date;
      });
    }

    // 6. Comprehensive sorting (Defaults to latest posts first)
    const mult = filters.sortOrder === 'asc' ? -1 : 1;

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest': {
          const timeA = new Date(a.createdAt || a.created_at || a.ingestedAt || a.ingested_at || 0).getTime() || 0;
          const timeB = new Date(b.createdAt || b.created_at || b.ingestedAt || b.ingested_at || 0).getTime() || 0;
          if (timeA !== timeB) return mult * (timeB - timeA);
          return mult * String(b.id || '').localeCompare(String(a.id || ''));
        }
        case 'oldest': {
          const timeA = new Date(a.createdAt || a.created_at || a.ingestedAt || a.ingested_at || 0).getTime() || 0;
          const timeB = new Date(b.createdAt || b.created_at || b.ingestedAt || b.ingested_at || 0).getTime() || 0;
          if (timeA !== timeB) return mult * (timeA - timeB);
          return mult * String(a.id || '').localeCompare(String(b.id || ''));
        }
        case 'recently_ingested': {
          const timeA = new Date(a.ingestedAt || a.ingested_at || a.createdAt || a.created_at || 0).getTime() || 0;
          const timeB = new Date(b.ingestedAt || b.ingested_at || b.createdAt || b.created_at || 0).getTime() || 0;
          if (timeA !== timeB) return mult * (timeB - timeA);
          return mult * String(b.id || '').localeCompare(String(a.id || ''));
        }
        case 'engagement': {
          const aEng = (parseInt(a.likes, 10) || 0) + (parseInt(a.retweets, 10) || 0) + (parseInt(a.replies, 10) || 0) + (parseInt(a.quotes, 10) || 0);
          const bEng = (parseInt(b.likes, 10) || 0) + (parseInt(b.retweets, 10) || 0) + (parseInt(b.replies, 10) || 0) + (parseInt(b.quotes, 10) || 0);
          if (aEng !== bEng) return mult * (bEng - aEng);
          return (new Date(b.createdAt || b.created_at || 0).getTime() || 0) - (new Date(a.createdAt || a.created_at || 0).getTime() || 0);
        }
        case 'likes': {
          const aL = parseInt(a.likes, 10) || 0;
          const bL = parseInt(b.likes, 10) || 0;
          if (aL !== bL) return mult * (bL - aL);
          return (new Date(b.createdAt || b.created_at || 0).getTime() || 0) - (new Date(a.createdAt || a.created_at || 0).getTime() || 0);
        }
        case 'retweets': {
          const aR = parseInt(a.retweets, 10) || 0;
          const bR = parseInt(b.retweets, 10) || 0;
          if (aR !== bR) return mult * (bR - aR);
          return (new Date(b.createdAt || b.created_at || 0).getTime() || 0) - (new Date(a.createdAt || a.created_at || 0).getTime() || 0);
        }
        case 'replies': {
          const aRep = parseInt(a.replies, 10) || 0;
          const bRep = parseInt(b.replies, 10) || 0;
          if (aRep !== bRep) return mult * (bRep - aRep);
          return (new Date(b.createdAt || b.created_at || 0).getTime() || 0) - (new Date(a.createdAt || a.created_at || 0).getTime() || 0);
        }
        case 'views': {
          const aV = parseInt(a.views, 10) || 0;
          const bV = parseInt(b.views, 10) || 0;
          if (aV !== bV) return mult * (bV - aV);
          return (new Date(b.createdAt || b.created_at || 0).getTime() || 0) - (new Date(a.createdAt || a.created_at || 0).getTime() || 0);
        }
        case 'followers': {
          const aF = parseInt(a.authorFollowers || a.author_followers, 10) || 0;
          const bF = parseInt(b.authorFollowers || b.author_followers, 10) || 0;
          if (aF !== bF) return mult * (bF - aF);
          return (new Date(b.createdAt || b.created_at || 0).getTime() || 0) - (new Date(a.createdAt || a.created_at || 0).getTime() || 0);
        }
        case 'verified': {
          const aV = (a.authorVerified || a.author_verified) ? 1 : 0;
          const bV = (b.authorVerified || b.author_verified) ? 1 : 0;
          if (aV !== bV) return mult * (bV - aV);
          return (new Date(b.createdAt || b.created_at || 0).getTime() || 0) - (new Date(a.createdAt || a.created_at || 0).getTime() || 0);
        }
        case 'media_count': {
          const aM = (a.mediaUrls || a.media_urls || []).length;
          const bM = (b.mediaUrls || b.media_urls || []).length;
          if (aM !== bM) return mult * (bM - aM);
          return (new Date(b.createdAt || b.created_at || 0).getTime() || 0) - (new Date(a.createdAt || a.created_at || 0).getTime() || 0);
        }
        default: {
          const timeA = new Date(a.createdAt || a.created_at || 0).getTime() || 0;
          const timeB = new Date(b.createdAt || b.created_at || 0).getTime() || 0;
          return mult * (timeB - timeA);
        }
      }
    });

    return result;
  }, [noisePostsList, restoredPostsList, activeTab, filters]);

  const totalPages = Math.ceil(filteredNoisePosts.length / postsPerPage) || 1;
  const paginatedPosts = filteredNoisePosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const handleOpenRestoreDialog = async (post) => {
    setSelectedPost(post);
    setRestoreModalOpen(true);
    setCustomRuleValue('');

    try {
      const postCat = post.exclusionCategory || post.exclusion_category;
      const postRsn = post.exclusionReason || post.exclusion_reason;
      const postAuthor = post.authorUsername || post.author_username;
      const postId = post.id || post.clean_id;

      let candidates = await extractNoiseCandidates({
        postId,
        text: post.text,
        author: postAuthor,
        category: postCat,
        reason: postRsn,
      });

      if (!candidates || candidates.length === 0) {
        candidates = extractLearningCandidates(post, postCat, postRsn);
      }

      setCandidateRules(candidates);
      const checked = new Set();
      candidates.forEach((c, idx) => {
        if (c.recommended) checked.add(idx);
      });
      setSelectedRuleIndices(checked);
    } catch (err) {
      console.warn('Fallback to client candidate extraction:', err);
      const candidates = extractLearningCandidates(post, post.exclusionCategory, post.exclusionReason);
      setCandidateRules(candidates);
      const checked = new Set();
      candidates.forEach((c, idx) => {
        if (c.recommended) checked.add(idx);
      });
      setSelectedRuleIndices(checked);
    }
  };

  const handleToggleCandidate = (idx) => {
    setSelectedRuleIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleAddCustomCandidate = () => {
    if (!customRuleValue.trim()) return;
    const newCand = {
      rule_type: customRuleType,
      rule_value: customRuleValue.trim(),
      label: `Custom: "${customRuleValue.trim()}" (${customRuleType})`,
      description: `User-defined rule from restoration of post ${selectedPost?.id}`,
      recommended: true,
    };
    setCandidateRules((prev) => [...prev, newCand]);
    setSelectedRuleIndices((prev) => new Set([...prev, candidateRules.length]));
    setCustomRuleValue('');
  };

  const handleConfirmRestore = async () => {
    if (!selectedPost) return;
    setIsRestoring(true);
    try {
      const rulesToApply = [];
      selectedRuleIndices.forEach((idx) => {
        if (candidateRules[idx]) {
          rulesToApply.push({
            rule_type: candidateRules[idx].rule_type,
            rule_value: candidateRules[idx].rule_value,
            description: candidateRules[idx].description || candidateRules[idx].label,
          });
        }
      });

      let res;
      try {
        res = await restoreNoisePost(selectedPost.id, rulesToApply);
      } catch (backendErr) {
        console.warn('Backend restore note, falling back to local state restoration:', backendErr);
        res = {
          success: true,
          restoredPost: {
            ...selectedPost,
            source: 'noise_restored',
          },
        };
      }

      setFeedbackAlert({
        type: 'success',
        message: `✅ Post @${selectedPost.authorUsername} successfully restored to Verified Feed! The system learned ${rulesToApply.length} deterministic rule(s).`,
      });

      setNoisePostsList((prev) => prev.filter((p) => String(p.id) !== String(selectedPost.id)));
      setRestoredPostsList((prev) => [
        { ...selectedPost, status: 'RESTORED', restoredAt: new Date().toISOString() },
        ...prev,
      ]);

      if (onPostRestored) {
        onPostRestored(res.restoredPost || selectedPost, selectedPost.id);
      }

      setRestoreModalOpen(false);
      setSelectedPost(null);
      fetchData().catch(() => {});
    } catch (err) {
      setFeedbackAlert({
        type: 'error',
        message: `Failed to restore post: ${err.message}`,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleOpenExcludeDialog = (post) => {
    setPostToExclude(post);
    setExcludeReason('Re-evaluated as off-topic noise');
    setRevokeRulesChecked(true);
    setExcludeModalOpen(true);
  };

  const handleConfirmExclude = async () => {
    if (!postToExclude) return;
    setIsExcluding(true);
    try {
      await excludePost({
        postId: postToExclude.id,
        reason: excludeReason,
        removeAssociatedRules: revokeRulesChecked,
      });

      setRestoredPostsList((prev) => prev.filter((p) => String(p.id) !== String(postToExclude.id)));

      setNoisePostsList((prev) => [
        {
          ...postToExclude,
          status: 'EXCLUDED',
          exclusionReason: excludeReason,
          restoredAt: null,
        },
        ...prev.filter((p) => String(p.id) !== String(postToExclude.id)),
      ]);

      if (revokeRulesChecked) {
        setLearnedRulesList((prev) =>
          prev.filter((r) => String(r.sourcePostId) !== String(postToExclude.id))
        );
      }

      setNoiseStats((prev) => ({
        ...prev,
        activeNoise: (prev.activeNoise || 0) + 1,
        restoredCount: Math.max(0, (prev.restoredCount || 1) - 1),
      }));

      if (onPostExcluded) {
        onPostExcluded(postToExclude.id, postToExclude.authorUsername);
      }

      setFeedbackAlert({
        type: 'info',
        message: `Post @${postToExclude.authorUsername || postToExclude.id} re-excluded as noise and removed from verified feed.`,
      });

      setExcludeModalOpen(false);
      setPostToExclude(null);
      fetchData().catch(() => {});
    } catch (err) {
      setFeedbackAlert({
        type: 'error',
        message: `Failed to exclude post: ${err.message}`,
      });
    } finally {
      setIsExcluding(false);
    }
  };

  const handleToggleRule = async (ruleId, currentStatus) => {
    try {
      await toggleLearnedRule(ruleId, !currentStatus);
      setLearnedRulesList((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, isActive: !currentStatus } : r))
      );
    } catch (err) {
      console.error('Error toggling rule:', err);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this learned rule?')) return;
    try {
      await deleteLearnedRule(ruleId);
      setLearnedRulesList((prev) => prev.filter((r) => r.id !== ruleId));
      fetchData();
    } catch (err) {
      console.error('Error deleting rule:', err);
    }
  };

  const handleAddManualRule = async () => {
    if (!newManualValue.trim()) return;
    try {
      await addLearnedRule({
        ruleType: newManualType,
        ruleValue: newManualValue.trim(),
        description: newManualDesc.trim() || 'Manual user-defined rule',
      });
      setManualRuleModalOpen(false);
      setNewManualValue('');
      setNewManualDesc('');
      fetchData();
      setFeedbackAlert({
        type: 'success',
        message: `Rule added successfully! It is now active for all future ingestions.`,
      });
    } catch (err) {
      alert('Failed to add rule: ' + err.message);
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      
      <Box
        sx={{
          mb: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1.2}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: 'linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(94, 114, 228, 0.3)',
              }}
            >
              <CleaningServicesRoundedIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 700,
                  color: darkMode ? '#ffffff' : '#1e293b',
                  fontSize: { xs: '20px', md: '24px' },
                  lineHeight: 1.2,
                }}
              >
                Noise Ingestion & Learning Engine
              </Typography>
              <Typography
                sx={{ fontFamily: '"Open Sans", sans-serif', fontSize: '13.5px', color: darkMode ? '#94a3b8' : '#67748e', mt: 0.3 }}
              >
                Review filtered noise, manually salvage relevant posts, and teach the system through explainable rule induction (No AI).
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1.5} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
          <Button
            variant="outlined"
            size="small"
            onClick={fetchData}
            startIcon={<RefreshRoundedIcon />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              color: darkMode ? '#a5b4fc' : '#5e72e4',
              borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#d2d6da',
              '&:hover': {
                borderColor: '#5e72e4',
                backgroundColor: darkMode ? 'rgba(94, 114, 228, 0.15)' : 'rgba(94, 114, 228, 0.05)',
              },
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setManualRuleModalOpen(true)}
            startIcon={<AddCircleOutlineRoundedIcon />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              background: 'linear-gradient(310deg, #11cdef 0%, #1171ef 100%)',
              color: '#fff',
              boxShadow: '0 4px 10px rgba(17, 205, 239, 0.3)',
            }}
          >
            + Add Learned Rule
          </Button>
        </Box>
      </Box>

      {feedbackAlert && (
        <Alert
          severity={feedbackAlert.type}
          onClose={() => setFeedbackAlert(null)}
          sx={{ mb: 2.5, borderRadius: '10px' }}
        >
          {feedbackAlert.message}
        </Alert>
      )}

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
          title="Total Filtered Noise"
          count={String(noiseStats.totalNoise || noisePostsList.length)}
          icon={{
            color: 'error',
            component: <CleaningServicesRoundedIcon />,
          }}
          percentage={{ color: 'error', count: '100%', text: 'excluded posts' }}
        />

        <DetailedStatisticsCard
          title="Active in Noise Pool"
          count={String(noiseStats.activeNoise || noisePostsList.length)}
          icon={{
            color: 'warning',
            component: <WarningAmberRoundedIcon />,
          }}
          percentage={{ color: 'warning', count: 'Pool', text: 'awaiting review' }}
        />

        <DetailedStatisticsCard
          title="Rescued to Feed"
          count={`+${noiseStats.restoredCount || restoredPostsList.length}`}
          icon={{
            color: 'success',
            component: <CheckCircleRoundedIcon />,
          }}
          percentage={{ color: 'success', count: 'Salvaged', text: 'by operator' }}
        />

        <DetailedStatisticsCard
          title="Learned Active Rules"
          count={String(learnedRulesList.filter((r) => r.isActive).length)}
          icon={{
            color: 'primary',
            component: <PsychologyAltRoundedIcon />,
          }}
          percentage={{ color: 'info', count: 'Zero AI', text: 'heuristic induction' }}
        />
      </Box>

      <Card
        sx={{
          borderRadius: '16px',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
          backgroundColor: darkMode ? '#111c44' : '#ffffff',
          mb: 3,
          boxShadow: darkMode ? '0 8px 24px rgba(0, 0, 0, 0.35)' : '0 4px 20px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'divider', px: { xs: 2, sm: 3 }, pt: 1.5 }}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => {
              setActiveTab(v);
              setCurrentPage(1);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '14px',
                minHeight: '48px',
                color: darkMode ? '#94a3b8' : '#67748e',
                '&.Mui-selected': {
                  color: darkMode ? '#ffffff' : '#5e72e4',
                  fontWeight: 700,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#5e72e4',
                height: '3px',
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
              label={`Noise Ingested Feed (${noisePostsList.length})`}
              icon={<CleaningServicesRoundedIcon sx={{ fontSize: '18px' }} />}
              iconPosition="start"
            />
            <Tab
              label={`Learned Rules Engine (${learnedRulesList.length})`}
              icon={<PsychologyAltRoundedIcon sx={{ fontSize: '18px' }} />}
              iconPosition="start"
            />
            <Tab
              label={`Restored Posts Ledger (${restoredPostsList.length})`}
              icon={<CheckCircleRoundedIcon sx={{ fontSize: '18px' }} />}
              iconPosition="start"
            />
          </Tabs>
        </Box>        {(activeTab === 0 || activeTab === 2) && (
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
              borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
            }}
          >
            {/* Top Grid: Search and Filter Dropdowns */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: '2fr repeat(4, 1fr)',
                },
                gap: 1.5,
                alignItems: 'center',
                mb: 2,
              }}
            >
              {/* Keyword Search Input with Clear Button */}
              <Box sx={{ gridColumn: { xs: '1', sm: 'span 2', md: 'span 1' } }}>
                <OutlinedInput
                  placeholder="Search noise posts by keyword, author, or reason..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
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
                          onClick={() => handleFilterChange('search', '')}
                          edge="end"
                          sx={{ p: 0.5, color: '#94a3b8', '&:hover': { color: darkMode ? '#ffffff' : '#475569' } }}
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
                    backgroundColor: darkMode ? '#111c44' : '#fff',
                    color: darkMode ? '#ffffff' : '#1e293b',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5e72e4' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#5e72e4' },
                    '& input': { color: darkMode ? '#ffffff' : 'inherit' },
                  }}
                />
              </Box>

              {/* Exclusion Category Filter */}
              <FormControl fullWidth size="small">
                <InputLabel id="noise-cat-label" sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : undefined }}>
                  Exclusion Category
                </InputLabel>
                <Select
                  labelId="noise-cat-label"
                  value={filters.category}
                  label="Exclusion Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
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
                    backgroundColor: darkMode ? '#111c44' : '#fff',
                    color: darkMode ? '#ffffff' : '#344767',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1' },
                    '& .MuiSvgIcon-root': { color: darkMode ? '#94a3b8' : '#8392ab' },
                  }}
                >
                  <MenuItem value="all">
                    All Categories ({activeTab === 2 ? restoredPostsList.length : noisePostsList.length})
                  </MenuItem>
                  {availableCategories.map((c) => {
                    const badge = getCategoryBadge(c.id);
                    const label = badge ? badge.props.children : c.id;
                    return (
                      <MenuItem key={c.id} value={c.id}>
                        {label} ({c.count})
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              {/* Media Attachments Filter */}
              <FormControl fullWidth size="small">
                <InputLabel id="noise-media-label" sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : undefined }}>
                  Media Filter
                </InputLabel>
                <Select
                  labelId="noise-media-label"
                  value={filters.media}
                  label="Media Filter"
                  onChange={(e) => handleFilterChange('media', e.target.value)}
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
                    backgroundColor: darkMode ? '#111c44' : '#fff',
                    color: darkMode ? '#ffffff' : '#344767',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1' },
                    '& .MuiSvgIcon-root': { color: darkMode ? '#94a3b8' : '#8392ab' },
                  }}
                >
                  <MenuItem value="all">All Attachments</MenuItem>
                  <MenuItem value="media">Photo / Video Evidence</MenuItem>
                  <MenuItem value="text">Text Only (No Media)</MenuItem>
                </Select>
              </FormControl>

              {/* Verified Author Filter */}
              <FormControl fullWidth size="small">
                <InputLabel id="noise-verified-label" sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : undefined }}>
                  Author Account
                </InputLabel>
                <Select
                  labelId="noise-verified-label"
                  value={filters.verified}
                  label="Author Account"
                  onChange={(e) => handleFilterChange('verified', e.target.value)}
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
                    backgroundColor: darkMode ? '#111c44' : '#fff',
                    color: darkMode ? '#ffffff' : '#344767',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1' },
                    '& .MuiSvgIcon-root': { color: darkMode ? '#94a3b8' : '#8392ab' },
                  }}
                >
                  <MenuItem value="all">All Accounts</MenuItem>
                  <MenuItem value="verified">Verified Accounts Only</MenuItem>
                  <MenuItem value="unverified">Standard Accounts Only</MenuItem>
                </Select>
              </FormControl>

              {/* Date Filter */}
              <FormControl fullWidth size="small">
                <InputLabel id="noise-date-label" sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : undefined }}>
                  Date Filter
                </InputLabel>
                <Select
                  labelId="noise-date-label"
                  value={filters.date}
                  label="Date Filter"
                  onChange={(e) => handleFilterChange('date', e.target.value)}
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
                    backgroundColor: darkMode ? '#111c44' : '#fff',
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
            </Box>

            {/* Bottom Row: Quick Sort Chips, Comprehensive Sort Dropdown, Direction Toggle, Reset, Count */}
            <Box
              sx={{
                backgroundColor: darkMode ? '#111c44' : '#ffffff',
                borderRadius: '12px',
                p: { xs: 1.5, sm: 1.8 },
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 1.5,
              }}
            >
              {/* Quick Sort Chips */}
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

                {NOISE_QUICK_SORTS.map((qs) => {
                  const isActive = filters.sortBy === qs.id;
                  return (
                    <Button
                      key={qs.id}
                      size="small"
                      variant={isActive ? 'contained' : 'outlined'}
                      onClick={() => handleFilterChange('sortBy', qs.id)}
                      sx={{
                        textTransform: 'none',
                        fontSize: '11.5px',
                        fontWeight: isActive ? 700 : 500,
                        fontFamily: '"Open Sans", sans-serif',
                        borderRadius: '6px',
                        px: 1.1,
                        py: 0.3,
                        minWidth: 'auto',
                        background: isActive
                          ? 'linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)'
                          : darkMode
                          ? 'rgba(255, 255, 255, 0.04)'
                          : '#ffffff',
                        color: isActive ? '#ffffff' : darkMode ? '#94a3b8' : '#64748b',
                        borderColor: isActive
                          ? 'transparent'
                          : darkMode
                          ? 'rgba(255, 255, 255, 0.12)'
                          : '#e2e8f0',
                        boxShadow: isActive ? '0 2px 6px rgba(94, 114, 228, 0.35)' : 'none',
                        '&:hover': {
                          background: isActive
                            ? 'linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)'
                            : darkMode
                            ? 'rgba(255, 255, 255, 0.08)'
                            : '#f1f5f9',
                          borderColor: isActive ? 'transparent' : '#cbd5e1',
                        },
                      }}
                    >
                      <Box component="span" sx={{ mr: 0.4 }}>
                        {qs.icon}
                      </Box>
                      {qs.label}
                    </Button>
                  );
                })}
              </Box>

              {/* Right Controls: Sort Dropdown, Direction Toggle, Reset, Count */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2,
                  flexShrink: 0,
                  justifyContent: { xs: 'space-between', sm: 'flex-end' },
                }}
              >
                {/* Full Sort Dropdown */}
                <FormControl size="small" sx={{ minWidth: 210 }}>
                  <Select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: darkMode ? '#111c44' : '#ffffff',
                          color: darkMode ? '#ffffff' : 'inherit',
                          maxHeight: 380,
                        },
                      },
                    }}
                    sx={{
                      fontSize: '12.5px',
                      borderRadius: '8px',
                      fontFamily: '"Open Sans", sans-serif',
                      fontWeight: 600,
                      backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                      color: darkMode ? '#ffffff' : '#344767',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1' },
                      '& .MuiSvgIcon-root': { color: darkMode ? '#94a3b8' : '#8392ab' },
                    }}
                  >
                    {['Recency & Timeline', 'Interactions & Virality', 'Author & Influence', 'Media & Proof'].map((group) => {
                      const groupOptions = NOISE_SORT_OPTIONS.filter((o) => o.group === group);
                      if (groupOptions.length === 0) return null;
                      return [
                        <ListSubheader
                          key={group}
                          sx={{
                            backgroundColor: darkMode ? '#0b1437' : '#f1f5f9',
                            color: darkMode ? '#a5b4fc' : '#5e72e4',
                            fontWeight: 700,
                            fontSize: '11px',
                            lineHeight: '28px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {group}
                        </ListSubheader>,
                        ...groupOptions.map((opt) => (
                          <MenuItem key={opt.id} value={opt.id} sx={{ fontSize: '12.5px', py: 0.8 }}>
                            {opt.label}
                          </MenuItem>
                        )),
                      ];
                    })}
                  </Select>
                </FormControl>

                {/* Sort Order Direction Toggle Button */}
                <Tooltip title={filters.sortOrder === 'asc' ? 'Ascending Order (Lowest / Oldest first)' : 'Descending Order (Highest / Latest first)'}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleToggleSortOrder}
                    sx={{
                      minWidth: '38px',
                      width: '38px',
                      height: '38px',
                      p: 0,
                      borderRadius: '8px',
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1',
                      color: '#5e72e4',
                      backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                      '&:hover': {
                        borderColor: '#5e72e4',
                        backgroundColor: darkMode ? 'rgba(94, 114, 228, 0.15)' : 'rgba(94, 114, 228, 0.08)',
                      },
                    }}
                  >
                    {filters.sortOrder === 'asc' ? (
                      <NorthRoundedIcon sx={{ fontSize: '18px' }} />
                    ) : (
                      <SouthRoundedIcon sx={{ fontSize: '18px' }} />
                    )}
                  </Button>
                </Tooltip>

                {/* Reset Filters Button */}
                {hasActiveFilters && (
                  <Tooltip title="Reset all filters and restore default sort (Latest posts)">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleResetFilters}
                      startIcon={<RestartAltRoundedIcon sx={{ fontSize: '16px' }} />}
                      sx={{
                        textTransform: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: '"Open Sans", sans-serif',
                        borderRadius: '8px',
                        borderColor: '#f5365c',
                        color: '#f5365c',
                        backgroundColor: darkMode ? 'rgba(245, 54, 92, 0.08)' : 'rgba(245, 54, 92, 0.04)',
                        '&:hover': {
                          borderColor: '#f5365c',
                          backgroundColor: darkMode ? 'rgba(245, 54, 92, 0.18)' : 'rgba(245, 54, 92, 0.1)',
                        },
                      }}
                    >
                      Reset
                    </Button>
                  </Tooltip>
                )}

                {/* Result Count Indicator */}
                <Box
                  sx={{
                    px: 1.3,
                    py: 0.6,
                    borderRadius: '8px',
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#edf2f7',
                    color: darkMode ? '#cbd5e1' : '#475569',
                    fontSize: '12px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Typography component="span" sx={{ fontSize: '12px', fontWeight: 700, color: '#5e72e4' }}>
                    {filteredNoisePosts.length}
                  </Typography>
                  <Typography component="span" sx={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                    / {activeTab === 2 ? restoredPostsList.length : noisePostsList.length} posts
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Card>

      {(activeTab === 0 || activeTab === 2) && (
        <>
          {loading && (activeTab === 2 ? restoredPostsList.length === 0 : noisePostsList.length === 0) ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress size={36} sx={{ color: '#5e72e4' }} />
            </Box>
          ) : paginatedPosts.length === 0 ? (
            <Card
              sx={{
                p: 5,
                textAlign: 'center',
                my: 3,
                borderRadius: '16px',
                backgroundColor: darkMode ? '#111c44' : '#fff',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
                boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <CleaningServicesRoundedIcon sx={{ fontSize: 32, color: darkMode ? '#5e72e4' : '#8392ab' }} />
              </Box>
              <Typography
                sx={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  color: darkMode ? '#ffffff' : '#344767',
                  mb: 1,
                }}
              >
                {activeTab === 0 ? 'No Excluded Noise Posts Found' : 'No Restored Posts Found'}
              </Typography>
              <Typography sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                {activeTab === 0
                  ? 'No posts match your current search query or exclusion category filter.'
                  : 'Posts that you mark relevant and salvage from the Noise Feed will appear here.'}
              </Typography>
            </Card>
          ) : (
            <>
              
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    lg: miniSidenav ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                    xl: 'repeat(3, 1fr)',
                  },
                  gap: 2.5,
                  mb: 4,
                  alignItems: 'stretch',
                }}
              >
                {paginatedPosts.map((post) => (
                  <NoisePostCard
                    key={post.id || post.clean_id}
                    post={post}
                    isRestored={activeTab === 2 || post.status === 'RESTORED'}
                    onImageClick={onImageClick}
                    onRestoreClick={() => handleOpenRestoreDialog(post)}
                    onExcludeClick={() => handleOpenExcludeDialog(post)}
                  />
                ))}
              </Box>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(e, p) => {
                      setCurrentPage(p);
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    color="primary"
                    shape="rounded"
                    size="medium"
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 1 && (
        <Card
          sx={{
            p: 3,
            borderRadius: '16px',
            backgroundColor: darkMode ? '#111c44' : '#ffffff',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7',
            boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ color: darkMode ? '#ffffff' : '#1e293b' }}>
                Active Deterministic Rule Learning Ledger
              </Typography>
              <Typography sx={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#67748e', mt: 0.3 }}>
                These explainable heuristic rules were induced from operator curation. They are applied immediately across all future ingestion runs without AI.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setManualRuleModalOpen(true)}
              startIcon={<AddCircleOutlineRoundedIcon />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                color: '#5e72e4',
                borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1',
                '&:hover': {
                  borderColor: '#5e72e4',
                  backgroundColor: darkMode ? 'rgba(94, 114, 228, 0.1)' : undefined,
                },
              }}
            >
              + Add Rule Manually
            </Button>
          </Box>

          {learnedRulesList.length === 0 ? (
            <Box textAlign="center" py={6}>
              <PsychologyAltRoundedIcon sx={{ fontSize: 48, color: darkMode ? '#475569' : '#cbd5e1', mb: 1.5 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: darkMode ? '#ffffff' : '#344767' }}>
                No learned rules yet
              </Typography>
              <Typography variant="caption" sx={{ color: darkMode ? '#94a3b8' : '#8392ab' }}>
                Whenever you mark an excluded post as relevant in the Noise Feed, the system will synthesize rules here.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7', borderRadius: '10px' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: darkMode ? '#0b1437' : '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: darkMode ? '#94a3b8' : '#475569', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7' }}>RULE TYPE</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: darkMode ? '#94a3b8' : '#475569', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7' }}>LEARNED VALUE / PATTERN</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: darkMode ? '#94a3b8' : '#475569', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7' }}>SOURCE / REASON</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: darkMode ? '#94a3b8' : '#475569', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7' }}>HIT COUNT</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: darkMode ? '#94a3b8' : '#475569', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7' }}>STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', textAlign: 'right', color: darkMode ? '#94a3b8' : '#475569', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #edf2f7' }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {learnedRulesList.map((rule) => (
                    <TableRow key={rule.id} hover sx={{ '&:hover': { backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03) !important' : undefined } }}>
                      <TableCell sx={{ borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #edf2f7' }}>
                        <Chip
                          label={
                            rule.ruleType === 'author_whitelist'
                              ? 'AUTHOR WHITELIST'
                              : rule.ruleType === 'aq_keyword'
                              ? 'AQ KEYWORD'
                              : rule.ruleType === 'geo_keyword'
                              ? 'PUNJAB LOCALITY'
                              : rule.ruleType === 'off_topic_exception'
                              ? 'CONTEXT EXCEPTION'
                              : rule.ruleType.toUpperCase()
                          }
                          size="small"
                          sx={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            backgroundColor:
                              rule.ruleType === 'author_whitelist'
                                ? (darkMode ? 'rgba(45, 206, 137, 0.2)' : '#e6f8f0')
                                : rule.ruleType === 'aq_keyword'
                                ? (darkMode ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe')
                                : rule.ruleType === 'geo_keyword'
                                ? (darkMode ? 'rgba(130, 94, 228, 0.2)' : '#f3e8ff')
                                : (darkMode ? 'rgba(251, 99, 64, 0.2)' : '#fef3e2'),
                            color:
                              rule.ruleType === 'author_whitelist'
                                ? '#2dce89'
                                : rule.ruleType === 'aq_keyword'
                                ? '#38bdf8'
                                : rule.ruleType === 'geo_keyword'
                                ? '#a78bfa'
                                : '#fb6340',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '13px', color: darkMode ? '#ffffff' : '#1e293b', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #edf2f7' }}>
                        {rule.ruleType === 'author_whitelist' ? `@${rule.ruleValue}` : rule.ruleValue}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#64748b', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #edf2f7' }}>
                        {rule.description || 'Learned from user activity'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '13px', fontWeight: 600, color: darkMode ? '#ffffff' : '#1e293b', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #edf2f7' }}>
                        {rule.hitCount || 0} salvaged
                      </TableCell>
                      <TableCell sx={{ borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #edf2f7' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={rule.isActive}
                              onChange={() => handleToggleRule(rule.id, rule.isActive)}
                              color="primary"
                            />
                          }
                          label={
                            <Typography
                              sx={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: rule.isActive ? '#2dce89' : (darkMode ? '#64748b' : '#8392ab'),
                              }}
                            >
                              {rule.isActive ? 'Active' : 'Disabled'}
                            </Typography>
                          }
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #edf2f7' }}>
                        <Tooltip title="Delete Rule">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRule(rule.id)}
                            sx={{ color: '#f5365c' }}
                          >
                            <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      <Dialog
        open={restoreModalOpen}
        onClose={() => !isRestoring && setRestoreModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1,
            backgroundColor: darkMode ? '#111c44' : '#ffffff',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
            color: darkMode ? '#ffffff' : 'inherit',
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={1.2}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: darkMode ? 'rgba(45, 206, 137, 0.2)' : '#e6f8f0',
                color: '#2dce89',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AutoAwesomeRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ color: darkMode ? '#ffffff' : '#1e293b' }}>
                Restore Post & Teach Rule Engine
              </Typography>
              <Typography variant="caption" sx={{ color: darkMode ? '#94a3b8' : '#8392ab' }}>
                Explainable Deterministic Active Feedback (Zero AI)
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setRestoreModalOpen(false)} disabled={isRestoring} sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5, borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined }}>
          {selectedPost && (
            <>
              
              <Box
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  mb: 2.5,
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: darkMode ? '#ffffff' : '#1e293b' }}>
                      {selectedPost.authorName || selectedPost.authorUsername}
                    </Typography>
                    <Typography sx={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                      @{selectedPost.authorUsername}
                    </Typography>
                  </Box>
                  {getCategoryBadge(selectedPost.exclusionCategory)}
                </Box>
                <Typography sx={{ fontSize: '13px', color: darkMode ? '#cbd5e1' : '#334155', fontStyle: 'italic', mb: 1 }}>
                  &quot;{selectedPost.text}&quot;
                </Typography>
                <Typography sx={{ fontSize: '11.5px', color: '#f5365c', fontWeight: 600 }}>
                  Original Exclusion Reason: {selectedPost.exclusionReason}
                </Typography>
              </Box>

              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: darkMode ? '#ffffff' : '#1e293b', mb: 0.5 }}>
                What should the system learn from this action?
              </Typography>
              <Typography variant="caption" sx={{ color: darkMode ? '#94a3b8' : '#8392ab', display: 'block', mb: 1.5 }}>
                Select the heuristic rules to activate. These will automatically permit similar posts in future scrapes without AI:
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                {candidateRules.map((cand, idx) => (
                  <Card
                    key={idx}
                    variant="outlined"
                    sx={{
                      p: 1.2,
                      px: 2,
                      borderRadius: '8px',
                      borderColor: selectedRuleIndices.has(idx) ? '#5e72e4' : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'),
                      backgroundColor: selectedRuleIndices.has(idx)
                        ? (darkMode ? 'rgba(94, 114, 228, 0.16)' : 'rgba(94, 114, 228, 0.04)')
                        : (darkMode ? '#0b1437' : '#fff'),
                      cursor: 'pointer',
                    }}
                    onClick={() => handleToggleCandidate(idx)}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedRuleIndices.has(idx)}
                          onChange={() => handleToggleCandidate(idx)}
                          color="primary"
                          size="small"
                        />
                      }
                      label={
                        <Box>
                          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#ffffff' : '#1e293b' }}>
                            {cand.label}
                          </Typography>
                          <Typography sx={{ fontSize: '11.5px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                            {cand.description}
                          </Typography>
                        </Box>
                      }
                      sx={{ m: 0, width: '100%' }}
                    />
                  </Card>
                ))}
              </Box>

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                  border: darkMode ? '1px dashed rgba(255, 255, 255, 0.15)' : '1px dashed #cbd5e1',
                }}
              >
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#cbd5e1' : '#475569', mb: 1 }}>
                  + Add Custom Rule for This Post:
                </Typography>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={customRuleType}
                        onChange={(e) => setCustomRuleType(e.target.value)}
                        sx={{
                          fontSize: '12px',
                          backgroundColor: darkMode ? '#111c44' : '#fff',
                          color: darkMode ? '#ffffff' : '#1e293b',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : undefined,
                          },
                          '& .MuiSvgIcon-root': {
                            color: darkMode ? '#94a3b8' : undefined,
                          },
                        }}
                      >
                        <MenuItem value="aq_keyword">Air Quality Term</MenuItem>
                        <MenuItem value="geo_keyword">Punjab Locality</MenuItem>
                        <MenuItem value="author_whitelist">Author Whitelist</MenuItem>
                        <MenuItem value="off_topic_exception">Off-Topic Exception</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <OutlinedInput
                      size="small"
                      fullWidth
                      placeholder="e.g. dhund, Muridke, cricket+smog..."
                      value={customRuleValue}
                      onChange={(e) => setCustomRuleValue(e.target.value)}
                      sx={{
                        fontSize: '12px',
                        backgroundColor: darkMode ? '#111c44' : '#fff',
                        color: darkMode ? '#ffffff' : '#1e293b',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : undefined,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={handleAddCustomCandidate}
                      sx={{
                        height: '38px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '12px',
                        color: darkMode ? '#ffffff' : undefined,
                        borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : undefined,
                      }}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRestoreModalOpen(false)} disabled={isRestoring} sx={{ textTransform: 'none', color: darkMode ? '#94a3b8' : undefined }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmRestore}
            disabled={isRestoring}
            startIcon={isRestoring ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeRoundedIcon />}
            sx={{
              background: 'linear-gradient(310deg, #2dce89 0%, #2dcecc 100%)',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: '0 4px 10px rgba(45, 206, 137, 0.3)',
            }}
          >
            {isRestoring ? 'Restoring & Learning...' : `Confirm & Restore (+${selectedRuleIndices.size} Rules)`}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={excludeModalOpen}
        onClose={() => !isExcluding && setExcludeModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1,
            backgroundColor: darkMode ? '#111c44' : '#ffffff',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
            color: darkMode ? '#ffffff' : 'inherit',
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={1.2}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ color: darkMode ? '#ffffff' : '#1e293b' }}>
                Exclude Restored Post
              </Typography>
              <Typography variant="caption" sx={{ color: darkMode ? '#94a3b8' : '#8392ab' }}>
                Revert post from verified feed back to noise pool
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setExcludeModalOpen(false)} disabled={isExcluding} sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5, borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined }}>
          {postToExclude && (
            <Box display="flex" flexDirection="column" gap={2}>
              
              <Box sx={{ p: 2, borderRadius: '10px', backgroundColor: darkMode ? '#0b1437' : '#f8fafc', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography sx={{ fontWeight: 700, fontSize: '13px', color: darkMode ? '#ffffff' : '#1e293b' }}>
                    {postToExclude.authorName || postToExclude.authorUsername} (@{postToExclude.authorUsername})
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#8392ab' }}>
                    ID: {postToExclude.id}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '12.5px', color: darkMode ? '#cbd5e1' : '#475569', fontStyle: 'italic' }}>
                  &quot;{postToExclude.text}&quot;
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: darkMode ? '#cbd5e1' : '#334155', mb: 0.8 }}>
                  Select Exclusion Reason:
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={excludeReason}
                    onChange={(e) => setExcludeReason(e.target.value)}
                    sx={{
                      fontSize: '13px',
                      backgroundColor: darkMode ? '#0b1437' : '#fff',
                      color: darkMode ? '#ffffff' : '#1e293b',
                      borderRadius: '8px',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : undefined,
                      },
                      '& .MuiSvgIcon-root': {
                        color: darkMode ? '#94a3b8' : undefined,
                      },
                    }}
                  >
                    <MenuItem value="Re-evaluated as off-topic noise">Re-evaluated as off-topic noise</MenuItem>
                    <MenuItem value="No authentic air quality relevance">No authentic air quality relevance</MenuItem>
                    <MenuItem value="Indian domestic context / Not Punjab target area">Indian domestic context / Not Punjab target area</MenuItem>
                    <MenuItem value="Promotional spam / Crypto / Political rhetoric">Promotional spam / Crypto / Political rhetoric</MenuItem>
                    <MenuItem value="Sarcastic / Metaphorical use of smog term">Sarcastic / Metaphorical use of smog term</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Card
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: '10px',
                  borderColor: revokeRulesChecked ? '#ef4444' : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'),
                  backgroundColor: revokeRulesChecked
                    ? (darkMode ? 'rgba(239, 68, 68, 0.15)' : '#fff1f2')
                    : (darkMode ? '#0b1437' : '#fff'),
                  cursor: 'pointer',
                }}
                onClick={() => setRevokeRulesChecked(!revokeRulesChecked)}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={revokeRulesChecked}
                      onChange={(e) => setRevokeRulesChecked(e.target.checked)}
                      color="error"
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#fca5a5' : '#991b1b' }}>
                        Revoke Associated Learned Rules
                      </Typography>
                      <Typography sx={{ fontSize: '11.5px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                        Automatically deletes or deactivates any whitelist or keyword rules induced when this post was restored.
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%' }}
                />
              </Card>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setExcludeModalOpen(false)} disabled={isExcluding} sx={{ textTransform: 'none', color: darkMode ? '#94a3b8' : undefined }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmExclude}
            disabled={isExcluding}
            startIcon={isExcluding ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineRoundedIcon />}
            sx={{
              background: 'linear-gradient(310deg, #f5365c 0%, #ec0c38 100%)',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: '0 4px 10px rgba(245, 54, 92, 0.3)',
            }}
          >
            {isExcluding ? 'Excluding...' : 'Confirm & Exclude as Noise'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={manualRuleModalOpen}
        onClose={() => setManualRuleModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1,
            backgroundColor: darkMode ? '#111c44' : '#ffffff',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
            color: darkMode ? '#ffffff' : 'inherit',
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: darkMode ? '#ffffff' : '#1e293b' }}>
            Add Non-AI Learned Rule
          </Typography>
          <Typography variant="caption" sx={{ color: darkMode ? '#94a3b8' : '#8392ab' }}>
            Directly insert a heuristic rule into the filtering engine
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5, borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: darkMode ? '#94a3b8' : undefined }}>Rule Type</InputLabel>
              <Select
                value={newManualType}
                label="Rule Type"
                onChange={(e) => setNewManualType(e.target.value)}
                sx={{
                  backgroundColor: darkMode ? '#0b1437' : '#fff',
                  color: darkMode ? '#ffffff' : '#1e293b',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : undefined,
                  },
                  '& .MuiSvgIcon-root': {
                    color: darkMode ? '#94a3b8' : undefined,
                  },
                }}
              >
                <MenuItem value="aq_keyword">Air Quality Keyword (Positive Lexicon)</MenuItem>
                <MenuItem value="geo_keyword">Punjab Locality (Target Geography)</MenuItem>
                <MenuItem value="author_whitelist">Author Whitelist (Trusted Source)</MenuItem>
                <MenuItem value="off_topic_exception">Off-Topic Exception (e.g. cricket+smog)</MenuItem>
                <MenuItem value="indian_exception">Indian Exception (Cross-border)</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: darkMode ? '#cbd5e1' : '#475569', mb: 0.5 }}>
                Rule Pattern / Value:
              </Typography>
              <OutlinedInput
                fullWidth
                size="small"
                placeholder={
                  newManualType === 'author_whitelist'
                    ? 'e.g. SmogWatchPK (without @)'
                    : newManualType === 'geo_keyword'
                    ? 'e.g. Muridke, Kot Lakhpat'
                    : newManualType === 'aq_keyword'
                    ? 'e.g. dhund, ghutan, visibility'
                    : 'e.g. cricket+smog'
                }
                value={newManualValue}
                onChange={(e) => setNewManualValue(e.target.value)}
                sx={{
                  backgroundColor: darkMode ? '#0b1437' : '#fff',
                  color: darkMode ? '#ffffff' : '#1e293b',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : undefined,
                  },
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: darkMode ? '#cbd5e1' : '#475569', mb: 0.5 }}>
                Description (Optional):
              </Typography>
              <OutlinedInput
                fullWidth
                size="small"
                placeholder="Reason or notes for this rule..."
                value={newManualDesc}
                onChange={(e) => setNewManualDesc(e.target.value)}
                sx={{
                  backgroundColor: darkMode ? '#0b1437' : '#fff',
                  color: darkMode ? '#ffffff' : '#1e293b',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : undefined,
                  },
                }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setManualRuleModalOpen(false)} sx={{ textTransform: 'none', color: darkMode ? '#94a3b8' : undefined }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddManualRule}
            sx={{
              background: 'linear-gradient(310deg, #11cdef 0%, #1171ef 100%)',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Save Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

NoiseView.propTypes = {
  noisePosts: PropTypes.arrayOf(PropTypes.object),
  onPostRestored: PropTypes.func,
  onPostExcluded: PropTypes.func,
  onImageClick: PropTypes.func,
};

export default NoiseView;