import { describe, expect, it } from 'vitest';

import { type Report } from '../../engine';
import { createSummary } from './finish';

const REPORT: Report = {
  changes: ['Add @cngx/utils@0.1.0'],
  files: ['package.json'],
  skipped: [{ id: 'style-import', label: 'Import cngx.css', reason: 'already imported' }],
  warnings: [],
  nextSteps: ['Run `npx @cngx/doctor` to check the wiring.'],
  links: [{ label: 'cngx documentation', url: 'https://cngxjs.github.io/cngx/' }],
};

describe('createSummary', () => {
  it('lists the files, idempotent hits, next steps and docs when no plan list ran', () => {
    expect(createSummary(REPORT, false)).toEqual([
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

  it('only counts the idempotent hits when the plan list already named them', () => {
    const lines = createSummary(REPORT, true);

    expect(lines).toContain('1 step already in place.');
    expect(lines).not.toContain('Already in place:');
    expect(lines).not.toContain('  Import cngx.css');
  });

  it('counts the idempotent hits in the plural', () => {
    const skipped = [...REPORT.skipped, { id: 'lint', label: 'Add the eslint plugin', reason: 'r' }];

    expect(createSummary({ ...REPORT, skipped }, true)).toContain('2 steps already in place.');
  });

  it('counts changes in the plural', () => {
    expect(createSummary({ ...REPORT, changes: ['a', 'b'] }, true)[0]).toBe('cngx planned 2 changes.');
  });

  it('says nothing changed for an empty report and drops empty sections', () => {
    const lines = createSummary({ ...REPORT, changes: [], files: [], skipped: [] }, false);

    expect(lines[0]).toBe('cngx is already set up; nothing changed.');
    expect(lines).not.toContain('Files:');
    expect(lines).not.toContain('Already in place:');
  });

  it('does not mutate the report', () => {
    const before = JSON.stringify(REPORT);

    createSummary(REPORT, true);

    expect(JSON.stringify(REPORT)).toBe(before);
  });
});
