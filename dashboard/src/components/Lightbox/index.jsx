import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';
import { isVideoUrl } from '../../utils/media';

function Lightbox({ images, activeIndex, onClose, onPrev, onNext }) {
  const isOpen = Boolean(images && images.length > 0 && activeIndex !== null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && images.length > 1) onPrev();
      if (e.key === 'ArrowRight' && images.length > 1) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images?.length, onClose, onPrev, onNext]);

  if (!isOpen) return null;

  const currentImg = images[activeIndex];

  return (
    <Dialog
      open={activeIndex !== null}
      onClose={onClose}
      maxWidth="lg"
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    boxShadow: 'none',
          overflow: 'hidden',
          borderRadius: 3,
          m: 2,
          position: 'relative',
          maxHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }}
    >
      
      <ArgonBox
        position="absolute"
        top={16}
        left={24}
        right={24}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        zIndex={10}
      >
        <ArgonTypography variant="button" color="white" fontWeight="medium">
          {isVideoUrl(currentImg) ? 'Video' : 'Image'} {activeIndex + 1} of {images.length}
        </ArgonTypography>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#fff',
            backgroundColor: 'rgba(255,255,255,0.15)',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
          }}
          size="small"
        >
          <CloseRoundedIcon sx={{ fontSize: '20px' }} />
        </IconButton>
      </ArgonBox>

      <ArgonBox
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
        pt={7}
        width="100%"
        height="100%"
      >
        {isVideoUrl(currentImg) ? (
          <video
            key={currentImg}
            src={currentImg}
            referrerPolicy="no-referrer"
            controls
            autoPlay
            playsInline
            style={{
              maxWidth: '100%',
              maxHeight: '75vh',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              backgroundColor: '#000',
              outline: 'none',
            }}
          />
        ) : (
          <img
            src={currentImg}
            alt={`Post attachment ${activeIndex + 1}`}
            referrerPolicy="no-referrer"
            style={{
              maxWidth: '100%',
              maxHeight: '75vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/800x600?text=Image+Preview+Unavailable';
            }}
          />
        )}
      </ArgonBox>

      {images.length > 1 && (
        <>
          <IconButton
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            sx={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#fff',
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.4)' },
              zIndex: 10
            }}
          >
            <ChevronLeftRoundedIcon sx={{ fontSize: '24px' }} />
          </IconButton>
          <IconButton
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#fff',
              backgroundColor: 'rgba(255,255,255,0.2)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.4)' },
              zIndex: 10
            }}
          >
            <ChevronRightRoundedIcon sx={{ fontSize: '24px' }} />
          </IconButton>
        </>
      )}
    </Dialog>
  );
}

Lightbox.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
  activeIndex: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired
};

export default Lightbox;