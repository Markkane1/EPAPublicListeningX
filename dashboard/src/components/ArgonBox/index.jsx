import { forwardRef } from "react";
import PropTypes from "prop-types";
import ArgonBoxRoot from "components/ArgonBox/ArgonBoxRoot";

const ArgonBox = forwardRef(
  (
    {
      variant = "contained",
      bgColor = "transparent",
      color = "dark",
      opacity = 1,
      borderRadius = "none",
      shadow = "none",
      sx = {},
      p, px, py, pt, pb, pl, pr,
      m, mx, my, mt, mb, ml, mr,
      display, justifyContent, alignItems, flexDirection, gap,
      width, height, minWidth, maxWidth, minHeight, maxHeight,
      textAlign, position, top, bottom, left, right, zIndex,
      ...rest
    },
    ref
  ) => {
    const spacingSx = {};
    if (p !== undefined) spacingSx.p = p;
    if (px !== undefined) spacingSx.px = px;
    if (py !== undefined) spacingSx.py = py;
    if (pt !== undefined) spacingSx.pt = pt;
    if (pb !== undefined) spacingSx.pb = pb;
    if (pl !== undefined) spacingSx.pl = pl;
    if (pr !== undefined) spacingSx.pr = pr;
    if (m !== undefined) spacingSx.m = m;
    if (mx !== undefined) spacingSx.mx = mx;
    if (my !== undefined) spacingSx.my = my;
    if (mt !== undefined) spacingSx.mt = mt;
    if (mb !== undefined) spacingSx.mb = mb;
    if (ml !== undefined) spacingSx.ml = ml;
    if (mr !== undefined) spacingSx.mr = mr;
    if (display !== undefined) spacingSx.display = display;
    if (justifyContent !== undefined) spacingSx.justifyContent = justifyContent;
    if (alignItems !== undefined) spacingSx.alignItems = alignItems;
    if (flexDirection !== undefined) spacingSx.flexDirection = flexDirection;
    if (gap !== undefined) spacingSx.gap = gap;
    if (width !== undefined) spacingSx.width = width;
    if (height !== undefined) spacingSx.height = height;
    if (minWidth !== undefined) spacingSx.minWidth = minWidth;
    if (maxWidth !== undefined) spacingSx.maxWidth = maxWidth;
    if (minHeight !== undefined) spacingSx.minHeight = minHeight;
    if (maxHeight !== undefined) spacingSx.maxHeight = maxHeight;
    if (textAlign !== undefined) spacingSx.textAlign = textAlign;
    if (position !== undefined) spacingSx.position = position;
    if (top !== undefined) spacingSx.top = top;
    if (bottom !== undefined) spacingSx.bottom = bottom;
    if (left !== undefined) spacingSx.left = left;
    if (right !== undefined) spacingSx.right = right;
    if (zIndex !== undefined) spacingSx.zIndex = zIndex;

    const customSx = typeof sx === "function" ? sx : (Array.isArray(sx) ? Object.assign({}, ...sx) : sx);
    const combinedSx = { ...spacingSx, ...(typeof customSx === "object" ? customSx : {}) };

    return (
      <ArgonBoxRoot
        {...rest}
        ref={ref}
        sx={combinedSx}
        ownerState={{ variant, bgColor, color, opacity, borderRadius, shadow }}
      />
    );
  }
);

ArgonBox.propTypes = {
  variant: PropTypes.oneOf(["contained", "gradient"]),
  bgColor: PropTypes.string,
  color: PropTypes.string,
  opacity: PropTypes.number,
  borderRadius: PropTypes.string,
  shadow: PropTypes.string,
};

export default ArgonBox;