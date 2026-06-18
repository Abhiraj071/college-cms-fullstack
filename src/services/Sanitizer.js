/**
 * Sanitizer utility to prevent Cross-Site Scripting (XSS) attacks.
 */
export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return str
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
