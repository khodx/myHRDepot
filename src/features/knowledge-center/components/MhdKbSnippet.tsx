interface MhdKbSnippetProps {
  snippet: string;
}

export function MhdKbSnippet({ snippet }: MhdKbSnippetProps) {
  const parts = snippet.split(/(<mark>|<\/mark>)/g);
  const renderedParts = [];

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (part === '<mark>' && parts[index + 2] === '</mark>') {
      renderedParts.push(<mark key={index}>{parts[index + 1]}</mark>);
      index += 2;
    } else {
      renderedParts.push(<span key={index}>{part}</span>);
    }
  }

  return <span>{renderedParts}</span>;
}
