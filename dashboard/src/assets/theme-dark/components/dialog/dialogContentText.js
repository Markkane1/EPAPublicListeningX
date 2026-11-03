
import typography from "assets/theme-dark/base/typography";
import colors from "assets/theme-dark/base/colors";

const { size } = typography;
const { text } = colors;

const dialogContentText = {
  styleOverrides: {
    root: {
      fontSize: size.md,
      color: text.main,
    },
  },
};

export default dialogContentText;