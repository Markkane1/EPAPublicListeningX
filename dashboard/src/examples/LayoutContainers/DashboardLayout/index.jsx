import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Backdrop from "@mui/material/Backdrop";
import { useArgonController, setLayout, setMiniSidenav } from "context";

function DashboardLayout({ children }) {
  const [controller, dispatch] = useArgonController();
  const { miniSidenav, darkMode } = controller;
  const { pathname } = useLocation();

  useEffect(() => {
    setLayout(dispatch, "dashboard");
  }, [pathname, dispatch]);

  const handleCloseMobileDrawer = () => {
    setMiniSidenav(dispatch, true);
  };

  return (
    <Box
      sx={({ breakpoints, transitions }) => ({
        p: { xs: 1.5, sm: 2.5, md: 3.5 },
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
        backgroundColor: darkMode ? "#070d24" : "#f8f9fa",
        [breakpoints.up("lg")]: {
          marginLeft: miniSidenav ? "106px" : "276px",
          width: miniSidenav ? "calc(100% - 106px)" : "calc(100% - 276px)",
          maxWidth: miniSidenav ? "calc(100% - 106px)" : "calc(100% - 276px)",
          transition: transitions.create(["margin-left", "width", "max-width"], {
            easing: transitions.easing.easeInOut,
            duration: transitions.duration.standard,
          }),
        },
      })}
    >
      
      <Backdrop
        open={!miniSidenav}
        onClick={handleCloseMobileDrawer}
        sx={{
          zIndex: 1250,
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(2px)",
          display: { xs: "block", lg: "none" },
        }}
      />

      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "180px",
          background: darkMode
            ? "linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0) 100%)"
            : "linear-gradient(180deg, rgba(94, 114, 228, 0.08) 0%, rgba(248, 249, 250, 0) 100%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1, maxWidth: "1600px", mx: "auto" }}>
        {children}
      </Box>
    </Box>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardLayout;