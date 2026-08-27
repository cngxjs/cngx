// Distils the cngx theming-token reference from the published compodoc
// documentation.json into pack data the consumer plugin ships. Reuses the
// already-public data (the same snapshot @cngx/mcp queries) rather than
// re-scanning source, and records provenance so the drift-check can tell when
// the shipped reference falls behind the snapshot.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_DOC = 'packages/mcp/data/documentation.json';
const OUT = 'packages/plugin/pack/theming-tokens.md';
const MANIFEST = 'packages/plugin/pack/pack-manifest.json';

const cell = (value) => String(value).replace(/\|/g, '\\|');

// Token descriptions come from source JSDoc that may use em/en dashes (U+2014,
// U+2013). The shipped reference is a generated artifact, so normalise them to a
// plain ASCII hyphen rather than distribute em-dashes.
const normalizeDashes = (text) => text.replace(/\s*[\u2014\u2013]\s*/g, ' - ');

// Source JSDoc wraps long descriptions across lines; a table cell needs one
// line. Join the wrapped lines with a space instead of truncating at the first
// newline - the old first-line cut shipped sentences broken mid-word.
const singleLine = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');

// Keep only artifacts that declare at least one theming token, and drop the
// absolute source path / line - the consumer reference needs the token, its
// default and its role, never the maintainer's filesystem.
export function collectThemeTokens(doc) {
  const artifacts = [...(doc.components ?? []), ...(doc.directives ?? [])];
  const groups = [];
  for (const artifact of artifacts) {
    const tokens = Array.isArray(artifact.themeTokens) ? artifact.themeTokens : [];
    if (tokens.length === 0) {
      continue;
    }
    groups.push({
      component: artifact.name,
      category: artifact.category ?? '',
      tokens: tokens.map((token) => ({
        name: token.name,
        default: token.defaultValue ?? '',
        group: token.group ?? '',
        description: normalizeDashes(singleLine(token.description ?? '')),
      })),
    });
  }
  groups.sort((a, b) => a.component.localeCompare(b.component));
  return groups;
}

export function renderTokenReference(doc) {
  const groups = collectThemeTokens(doc);
  const total = groups.reduce((sum, group) => sum + group.tokens.length, 0);
  const lines = [
    '# cngx theming tokens',
    '',
    `Every cngx component themes through \`--cngx-*\` CSS custom properties with literal fallbacks. Set any token in your own stylesheet to override it; leave it unset to keep the default below. ${total} tokens across ${groups.length} components.`,
    '',
  ];
  for (const group of groups) {
    lines.push(`## ${group.component}`, '');
    lines.push('|Token|Default|Group|Description|', '|-|-|-|-|');
    for (const token of group.tokens) {
      lines.push(`|\`${cell(token.name)}\`|\`${cell(token.default)}\`|${cell(token.group)}|${cell(token.description)}|`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function computeSourceHash(raw) {
  return `sha256:${createHash('sha256').update(raw).digest('hex')}`;
}

export function upsertManifestEntry(manifest, entry) {
  const sources = Array.isArray(manifest.sources) ? [...manifest.sources] : [];
  const index = sources.findIndex((source) => source.artifact === entry.artifact);
  if (index >= 0) {
    sources[index] = entry;
  } else {
    sources.push(entry);
  }
  return { ...manifest, sources };
}

function main() {
  const docPath = resolve(process.argv[2] ?? DEFAULT_DOC);
  const raw = readFileSync(docPath);
  const doc = JSON.parse(raw);

  const groups = collectThemeTokens(doc);
  const tokenCount = groups.reduce((sum, group) => sum + group.tokens.length, 0);
  writeFileSync(resolve(OUT), `${renderTokenReference(doc)}\n`);

  const manifest = JSON.parse(readFileSync(resolve(MANIFEST), 'utf8'));
  // theming-tokens.md is distilled from documentation.json, a gitignored build
  // artifact (packages/mcp/data/ is not committed). A fresh checkout has no such
  // file to re-hash, so this provenance is informational and lives under
  // `theming`, out of the drift-checked `sources[]` - which holds only committed
  // sources (the recipe stories). Filter out any legacy theming entry there.
  const next = {
    ...manifest,
    sources: (manifest.sources ?? []).filter((s) => s.artifact !== 'pack/theming-tokens.md'),
    theming: {
      artifact: 'pack/theming-tokens.md',
      source: DEFAULT_DOC,
      contentHash: computeSourceHash(raw),
      tokenCount,
    },
  };
  writeFileSync(resolve(MANIFEST), `${JSON.stringify(next, null, 2)}\n`);

  process.stdout.write(`theming-tokens.md: ${tokenCount} tokens across ${groups.length} components\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
