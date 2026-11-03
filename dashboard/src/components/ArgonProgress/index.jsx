
import { forwardRef } from "react";

import PropTypes from "prop-types";

import ArgonTypography from "components/ArgonTypography";

import ArgonProgressRoot from "components/ArgonProgress/ArgonProgressRoot";

const ArgonProgress = forwardRef(({ variant, color, value, label, ...rest }, ref) => (
  <>
    {label && (
      <ArgonTypography variant="button" fontWeight="medium" color="text">
        {value}%
      </ArgonTypography>
    )}
    <ArgonProgressRoot
      {...rest}
      ref={ref}
      variant="determinate"
      value={value}
      ownerState={{ color, value, variant }}
    />
  </>
));

ArgonProgress.defaultProps = {
  variant: "contained",
  color: "info",
  value: 0,
  label: false,
};

ArgonProgress.propTypes = {
  variant: PropTypes.oneOf(["contained", "gradient"]),
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "light",
    "dark",
  ]),
  value: PropTypes.number,
  label: PropTypes.bool,
};

export default ArgonProgress;