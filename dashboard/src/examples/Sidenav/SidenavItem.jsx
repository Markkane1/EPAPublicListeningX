import React from "react";
import PropTypes from "prop-types";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";

import { useArgonController } from "context";

function SidenavItem({ icon, name, active, ...rest }) {
  const [controller] = useArgonController();
  const { miniSidenav, darkSidenav, darkMode } = controller || {};
  const isDark = Boolean(darkSidenav || darkMode);

  const content = (
    <ListItem
      component="li"
      disablePadding
      sx={{
        px: 1.5,
        py: 0.5,
        display: "block",
      }}
    >
      <Box
        {...rest}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: miniSidenav ? "center" : "flex-start",
          width: "100%",
          minHeight: "44px",
          px: miniSidenav ? 0 : 2,
          py: 1,
          borderRadius: "10px",
          cursor: "pointer",
          userSelect: "none",
          transition: "all 0.2s ease-in-out",
          background: active
            ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)"
            : "transparent",
          color: active
            ? "#ffffff"
            : isDark
            ? "#cbd5e1"
            : "#475569",
          boxShadow: active
            ? "0 4px 14px 0 rgba(22, 163, 74, 0.35)"
            : "none",
          "&:hover": {
            backgroundColor: active
              ? undefined
              : isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "#f1f5f9",
            color: active
              ? "#ffffff"
              : isDark
              ? "#ffffff"
              : "#1e293b",
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: miniSidenav ? "auto" : "32px",
            color: active ? "#ffffff" : "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "& svg": {
              fontSize: "19px",
              color: active ? "#ffffff" : "inherit",
            },
          }}
        >
          {icon}
        </ListItemIcon>

        {!miniSidenav && (
          <ListItemText
            primary={name}
            sx={{
              ml: 1,
              my: 0,
              "& .MuiTypography-root": {
                fontFamily: '"Open Sans", sans-serif',
                fontSize: "13px",
                fontWeight: active ? 700 : 500,
                color: "inherit",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            }}
          />
        )}
      </Box>
    </ListItem>
  );

  return miniSidenav ? (
    <Tooltip title={name} placement="right" arrow>
      {content}
    </Tooltip>
  ) : (
    content
  );
}

SidenavItem.propTypes = {
  icon: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  active: PropTypes.bool,
};

export default SidenavItem;