
import { useState } from "react";

import PropTypes from "prop-types";

import Fade from "@mui/material/Fade";

import ArgonBox from "components/ArgonBox";

import ArgonAlertRoot from "components/ArgonAlert/ArgonAlertRoot";
import ArgonAlertCloseIcon from "components/ArgonAlert/ArgonAlertCloseIcon";

function ArgonAlert({ color, dismissible, children, ...rest }) {
  const [alertStatus, setAlertStatus] = useState("mount");

  const handleAlertStatus = () => setAlertStatus("fadeOut");

  const alertTemplate = (mount = true) => (
    <Fade in={mount} timeout={300}>
      <ArgonAlertRoot ownerState={{ color }} {...rest}>
        <ArgonBox display="flex" alignItems="center" color="white">
          {children}
        </ArgonBox>
        {dismissible ? (
          <ArgonAlertCloseIcon onClick={mount ? handleAlertStatus : null}>
            &times;
          </ArgonAlertCloseIcon>
        ) : null}
      </ArgonAlertRoot>
    </Fade>
  );

  switch (true) {
    case alertStatus === "mount":
      return alertTemplate();
    case alertStatus === "fadeOut":
      setTimeout(() => setAlertStatus("unmount"), 400);
      return alertTemplate(false);
    default:
      alertTemplate();
      break;
  }

  return null;
}

ArgonAlert.defaultProps = {
  color: "info",
  dismissible: false,
};

ArgonAlert.propTypes = {
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
  dismissible: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default ArgonAlert;