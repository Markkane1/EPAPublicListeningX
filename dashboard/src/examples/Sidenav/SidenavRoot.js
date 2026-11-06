
import Drawer from "@mui/material/Drawer";
import { styled } from "@mui/material/styles";

export default styled(Drawer)(({ theme, ownerState }) => {
  const { palette, boxShadows, transitions, breakpoints, functions } = theme;
  const { darkSidenav, miniSidenav, layout, darkMode } = ownerState;

  const sidebarWidth = 264;
  const miniSidebarWidth = 88;
  const { white, background, transparent } = palette;
  const { xxl } = boxShadows;
  const { pxToRem } = functions;

  const isDark = Boolean(darkSidenav || darkMode || palette.mode === "dark");

  let bgColor;

  if (layout === "landing") {
    bgColor = transparent.main;
  } else if (isDark) {
    bgColor = background?.dark || "#0f172a";
  } else {
    bgColor = white.main;
  }

  const drawerOpenStyles = () => ({
    transform: "translateX(0)",
    overflowX: "hidden",
    width: sidebarWidth,
    zIndex: 1300,
    visibility: "visible",
    pointerEvents: "auto",
    transition: transitions.create(["transform", "width", "visibility"], {
      easing: transitions.easing.sharp,
      duration: transitions.duration.enteringScreen,
    }),

    [breakpoints.up("lg")]: {
      backgroundColor: bgColor,
      boxShadow: darkSidenav ? "none" : xxl,
      marginBottom: darkSidenav ? 0 : "inherit",
      left: "0",
      width: sidebarWidth,
      overflowX: "hidden",
      transform: "translateX(0)",
      transition: transitions.create(["width", "background-color"], {
        easing: transitions.easing.sharp,
        duration: transitions.duration.enteringScreen,
      }),
    },
  });

  const drawerCloseStyles = () => ({
    transform: `translateX(-100%)`,
    overflowX: "hidden",
    visibility: "hidden",
    pointerEvents: "none",
    transition: transitions.create(["transform", "width", "visibility"], {
      easing: transitions.easing.sharp,
      duration: transitions.duration.leavingScreen,
    }),

    [breakpoints.up("lg")]: {
      visibility: "visible",
      pointerEvents: "auto",
      backgroundColor: bgColor,
      boxShadow: darkSidenav ? "none" : xxl,
      marginBottom: darkSidenav ? 0 : "inherit",
      left: "0",
      width: pxToRem(miniSidebarWidth),
      overflowX: "hidden",
      transform: "translateX(0)",
      transition: transitions.create(["width", "background-color"], {
        easing: transitions.easing.sharp,
        duration: transitions.duration.shorter,
      }),
    },
  });

  return {
    [breakpoints.down("lg")]: {
      pointerEvents: miniSidenav ? "none" : "auto",
      width: miniSidenav ? 0 : "auto",
      position: "fixed",
      zIndex: 1300,
    },
    "& .MuiDrawer-paper": {
      boxShadow: isDark ? "0 10px 30px 0 rgba(0, 0, 0, 0.4)" : xxl,
      border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
      backgroundColor: bgColor,
      overflowX: "hidden !important",
      ...(miniSidenav ? drawerCloseStyles() : drawerOpenStyles()),
    },
  };
});