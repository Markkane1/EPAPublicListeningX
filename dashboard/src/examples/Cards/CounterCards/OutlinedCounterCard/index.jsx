
import CountUp from "react-countup";

import PropTypes from "prop-types";

import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

import colors from "assets/theme/base/colors";
import borders from "assets/theme/base/borders";

function OutlinedCounterCard({ color, count, title, prefix, suffix }) {
  const { secondary } = colors;
  const { borderWidth } = borders;

  return (
    <ArgonBox
      borderRadius="md"
      border={`${borderWidth[1]} dashed ${secondary.main}`}
      textAlign="center"
      py={2}
    >
      <ArgonTypography variant="h6" color={color} fontWeight="medium" textTransform="capitalize">
        {title}
      </ArgonTypography>
      <ArgonTypography variant="h4" fontWeight="bold">
        {prefix && (
          <ArgonTypography component="span" variant="h5" fontWeight="bold">
            {prefix}
          </ArgonTypography>
        )}
        <ArgonBox display="inline-block" color="inherit" mx={0.5}>
          <CountUp end={count} duration={1} separator="," />
        </ArgonBox>
        {suffix && (
          <ArgonTypography component="span" variant="h5" fontWeight="bold">
            {suffix}
          </ArgonTypography>
        )}
      </ArgonTypography>
    </ArgonBox>
  );
}

OutlinedCounterCard.defaultProps = {
  color: "info",
  prefix: "",
  suffix: "",
};

OutlinedCounterCard.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string.isRequired,
  prefix: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  suffix: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
};

export default OutlinedCounterCard;