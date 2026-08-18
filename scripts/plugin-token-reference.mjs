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
        description: normalizeDashes((token.description ?? '').split('\n')[0].trim()),
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
  const entry = {
    artifact: 'pack/theming-tokens.md',
    source: DEFAULT_DOC,
    contentHash: computeSourceHash(raw),
    tokenCount,
  };
  writeFileSync(resolve(MANIFEST), `${JSON.stringify(upsertManifestEntry(manifest, entry), null, 2)}\n`);

  process.stdout.write(`theming-tokens.md: ${tokenCount} tokens across ${groups.length} components\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
