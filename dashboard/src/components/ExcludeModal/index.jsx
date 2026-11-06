import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import OutlinedInput from '@mui/material/OutlinedInput';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useArgonController } from '../../context';
import { NOISE_TAXONOMY, NOISE_GROUPS, getNoiseCategoryInfo } from '../../services/taxonomy';
import { extractExclusionCandidates } from '../../services/api';

export default function ExcludeModal({
  open,
  post,
  onClose,
  onConfirm,
  isExcluding = false
}) {
  const [controller] = useArgonController();
  const { darkMode } = controller;

  const [selectedCategory, setSelectedCategory] = useState('GOVT_BUREAUCRATIC_PR');
  const [reasonText, setReasonText] = useState('');
  const [detectedCandidates, setDetectedCandidates] = useState([]);
  const [selectedPhrases, setSelectedPhrases] = useState(new Set());
  const [customPhrase, setCustomPhrase] = useState('');
  const [confidence, setConfidence] = useState(1.0);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  // When post opens, auto-detect candidate category and phrase patterns
  useEffect(() => {
    if (!open || !post) return;

    const text = post.text || '';
    const textLower = text.toLowerCase();

    // Auto-detect initial category
    let initialCat = 'GOVT_BUREAUCRATIC_PR';
    if (textLower.includes('meeting') || textLower.includes('chaired') || textLower.includes('delegation')) {
      initialCat = 'GOVT_BUREAUCRATIC_PR';
    } else if (textLower.includes('buddha nullah') || textLower.includes('chitti bein')) {
      initialCat = 'INDIAN_WATER_DISPUTES';
    } else if (textLower.includes('caqm') || textLower.includes('cpcb') || textLower.includes('grap')) {
      initialCat = 'FOREIGN_AGENCY_DOMESTIC';
    } else if (textLower.includes('air purifier') || textLower.includes('hepa') || textLower.includes('discount')) {
      initialCat = 'COMMERCIAL_SPAM_AND_ADS';
    } else if (textLower.includes('cricket') || textLower.includes('match') || textLower.includes('pcb')) {
      initialCat = 'SPORTS_AND_ENTERTAINMENT';
    } else if (textLower.includes('cheezious') || textLower.includes('pizza') || textLower.includes('kababjees')) {
      initialCat = 'LIFESTYLE_AND_FOOD';
    } else if (textLower.includes('toxic boss') || textLower.includes('smog of')) {
      initialCat = 'METAPHORICAL_OR_SARCASTIC';
    }

    setSelectedCategory(initialCat);
    setReasonText(`Re-evaluated as ${getNoiseCategoryInfo(initialCat).label}`);
    setConfidence(1.0);
    setCustomPhrase('');

    // Fetch candidate phrases from backend
    setIsLoadingCandidates(true);
    extractExclusionCandidates({ postId: post.id, text, category: initialCat })
      .then((cands) => {
        if (Array.isArray(cands)) {
          setDetectedCandidates(cands);
          // Pre-select recommended phrases
          const preSelected = new Set();
          cands.forEach((c) => {
            if (c.recommended && c.phrase) {
              preSelected.add(c.phrase.toLowerCase());
            }
          });
          setSelectedPhrases(preSelected);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch phrase candidates:', err);
      })
      .finally(() => {
        setIsLoadingCandidates(false);
      });
  }, [open, post]);

  // When category changes, refresh candidate phrases
  const handleCategoryChange = (e) => {
    const newCat = e.target.value;
    setSelectedCategory(newCat);
    setReasonText(`Classified as ${getNoiseCategoryInfo(newCat).label}`);

    if (post && post.text) {
      setIsLoadingCandidates(true);
      extractExclusionCandidates({ postId: post.id, text: post.text, category: newCat })
        .then((cands) => {
          if (Array.isArray(cands)) {
            setDetectedCandidates(cands);
            const preSelected = new Set();
            cands.forEach((c) => {
              if (c.recommended && c.phrase) {
                preSelected.add(c.phrase.toLowerCase());
              }
            });
            setSelectedPhrases(preSelected);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingCandidates(false));
    }
  };

  const handleTogglePhrase = (phrase) => {
    const clean = phrase.toLowerCase().trim();
    setSelectedPhrases((prev) => {
      const next = new Set(prev);
      if (next.has(clean)) {
        next.delete(clean);
      } else {
        next.add(clean);
      }
      return next;
    });
  };

  const handleAddCustomPhrase = () => {
    const val = customPhrase.trim().toLowerCase();
    if (!val) return;
    setSelectedPhrases((prev) => new Set([...prev, val]));
    setDetectedCandidates((prev) => [
      ...prev,
      { phrase: val, label: `Custom phrase: "${val}"`, recommended: true }
    ]);
    setCustomPhrase('');
  };

  const handleSubmit = () => {
    if (!post) return;
    onConfirm({
      postId: post.id,
      category: selectedCategory,
      reason: reasonText || getNoiseCategoryInfo(selectedCategory).label,
      phrasePatterns: Array.from(selectedPhrases),
      confidence
    });
  };

  if (!post) return null;

  const currentInfo = getNoiseCategoryInfo(selectedCategory);
  const authorHandle = post.authorUsername || (post.author_username || '').replace('@', '');

  return (
    <Dialog
      open={open}
      onClose={isExcluding ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          backgroundColor: darkMode ? '#0f172a' : '#ffffff',
          color: darkMode ? '#ffffff' : '#1e293b',
          boxShadow: darkMode
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WarningAmberRoundedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.2 }}>
              Exclude Post as Noise &amp; Learn Patterns
            </Typography>
            <Typography variant="caption" sx={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '12px' }}>
              Categorize noise and induce phrase-based filtering rules without blocking author handles
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} disabled={isExcluding} sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
          <CloseRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9' }}>
        <Box display="flex" flexDirection="column" gap={2.5}>
          
          {/* Post Snippet Card */}
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              backgroundColor: darkMode ? '#090e15' : '#f8fafc',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: darkMode ? '#ffffff' : '#1e293b' }}>
                {post.authorName || authorHandle} (@{authorHandle})
              </Typography>
              <Typography sx={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', fontFamily: 'monospace' }}>
                ID: {post.id}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '13px', color: darkMode ? '#cbd5e1' : '#334155', fontStyle: 'italic', lineHeight: 1.5 }}>
              &quot;{post.text}&quot;
            </Typography>
          </Box>

          {/* Noise Category Selection (Grouped 16 Categories) */}
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#ffffff' : '#1e293b', mb: 0.8 }}>
              Select Noise Taxonomy Category:
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                disabled={isExcluding}
                sx={{
                  fontSize: '13.5px',
                  fontWeight: 600,
                  backgroundColor: darkMode ? '#090e15' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#1e293b',
                  borderRadius: '10px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1',
                  },
                }}
              >
                {NOISE_GROUPS.map((grp) => [
                  <ListSubheader
                    key={grp.groupName}
                    sx={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      backgroundColor: darkMode ? '#1e293b' : '#f1f5f9',
                      color: darkMode ? '#94a3b8' : '#475569',
                      lineHeight: '32px',
                    }}
                  >
                    {grp.groupName}
                  </ListSubheader>,
                  ...grp.categories.map((code) => {
                    const info = NOISE_TAXONOMY[code] || {};
                    return (
                      <MenuItem key={code} value={code} sx={{ fontSize: '13px', py: 1 }}>
                        <Box>
                          <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>
                            {info.label || code}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                            {info.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    );
                  }),
                ])}
              </Select>
            </FormControl>
            <Typography sx={{ fontSize: '11.5px', color: darkMode ? '#94a3b8' : '#64748b', mt: 0.8 }}>
              ℹ️ {currentInfo.description}
            </Typography>
          </Box>

          {/* Phrase Pattern Learning Section */}
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              backgroundColor: darkMode ? '#090e15' : '#f8fafc',
              border: darkMode ? '1px dashed rgba(255, 255, 255, 0.15)' : '1px dashed #cbd5e1',
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <AutoAwesomeRoundedIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#ffffff' : '#1e293b' }}>
                Learn Negative Phrase Pattern (Content-Based Learning)
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '11.5px', color: darkMode ? '#94a3b8' : '#64748b', mb: 1.5 }}>
              Select phrases to automatically suppress future similar posts across <strong>all accounts</strong>. Posts containing these phrases will be routed to noise unless they contain hard field metrics (AQI numbers or fine amounts).
            </Typography>

            {isLoadingCandidates ? (
              <Box display="flex" alignItems="center" gap={1} py={1}>
                <CircularProgress size={16} />
                <Typography sx={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                  Scanning post for phrase patterns...
                </Typography>
              </Box>
            ) : detectedCandidates.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={1} mb={1.5}>
                {detectedCandidates.map((cand, idx) => {
                  const isChecked = selectedPhrases.has((cand.phrase || '').toLowerCase());
                  return (
                    <Box
                      key={idx}
                      onClick={() => handleTogglePhrase(cand.phrase)}
                      sx={{
                        p: 1,
                        px: 1.5,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isChecked
                          ? (darkMode ? 'rgba(239, 68, 68, 0.15)' : '#fff1f2')
                          : (darkMode ? 'rgba(255, 255, 255, 0.03)' : '#ffffff'),
                        border: isChecked
                          ? '1px solid #ef4444'
                          : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'),
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isChecked}
                            onChange={() => handleTogglePhrase(cand.phrase)}
                            color="error"
                            size="small"
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: darkMode ? '#ffffff' : '#1e293b' }}>
                              Filter out phrase: &quot;{cand.phrase}&quot;
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                              {cand.description || 'Suppresses future posts matching this phrase'}
                            </Typography>
                          </Box>
                        }
                        sx={{ m: 0 }}
                      />
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography sx={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', fontStyle: 'italic', mb: 1.5 }}>
                No standard boilerplate patterns detected. You can type a custom phrase below:
              </Typography>
            )}

            {/* Custom Phrase Input */}
            <Box display="flex" gap={1}>
              <OutlinedInput
                size="small"
                fullWidth
                placeholder="e.g. chaired review meeting, flat 30% off, buddha nullah..."
                value={customPhrase}
                onChange={(e) => setCustomPhrase(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomPhrase();
                  }
                }}
                sx={{
                  fontSize: '12.5px',
                  backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#1e293b',
                  borderRadius: '8px',
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleAddCustomPhrase}
                disabled={!customPhrase.trim()}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '12px',
                  minWidth: '80px',
                  borderRadius: '8px',
                }}
              >
                + Add Phrase
              </Button>
            </Box>
          </Box>

          {/* Confidence Rating */}
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: darkMode ? '#cbd5e1' : '#334155' }}>
              Annotation Quality / Confidence:
            </Typography>
            <Box display="flex" gap={1}>
              <Chip
                label="Definitive (100%)"
                size="small"
                color={confidence === 1.0 ? 'primary' : 'default'}
                variant={confidence === 1.0 ? 'filled' : 'outlined'}
                onClick={() => setConfidence(1.0)}
                sx={{ cursor: 'pointer', fontSize: '11.5px', fontWeight: 600 }}
              />
              <Chip
                label="Borderline (Contextual)"
                size="small"
                color={confidence === 0.5 ? 'warning' : 'default'}
                variant={confidence === 0.5 ? 'filled' : 'outlined'}
                onClick={() => setConfidence(0.5)}
                sx={{ cursor: 'pointer', fontSize: '11.5px', fontWeight: 600 }}
              />
            </Box>
          </Box>

          {/* Author Safety Assurance (Zero Author Blocking) */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: '10px',
              backgroundColor: darkMode ? 'rgba(14, 165, 233, 0.12)' : '#e0f2fe',
              border: darkMode ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <ShieldRoundedIcon sx={{ fontSize: 22, color: '#0284c7' }} />
            <Box>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#38bdf8' : '#0369a1' }}>
                Account @{authorHandle} will NOT be blocked
              </Typography>
              <Typography sx={{ fontSize: '11px', color: darkMode ? '#bae6fd' : '#0c4a6e' }}>
                Only posts matching the selected noise category and phrase rules will be filtered. Future real smog emergencies or field enforcement reports from this author will still be permitted.
              </Typography>
            </Box>
          </Box>

        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '#f1f5f9' }}>
        <Button
          onClick={onClose}
          disabled={isExcluding}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '13px',
            color: darkMode ? '#94a3b8' : '#64748b',
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={isExcluding}
          startIcon={isExcluding ? <CircularProgress size={16} color="inherit" /> : <CheckCircleRoundedIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '13px',
            borderRadius: '8px',
            px: 2.5,
            py: 1,
            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)',
          }}
        >
          {isExcluding ? 'Excluding...' : `Exclude Post & Learn (${selectedPhrases.size} Phrase Rules)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ExcludeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  post: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isExcluding: PropTypes.bool
};
