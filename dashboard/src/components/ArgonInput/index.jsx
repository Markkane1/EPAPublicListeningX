
import { forwardRef } from "react";

import PropTypes from "prop-types";

import ArgonInputRoot from "components/ArgonInput/ArgonInputRoot";

import { useArgonController } from "context";

const ArgonInput = forwardRef(({ size, error, success, disabled, ...rest }, ref) => {
  const [controller] = useArgonController();
  const { darkMode } = controller;

  return (
    <ArgonInputRoot {...rest} ref={ref} ownerState={{ size, error, success, disabled, darkMode }} />
  );
});

ArgonInput.defaultProps = {
  size: "medium",
  error: false,
  success: false,
  disabled: false,
};

ArgonInput.propTypes = {
  size: PropTypes.oneOf(["small", "medium", "large"]),
  error: PropTypes.bool,
  success: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default ArgonInput;