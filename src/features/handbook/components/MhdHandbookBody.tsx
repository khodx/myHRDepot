import { Fragment } from 'react';
import { mhdParseHandbookBody, mhdParseHandbookInline } from '../bodyFormat';

interface Props {
  body: string;
  /** The section's own title, so a heading that merely repeats it is not shown twice. */
  sectionTitle?: string | null;
  /** Renders the body as muted placeholder text (the attorney-pending shell state). */
  muted?: boolean;
}

function Inline({ text }: { text: string }) {
  return (
    <>
      {mhdParseHandbookInline(text).map((segment, index) => (
        <Fragment key={`${index}-${segment.style}`}>
          {segment.style === 'bold' ? (
            <strong>{segment.text}</strong>
          ) : segment.style === 'italic' ? (
            <em>{segment.text}</em>
          ) : (
            segment.text
          )}
        </Fragment>
      ))}
    </>
  );
}

/**
 * A handbook section body, rendered as real elements (paragraphs, lists, bold and
 * italic) from the same closed subset the exported document uses. Rendered as React
 * nodes, never as HTML, so nothing in a body can inject markup.
 */
export function MhdHandbookBody({ body, sectionTitle, muted = false }: Props) {
  const blocks = mhdParseHandbookBody(body, sectionTitle);
  const tone = muted ? 'italic text-muted-foreground' : 'text-foreground';

  return (
    <div className={`mt-2 space-y-2 text-sm ${tone}`}>
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'lead':
            return (
              <p key={index} className="font-semibold">
                <Inline text={block.text} />
              </p>
            );
          case 'bullets':
            return (
              <ul key={index} className="list-disc space-y-1 pl-5">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            );
          case 'numbered':
            return (
              <ol key={index} className="list-decimal space-y-1 pl-5">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Inline text={item} />
                  </li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={index}>
                <Inline text={block.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
