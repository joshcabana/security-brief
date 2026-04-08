const JSON_HTML_ESCAPE_MAP = Object.freeze({
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
});

const JSON_HTML_ESCAPE_PATTERN = /[<>&\u2028\u2029]/g;

/**
 * Serialises JSON for inline HTML script contexts without allowing `</script>`
 * or other parser-breaking characters to terminate the tag early.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function serializeJsonForHtml(value) {
  return JSON.stringify(value).replace(
    JSON_HTML_ESCAPE_PATTERN,
    (match) => JSON_HTML_ESCAPE_MAP[match] ?? match,
  );
}
