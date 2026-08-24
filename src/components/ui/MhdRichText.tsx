import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Indent,
  Italic,
  Link,
  List,
  ListOrdered,
  Outdent,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  Underline,
  Undo2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import {
  mhdRichTextToDocument,
  mhdSanitizeRichHtml,
  type MhdRichTextDocument,
} from './MhdRichTextUtils';

interface MhdRichTextEditorProps {
  label: string;
  html: string;
  onChange: (html: string, plainText: string, document: MhdRichTextDocument) => void;
  placeholder?: string;
  minHeightClassName?: string;
}

interface MhdRichTextRendererProps {
  html?: string | null;
  className?: string;
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:border-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

export function MhdRichTextEditor({
  label,
  html,
  onChange,
  placeholder,
  minHeightClassName = 'min-h-36',
}: MhdRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || editor.innerHTML === html) return;
    editor.innerHTML = html;
  }, [html]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const nextHtml = editor.innerHTML;
    // textContent, not innerText: innerText depends on computed layout (unsupported
    // in jsdom, returning undefined there) and this plain-text derivation only
    // needs the text itself, not layout-aware whitespace collapsing.
    const plainText = (editor.textContent ?? '').trim();
    onChange(nextHtml, plainText, mhdRichTextToDocument(nextHtml, plainText));
  };

  const command = (commandName: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(commandName, false, value);
    emitChange();
  };

  const promptCommand = (commandName: 'createLink' | 'insertImage') => {
    const value = window.prompt(commandName === 'createLink' ? 'URL' : 'Image URL');
    if (!value) return;
    command(commandName, value);
  };

  const insertTable = () => {
    editorRef.current?.focus();
    document.execCommand(
      'insertHTML',
      false,
      '<table><tbody><tr><th>Header</th><th>Header</th></tr><tr><td>Cell</td><td>Cell</td></tr></tbody></table>',
    );
    emitChange();
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
      <div className="rounded-md border border-border bg-card">
        <div className="flex flex-wrap gap-1 border-b border-border p-2">
          <ToolbarButton label="Undo" onClick={() => command('undo')}>
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Redo" onClick={() => command('redo')}>
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Paragraph" onClick={() => command('formatBlock', 'P')}>
            <Pilcrow className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Heading 1" onClick={() => command('formatBlock', 'H1')}>
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Heading 2" onClick={() => command('formatBlock', 'H2')}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Heading 3" onClick={() => command('formatBlock', 'H3')}>
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Bold" onClick={() => command('bold')}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Italic" onClick={() => command('italic')}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Underline" onClick={() => command('underline')}>
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Strikethrough" onClick={() => command('strikeThrough')}>
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Superscript" onClick={() => command('superscript')}>
            <Superscript className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Subscript" onClick={() => command('subscript')}>
            <Subscript className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Bulleted List" onClick={() => command('insertUnorderedList')}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Numbered List" onClick={() => command('insertOrderedList')}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Outdent" onClick={() => command('outdent')}>
            <Outdent className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Indent" onClick={() => command('indent')}>
            <Indent className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Align Left" onClick={() => command('justifyLeft')}>
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Align Center" onClick={() => command('justifyCenter')}>
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Align Right" onClick={() => command('justifyRight')}>
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Justify" onClick={() => command('justifyFull')}>
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Quote" onClick={() => command('formatBlock', 'BLOCKQUOTE')}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Code Block" onClick={() => command('formatBlock', 'PRE')}>
            <Code2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Link" onClick={() => promptCommand('createLink')}>
            <Link className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Image" onClick={() => promptCommand('insertImage')}>
            <Image className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Table" onClick={insertTable}>
            <Table className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Clear Formatting" onClick={() => command('removeFormat')}>
            <Eraser className="h-4 w-4" />
          </ToolbarButton>
          <select
            aria-label="Font size"
            onChange={(event) => command('fontSize', event.target.value)}
            className="h-8 rounded-md border border-border bg-card px-2 text-xs"
            defaultValue=""
          >
            <option value="" disabled>
              Size
            </option>
            <option value="1">Small</option>
            <option value="3">Normal</option>
            <option value="5">Large</option>
            <option value="7">Huge</option>
          </select>
          <input
            type="color"
            aria-label="Text color"
            title="Text color"
            onChange={(event) => command('foreColor', event.target.value)}
            className="h-8 w-10 rounded-md border border-border bg-card p-1"
          />
          <input
            type="color"
            aria-label="Highlight color"
            title="Highlight color"
            onChange={(event) => command('hiliteColor', event.target.value)}
            className="h-8 w-10 rounded-md border border-border bg-card p-1"
          />
        </div>
        <div
          ref={editorRef}
          contentEditable
          role="textbox"
          aria-label={label}
          aria-multiline="true"
          data-placeholder={placeholder}
          onInput={emitChange}
          onBlur={emitChange}
          className={`${minHeightClassName} w-full px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&:empty:before]:text-muted-foreground [&:empty:before]:content-[attr(data-placeholder)] [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_ul]:list-disc [&_ul]:pl-6`}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}

export function MhdRichTextRenderer({ html, className = '' }: MhdRichTextRendererProps) {
  if (!html?.trim()) return null;
  return (
    <div
      className={`space-y-2 text-sm text-muted-foreground [&_a]:text-accent [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_ul]:list-disc [&_ul]:pl-6 ${className}`}
      dangerouslySetInnerHTML={{ __html: mhdSanitizeRichHtml(html) }}
    />
  );
}
