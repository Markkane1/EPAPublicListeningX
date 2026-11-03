
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";

export default styled(Box, {
  shouldForwardProp: (prop) =>
    ![
      "variant",
      "bgColor",
      "color",
      "opacity",
      "borderRadius",
      "shadow",
      "ownerState",
    ].includes(prop),
})(({ theme, ownerState }) => {
  const { palette, functions, borders, boxShadows } = theme;
  const {
    variant = "contained",
    bgColor = "transparent",
    color = "dark",
    opacity = 1,
    borderRadius = "none",
    shadow = "none",
  } = ownerState || {};

  const { gradients, grey, white } = palette;
  const { linearGradient } = functions;
  const { borderRadius: radius } = borders;

  const greyColors = grey
    ? {
        "grey-100": grey[100],
        "grey-200": grey[200],
        "grey-300": grey[300],
        "grey-400": grey[400],
        "grey-500": grey[500],
        "grey-600": grey[600],
        "grey-700": grey[700],
        "grey-800": grey[800],
        "grey-900": grey[900],
      }
    : {};

  const validGradients = [
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "dark",
    "light",
  ];

  const validColors = [
    "transparent",
    "white",
    "black",
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "light",
    "dark",
    "text",
    "grey-100",
    "grey-200",
    "grey-300",
    "grey-400",
    "grey-500",
    "grey-600",
    "grey-700",
    "grey-800",
    "grey-900",
  ];

  const validBorderRadius = ["xs", "sm", "md", "lg", "xl", "xxl", "section"];
  const validBoxShadows = ["xs", "sm", "md", "lg", "xl", "xxl", "inset"];

  let backgroundValue = bgColor;

  if (variant === "gradient") {
    backgroundValue =
      validGradients.includes(bgColor) && gradients && gradients[bgColor]
        ? linearGradient(gradients[bgColor].main, gradients[bgColor].state)
        : white
        ? white.main
        : "#ffffff";
  } else if (validColors.includes(bgColor)) {
    backgroundValue = palette[bgColor]
      ? palette[bgColor].main
      : greyColors[bgColor] || bgColor;
  } else {
    backgroundValue = bgColor;
  }

  let colorValue = color;

  if (validColors.includes(color)) {
    colorValue = palette[color]
      ? palette[color].main
      : greyColors[color] || color;
  }

  let borderRadiusValue = borderRadius;

  if (validBorderRadius.includes(borderRadius) && radius) {
    borderRadiusValue = radius[borderRadius];
  }

  let boxShadowValue = boxShadows;

  if (validBoxShadows.includes(shadow) && boxShadows) {
    boxShadowValue = boxShadows[shadow];
  }

  return {
    opacity,
    background: backgroundValue,
    color: colorValue,
    borderRadius: borderRadiusValue,
    boxShadow: boxShadowValue,
  };
});