import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mhdParseHandbookBody, mhdParseHandbookInline } from '../bodyFormat';
import { MhdHandbookBody } from '../components/MhdHandbookBody';

describe('mhdParseHandbookBody', () => {
  it('drops a leading heading that repeats the section title, keeps a different one as a lead-in', () => {
    expect(mhdParseHandbookBody('## At-Will Employment\n\nBody.', 'At-Will Employment')).toEqual([
      { kind: 'paragraph', text: 'Body.' },
    ]);
    expect(mhdParseHandbookBody('### Overtime\nBody.', 'Wages')).toEqual([
      { kind: 'lead', text: 'Overtime' },
      { kind: 'paragraph', text: 'Body.' },
    ]);
  });

  it('joins consecutive lines into one paragraph and splits on blank lines', () => {
    expect(mhdParseHandbookBody('one\ntwo\n\nthree')).toEqual([
      { kind: 'paragraph', text: 'one two' },
      { kind: 'paragraph', text: 'three' },
    ]);
  });

  it('builds bullet and numbered lists, switching between them', () => {
    expect(mhdParseHandbookBody('- a\n- b\n1. x\n2. y\n\nafter')).toEqual([
      { kind: 'bullets', items: ['a', 'b'] },
      { kind: 'numbered', items: ['x', 'y'] },
      { kind: 'paragraph', text: 'after' },
    ]);
  });

  it('does not treat a line that starts with ** as a bullet', () => {
    expect(mhdParseHandbookBody('**Purpose.** text')).toEqual([
      { kind: 'paragraph', text: '**Purpose.** text' },
    ]);
  });

  it('returns no blocks for an empty body', () => {
    expect(mhdParseHandbookBody('')).toEqual([]);
  });
});

describe('mhdParseHandbookInline', () => {
  it('splits bold and italic runs and leaves the rest plain', () => {
    expect(mhdParseHandbookInline('A **bold** and *italic* word')).toEqual([
      { text: 'A ', style: 'plain' },
      { text: 'bold', style: 'bold' },
      { text: ' and ', style: 'plain' },
      { text: 'italic', style: 'italic' },
      { text: ' word', style: 'plain' },
    ]);
  });

  it('leaves a lone asterisk inside a word alone', () => {
    expect(mhdParseHandbookInline('2*3*4')).toEqual([{ text: '2*3*4', style: 'plain' }]);
  });
});

describe('MhdHandbookBody', () => {
  it('renders real elements, and never interprets markup inside the text', () => {
    const { container } = render(
      <MhdHandbookBody
        body={'## Intro\n\n**Purpose.** <img src=x onerror=alert(1)>\n\n- one\n- two'}
        sectionTitle="Intro"
      />,
    );

    expect(screen.getByText('Purpose.').tagName).toBe('STRONG');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    // The heading that repeats the section title is not shown a second time.
    expect(screen.queryByText('Intro')).toBeNull();
    // The angle-bracket text is shown as text; no element is created from it.
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});
