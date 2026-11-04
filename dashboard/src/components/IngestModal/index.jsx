import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import Grid from '@mui/material/Grid';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import ArgonButton from 'components/ArgonButton';
import ArgonBadge from 'components/ArgonBadge';
import ArgonAlert from 'components/ArgonAlert';
import { useArgonController } from 'context';
import { processRawPosts } from '../../services/pipeline';

function IngestModal({ open, onClose, currentPosts, onIngestSuccess }) {
  const [controller] = useArgonController();
  const { darkMode } = controller;
  const [dragActive, setDragActive] = useState(false);
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [processingResult, setProcessingResult] = useState(null);
  const [ingestMode, setIngestMode] = useState('merge'); 
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const resetState = () => {
    setFileData(null);
    setFileName('');
    setProcessingResult(null);
    setErrorMessage('');
    setIngestMode('merge');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileProcess = (file) => {
    setErrorMessage('');
    if (!file) return;

    // File size guard (max 10 MB to prevent client browser crash/DoS)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`File exceeds the maximum allowable size of 10 MB (provided: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      setErrorMessage('Please upload a valid JSON file (.json).');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawJson = JSON.parse(e.target.result);
        let postsArray = Array.isArray(rawJson)
          ? rawJson
          : (rawJson && typeof rawJson === 'object' && Array.isArray(rawJson.posts) ? rawJson.posts : [rawJson]);

        // Filter invalid non-object records
        postsArray = postsArray.filter(item => item && typeof item === 'object');

        // Cap batch processing to 10,000 items to avoid UI thread freeze
        const MAX_ITEMS = 10000;
        if (postsArray.length > MAX_ITEMS) {
          setErrorMessage(`Batch contains too many items (${postsArray.length}). Maximum allowed per import is ${MAX_ITEMS}.`);
          return;
        }

        if (postsArray.length === 0) {
          setErrorMessage('The file contains no valid post records.');
          return;
        }

        setFileData(postsArray);

        const result = processRawPosts(
          postsArray,
          ingestMode === 'replace' ? [] : currentPosts
        );
        setProcessingResult(result);
      } catch (err) {
        setErrorMessage(`Invalid JSON syntax: ${err.message}`);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleModeChange = (newMode) => {
    setIngestMode(newMode);
    if (fileData) {
      const result = processRawPosts(
        fileData,
        newMode === 'replace' ? [] : currentPosts
      );
      setProcessingResult(result);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmIngest = () => {
    if (!processingResult) return;
    onIngestSuccess(processingResult, ingestMode, fileData);
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: { xs: 0.5, sm: 1 },
          m: { xs: 1, sm: 2 },
          backgroundColor: darkMode ? '#111c44' : '#ffffff',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
          color: darkMode ? '#ffffff' : 'inherit',
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ArgonBox display="flex" alignItems="center" gap={1}>
          <ArgonBox
            width="36px"
            height="36px"
            borderRadius="50%"
            bgColor="info"
            variant="gradient"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <CloudUploadRoundedIcon sx={{ color: '#fff', fontSize: '22px' }} />
          </ArgonBox>
          <ArgonBox>
            <ArgonTypography variant="h6" fontWeight="bold" color={darkMode ? 'white' : 'dark'}>
              Ingest Scraped X.com Data
            </ArgonTypography>
            <ArgonTypography variant="caption" sx={{ color: darkMode ? '#94a3b8' : undefined }} color={darkMode ? undefined : 'text'}>
              Automated Cleaning, Negative Query Filtering & Deduplication Pipeline
            </ArgonTypography>
          </ArgonBox>
        </ArgonBox>
        <IconButton onClick={handleClose} size="small" sx={{ color: darkMode ? '#94a3b8' : undefined }}>
          <CloseRoundedIcon sx={{ fontSize: '20px' }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 }, borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined }}>
        {errorMessage && (
          <ArgonAlert color="error" dismissible onClose={() => setErrorMessage('')}>
            {errorMessage}
          </ArgonAlert>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileProcess(e.target.files[0]);
            }
          }}
        />

        <ArgonBox
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          sx={{
            border: '2px dashed',
            borderColor: dragActive ? '#5e72e4' : (darkMode ? 'rgba(255, 255, 255, 0.15)' : '#ced4da'),
            backgroundColor: dragActive
              ? (darkMode ? 'rgba(94, 114, 228, 0.15)' : 'rgba(94, 114, 228, 0.05)')
              : (darkMode ? '#0b1437' : '#f8f9fa'),
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#5e72e4',
              backgroundColor: darkMode ? 'rgba(94, 114, 228, 0.1)' : 'rgba(94, 114, 228, 0.03)'
            }
          }}
        >
          <UploadFileRoundedIcon sx={{ fontSize: '48px', color: dragActive ? '#5e72e4' : (darkMode ? '#5e72e4' : '#8392ab'), mb: 1 }} />
          <ArgonTypography variant="h6" color={darkMode ? 'white' : 'dark'} fontWeight="medium">
            {fileName ? `Loaded: ${fileName}` : 'Drag and drop scraped posts .json file here'}
          </ArgonTypography>
          <ArgonTypography variant="caption" sx={{ color: darkMode ? '#94a3b8' : undefined }} color={darkMode ? undefined : 'text'}>
            Supports standard X.com / Twitter scraper raw JSON schemas • Click to browse file
          </ArgonTypography>
        </ArgonBox>

        {processingResult && (
          <ArgonBox mt={3}>
            <ArgonTypography variant="subtitle2" fontWeight="bold" color={darkMode ? 'white' : 'dark'} mb={1.5}>
              Pipeline Execution Preview:
            </ArgonTypography>

            <Grid container spacing={2} mb={2}>
              <Grid item xs={6} sm={3}>
                <ArgonBox p={1.5} borderRadius="10px" sx={{ backgroundColor: darkMode ? '#0b1437' : '#f1f5f9', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : undefined }} textAlign="center">
                  <ArgonTypography variant="caption" sx={{ color: darkMode ? '#94a3b8' : undefined }} color={darkMode ? undefined : 'text'} textTransform="uppercase" fontWeight="bold">
                    Raw Ingested
                  </ArgonTypography>
                  <ArgonTypography variant="h5" color={darkMode ? 'white' : 'dark'} fontWeight="bold">
                    {processingResult.stats.totalIngested}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" sx={{ fontSize: '10.5px', color: '#8392ab', display: 'block', mt: 0.2 }}>
                    Total batch posts
                  </ArgonTypography>
                </ArgonBox>
              </Grid>

              <Grid item xs={6} sm={3}>
                <ArgonBox p={1.5} borderRadius="10px" sx={{ backgroundColor: darkMode ? 'rgba(45, 206, 137, 0.15)' : 'rgba(45, 206, 137, 0.1)', border: darkMode ? '1px solid rgba(45, 206, 137, 0.3)' : undefined }} textAlign="center">
                  <ArgonTypography variant="caption" color="success" textTransform="uppercase" fontWeight="bold">
                    Clean Valid
                  </ArgonTypography>
                  <ArgonTypography variant="h5" color="success" fontWeight="bold">
                    +{processingResult.newlyAddedPosts.length}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" sx={{ fontSize: '10.5px', color: darkMode ? '#4ade80' : '#2dce89', display: 'block', mt: 0.2, fontWeight: 600 }}>
                    {ingestMode === 'merge' ? 'New unique posts' : 'Total clean posts'}
                  </ArgonTypography>
                </ArgonBox>
              </Grid>

              <Grid item xs={6} sm={3}>
                <ArgonBox p={1.5} borderRadius="10px" sx={{ backgroundColor: darkMode ? 'rgba(251, 99, 64, 0.15)' : 'rgba(251, 99, 64, 0.1)', border: darkMode ? '1px solid rgba(251, 99, 64, 0.3)' : undefined }} textAlign="center">
                  <ArgonTypography variant="caption" color="warning" textTransform="uppercase" fontWeight="bold">
                    Duplicates
                  </ArgonTypography>
                  <ArgonTypography variant="h5" color="warning" fontWeight="bold">
                    {processingResult.stats.duplicatesMerged}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" sx={{ fontSize: '10.5px', color: darkMode ? '#fb923c' : '#ea580c', display: 'block', mt: 0.2, fontWeight: 600 }}>
                    {(processingResult.stats.exactDuplicates || 0) > 0
                      ? `${processingResult.stats.exactDuplicates} in DB • ${processingResult.stats.semanticDuplicates || 0} merged`
                      : `${processingResult.stats.semanticDuplicates || processingResult.stats.duplicatesMerged} content merged`}
                  </ArgonTypography>
                </ArgonBox>
              </Grid>

              <Grid item xs={6} sm={3}>
                <ArgonBox p={1.5} borderRadius="10px" sx={{ backgroundColor: darkMode ? 'rgba(245, 54, 92, 0.15)' : 'rgba(245, 54, 92, 0.1)', border: darkMode ? '1px solid rgba(245, 54, 92, 0.3)' : undefined }} textAlign="center">
                  <ArgonTypography variant="caption" color="error" textTransform="uppercase" fontWeight="bold">
                    Noise Filtered
                  </ArgonTypography>
                  <ArgonTypography variant="h5" color="error" fontWeight="bold">
                    {processingResult.stats.removedCount}
                  </ArgonTypography>
                  <ArgonTypography variant="caption" sx={{ fontSize: '10.5px', color: darkMode ? '#f87171' : '#f5365c', display: 'block', mt: 0.2, fontWeight: 600 }}>
                    Excluded / off-topic
                  </ArgonTypography>
                </ArgonBox>
              </Grid>
            </Grid>

            {/* Complete Pipeline Balance Strip */}
            <ArgonBox
              p={1.25}
              px={2}
              mb={2}
              borderRadius="10px"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1}
              sx={{
                backgroundColor: darkMode ? '#0b1437' : '#f8fafc',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              }}
            >
              <ArgonTypography variant="caption" fontWeight="bold" sx={{ color: darkMode ? '#38bdf8' : '#0284c7' }}>
                ✓ 100% Pipeline Accounting:
              </ArgonTypography>
              <ArgonTypography variant="caption" sx={{ color: darkMode ? '#cbd5e1' : '#475569', fontWeight: 600 }}>
                <strong>{processingResult.newlyAddedPosts.length}</strong> Clean +{' '}
                <strong>{processingResult.stats.duplicatesMerged}</strong> Duplicates ({processingResult.stats.exactDuplicates || 0} existing in DB + {processingResult.stats.semanticDuplicates || 0} merged) +{' '}
                <strong>{processingResult.stats.removedCount}</strong> Noise ={' '}
                <strong>{processingResult.stats.totalIngested}</strong> Total Raw
              </ArgonTypography>
            </ArgonBox>

            <ArgonBox p={2} borderRadius="10px" sx={{ backgroundColor: darkMode ? '#0b1437' : 'transparent', border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e9ecef' }} mb={1}>
              <ArgonTypography variant="button" fontWeight="bold" color={darkMode ? 'white' : 'dark'} display="block" mb={0.5}>
                Ingestion Strategy:
              </ArgonTypography>
              <RadioGroup
                row
                value={ingestMode}
                onChange={(e) => handleModeChange(e.target.value)}
              >
                <FormControlLabel
                  value="merge"
                  control={<Radio size="small" />}
                  label={<ArgonTypography variant="caption" sx={{ color: darkMode ? '#cbd5e1' : undefined }}>Merge into existing dataset (Deduplicate against current)</ArgonTypography>}
                />
                <FormControlLabel
                  value="replace"
                  control={<Radio size="small" />}
                  label={<ArgonTypography variant="caption" sx={{ color: darkMode ? '#cbd5e1' : undefined }}>Replace entire dataset with this file</ArgonTypography>}
                />
              </RadioGroup>
            </ArgonBox>

            {ingestMode === 'merge' && (processingResult.stats.exactDuplicates || 0) > 0 && (
              <ArgonBox
                mt={1.5}
                p={1.5}
                borderRadius="8px"
                sx={{
                  backgroundColor: darkMode ? 'rgba(94, 114, 228, 0.12)' : 'rgba(94, 114, 228, 0.06)',
                  border: darkMode ? '1px dashed rgba(94, 114, 228, 0.35)' : '1px dashed #b8c4f9'
                }}
              >
                <ArgonTypography variant="caption" fontWeight="bold" sx={{ color: darkMode ? '#a5b4fc' : '#5e72e4', display: 'block' }}>
                  ℹ️ {processingResult.stats.exactDuplicates} posts are already indexed in your verified database.
                </ArgonTypography>
                <ArgonTypography variant="caption" sx={{ color: darkMode ? '#cbd5e1' : '#475569', display: 'block', mt: 0.3, lineHeight: 1.5 }}>
                  The merge strategy skips existing post IDs to prevent duplicating records, appending only the <strong>+{processingResult.newlyAddedPosts.length} new unique posts</strong>. Switch to &quot;Replace entire dataset&quot; if you want to overwrite all records with this file.
                </ArgonTypography>
              </ArgonBox>
            )}

            {processingResult.stats.removedCount > 0 && (
              <ArgonBox mt={1.5} p={1.5} borderRadius="8px" sx={{ backgroundColor: darkMode ? 'rgba(245, 54, 92, 0.15)' : 'rgba(245, 54, 92, 0.05)', border: darkMode ? '1px dashed rgba(245, 54, 92, 0.4)' : '1px dashed #fca5a5' }} display="flex" alignItems="center" gap={1}>
                <ArgonBox>
                  <ArgonTypography variant="caption" fontWeight="bold" color="error">
                    ℹ️ {processingResult.stats.removedCount} posts were classified as noise.
                  </ArgonTypography>
                  <ArgonTypography variant="caption" display="block" sx={{ color: darkMode ? '#94a3b8' : undefined }} color={darkMode ? undefined : 'text'}>
                    After ingesting, you can review and manually salvage relevant posts in the <strong>Noise & Learning Engine</strong> page to teach the system without AI.
                  </ArgonTypography>
                </ArgonBox>
              </ArgonBox>
            )}
          </ArgonBox>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <ArgonButton variant="outlined" color="secondary" onClick={handleClose}>
          Cancel
        </ArgonButton>
        <ArgonButton
          variant="gradient"
          color="info"
          disabled={!processingResult || (ingestMode === 'merge' && processingResult.newlyAddedPosts.length === 0)}
          onClick={handleConfirmIngest}
        >
          Confirm & Ingest ({processingResult ? processingResult.newlyAddedPosts.length : 0} Posts)
        </ArgonButton>
      </DialogActions>
    </Dialog>
  );
}

IngestModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentPosts: PropTypes.arrayOf(PropTypes.object).isRequired,
  onIngestSuccess: PropTypes.func.isRequired
};

export default IngestModal;