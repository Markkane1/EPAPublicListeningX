import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";

import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";

import {
  useArgonController,
  setMiniSidenav,
  setDarkMode,
} from "context";
import { useAuth } from "../../../context/AuthContext";

function DashboardNavbar({ isMini = false, dataSource = "file", stats = null }) {
  const [controller, dispatch] = useArgonController();
  const { miniSidenav, darkMode } = controller;
  const { user, logout, hasPermission } = useAuth();

  const [openMenu, setOpenMenu] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const routeSegments = location.pathname.split("/").filter(Boolean);
  const currentRoute = routeSegments[routeSegments.length - 1] || "dashboard";

  const routeTitles = {
    dashboard: "Dashboard Overview",
    search: "Keyword Search & Post Fetching",
    posts: "Posts Feed (Full Previews)",
    analytics: "Analytics & Trends",
    audit: "Deduplication Audit",
    noise: "Noise & Learning Engine",
    users: "User Management & Credentials",
    roles: "Role & Permission Policies",
    settings: "Settings",
  };

  const pageTitle = routeTitles[currentRoute] || currentRoute.toUpperCase();

  const handleToggleSidenav = () => {
    setMiniSidenav(dispatch, !miniSidenav);
  };

  const handleOpenMenu = (event) => setOpenMenu(event.currentTarget);
  const handleCloseMenu = () => setOpenMenu(false);
  const handleToggleDarkMode = () => setDarkMode(dispatch, !darkMode);

  const handleOpenUserMenu = (event) => setUserMenuAnchor(event.currentTarget);
  const handleCloseUserMenu = () => setUserMenuAnchor(null);

  const handleLogout = async () => {
    handleCloseUserMenu();
    await logout();
    navigate("/login");
  };

  const handleOpenIngest = () => {
    window.dispatchEvent(new CustomEvent("open-ingest-modal"));
  };

  const canIngest = hasPermission("posts.ingest");

  const computedAlerts = [];
  const peakAqi = stats?.peakAqi;
  if (typeof peakAqi === "number" && peakAqi >= 301) {
    const city = stats?.peakAqiCity || "Punjab";
    computedAlerts.push({
      title: `Hazardous AQI ${peakAqi} in ${city}`,
      detail: "Computed from posts that include a numeric AQI.",
    });
  }

  const getRoleBadgeColor = () => {
    if (!user || !user.role) return "#64748b";
    switch (user.role.name) {
      case "super_admin":
        return "#16a34a";
      case "analyst":
        return "#0284c7";
      case "auditor":
        return "#d97706";
      default:
        return "#64748b";
    }
  };

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{
        backgroundColor: "transparent",
        boxShadow: "none",
        py: 0.5,
        px: 0,
        mb: 2,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          minHeight: "52px",
          width: "100%",
        }}
      >
<Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.2, sm: 1.8 } }}>
          <Tooltip title={miniSidenav ? "Expand Navigation" : "Collapse Navigation"} arrow>
            <IconButton
              size="small"
              onClick={handleToggleSidenav}
              aria-label="Toggle navigation drawer"
              sx={{
                display: { xs: "inline-flex", lg: "none" },
                color: darkMode ? "#cbd5e1" : "#344767",
                backgroundColor: darkMode ? "#0f172a" : "#ffffff",
                border: darkMode ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #e2e8f0",
                borderRadius: "10px",
                p: 0.9,
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9",
                  borderColor: "#16a34a",
                  color: "#16a34a",
                  transform: "scale(1.04)",
                },
              }}
            >
              {miniSidenav ? (
                <MenuRoundedIcon sx={{ fontSize: "20px" }} />
              ) : (
                <MenuOpenRoundedIcon sx={{ fontSize: "20px" }} />
              )}
            </IconButton>
          </Tooltip>

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.2 }}>
              <HomeRoundedIcon sx={{ fontSize: "15px", color: "#8392ab" }} />
              <Typography sx={{ fontSize: "12px", color: "#8392ab", fontWeight: 500 }}>
                / Pages /
              </Typography>
              <Typography sx={{ fontSize: "12px", color: darkMode ? "#e2e8f0" : "#344767", fontWeight: 600, textTransform: "capitalize" }}>
                {currentRoute}
              </Typography>
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Open Sans", sans-serif',
                fontWeight: 700,
                color: darkMode ? "#ffffff" : "#1e293b",
                lineHeight: 1.2,
                fontSize: { xs: "17px", sm: "20px", md: "22px" },
              }}
            >
              {pageTitle}
            </Typography>
          </Box>
        </Box>
<Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap", ml: "auto" }}>
          
          <Tooltip title="Click to choose where posts come from" arrow>
            <Box
              onClick={() => navigate("/settings")}
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 0.8,
                backgroundColor: darkMode ? (dataSource === "x_api" ? "rgba(34, 197, 94, 0.15)" : "#0f172a") : (dataSource === "x_api" ? "#f0fdf4" : "#f1f5f9"),
                color: dataSource === "x_api" ? "#22c55e" : (darkMode ? "#94a3b8" : "#334155"),
                px: 1.4,
                py: 0.5,
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.2px",
                border: dataSource === "x_api" ? (darkMode ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid #bbf7d0") : (darkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #cbd5e1"),
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              <Box
                sx={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: dataSource === "x_api" ? "#22c55e" : "#64748b",
                  boxShadow: dataSource === "x_api" ? "0 0 0 2px rgba(34, 197, 94, 0.25)" : "none",
                }}
              />
              {dataSource === "x_api" ? "Live X" : "Saved files"}
            </Box>
          </Tooltip>

          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 0.8,
              backgroundColor: darkMode ? "rgba(2, 132, 199, 0.15)" : "#e0f2fe",
              color: darkMode ? "#38bdf8" : "#0369a1",
              px: 1.4,
              py: 0.5,
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.3px",
              border: darkMode ? "1px solid rgba(56, 189, 248, 0.25)" : "1px solid #bae6fd",
            }}
          >
            <Box
              sx={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#0284c7",
                boxShadow: "0 0 0 2px rgba(2, 132, 199, 0.2)",
              }}
            />
            Punjab, Pakistan
          </Box>

          {canIngest && (
            <Button
              variant="contained"
              size="small"
              onClick={handleOpenIngest}
              startIcon={<CloudUploadRoundedIcon sx={{ fontSize: "16px !important" }} />}
              sx={{
                backgroundColor: "#16a34a",
                color: "#ffffff",
                textTransform: "none",
                fontFamily: '"Open Sans", sans-serif',
                fontWeight: 600,
                fontSize: { xs: "11px", sm: "12.5px" },
                borderRadius: "8px",
                px: { xs: 1.2, sm: 2 },
                py: 0.6,
                boxShadow: "none",
                whiteSpace: "nowrap",
                "&:hover": {
                  backgroundColor: "#15803d",
                  boxShadow: "none",
                },
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>+ </Box>
              Ingest
              <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}> Scraped JSON</Box>
            </Button>
          )}

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              height: "22px",
              my: "auto",
              mx: 0.3,
              borderColor: darkMode ? "rgba(255, 255, 255, 0.12)" : "#cbd5e1",
              display: { xs: "none", sm: "block" },
            }}
          />

          <IconButton
            size="small"
            onClick={handleToggleDarkMode}
            title="Toggle Dark Mode"
            sx={{
              color: darkMode ? "#cbd5e1" : "#64748b",
              backgroundColor: darkMode ? "#0f172a" : "#ffffff",
              border: darkMode ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #e2e8f0",
              borderRadius: "8px",
              p: 0.8,
              "&:hover": { backgroundColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9" },
            }}
          >
            {darkMode ? (
              <LightModeRoundedIcon sx={{ fontSize: "18px" }} />
            ) : (
              <DarkModeRoundedIcon sx={{ fontSize: "18px" }} />
            )}
          </IconButton>

          <IconButton
            size="small"
            onClick={handleOpenMenu}
            sx={{
              color: darkMode ? "#cbd5e1" : "#64748b",
              backgroundColor: darkMode ? "#0f172a" : "#ffffff",
              border: darkMode ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #e2e8f0",
              borderRadius: "8px",
              p: 0.8,
              "&:hover": { backgroundColor: darkMode ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9" },
            }}
          >
            <NotificationsRoundedIcon sx={{ fontSize: "18px" }} />
          </IconButton>

          {user && (
            <>
              <Box
                onClick={handleOpenUserMenu}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.2,
                  py: 0.4,
                  borderRadius: "24px",
                  border: darkMode ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid #e2e8f0",
                  backgroundColor: darkMode ? "#0f172a" : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                    transform: "translateY(-1px)"
                  }
                }}
              >
                <Avatar
                  src={user.avatar}
                  alt={user.fullName || user.username}
                  sx={{ width: 28, height: 28, fontSize: "12px", bgcolor: getRoleBadgeColor() }}
                >
                  {(user.fullName || user.username || "U")[0].toUpperCase()}
                </Avatar>

                <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "left" }}>
                  <Typography sx={{ fontSize: "12.5px", fontWeight: 700, color: darkMode ? "#ffffff" : "#1e293b", lineHeight: 1.2 }}>
                    {user.fullName || user.username}
                  </Typography>
                  <Typography sx={{ fontSize: "10.5px", fontWeight: 600, color: getRoleBadgeColor() }}>
                    {user.role?.displayName || user.role?.name}
                  </Typography>
                </Box>
              </Box>

              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleCloseUserMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  sx: {
                    borderRadius: "14px",
                    mt: 1.5,
                    minWidth: "240px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                    border: darkMode ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #e2e8f0",
                    backgroundColor: darkMode ? "#0f172a" : "#ffffff",
                    p: 1
                  }
                }}
              >
                <Box sx={{ px: 1.5, py: 1 }}>
                  <Typography sx={{ fontSize: "13.5px", fontWeight: 700, color: darkMode ? "#ffffff" : "#1e293b" }}>
                    {user.fullName || user.username}
                  </Typography>
                  <Typography sx={{ fontSize: "11.5px", color: "#64748b", mb: 0.8 }}>
                    @{user.username} ({user.email})
                  </Typography>
                  <Chip
                    icon={<ShieldRoundedIcon sx={{ fontSize: "13px !important", color: "inherit" }} />}
                    label={user.role?.displayName || user.role?.name}
                    size="small"
                    sx={{
                      fontSize: "11px",
                      fontWeight: 700,
                      backgroundColor: darkMode ? "rgba(255, 255, 255, 0.1)" : "#f1f5f9",
                      color: darkMode ? "#ffffff" : "#334155"
                    }}
                  />
                </Box>

                <Divider sx={{ my: 0.8 }} />

                {hasPermission("users.view") && (
                  <MenuItem onClick={() => { handleCloseUserMenu(); navigate("/users"); }} sx={{ borderRadius: "8px", py: 0.8 }}>
                    <ListItemIcon>
                      <PeopleRoundedIcon sx={{ fontSize: "18px", color: "#64748b" }} />
                    </ListItemIcon>
                    <Typography sx={{ fontSize: "13px", fontWeight: 600, color: darkMode ? "#ffffff" : "#1e293b" }}>
                      User Management
                    </Typography>
                  </MenuItem>
                )}

                {hasPermission("roles.view") && (
                  <MenuItem onClick={() => { handleCloseUserMenu(); navigate("/roles"); }} sx={{ borderRadius: "8px", py: 0.8 }}>
                    <ListItemIcon>
                      <AdminPanelSettingsRoundedIcon sx={{ fontSize: "18px", color: "#64748b" }} />
                    </ListItemIcon>
                    <Typography sx={{ fontSize: "13px", fontWeight: 600, color: darkMode ? "#ffffff" : "#1e293b" }}>
                      Role Policies
                    </Typography>
                  </MenuItem>
                )}

                <Divider sx={{ my: 0.8 }} />

                <Button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Sign out"
                  startIcon={<LogoutRoundedIcon sx={{ fontSize: "18px" }} />}
                  sx={{
                    width: "100%",
                    justifyContent: "flex-start",
                    borderRadius: "8px",
                    py: 0.8,
                    px: 1.5,
                    color: "#ef4444",
                    textTransform: "none",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  Sign out
                </Button>
              </Menu>
            </>
          )}

          <Menu
            anchorEl={openMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            open={Boolean(openMenu)}
            onClose={handleCloseMenu}
            PaperProps={{
              sx: {
                borderRadius: "12px",
                mt: 1.5,
                boxShadow: darkMode ? "0 10px 30px rgba(0,0,0,0.5)" : "0 10px 30px rgba(0,0,0,0.1)",
                border: darkMode ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #e2e8f0",
                backgroundColor: darkMode ? "#0f172a" : "#ffffff",
                minWidth: "280px",
              },
            }}
          >
            {computedAlerts.length === 0 ? (
              <Box role="status" sx={{ px: 1.5, py: 1.4 }}>
                <Typography sx={{ fontSize: "13px", fontWeight: 600, color: darkMode ? "#cbd5e1" : "#475569" }}>
                  There are no alerts.
                </Typography>
              </Box>
            ) : (
              computedAlerts.map((alert) => (
                <Box key={alert.title} role="status" sx={{ px: 1.5, py: 1.2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
                        color: "#ef4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <WarningAmberRoundedIcon sx={{ fontSize: "19px" }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: "13px", fontWeight: 700, color: darkMode ? "#ffffff" : "#1e293b" }}>
                        {alert.title}
                      </Typography>
                      <Typography sx={{ fontSize: "11px", color: darkMode ? "#94a3b8" : "#64748b" }}>
                        {alert.detail}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))
            )}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

DashboardNavbar.propTypes = {
  isMini: PropTypes.bool,
  dataSource: PropTypes.string,
  stats: PropTypes.object,
};

export default DashboardNavbar;