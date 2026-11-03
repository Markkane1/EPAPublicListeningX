import Avatar from "@mui/material/Avatar";
import { styled } from "@mui/material/styles";

export default styled(Avatar)(({ theme, ownerState }) => {
  const { palette, functions, typography, boxShadows } = theme;
  const { shadow = "none", bgColor = "transparent", size = "md" } = ownerState || {};

  const { gradients, transparent } = palette;
  const { pxToRem, linearGradient } = functions;
  const { size: fontSize, fontWeightBold } = typography;

  const backgroundValue =
    !bgColor || bgColor === "transparent" || !gradients || !gradients[bgColor]
      ? (transparent ? transparent.main : "transparent")
      : linearGradient(gradients[bgColor].main, gradients[bgColor].state);

  let sizeValue;

  switch (size) {
    case "xs":
      sizeValue = {
        width: pxToRem(24),
        height: pxToRem(24),
        fontSize: fontSize ? fontSize.xs : "0.75rem",
      };
      break;
    case "sm":
      sizeValue = {
        width: pxToRem(36),
        height: pxToRem(36),
        fontSize: fontSize ? fontSize.sm : "0.875rem",
      };
      break;
    case "lg":
      sizeValue = {
        width: pxToRem(58),
        height: pxToRem(58),
        fontSize: fontSize ? fontSize.sm : "0.875rem",
      };
      break;
    case "xl":
      sizeValue = {
        width: pxToRem(74),
        height: pxToRem(74),
        fontSize: fontSize ? fontSize.md : "1rem",
      };
      break;
    case "xxl":
      sizeValue = {
        width: pxToRem(110),
        height: pxToRem(110),
        fontSize: fontSize ? fontSize.md : "1rem",
      };
      break;
    default: {
      sizeValue = {
        width: pxToRem(48),
        height: pxToRem(48),
        fontSize: fontSize ? fontSize.md : "1rem",
      };
    }
  }

  return {
    background: backgroundValue,
    fontWeight: fontWeightBold,
    boxShadow: boxShadows && boxShadows[shadow] ? boxShadows[shadow] : "none",
    ...sizeValue,
  };
});