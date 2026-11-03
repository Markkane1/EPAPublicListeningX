import PropTypes from "prop-types";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";

function Footer({ company, links }) {
  const { href = "https://epd.punjab.gov.pk/", name = "Punjab EPA Intelligence" } = company || {};

  return (
    <Box
      component="footer"
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: "center",
        py: 3,
        px: 1,
        mt: 4,
        borderTop: "1px solid #edf2f7",
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          fontSize: "13px",
          color: "#8392ab",
          fontFamily: '"Open Sans", sans-serif',
          gap: 0.5,
        }}
      >
        <span>&copy; {new Date().getFullYear()}</span>
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "#5e72e4",
            fontWeight: 600,
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {name}
        </Link>
        <span>• Dedicated Smog & Air Quality Monitoring in Pakistani Punjab</span>
      </Box>

      <Box
        component="ul"
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2.5,
          listStyle: "none",
          p: 0,
          m: 0,
        }}
      >
        {links.map((link) => (
          <Box component="li" key={link.name}>
            <Link
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                fontSize: "12.5px",
                fontWeight: 500,
                color: "#67748e",
                textDecoration: "none",
                fontFamily: '"Open Sans", sans-serif',
                transition: "color 0.15s ease",
                "&:hover": { color: "#5e72e4", textDecoration: "underline" },
              }}
            >
              {link.name}
            </Link>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

Footer.defaultProps = {
  company: { href: "https://epd.punjab.gov.pk/", name: "Punjab EPA Intelligence" },
  links: [
    { href: "https://epd.punjab.gov.pk/", name: "EPA Punjab Official" },
    { href: "https://www.iqair.com/pakistan/punjab/lahore", name: "IQAir Lahore Live" },
    { href: "https://x.com", name: "X.com Source Feed" },
  ],
};

Footer.propTypes = {
  company: PropTypes.shape({
    href: PropTypes.string,
    name: PropTypes.string,
  }),
  links: PropTypes.arrayOf(
    PropTypes.shape({
      href: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
};

export default Footer;