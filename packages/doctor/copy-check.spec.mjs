import { describe, expect, it } from 'vitest';
import { compareCopies, DOCTOR_COPY_FILES } from '../../scripts/doctor-copy-check.mjs';

// Fake reader over an in-memory { file: Buffer } map; a missing key reads as
// null, the same null-means-absent contract the disk reader uses.
function readerFor(map) {
  return (file) => (file in map ? map[file] : null);
}

const bytes = (s) => Buffer.from(s, 'utf8');

describe('compareCopies', () => {
  it('reports no mismatch when every file is byte-identical', () => {
    const pkg = Object.fromEntries(DOCTOR_COPY_FILES.map((f) => [f, bytes(`content of ${f}`)]));
    const plugin = Object.fromEntries(DOCTOR_COPY_FILES.map((f) => [f, bytes(`content of ${f}`)]));
    expect(compareCopies(readerFor(pkg), readerFor(plugin), DOCTOR_COPY_FILES)).toEqual([]);
  });

  it('flags a file whose bytes differ (copy edited, canonical untouched)', () => {
    const pkg = { 'doctor/checks.mjs': bytes('canonical') };
    const plugin = { 'doctor/checks.mjs': bytes('hand-edited') };
    expect(compareCopies(readerFor(pkg), readerFor(plugin), ['doctor/checks.mjs'])).toEqual([
      { file: 'doctor/checks.mjs', reason: 'bytes differ' },
    ]);
  });

  it('flags a file missing from the plugin copy', () => {
    const pkg = { 'doctor/scan.mjs': bytes('canonical') };
    const plugin = {};
    expect(compareCopies(readerFor(pkg), readerFor(plugin), ['doctor/scan.mjs'])).toEqual([
      { file: 'doctor/scan.mjs', reason: 'missing in the plugin copy' },
    ]);
  });

  it('flags a file missing from packages/doctor', () => {
    const pkg = {};
    const plugin = { 'doctor/scan.mjs': bytes('copy') };
    expect(compareCopies(readerFor(pkg), readerFor(plugin), ['doctor/scan.mjs'])).toEqual([
      { file: 'doctor/scan.mjs', reason: 'missing in packages/doctor' },
    ]);
  });
});
