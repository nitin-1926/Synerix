/** Escape a user-supplied string for interpolation into HTML (email
 * templates, etc.) — prevents markup/anchor injection into mail that
 * legitimately originates from our domain. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
