import { describe, expect, it } from 'vitest';
import {
  MHD_HANDBOOK_MAX_DEPTH_INDEX,
  mhdHandbookIndentStyle,
  mhdHandbookParentCandidates,
  mhdOrderSectionsAsOutline,
  type MhdHandbookSection,
} from '../Types';

const COMPANY = 'company-1';

function section(overrides: Partial<MhdHandbookSection> & { id: string }): MhdHandbookSection {
  return {
    companyId: null,
    handbookType: 'EMPLOYEE',
    jurisdiction: 'FEDERAL',
    sectionKey: overrides.id,
    title: overrides.id,
    bodyPlaceholder: 'body',
    isRequired: false,
    sortOrder: 100,
    isActive: true,
    isLibrary: true,
    sourceSectionId: null,
    parentSectionId: null,
    ...overrides,
  };
}

describe('mhdOrderSectionsAsOutline', () => {
  it('lists each section directly before its subsections, siblings by sort order then title', () => {
    const outline = mhdOrderSectionsAsOutline([
      section({ id: 'wages', sortOrder: 20 }),
      section({ id: 'overtime', parentSectionId: 'wages', sortOrder: 2 }),
      section({ id: 'intro', sortOrder: 10 }),
      section({ id: 'breaks', parentSectionId: 'wages', sortOrder: 1 }),
      section({ id: 'meal', parentSectionId: 'breaks', sortOrder: 1 }),
    ]);

    expect(outline.map((entry) => [entry.section.id, entry.depth])).toEqual([
      ['intro', 0],
      ['wages', 0],
      ['breaks', 1],
      ['meal', 2],
      ['overtime', 1],
    ]);
  });

  it('keeps a section whose parent was filtered out, as top-level, rather than dropping it', () => {
    const outline = mhdOrderSectionsAsOutline([
      section({ id: 'orphan', parentSectionId: 'not-in-this-list' }),
    ]);
    expect(outline).toEqual([{ section: expect.objectContaining({ id: 'orphan' }), depth: 0 }]);
  });

  it('terminates on a malformed cycle instead of looping', () => {
    const outline = mhdOrderSectionsAsOutline([
      section({ id: 'a', parentSectionId: 'b' }),
      section({ id: 'b', parentSectionId: 'a' }),
    ]);
    // Neither is reachable from the top level, so nothing is emitted — and, crucially, it returns.
    expect(outline).toEqual([]);
  });
});

describe('mhdHandbookIndentStyle', () => {
  it('indents per level and never goes negative', () => {
    expect(mhdHandbookIndentStyle(0)).toEqual({ marginLeft: '0rem' });
    expect(mhdHandbookIndentStyle(2)).toEqual({ marginLeft: '2.5rem' });
    expect(mhdHandbookIndentStyle(-1)).toEqual({ marginLeft: '0rem' });
  });
});

describe('mhdHandbookParentCandidates', () => {
  const library = [
    section({ id: 'a' }),
    section({ id: 'a1', parentSectionId: 'a' }),
    section({ id: 'a1x', parentSectionId: 'a1' }),
    section({ id: 'a1x1', parentSectionId: 'a1x' }), // depth index 3 — the deepest allowed
    section({ id: 'b' }),
    section({ id: 'ca-only', jurisdiction: 'CA' }),
    section({ id: 'safety-only', handbookType: 'SAFETY', jurisdiction: 'FED_OSHA' }),
    section({ id: 'retired', isActive: false }),
    section({ id: 'mine', companyId: COMPANY, isLibrary: false }),
    section({ id: 'theirs', companyId: 'company-2', isLibrary: false }),
  ];
  const ids = (entries: ReturnType<typeof mhdHandbookParentCandidates>) =>
    entries.map((entry) => entry.section.id);

  it('offers only same-type, same-jurisdiction, active sections', () => {
    const candidates = ids(
      mhdHandbookParentCandidates(library, {
        handbookType: 'EMPLOYEE',
        jurisdiction: 'FEDERAL',
        scopeCompanyId: COMPANY,
      }),
    );
    expect(candidates).toEqual(expect.arrayContaining(['a', 'a1', 'a1x', 'b', 'mine']));
    expect(candidates).not.toContain('ca-only');
    expect(candidates).not.toContain('safety-only');
    expect(candidates).not.toContain('retired');
  });

  it("never offers another company's section, and a global section only sits under a global one", () => {
    const forCompany = ids(
      mhdHandbookParentCandidates(library, {
        handbookType: 'EMPLOYEE',
        jurisdiction: 'FEDERAL',
        scopeCompanyId: COMPANY,
      }),
    );
    expect(forCompany).not.toContain('theirs');

    const forGlobal = ids(
      mhdHandbookParentCandidates(library, {
        handbookType: 'EMPLOYEE',
        jurisdiction: 'FEDERAL',
        scopeCompanyId: null,
      }),
    );
    expect(forGlobal).not.toContain('mine');
    expect(forGlobal).toContain('a');
  });

  it('stops offering parents that would push a new section past the depth cap', () => {
    const candidates = ids(
      mhdHandbookParentCandidates(library, {
        handbookType: 'EMPLOYEE',
        jurisdiction: 'FEDERAL',
        scopeCompanyId: COMPANY,
      }),
    );
    // a1x1 already sits at the deepest level, so it cannot be a parent.
    expect(candidates).not.toContain('a1x1');
    expect(MHD_HANDBOOK_MAX_DEPTH_INDEX).toBe(3);
  });

  it('excludes the section being moved and its subtree, and accounts for the subtree height', () => {
    const candidates = ids(
      mhdHandbookParentCandidates(library, {
        handbookType: 'EMPLOYEE',
        jurisdiction: 'FEDERAL',
        scopeCompanyId: COMPANY,
        excludeSectionId: 'a1',
      }),
    );
    // Not itself, and not anything beneath it (that would be a cycle).
    expect(candidates).not.toContain('a1');
    expect(candidates).not.toContain('a1x');
    expect(candidates).not.toContain('a1x1');
    // a1 has a two-level subtree (a1x, a1x1); under 'a' (depth 0) that is still within the cap,
    // but under 'b' -> fine too. Moving it beneath a deeper parent would not be, and none exist here.
    expect(candidates).toEqual(expect.arrayContaining(['a', 'b']));
  });

  it("refuses a parent when the moved section's subtree would no longer fit beneath it", () => {
    const deep = [
      section({ id: 'r' }),
      section({ id: 'r1', parentSectionId: 'r' }),
      section({ id: 'r2', parentSectionId: 'r1' }), // depth 2
      section({ id: 'm' }),
      section({ id: 'm1', parentSectionId: 'm' }),
      section({ id: 'm2', parentSectionId: 'm1' }), // 'm' has a two-level subtree
    ];
    const candidates = ids(
      mhdHandbookParentCandidates(deep, {
        handbookType: 'EMPLOYEE',
        jurisdiction: 'FEDERAL',
        scopeCompanyId: null,
        excludeSectionId: 'm',
      }),
    );
    // Moving 'm' (height 2) under r2 (depth 2) would put its deepest node at depth 5.
    expect(candidates).not.toContain('r2');
    // Under r (depth 0): m at 1, m1 at 2, m2 at 3 — exactly the cap, so allowed.
    expect(candidates).toContain('r');
  });
});
