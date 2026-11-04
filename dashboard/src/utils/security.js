/**
 * Security utilities for EPA Punjab Social Listening Dashboard
 * Hardens URL sanitization, XSS prevention, and export escaping.
 */

/**
 * Validates and sanitizes a URL to prevent javascript: or data: XSS attacks.
 * Allows only standard http:, https:, mailto:, or internal relative paths.
 *
 * @param {string} url - Untrusted URL input
 * @param {string} fallback - Fallback URL if invalid (default: '#')
 * @returns {string} Sanitized safe URL
 */
export function sanitizeUrl(url, fallback = '#') {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();

  // Allow standard web protocols
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Allow safe root-relative paths, but explicitly disallow protocol-relative //
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  // Allow safe mailto
  if (/^mailto:[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmed)) {
    return trimmed;
  }

  return fallback;
}

/**
 * Escapes HTML characters in untrusted strings.
 *
 * @param {*} str - Input value
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Neutralizes CSV formula injection (CWE-1236) by prepending a single quote
 * if the cell content begins with =, +, -, @, \t, or \r.
 *
 * @param {*} val - Cell value
 * @returns {string} Sanitized string
 */
export function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '';
  let str = String(val);
  if (/^[\=\+\-\@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return str;
}
