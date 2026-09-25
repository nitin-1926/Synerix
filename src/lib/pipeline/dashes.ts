/**
 * Hard guarantee: no em/en dashes survive into rendered copy or prompts. A
 * numeric range ("3–4 days", "₹499–999") keeps its meaning as a hyphen; every
 * other dash becomes a comma. One copy — concepting, concept validation and the
 * prompt enhancer each used to carry their own, all mangling ranges to "3, 4".
 */
export function stripDashes(text: string): string {
  return text
    .replace(/(\d)\s*[—–]\s*(?=\d)/g, "$1-")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/,\s*,\s*/g, ", ")
    .trim();
}
