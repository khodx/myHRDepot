import { MhdRichTextRenderer } from '@/components/ui/MhdRichText';
import type { MhdKbBodyFormat } from '../Types';

interface MhdKbArticleBodyProps {
  body: string;
  bodyFormat: MhdKbBodyFormat;
}

export function MhdKbArticleBody({ body, bodyFormat }: MhdKbArticleBodyProps) {
  if (bodyFormat === 'rich') {
    return <MhdRichTextRenderer html={body} />;
  }

  return (
    <div className="whitespace-pre-wrap rounded-lg border border-border bg-card p-6 text-sm leading-7 text-foreground">
      {body}
    </div>
  );
}
