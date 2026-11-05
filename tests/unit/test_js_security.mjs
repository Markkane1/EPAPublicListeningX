import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeUrl, escapeHtml, sanitizeCsvCell } from '../../dashboard/src/utils/security.js';

test('Security Utils - sanitizeUrl', async (t) => {
  await t.test('allows valid https URLs', () => {
    assert.equal(sanitizeUrl('https://x.com/user/status/123'), 'https://x.com/user/status/123');
    assert.equal(sanitizeUrl('http://localhost:8080/portal'), 'http://localhost:8080/portal');
  });

  await t.test('allows relative root paths', () => {
    assert.equal(sanitizeUrl('/dashboard'), '/dashboard');
    assert.equal(sanitizeUrl('/api/stats'), '/api/stats');
  });

  await t.test('blocks protocol-relative // URLs (open redirect)', () => {
    assert.equal(sanitizeUrl('//evil.com/phish'), '#');
  });

  await t.test('blocks javascript: and data: pseudo-protocols', () => {
    assert.equal(sanitizeUrl('javascript:alert(1)'), '#');
    assert.equal(sanitizeUrl('JAVASCRIPT:alert(document.cookie)'), '#');
    assert.equal(sanitizeUrl('data:text/html,<script>alert(1)</script>'), '#');
    assert.equal(sanitizeUrl('vbscript:msgbox(1)'), '#');
  });

  await t.test('handles empty or malformed inputs with fallback', () => {
    assert.equal(sanitizeUrl(null), '#');
    assert.equal(sanitizeUrl(undefined), '#');
    assert.equal(sanitizeUrl('', '/fallback'), '/fallback');
    assert.equal(sanitizeUrl('   '), '#');
  });
});

test('Security Utils - escapeHtml', async (t) => {
  await t.test('escapes HTML special characters', () => {
    const raw = '<script>alert("XSS & attack\'s")</script>';
    const expected = '&lt;script&gt;alert(&quot;XSS &amp; attack&#039;s&quot;)&lt;/script&gt;';
    assert.equal(escapeHtml(raw), expected);
  });

  await t.test('handles null and undefined safely', () => {
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
    assert.equal(escapeHtml(12345), '12345');
  });
});

test('Security Utils - sanitizeCsvCell (Formula Injection CWE-1236)', async (t) => {
  await t.test('neutralizes leading =, +, -, @, \\t, \\r', () => {
    assert.equal(sanitizeCsvCell('=1+1'), "''=1+1".slice(1)); // begins with '
    assert.equal(sanitizeCsvCell('+cmd|"/c calc"!A0'), "'+cmd|\"/c calc\"!A0");
    assert.equal(sanitizeCsvCell('-5+2'), "'-5+2");
    assert.equal(sanitizeCsvCell('@SUM(A1:A10)'), "'@SUM(A1:A10)");
    assert.equal(sanitizeCsvCell('\tmalicious'), "'\tmalicious");
  });

  await t.test('leaves benign values untouched', () => {
    assert.equal(sanitizeCsvCell('Normal air quality text'), 'Normal air quality text');
    assert.equal(sanitizeCsvCell(450), '450');
  });
});
