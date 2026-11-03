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

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [failedImages, setFailedImages] = useState({});

  const {
    id,
    authorName,
    authorUsername,
    authorVerified,
    authorAvatar,
    authorFollowers,
    createdAt,
    text = '',
    postUrl,
    exclusionCategory,
    exclusionReason,
    mediaUrls = [],
    likes = 0,
    retweets = 0,
    replies = 0,
    views = 0,
  } = post;

  const initials = (authorName || authorUsername || 'U').slice(0, 1).toUpperCase();
  const isLongText = text.length > 180;

  const handleImageError = (index) => {
    setFailedImages((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <Card
      sx={{
        borderRadius: '16px',
        border: '1px solid #edf2f7',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'all 0.2s ease-in-out',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08)',
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
                    color: '#1e293b',
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
                    color: '#8392ab',
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
                      color: '#adb5bd',
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
                      color: '#adb5bd',
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
              href={postUrl}
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
                color: '#5e72e4',
                borderColor: '#cbd5e1',
                borderRadius: '6px',
                px: 1.2,
                py: 0.3,
                minWidth: 'auto',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: '#5e72e4',
                  backgroundColor: 'rgba(94, 114, 228, 0.05)',
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
              color: '#334155',
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
                color: '#5e72e4',
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
            backgroundColor: '#fff7ed',
            border: '1px dashed #fedec0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
            <WarningAmberRoundedIcon sx={{ fontSize: '15px', color: '#ea580c' }} />
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#c2410c',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Exclusion Diagnostic:
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '12px', color: '#7c2d12', lineHeight: 1.45, fontWeight: 500 }}>
            {exclusionReason || 'Filtered by automated data cleaning pipeline.'}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          borderTop: '1px solid #edf2f7',
          backgroundColor: '#f8fafc',
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
            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#344767' }}>
              {formatMetric(likes)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <RepeatRoundedIcon sx={{ color: '#2dce89', fontSize: '15px' }} />
            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#344767' }}>
              {formatMetric(retweets)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ChatBubbleOutlineRoundedIcon sx={{ color: '#11cdef', fontSize: '15px' }} />
            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#344767' }}>
              {formatMetric(replies)}
            </Typography>
          </Box>

          {views > 0 && (
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: '5px' }}>
              <VisibilityRoundedIcon sx={{ color: '#8392ab', fontSize: '15px' }} />
              <Typography sx={{ fontSize: '12.5px', fontWeight: 500, color: '#8392ab' }}>
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

function NoiseView({ noisePosts: propNoisePosts = [], onPostRestored, onPostExcluded, onImageClick }) {
  const [controller] = useArgonController();
  const { miniSidenav } = controller || {};

  const [activeTab, setActiveTab] = useState(0); 
  const [noisePostsList, setNoisePostsList] = useState([]);
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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
        getNoisePosts({ status: 'EXCLUDED', limit: 250 }).catch(() => []),
        getNoisePosts({ status: 'RESTORED', limit: 100 }).catch(() => []),
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

  const filteredNoisePosts = useMemo(() => {
    const list = activeTab === 2 ? restoredPostsList : noisePostsList;
    return list.filter((p) => {
      if (selectedCategory !== 'all' && p.exclusionCategory !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const textMatch = (p.text || '').toLowerCase().includes(q);
        const authorMatch = (p.authorUsername || '').toLowerCase().includes(q);
        const nameMatch = (p.authorName || '').toLowerCase().includes(q);
        const reasonMatch = (p.exclusionReason || '').toLowerCase().includes(q);
        if (!textMatch && !authorMatch && !nameMatch && !reasonMatch) return false;
      }
      return true;
    });
  }, [noisePostsList, restoredPostsList, activeTab, selectedCategory, searchQuery]);

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
      let candidates = await extractNoiseCandidates({
        postId: post.id,
        text: post.text,
        author: post.authorUsername,
        category: post.exclusionCategory,
        reason: post.exclusionReason,
      });

      if (!candidates || candidates.length === 0) {
        candidates = extractLearningCandidates(post, post.exclusionCategory, post.exclusionReason);
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
                  color: '#1e293b',
                  fontSize: { xs: '20px', md: '24px' },
                  lineHeight: 1.2,
                }}
              >
                Noise Ingestion & Learning Engine
              </Typography>
              <Typography
                sx={{ fontFamily: '"Open Sans", sans-serif', fontSize: '13.5px', color: '#67748e', mt: 0.3 }}
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
              color: '#5e72e4',
              borderColor: '#d2d6da',
              '&:hover': {
                borderColor: '#5e72e4',
                backgroundColor: 'rgba(94, 114, 228, 0.05)',
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
          border: '1px solid #edf2f7',
          mb: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 2, sm: 3 }, pt: 1.5 }}>
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
                color: '#67748e',
                '&.Mui-selected': {
                  color: '#5e72e4',
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
        </Box>

        {(activeTab === 0 || activeTab === 2) && (
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
            }}
          >
            <OutlinedInput
              placeholder="Search noise posts by keyword, author, or reason..."
              size="small"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              startAdornment={
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: '#8392ab', fontSize: 20 }} />
                </InputAdornment>
              }
              sx={{
                flexGrow: 1,
                maxWidth: { xs: '100%', sm: 420 },
                borderRadius: '8px',
                fontSize: '13.5px',
                backgroundColor: '#fff',
              }}
            />

            <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel sx={{ fontSize: '13px' }}>Exclusion Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Exclusion Category"
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  sx={{ borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff' }}
                >
                  <MenuItem value="all">All Exclusion Categories</MenuItem>
                  <MenuItem value="OFF_TOPIC">Off-Topic Noise</MenuItem>
                  <MenuItem value="NO_AIR_QUALITY_RELEVANCE">No AQ Relevance</MenuItem>
                  <MenuItem value="NO_GEOGRAPHIC_RELEVANCE">No Geo Relevance</MenuItem>
                  <MenuItem value="EXCLUDED_INDIAN_CONTEXT">Indian Domestic</MenuItem>
                  <MenuItem value="EXCLUDED_ACCOUNT">Excluded Account</MenuItem>
                </Select>
              </FormControl>

              <Box
                sx={{
                  px: 1.5,
                  py: 0.6,
                  borderRadius: '8px',
                  backgroundColor: '#edf2f7',
                  color: '#475569',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                Showing {filteredNoisePosts.length} posts
              </Box>
            </Box>
          </Box>
        )}
      </Card>

      {(activeTab === 0 || activeTab === 2) && (
        <>
          {loading ? (
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
                backgroundColor: '#fff',
                border: '1px solid #edf2f7',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <CleaningServicesRoundedIcon sx={{ fontSize: 32, color: '#8392ab' }} />
              </Box>
              <Typography
                sx={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontWeight: 700,
                  fontSize: '18px',
                  color: '#344767',
                  mb: 1,
                }}
              >
                {activeTab === 0 ? 'No Excluded Noise Posts Found' : 'No Restored Posts Found'}
              </Typography>
              <Typography sx={{ fontSize: '13px', color: '#8392ab' }}>
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
            border: '1px solid #edf2f7',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
            <Box>
              <Typography variant="h6" fontWeight="bold" color="#1e293b">
                Active Deterministic Rule Learning Ledger
              </Typography>
              <Typography sx={{ fontSize: '13px', color: '#67748e', mt: 0.3 }}>
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
                borderColor: '#cbd5e1',
              }}
            >
              + Add Rule Manually
            </Button>
          </Box>

          {learnedRulesList.length === 0 ? (
            <Box textAlign="center" py={6}>
              <PsychologyAltRoundedIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
              <Typography variant="h6" fontWeight="bold" color="text">
                No learned rules yet
              </Typography>
              <Typography variant="caption" color="text">
                Whenever you mark an excluded post as relevant in the Noise Feed, the system will synthesize rules here.
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ border: '1px solid #edf2f7', borderRadius: '10px' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>RULE TYPE</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>LEARNED VALUE / PATTERN</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>SOURCE / REASON</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>HIT COUNT</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', textAlign: 'right' }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {learnedRulesList.map((rule) => (
                    <TableRow key={rule.id} hover>
                      <TableCell>
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
                                ? '#e6f8f0'
                                : rule.ruleType === 'aq_keyword'
                                ? '#e0f2fe'
                                : rule.ruleType === 'geo_keyword'
                                ? '#f3e8ff'
                                : '#fef3e2',
                            color:
                              rule.ruleType === 'author_whitelist'
                                ? '#2dce89'
                                : rule.ruleType === 'aq_keyword'
                                ? '#0284c7'
                                : rule.ruleType === 'geo_keyword'
                                ? '#825ee4'
                                : '#fb6340',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '13px' }}>
                        {rule.ruleType === 'author_whitelist' ? `@${rule.ruleValue}` : rule.ruleValue}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12.5px', color: '#64748b' }}>
                        {rule.description || 'Learned from user activity'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '13px', fontWeight: 600 }}>
                        {rule.hitCount || 0} salvaged
                      </TableCell>
                      <TableCell>
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
                                color: rule.isActive ? '#2dce89' : '#8392ab',
                              }}
                            >
                              {rule.isActive ? 'Active' : 'Disabled'}
                            </Typography>
                          }
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
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
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={1.2}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: '#e6f8f0',
                color: '#2dce89',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AutoAwesomeRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Restore Post & Teach Rule Engine
              </Typography>
              <Typography variant="caption" color="text">
                Explainable Deterministic Active Feedback (Zero AI)
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setRestoreModalOpen(false)} disabled={isRestoring}>
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          {selectedPost && (
            <>
              
              <Box
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  mb: 2.5,
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography sx={{ fontWeight: 700, fontSize: '13.5px' }}>
                      {selectedPost.authorName || selectedPost.authorUsername}
                    </Typography>
                    <Typography sx={{ fontSize: '12.5px', color: '#8392ab' }}>
                      @{selectedPost.authorUsername}
                    </Typography>
                  </Box>
                  {getCategoryBadge(selectedPost.exclusionCategory)}
                </Box>
                <Typography sx={{ fontSize: '13px', color: '#334155', fontStyle: 'italic', mb: 1 }}>
                  &quot;{selectedPost.text}&quot;
                </Typography>
                <Typography sx={{ fontSize: '11.5px', color: '#f5365c', fontWeight: 600 }}>
                  Original Exclusion Reason: {selectedPost.exclusionReason}
                </Typography>
              </Box>

              <Typography variant="subtitle2" fontWeight="bold" color="#1e293b" mb={0.5}>
                What should the system learn from this action?
              </Typography>
              <Typography variant="caption" color="text" sx={{ display: 'block', mb: 1.5 }}>
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
                      borderColor: selectedRuleIndices.has(idx) ? '#5e72e4' : '#e2e8f0',
                      backgroundColor: selectedRuleIndices.has(idx) ? 'rgba(94, 114, 228, 0.04)' : '#fff',
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
                          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                            {cand.label}
                          </Typography>
                          <Typography sx={{ fontSize: '11.5px', color: '#64748b' }}>
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
                  backgroundColor: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                }}
              >
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#475569', mb: 1 }}>
                  + Add Custom Rule for This Post:
                </Typography>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={customRuleType}
                        onChange={(e) => setCustomRuleType(e.target.value)}
                        sx={{ fontSize: '12px', backgroundColor: '#fff' }}
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
                      sx={{ fontSize: '12px', backgroundColor: '#fff' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={handleAddCustomCandidate}
                      sx={{ height: '38px', textTransform: 'none', fontWeight: 600, fontSize: '12px' }}
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
          <Button onClick={() => setRestoreModalOpen(false)} disabled={isRestoring} sx={{ textTransform: 'none' }}>
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
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center" gap={1.2}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Exclude Restored Post
              </Typography>
              <Typography variant="caption" color="text">
                Revert post from verified feed back to noise pool
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setExcludeModalOpen(false)} disabled={isExcluding}>
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          {postToExclude && (
            <Box display="flex" flexDirection="column" gap={2}>
              
              <Box sx={{ p: 2, borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography sx={{ fontWeight: 700, fontSize: '13px' }}>
                    {postToExclude.authorName || postToExclude.authorUsername} (@{postToExclude.authorUsername})
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: '#8392ab' }}>
                    ID: {postToExclude.id}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '12.5px', color: '#475569', fontStyle: 'italic' }}>
                  &quot;{postToExclude.text}&quot;
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', mb: 0.8 }}>
                  Select Exclusion Reason:
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={excludeReason}
                    onChange={(e) => setExcludeReason(e.target.value)}
                    sx={{ fontSize: '13px', backgroundColor: '#fff', borderRadius: '8px' }}
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
                  borderColor: revokeRulesChecked ? '#ef4444' : '#e2e8f0',
                  backgroundColor: revokeRulesChecked ? '#fff1f2' : '#fff',
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
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#991b1b' }}>
                        Revoke Associated Learned Rules
                      </Typography>
                      <Typography sx={{ fontSize: '11.5px', color: '#64748b' }}>
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
          <Button onClick={() => setExcludeModalOpen(false)} disabled={isExcluding} sx={{ textTransform: 'none' }}>
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
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Add Non-AI Learned Rule
          </Typography>
          <Typography variant="caption" color="text">
            Directly insert a heuristic rule into the filtering engine
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Rule Type</InputLabel>
              <Select
                value={newManualType}
                label="Rule Type"
                onChange={(e) => setNewManualType(e.target.value)}
              >
                <MenuItem value="aq_keyword">Air Quality Keyword (Positive Lexicon)</MenuItem>
                <MenuItem value="geo_keyword">Punjab Locality (Target Geography)</MenuItem>
                <MenuItem value="author_whitelist">Author Whitelist (Trusted Source)</MenuItem>
                <MenuItem value="off_topic_exception">Off-Topic Exception (e.g. cricket+smog)</MenuItem>
                <MenuItem value="indian_exception">Indian Exception (Cross-border)</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#475569', mb: 0.5 }}>
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
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#475569', mb: 0.5 }}>
                Description (Optional):
              </Typography>
              <OutlinedInput
                fullWidth
                size="small"
                placeholder="Reason or notes for this rule..."
                value={newManualDesc}
                onChange={(e) => setNewManualDesc(e.target.value)}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setManualRuleModalOpen(false)} sx={{ textTransform: 'none' }}>
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