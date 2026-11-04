import React from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useArgonController } from "context";

function DetailedStatisticsCard({
  bgColor = "white",
  title = "",
  count = "0",
  percentage = { color: "success", count: "", text: "" },
  icon = { color: "info", component: null },
  direction = "right",
}) {
  const [controller] = useArgonController();
  const { darkMode } = controller || {};
  const isWhite = bgColor === "white";

  const gradientColors = {
    primary: "linear-gradient(310deg, #5e72e4 0%, #825ee4 100%)",
    secondary: "linear-gradient(310deg, #627594 0%, #a8b8d8 100%)",
    info: "linear-gradient(310deg, #1171ef 0%, #0b6a78 100%)",
    success: "linear-gradient(310deg, #0b5d3b 0%, #0e6a68 100%)",
    warning: "linear-gradient(310deg, #fb6340 0%, #fbb140 100%)",
    error: "linear-gradient(310deg, #f5365c 0%, #f56036 100%)",
    dark: "linear-gradient(310deg, #212529 0%, #212229 100%)",
  };

  const badgeColorsLight = {
    success: { bg: "#e6f8f0", text: "#0b5d3b" },
    error: { bg: "#fde8e8", text: "#f5365c" },
    warning: { bg: "#fef3e2", text: "#fb6340" },
    info: { bg: "#e7f6fd", text: "#1171ef" },
    secondary: { bg: "#f1f3f9", text: "#8392ab" },
  };

  const badgeColorsDark = {
    success: { bg: "rgba(45, 206, 137, 0.2)", text: "#4ade80" },
    error: { bg: "rgba(245, 54, 92, 0.2)", text: "#f87171" },
    warning: { bg: "rgba(251, 99, 64, 0.2)", text: "#fb923c" },
    info: { bg: "rgba(17, 113, 239, 0.2)", text: "#38bdf8" },
    secondary: { bg: "rgba(255, 255, 255, 0.08)", text: "#94a3b8" },
  };

  const badgeColors = darkMode ? badgeColorsDark : badgeColorsLight;
  const currentBadge = badgeColors[percentage?.color] || badgeColors.secondary;

  const iconBox = icon && (
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: gradientColors[icon.color] || gradientColors.info,
        boxShadow: "0 4px 14px 0 rgba(0, 0, 0, 0.12)",
        color: "#ffffff",
        flexShrink: 0,
        "& svg": {
          fontSize: "22px",
          color: "#ffffff",
        },
      }}
    >
      {icon.component}
    </Box>
  );

  return (
    <Card
      sx={{
        borderRadius: "16px",
        border: darkMode ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #edf2f7",
        boxShadow: darkMode ? "0 8px 24px rgba(0, 0, 0, 0.35)" : "0 4px 20px 0 rgba(0, 0, 0, 0.05)",
        backgroundColor: isWhite ? (darkMode ? "#111c44" : "#ffffff") : bgColor,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: darkMode ? "0 16px 36px rgba(0, 0, 0, 0.5)" : "0 10px 25px 0 rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {direction === "left" && <Box sx={{ mr: 2 }}>{iconBox}</Box>}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                fontFamily: '"Open Sans", sans-serif',
                fontSize: "11.5px",
                fontWeight: 700,
                color: isWhite ? (darkMode ? "#94a3b8" : "#8392ab") : "rgba(255, 255, 255, 0.8)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                display: "block",
                lineHeight: 1.3,
                mb: 0.5,
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Open Sans", sans-serif',
                fontSize: "26px",
                fontWeight: 700,
                color: isWhite ? (darkMode ? "#ffffff" : "#344767") : "#ffffff",
                lineHeight: 1.2,
                letterSpacing: "-0.5px",
              }}
            >
              {count}
            </Typography>
          </Box>

          {direction === "right" && <Box sx={{ ml: 2 }}>{iconBox}</Box>}
        </Box>

        {percentage && (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1.5, gap: 0.8 }}>
            {percentage.count && (
              <Box
                sx={{
                  px: 1,
                  py: 0.2,
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: currentBadge.bg,
                  color: currentBadge.text,
                  display: "inline-block",
                  lineHeight: 1.4,
                }}
              >
                {percentage.count}
              </Box>
            )}
            {percentage.text && (
              <Typography
                sx={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontSize: "12px",
                  color: isWhite ? (darkMode ? "#94a3b8" : "#8392ab") : "rgba(255, 255, 255, 0.8)",
                  fontWeight: 500,
                }}
              >
                {percentage.text}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Card>
  );
}

DetailedStatisticsCard.propTypes = {
  bgColor: PropTypes.string,
  title: PropTypes.string.isRequired,
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  percentage: PropTypes.shape({
    color: PropTypes.string,
    count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    text: PropTypes.string,
  }),
  icon: PropTypes.shape({
    color: PropTypes.string,
    component: PropTypes.node.isRequired,
  }).isRequired,
  direction: PropTypes.oneOf(["right", "left"]),
};

export default DetailedStatisticsCard;