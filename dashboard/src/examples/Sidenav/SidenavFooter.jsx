import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import { useArgonController } from "context";

function SidenavFooter({ onOpenIngest }) {
  const [controller] = useArgonController();
  const { miniSidenav } = controller || {};

  const handleOpen = () => {
    if (onOpenIngest) {
      onOpenIngest();
    } else {
      window.dispatchEvent(new CustomEvent("open-ingest-modal"));
    }
  };

  if (miniSidenav) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", pb: 2 }}>
        <Tooltip title="Ingest Scraped JSON" placement="right" arrow>
          <IconButton
            onClick={handleOpen}
            sx={{
              background: "linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)",
              color: "#ffffff",
              p: 1.2,
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(94, 114, 228, 0.35)",
              "&:hover": {
                background: "linear-gradient(310deg, #4b5fcc 0%, #6f4ecc 100%)",
              },
            }}
          >
            <CloudUploadRoundedIcon sx={{ fontSize: "20px" }} />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <Button
        variant="contained"
        fullWidth
        onClick={handleOpen}
        startIcon={<CloudUploadRoundedIcon sx={{ fontSize: "17px !important" }} />}
        sx={{
          background: "linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)",
          color: "#ffffff",
          textTransform: "none",
          fontFamily: '"Open Sans", sans-serif',
          fontWeight: 600,
          fontSize: "12.5px",
          py: 1,
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(94, 114, 228, 0.3)",
          "&:hover": {
            background: "linear-gradient(310deg, #4b5fcc 0%, #6f4ecc 100%)",
          },
        }}
      >
        + Ingest Scraped JSON
      </Button>
    </Box>
  );
}

SidenavFooter.propTypes = {
  onOpenIngest: PropTypes.func,
};

export default SidenavFooter;