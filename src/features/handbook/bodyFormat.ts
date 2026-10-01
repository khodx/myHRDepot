// Parser for a handbook section body. Library bodies are plain text in a small,
// closed Markdown-style subset: "## " headings, **bold**, *italic*, "- " bullets and
// "1. " numbered items. This mirrors `mhd_handbook_body_to_html` (migration 0341),
// which builds the exported document, so what a reader sees in the app matches what
// they get in the PDF / Word file. It produces data (blocks and segments), never
// HTML: the component renders React elements, so nothing in a body can inject markup.

export type MhdHandbookBodyBlock =
  | { kind: 'paragraph'; text: string }
  /** A heading inside a body, shown as a bold lead-in line. */
  | { kind: 'lead'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'numbered'; items: string[] };

export interface MhdHandbookInlineSegment {
  text: string;
  style: 'plain' | 'bold' | 'italic';
}

const HEADING = /^#{1,6}\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;
const NUMBERED = /^[0-9]+[.)]\s+(.*)$/;
// **bold**, or *italic* that does not sit inside a word.
const INLINE = /(\*\*[^*]+\*\*|(?<![*\p{L}\p{N}])\*[^*\s][^*]*\*)/u;

/**
 * Splits a body into blocks. A leading heading that repeats the section's own
 * title is dropped — the outline heading already carries it.
 */
export function mhdParseHandbookBody(
  body: string,
  sectionTitle?: string | null,
): MhdHandbookBodyBlock[] {
  const blocks: MhdHandbookBodyBlock[] = [];
  let paragraph = '';
  let list: { kind: 'bullets' | 'numbered'; items: string[] } | null = null;
  let seenContent = false;

  const flushParagraph = () => {
    if (paragraph) blocks.push({ kind: 'paragraph', text: paragraph });
    paragraph = '';
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };
  const flush = () => {
    flushParagraph();
    flushList();
  };

  for (const rawLine of body.replace(/\r/g, '').split('\n')) {
    const line = rawLine.trim();

    if (line === '') {
      flush();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      const isOwnTitle =
        !seenContent &&
        Boolean(sectionTitle) &&
        heading[1].trim().toLowerCase() === sectionTitle?.trim().toLowerCase();
      if (!isOwnTitle) blocks.push({ kind: 'lead', text: heading[1] });
      seenContent = true;
      continue;
    }

    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const item = bullet ?? numbered;
    if (item) {
      flushParagraph();
      const kind = bullet ? 'bullets' : 'numbered';
      if (list && list.kind !== kind) flushList();
      list ??= { kind, items: [] };
      list.items.push(item[1]);
      seenContent = true;
      continue;
    }

    flushList();
    paragraph = paragraph ? `${paragraph} ${line}` : line;
    seenContent = true;
  }

  flush();
  return blocks;
}

/** Splits one line of text into plain / bold / italic runs. */
export function mhdParseHandbookInline(text: string): MhdHandbookInlineSegment[] {
  return text
    .split(INLINE)
    .filter((part) => part !== '')
    .map((part): MhdHandbookInlineSegment => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return { text: part.slice(2, -2), style: 'bold' };
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return { text: part.slice(1, -1), style: 'italic' };
      }
      return { text: part, style: 'plain' };
    });
}
