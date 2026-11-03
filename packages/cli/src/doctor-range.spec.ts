import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The CLI depends on the published doctor, so a doctor bump in-tree that the
// CLI range excludes would ship a `cngx doctor` consumers cannot install
// against the new doctor. Only `^x.y.z` alternatives joined by `||` are
// understood, so the CLI gains no semver dependency for one check.

function readJson(relative: string): Record<string, unknown> {
  return JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8')) as Record<string, unknown>;
}

type Triple = readonly [number, number, number];

function parseVersion(version: string): Triple {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim());
  if (!match) {
    throw new Error(`unsupported version form '${version}'`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function satisfiesCaret(version: Triple, floor: Triple): boolean {
  const [major, minor, patch] = version;
  const [fMajor, fMinor, fPatch] = floor;
  if (fMajor === 0) {
    return major === 0 && minor === fMinor && patch >= fPatch;
  }
  return major === fMajor && (minor > fMinor || (minor === fMinor && patch >= fPatch));
}

function satisfiesRange(version: string, range: string): boolean {
  const parsed = parseVersion(version);
  return range.split('||').some((alternative) => {
    const match = /^\^(\d+\.\d+\.\d+)$/.exec(alternative.trim());
    if (!match) {
      throw new Error(`unsupported range form '${alternative.trim()}' in '${range}': use ^x.y.z alternatives joined by ||`);
    }
    return satisfiesCaret(parsed, parseVersion(match[1]));
  });
}

const CLI_PACKAGE = readJson('../package.json') as { dependencies: Record<string, string> };
const DOCTOR_PACKAGE = readJson('../../doctor/package.json') as { version: string };

describe('@cngx/doctor range', () => {
  it('accepts the in-tree doctor version', () => {
    const range = CLI_PACKAGE.dependencies['@cngx/doctor'];
    expect(satisfiesRange(DOCTOR_PACKAGE.version, range), `${DOCTOR_PACKAGE.version} vs ${range}`).toBe(true);
  });

  it('reads caret ranges the npm way, and refuses other range forms', () => {
    expect(satisfiesRange('0.3.0', '^0.2.1')).toBe(false);
    expect(satisfiesRange('0.3.0', '^0.2.1 || ^0.3.0')).toBe(true);
    expect(satisfiesRange('0.2.0', '^0.2.1')).toBe(false);
    expect(satisfiesRange('1.4.0', '^1.2.3')).toBe(true);
    expect(satisfiesRange('2.0.0', '^1.2.3')).toBe(false);
    expect(() => satisfiesRange('0.2.1', '>=0.2')).toThrow(/unsupported range form '>=0.2'/);
  });
});
