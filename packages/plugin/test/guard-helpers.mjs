// Shared guard helpers for the plugin's markdown-artifact specs (skills.spec.mjs
// and agents.spec.mjs). A spec file cannot be imported without re-running its
// describe blocks, so the parsing helpers and the maintainer-internal token set
// live here as a plain module both guards import - one copy, no re-declaration.

export const frontmatterOf = (source) => {
  const match = /^---\n([\s\S]*?)\n---/.exec(source);
  return match ? match[1] : null;
};

export const bodyOf = (source) => source.replace(/^---\n[\s\S]*?\n---/, '');

// Tokens assembled from fragments on purpose: the guard must not itself carry
// the maintainer-internal literals verbatim (mirrors command-cngx-init.spec).
export const FORBIDDEN = [
  `cngx-${'guru'}`,
  `cngx-${'designer'}`,
  `.intern${'al'}/`,
  'localhost',
];
