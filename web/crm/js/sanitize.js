/**
 * Majaz CRM — Sanitize Utility
 * Prevents XSS via innerHTML injection of user data.
 */
window.escapeHTML = function(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
