import { describe, expect, it } from 'vitest';

import { type Report } from '../plan/report';
import { createSummary, type SummaryContext } from './summary';

const QUIET: SummaryContext = { planListed: false, outcome: 'planned' };
const LISTED: SummaryContext = { planListed: true, outcome: 'applied' };

const REPORT: Report = {
  changes: ['Add @cngx/utils@0.1.0'],
  notes: [],
  files: ['package.json'],
  skipped: [{ id: 'style-import', label: 'Import cngx.css', reason: 'already imported' }],
  warnings: [],
  nextSteps: ['Run `npx @cngx/doctor` to check the wiring.'],
  links: [{ label: 'cngx documentation', url: 'https://cngxjs.github.io/cngx/' }],
};

describe('createSummary', () => {
  it('lists the files, idempotent hits, next steps and docs when no plan list ran', () => {
    expect(createSummary(REPORT, QUIET)).toEqual([
      'cngx planned 1 change.',
      'Files:',
      '  package.json',
      'Already in place:',
      '  Import cngx.css',
      'Next steps:',
      '  Run `npx @cngx/doctor` to check the wiring.',
      'Docs:',
      '  cngx documentation: https://cngxjs.github.io/cngx/',
    ]);
  });

  it('lists the notes a step left instead of a change when no plan list ran', () => {
    const lines = createSummary(
      { ...REPORT, notes: ['Skip the eslint entry - no eslint flat config (eslint.config.js, .mjs or .cjs) found'] },
      QUIET,
    );

    expect(lines.slice(3, 5)).toEqual([
      'Notes:',
      '  Skip the eslint entry - no eslint flat config (eslint.config.js, .mjs or .cjs) found',
    ]);
  });

  it('leaves out the files and notes the plan list already named', () => {
    const lines = createSummary({ ...REPORT, notes: ['Skip the eslint entry - no eslint flat config'] }, LISTED);

    expect(lines).toEqual([
      'cngx applied 1 change.',
      '1 step already in place.',
      'Next steps:',
      '  Run `npx @cngx/doctor` to check the wiring.',
      'Docs:',
      '  cngx documentation: https://cngxjs.github.io/cngx/',
    ]);
  });

  it('says planned under a dry run and applied otherwise', () => {
    expect(createSummary(REPORT, { planListed: true, outcome: 'planned' })[0]).toBe('cngx planned 1 change.');
    expect(createSummary(REPORT, { planListed: true, outcome: 'applied' })[0]).toBe('cngx applied 1 change.');
  });

  it('only counts the idempotent hits when the plan list already named them', () => {
    const lines = createSummary(REPORT, LISTED);

    expect(lines).toContain('1 step already in place.');
    expect(lines).not.toContain('Already in place:');
    expect(lines).not.toContain('  Import cngx.css');
  });

  it('counts the idempotent hits in the plural', () => {
    const skipped = [...REPORT.skipped, { id: 'lint', label: 'Add the eslint plugin', reason: 'r' }];

    expect(createSummary({ ...REPORT, skipped }, LISTED)).toContain('2 steps already in place.');
  });

  it('counts changes in the plural', () => {
    expect(createSummary({ ...REPORT, changes: ['a', 'b'] }, LISTED)[0]).toBe('cngx applied 2 changes.');
  });

  it('says nothing changed for an empty report and drops empty sections', () => {
    const lines = createSummary({ ...REPORT, changes: [], files: [], skipped: [] }, QUIET);

    expect(lines[0]).toBe('cngx is already set up; nothing changed.');
    expect(lines).not.toContain('Files:');
    expect(lines).not.toContain('Already in place:');
  });

  it('takes the headlines of the command that ran', () => {
    const headlines = {
      changed: (changes: string, outcome: string) => `update ${outcome} ${changes}.`,
      unchanged: 'update found nothing.',
    };

    expect(createSummary({ ...REPORT, changes: ['a', 'b'] }, LISTED, headlines)[0]).toBe('update applied 2 changes.');
    expect(createSummary({ ...REPORT, changes: [] }, LISTED, headlines)[0]).toBe('update found nothing.');
  });

  it('does not mutate the report', () => {
    const before = JSON.stringify(REPORT);

    createSummary(REPORT, LISTED);

    expect(JSON.stringify(REPORT)).toBe(before);
  });
});
