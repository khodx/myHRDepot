export interface MhdRichTextDocument {
  type: 'mhd_rich_text';
  version: 1;
  html: string;
  plainText: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function mhdPlainTextToRichHtml(value: string | null | undefined): string {
  const text = value ?? '';
  if (!text.trim()) return '';
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
    .join('');
}

export function mhdRichTextToDocument(html: string, plainText: string): MhdRichTextDocument {
  return {
    type: 'mhd_rich_text',
    version: 1,
    html,
    plainText,
  };
}

export function mhdDocumentToRichHtml(value: unknown, fallbackPlainText = ''): string {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.html === 'string') return candidate.html;
  }
  return mhdPlainTextToRichHtml(fallbackPlainText);
}

export function mhdSanitizeRichHtml(html: string): string {
  if (!html.trim()) return '';
  if (typeof window === 'undefined') return escapeHtml(html);

  const allowedTags = new Set([
    'A',
    'B',
    'BLOCKQUOTE',
    'BR',
    'CODE',
    'DIV',
    'EM',
    'H1',
    'H2',
    'H3',
    'H4',
    'HR',
    'I',
    'IMG',
    'LI',
    'OL',
    'P',
    'PRE',
    'SPAN',
    'STRIKE',
    'STRONG',
    'SUB',
    'SUP',
    'TABLE',
    'TBODY',
    'TD',
    'TH',
    'THEAD',
    'TR',
    'U',
    'UL',
  ]);
  const allowedAttrs = new Set(['href', 'src', 'alt', 'title', 'target', 'rel', 'style']);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  for (const element of Array.from(doc.body.querySelectorAll('*'))) {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(doc.createTextNode(element.textContent ?? ''));
      continue;
    }

    for (const attr of Array.from(element.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value;
      if (name.startsWith('on') || !allowedAttrs.has(name)) {
        element.removeAttribute(attr.name);
        continue;
      }
      if ((name === 'href' || name === 'src') && !/^(https?:|mailto:|data:image\/)/i.test(value)) {
        element.removeAttribute(attr.name);
      }
      if (name === 'style') {
        const safeRules = value
          .split(';')
          .map((rule) => rule.trim())
          .filter((rule) => /^(color|background-color|text-align|font-size):/i.test(rule));
        if (safeRules.length > 0) element.setAttribute('style', safeRules.join('; '));
        else element.removeAttribute('style');
      }
    }

    if (element.tagName === 'A') {
      element.setAttribute('target', '_blank');
      element.setAttribute('rel', 'noreferrer');
    }
  }

  return doc.body.innerHTML;
}
