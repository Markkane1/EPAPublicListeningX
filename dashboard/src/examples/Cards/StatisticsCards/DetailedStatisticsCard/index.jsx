import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useArgonController } from "context";

function parseNumberParts(val) {
  if (val === null || val === undefined || val === '' || val === '-' || val === '—') {
    return null;
  }
  const str = String(val).trim();
  const match = str.match(/^([^\d\-+.]*?)([-+]?\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const prefix = match[1] || '';
  const numStr = match[2].replace(/,/g, '');
  const suffix = match[3] || '';
  const num = parseFloat(numStr);
  if (isNaN(num)) return null;
  const dotIdx = numStr.indexOf('.');
  const decimals = dotIdx !== -1 ? (numStr.length - dotIdx - 1) : 0;
  return { prefix, num, suffix, decimals };
}

function formatValue(n, decimals, prefix = '', suffix = '') {
  const formatted = decimals > 0
    ? n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(n).toLocaleString();
  return `${prefix}${formatted}${suffix}`;
}

export function AnimatedNumber({ value, duration = 650 }) {
  const parts = parseNumberParts(value);
  const isReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [displayValue, setDisplayValue] = useState(() => {
    if (!parts) return value ?? '—';
    if (isReduced) return formatValue(parts.num, parts.decimals, parts.prefix, parts.suffix);
    return formatValue(0, parts.decimals, parts.prefix, parts.suffix);
  });

  const prevNumRef = useRef(null);

  useEffect(() => {
    if (!parts) {
      setDisplayValue(value ?? '—');
      prevNumRef.current = null;
      return;
    }

    if (isReduced) {
      setDisplayValue(formatValue(parts.num, parts.decimals, parts.prefix, parts.suffix));
      prevNumRef.current = parts.num;
      return;
    }

    const startNum = prevNumRef.current !== null ? prevNumRef.current : 0;
    const targetNum = parts.num;
    prevNumRef.current = targetNum;

    if (startNum === targetNum && prevNumRef.current !== null) {
      setDisplayValue(formatValue(targetNum, parts.decimals, parts.prefix, parts.suffix));
      return;
    }

    const startTime = performance.now();
    let frameId;

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startNum + (targetNum - startNum) * ease;
      setDisplayValue(formatValue(current, parts.decimals, parts.prefix, parts.suffix));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(formatValue(targetNum, parts.decimals, parts.prefix, parts.suffix));
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <>{displayValue}</>;
}

AnimatedNumber.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  duration: PropTypes.number,
};

function DetailedStatisticsCard({
  bgColor = "white",
  title = "",
  count = "0",
  percentage = { color: "success", count: "", text: "" },
  icon = { color: "info", component: null },
  direction = "right",
  loading = false,
  delay = 0,
}) {
  const [controller] = useArgonController();
  const { darkMode } = controller || {};
  const isWhite = bgColor === "white";

  const gradientColors = {
    primary: "#16a34a",
    secondary: "#475569",
    info: "#0284c7",
    success: "#16a34a",
    warning: "#d97706",
    error: "#dc2626",
    dark: "#0f172a",
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

  const currentBadge = darkMode
    ? badgeColorsDark[percentage.color] || badgeColorsDark.secondary
    : badgeColorsLight[percentage.color] || badgeColorsLight.secondary;

  const delaySec = typeof delay === "number" ? `${delay}s` : (delay || "0s");

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
        backgroundColor: isWhite ? (darkMode ? "#0f172a" : "#ffffff") : bgColor,
        transition: "transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.18s ease, border-color 0.18s ease",
        animation: `statCardEnter 0.26s cubic-bezier(0.16, 1, 0.3, 1) ${delaySec} both`,
        "@keyframes statCardEnter": {
          from: { opacity: 0, transform: "translateY(6px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
        },
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: darkMode ? "rgba(34, 197, 94, 0.35)" : "#16a34a",
          boxShadow: darkMode ? "0 12px 28px rgba(0, 0, 0, 0.45)" : "0 8px 20px 0 rgba(0, 0, 0, 0.08)",
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

            {loading ? (
              <Box
                sx={{
                  height: 30,
                  width: "55%",
                  borderRadius: "6px",
                  bgcolor: darkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                  my: 0.5,
                }}
              />
            ) : (
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
                <AnimatedNumber value={count} />
              </Typography>
            )}
          </Box>

          {direction === "right" && <Box sx={{ ml: 2 }}>{iconBox}</Box>}
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center", mt: 1.5, gap: 0.8 }}>
            <Box
              sx={{
                height: 18,
                width: "60%",
                borderRadius: "4px",
                bgcolor: darkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
              }}
            />
          </Box>
        ) : percentage && (
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
                }}
              >
                <AnimatedNumber value={percentage.count} />
              </Box>
            )}

            {percentage.text && (
              <Typography
                variant="button"
                sx={{
                  fontFamily: '"Open Sans", sans-serif',
                  fontSize: "11px",
                  fontWeight: 500,
                  color: isWhite ? (darkMode ? "#94a3b8" : "#8392ab") : "rgba(255, 255, 255, 0.75)",
                  lineHeight: 1.4,
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
    color: PropTypes.oneOf([
      "primary",
      "secondary",
      "info",
      "success",
      "warning",
      "error",
      "dark",
      "white",
    ]),
    count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    text: PropTypes.string,
  }),
  icon: PropTypes.shape({
    color: PropTypes.oneOf([
      "primary",
      "secondary",
      "info",
      "success",
      "warning",
      "error",
      "dark",
    ]),
    component: PropTypes.node.isRequired,
  }),
  direction: PropTypes.oneOf(["right", "left"]),
  loading: PropTypes.bool,
  delay: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default DetailedStatisticsCard;
