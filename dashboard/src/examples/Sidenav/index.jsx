import { useEffect } from "react";
import { useLocation, NavLink } from "react-router-dom";
import PropTypes from "prop-types";

import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

import ArgonBox from "components/ArgonBox";
import SidenavItem from "examples/Sidenav/SidenavItem";
import SidenavFooter from "examples/Sidenav/SidenavFooter";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SidenavRoot from "examples/Sidenav/SidenavRoot";

import { useArgonController, setMiniSidenav } from "context";

function Sidenav({ color, brand, brandName, routes, ...rest }) {
  const [controller, dispatch] = useArgonController();
  const { miniSidenav, darkSidenav, layout, darkMode } = controller;
  const isDark = Boolean(darkSidenav || darkMode);
  const location = useLocation();
  const { pathname } = location;
  const itemName = pathname.split("/").slice(1)[0];

  const closeSidenav = () => setMiniSidenav(dispatch, true);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 1200) {
        setMiniSidenav(dispatch, true);
      }
    }

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  const handleNavClick = () => {
    if (window.innerWidth < 1200) {
      closeSidenav();
    }
  };

  const renderRoutes = routes.map(({ type, name, icon, title, key, href, route }) => {
    let returnValue;

    if (type === "route") {
      if (href) {
        returnValue = (
          <Link href={href} key={key} target="_blank" rel="noreferrer" sx={{ textDecoration: "none" }}>
            <SidenavItem name={name} icon={icon} active={key === itemName} />
          </Link>
        );
      } else {
        returnValue = (
          <NavLink to={route} key={key} onClick={handleNavClick} style={{ textDecoration: "none" }}>
            <SidenavItem name={name} icon={icon} active={key === itemName} />
          </NavLink>
        );
      }
    } else if (type === "title") {
      if (miniSidenav) return null;
      returnValue = (
        <Typography
          key={key}
          sx={{
            color: isDark ? "#ffffff" : "#8392ab",
            display: "block",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            pl: 3,
            mt: 2,
            mb: 1,
            letterSpacing: "0.5px",
          }}
        >
          {title}
        </Typography>
      );
    } else if (type === "divider") {
      returnValue = <Divider key={key} sx={{ my: 1, borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)" }} />;
    }

    return returnValue;
  });

  return (
    <SidenavRoot {...rest} variant="permanent" ownerState={{ darkSidenav, miniSidenav, layout, darkMode }}>
      
      <Box
        sx={{
          pt: 3,
          pb: 1.5,
          px: miniSidenav ? 1.5 : 3,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: miniSidenav ? "center" : "flex-start",
        }}
      >
        
        <Box
          onClick={closeSidenav}
          sx={{
            display: { xs: "block", lg: "none" },
            position: "absolute",
            top: 12,
            right: 12,
            cursor: "pointer",
            p: 0.5,
            borderRadius: "6px",
            "&:hover": { backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#f1f5f9" },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: "20px", color: isDark ? "#ffffff" : "#8392ab" }} />
        </Box>

        <NavLink
          to="/"
          onClick={handleNavClick}
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            gap: "10px",
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={brand || "/logo-epa-mark.png"}
              alt="EPA Punjab Logo"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/logo-epa-mark.png";
              }}
              sx={{
                width: "32px",
                height: "32px",
                objectFit: "contain",
                display: "block",
              }}
            />
          </Box>

          {!miniSidenav && (
            <Typography
              sx={{
                fontFamily: '"Open Sans", sans-serif',
                fontWeight: 700,
                fontSize: "12.5px",
                color: isDark ? "#ffffff" : "#1e293b",
                letterSpacing: "0.2px",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              {brandName}
            </Typography>
          )}
        </NavLink>
      </Box>

      <Divider sx={{ my: 1, mx: 2, borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)" }} />

      <List sx={{ px: 0 }}>{renderRoutes}</List>

      <Box sx={{ mt: "auto", pt: 1 }}>
        <SidenavFooter />
      </Box>
    </SidenavRoot>
  );
}

Sidenav.defaultProps = {
  color: "info",
  brand: "",
};

Sidenav.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  brand: PropTypes.string,
  brandName: PropTypes.string.isRequired,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;