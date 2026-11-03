
import colors from "assets/theme/base/colors";

const { info, dark } = colors;

const globals = {
  html: {
    scrollBehavior: "smooth",
    boxSizing: "border-box",
    maxWidth: "100%",
  },
  body: {
    overflowX: "hidden",
    maxWidth: "100%",
  },
  "*, *::before, *::after": {
    boxSizing: "border-box",
  },
  "a, a:link, a:visited": {
    textDecoration: "none !important",
  },
  "a.link, .link, a.link:link, .link:link, a.link:visited, .link:visited": {
    color: `${dark.main} !important`,
    transition: "color 150ms ease-in !important",
  },
  "a.link:hover, .link:hover, a.link:focus, .link:focus": {
    color: `${info.main} !important`,
  },
  hr: {
    borderBottom: 0,
    borderLeft: 0,
    borderRight: 0,
  },
};

export default globals;