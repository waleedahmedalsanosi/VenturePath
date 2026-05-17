/**
 * Word-safe truncation. If the input is shorter than maxChars, return it as-is.
 * Otherwise return the longest prefix that ends on a word boundary and is at
 * most maxChars-1 in length, followed by an ellipsis. If no word boundary
 * exists within the window, fall back to hard-cut + ellipsis.
 */
export function truncateWords(input: string | null | undefined, maxChars: number): string {
  if (!input) return '';
  const s = input.trim();
  if (s.length <= maxChars) return s;
  const window = s.slice(0, maxChars - 1);
  const lastSpace = window.lastIndexOf(' ');
  if (lastSpace > Math.floor(maxChars * 0.5)) {
    return window.slice(0, lastSpace) + '…';
  }
  return window + '…';
}
