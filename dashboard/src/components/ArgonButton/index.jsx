import { forwardRef } from "react";
import PropTypes from "prop-types";
import ArgonButtonRoot from "components/ArgonButton/ArgonButtonRoot";

const ArgonButton = forwardRef(
  (
    {
      color = "info",
      variant = "contained",
      size = "medium",
      circular = false,
      iconOnly = false,
      children,
      ...rest
    },
    ref
  ) => (
    <ArgonButtonRoot
      {...rest}
      ref={ref}
      color="primary"
      variant={variant === "gradient" ? "contained" : variant}
      size={size}
      ownerState={{ color, variant, size, circular, iconOnly }}
    >
      {children}
    </ArgonButtonRoot>
  )
);

ArgonButton.propTypes = {
  size: PropTypes.oneOf(["small", "medium", "large"]),
  variant: PropTypes.oneOf(["text", "contained", "outlined", "gradient"]),
  color: PropTypes.oneOf([
    "white",
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "light",
    "dark",
  ]),
  circular: PropTypes.bool,
  iconOnly: PropTypes.bool,
  children: PropTypes.node,
};

export default ArgonButton;