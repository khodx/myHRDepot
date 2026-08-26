import { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { useMhdLegalJurisdictions, useMhdLegalSearch, useMhdLegalTopics } from '../Hook';
import type { MhdLegalJurisdiction, MhdLegalSearchResult } from '../Types';

function ResultCard({ result, pending = false }: { result: MhdLegalSearchResult; pending?: boolean }) {
  return <article className={`rounded-xl border p-4 shadow-sm ${pending ? 'border-amber-300 bg-amber-50/70' : 'border-border bg-card'}`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        {pending && <span className="mb-2 inline-flex rounded-full bg-amber-200 px-2 py-1 text-xs font-bold uppercase tracking-wide text-amber-950">Not yet law</span>}
        <h3 className="font-semibold text-foreground">{result.title}</h3>
      </div>
      {result.sourceUrl && <a className="text-muted-foreground hover:text-foreground" href={result.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open source for ${result.title}`}><ExternalLink className="size-4" /></a>}
    </div>
    {result.summary && <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.summary}</p>}
    <p className="mt-3 text-xs text-muted-foreground">Source: {result.externalProvider}</p>
  </article>;
}

function ResultSection({ title, description, results, pending = false }: { title: string; description: string; results: MhdLegalSearchResult[]; pending?: boolean }) {
  return <section className={`rounded-2xl p-5 ${pending ? 'border-2 border-amber-400 bg-amber-50/40' : 'border border-border bg-muted/20'}`} aria-label={title}>
    <div className="mb-4 border-b border-border pb-3"><h2 className="text-lg font-semibold text-foreground">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div>
    {results.length ? <div className="grid gap-3">{results.map((result) => <ResultCard key={result.id} result={result} pending={pending} />)}</div> : <p className="text-sm text-muted-foreground">No results in this section.</p>}
  </section>;
}

function jurisdictionLabel(jurisdiction: MhdLegalJurisdiction) { return jurisdiction.level === 'FEDERAL' ? 'Federal' : jurisdiction.name; }

export function MhdLegalSearchPage() {
  const [query, setQuery] = useState('');
  const [jurisdictionMode, setJurisdictionMode] = useState('BOTH');
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const jurisdictions = useMhdLegalJurisdictions();
  const topics = useMhdLegalTopics();
  const jurisdictionIds = useMemo(() => jurisdictionMode === 'BOTH' ? (jurisdictions.data ?? []).map((item) => item.id) : jurisdictionMode ? [jurisdictionMode] : [], [jurisdictionMode, jurisdictions.data]);
  const search = useMhdLegalSearch({ query, jurisdictionIds, topicIds });

  return <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
    <header><p className="text-sm font-semibold uppercase tracking-wide text-primary">Legal & regulatory reference</p><h1 className="mt-1 text-3xl font-bold text-foreground">Search legal content</h1><p className="mt-2 max-w-3xl text-muted-foreground">Find attorney-reviewed guidance, federal regulatory text, and pending legislation. Pending legislation is informational only and is not yet law.</p></header>
    <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-[1fr_220px_260px]">
      <label className="block text-sm font-medium text-foreground">Search<input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2" placeholder="Search topics, rules, or bills" /></label>
      <label className="block text-sm font-medium text-foreground">Jurisdiction<select value={jurisdictionMode} onChange={(event) => setJurisdictionMode(event.target.value)} className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2"><option value="BOTH">Both</option>{(jurisdictions.data ?? []).map((item) => <option key={item.id} value={item.id}>{jurisdictionLabel(item)}</option>)}</select></label>
      <fieldset><legend className="text-sm font-medium text-foreground">Topics</legend><div className="mt-2 flex max-h-28 flex-wrap gap-x-4 gap-y-2 overflow-auto">{(topics.data ?? []).map((topic) => <label key={topic.id} className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={topicIds.includes(topic.id)} onChange={(event) => setTopicIds((current) => event.target.checked ? [...current, topic.id] : current.filter((id) => id !== topic.id))} />{topic.displayName}</label>)}</div></fieldset>
    </div>
    {search.isLoading && <p className="text-sm text-muted-foreground">Searching…</p>}
    {search.isError && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">Unable to load legal search results. Please try again.</p>}
    {search.data && <div className="space-y-5"><ResultSection title="Curated" description="Attorney-reviewed reference content." results={search.data.curated} /><ResultSection title="Federal Regulatory Text" description="Federal regulations and notices." results={search.data.federalText} /><ResultSection title="Pending Legislation" description="Bills and proposals that are not yet law." results={search.data.pendingLegislation} pending /></div>}
    {!search.isLoading && !search.data && !search.isError && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground"><Search className="mx-auto mb-3 size-6" /><p>Search across the legal reference library.</p></div>}
  </main>;
}
