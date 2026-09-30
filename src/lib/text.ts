/** Splits plain text from the CMS into paragraphs at blank lines. */
export function paragraphs(text: string | undefined): string[] {
  return (text ?? '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
