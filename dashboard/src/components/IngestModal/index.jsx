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
import { processRawPosts } from '../../services/pipeline';

function IngestModal({ open, onClose, currentPosts, onIngestSuccess }) {
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

    if (!file.name.endsWith('.json')) {
      setErrorMessage('Please upload a valid JSON file (.json).');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawJson = JSON.parse(e.target.result);
        const postsArray = Array.isArray(rawJson) ? rawJson : (rawJson.posts || [rawJson]);
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
          p: 1
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
            <ArgonTypography variant="h6" fontWeight="bold">
              Ingest Scraped X.com Data
            </ArgonTypography>
            <ArgonTypography variant="caption" color="text">
              Automated Cleaning, Negative Query Filtering & Deduplication Pipeline
            </ArgonTypography>
          </ArgonBox>
        </ArgonBox>
        <IconButton onClick={handleClose} size="small">
          <CloseRoundedIcon sx={{ fontSize: '20px' }} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
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
            borderColor: dragActive ? '#5e72e4' : '#ced4da',
            backgroundColor: dragActive ? 'rgba(94, 114, 228, 0.05)' : '#f8f9fa',
            borderRadius: 3,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#5e72e4',
              backgroundColor: 'rgba(94, 114, 228, 0.03)'
            }
          }}
        >
          <UploadFileRoundedIcon sx={{ fontSize: '48px', color: dragActive ? '#5e72e4' : '#8392ab', mb: 1 }} />
          <ArgonTypography variant="h6" color="dark" fontWeight="medium">
            {fileName ? `Loaded: ${fileName}` : 'Drag and drop scraped posts .json file here'}
          </ArgonTypography>
          <ArgonTypography variant="caption" color="text">
            Supports standard X.com / Twitter scraper raw JSON schemas • Click to browse file
          </ArgonTypography>
        </ArgonBox>

        {processingResult && (
          <ArgonBox mt={3}>
            <ArgonTypography variant="subtitle2" fontWeight="bold" color="dark" mb={1.5}>
              Pipeline Execution Preview:
            </ArgonTypography>

            <Grid container spacing={2} mb={2}>
              <Grid item xs={6} sm={3}>
                <ArgonBox p={1.5} borderRadius="10px" bgColor="grey.100" textAlign="center">
                  <ArgonTypography variant="caption" color="text" textTransform="uppercase" fontWeight="bold">
                    Raw Ingested
                  </ArgonTypography>
                  <ArgonTypography variant="h5" color="dark" fontWeight="bold">
                    {processingResult.stats.totalIngested}
                  </ArgonTypography>
                </ArgonBox>
              </Grid>

              <Grid item xs={6} sm={3}>
                <ArgonBox p={1.5} borderRadius="10px" bgColor="rgba(45, 206, 137, 0.1)" textAlign="center">
                  <ArgonTypography variant="caption" color="success" textTransform="uppercase" fontWeight="bold">
                    Clean Valid
                  </ArgonTypography>
                  <ArgonTypography variant="h5" color="success" fontWeight="bold">
                    +{processingResult.newlyAddedPosts.length}
                  </ArgonTypography>
                </ArgonBox>
              </Grid>

              <Grid item xs={6} sm={3}>
                <ArgonBox p={1.5} borderRadius="10px" bgColor="rgba(251, 99, 64, 0.1)" textAlign="center">
                  <ArgonTypography variant="caption" color="warning" textTransform="uppercase" fontWeight="bold">
                    Duplicates Merged
                  </ArgonTypography>
                  <ArgonTypography variant="h5" color="warning" fontWeight="bold">
                    {processingResult.stats.duplicatesMerged}
                  </ArgonTypography>
                </ArgonBox>
              </Grid>

              <Grid item xs={6} sm={3}>
                <ArgonBox p={1.5} borderRadius="10px" bgColor="rgba(245, 54, 92, 0.1)" textAlign="center">
                  <ArgonTypography variant="caption" color="error" textTransform="uppercase" fontWeight="bold">
                    Noise Filtered
                  </ArgonTypography>
                  <ArgonTypography variant="h5" color="error" fontWeight="bold">
                    {processingResult.stats.removedCount}
                  </ArgonTypography>
                </ArgonBox>
              </Grid>
            </Grid>

            <ArgonBox p={2} borderRadius="10px" border="1px solid #e9ecef" mb={1}>
              <ArgonTypography variant="button" fontWeight="bold" color="dark" display="block" mb={0.5}>
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
                  label={<ArgonTypography variant="caption">Merge into existing dataset (Deduplicate against current)</ArgonTypography>}
                />
                <FormControlLabel
                  value="replace"
                  control={<Radio size="small" />}
                  label={<ArgonTypography variant="caption">Replace entire dataset with this file</ArgonTypography>}
                />
              </RadioGroup>
            </ArgonBox>

            {processingResult.stats.removedCount > 0 && (
              <ArgonBox mt={1.5} p={1.5} borderRadius="8px" bgColor="rgba(245, 54, 92, 0.05)" border="1px dashed #fca5a5" display="flex" alignItems="center" gap={1}>
                <ArgonBox>
                  <ArgonTypography variant="caption" fontWeight="bold" color="error">
                    ℹ️ {processingResult.stats.removedCount} posts were classified as noise.
                  </ArgonTypography>
                  <ArgonTypography variant="caption" display="block" color="text">
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