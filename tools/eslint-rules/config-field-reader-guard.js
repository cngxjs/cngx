'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Custom ESLint rule - flags declared-but-never-read config / i18n
 * fields. Guards against the "polished JSDoc, spec-asserted default,
 * zero wiring" failure class: a field on a `Cngx*Config` / `Cngx*I18n`
 * / `Cngx*Labels` / `Cngx*Templates` interface that nothing ever reads
 * is dead API surface, not configuration.
 *
 * A field counts as read when either
 *
 * - any OTHER non-spec `.ts` / `.html` file under the configured
 *   source roots contains a member access (`cfg.field`, `cfg?.field`,
 *   `cfg['field']`) - inline templates are template strings and
 *   external `templateUrl` templates are in the `.html` corpus, so
 *   template reads count; or
 * - the declaring file itself reads the field OUTSIDE of config
 *   plumbing. Member accesses inside `with*` / `provide*` / `define*`
 *   functions do not count: builders copy fields into the next config
 *   object without consuming them.
 *
 * Object-literal keys (`field: value`) are writes, not reads. Comments
 * are stripped before matching, so a `{@link Config.field}` JSDoc
 * reference does not count as a reader. Members whose JSDoc carries
 * `@deprecated` are skipped entirely - a deprecated field kept for a
 * release is intentionally unread.
 *
 * The check is deliberately conservative: any `.field` occurrence on
 * ANY receiver counts, so generically named fields (`icon`, `label`)
 * can slip through as false negatives. It never flags a field that is
 * actually read via member access.
 *
 * Options:
 *
 *   'local/config-field-reader-guard': ['error', {
 *     srcRoots: ['projects'],                                // resolved against cwd
 *     interfacePattern: '^Cngx.*(Config|I18n|Labels|Templates)$',
 *     ignore: ['CngxFooConfig.bar', 'CngxBazConfig.*'],      // documented exceptions
 *   }]
 *
 * @category eslint-rules
 */

const DEFAULT_INTERFACE_PATTERN = '^Cngx.*(Config|I18n|Labels|Templates)$';
const DEFAULT_SRC_ROOTS = ['projects'];
const PLUMBING_FN_PATTERN = /^(with|provide|define)[A-Z]/;

const SKIPPED_DIRS = new Set(['node_modules', 'dist', '.git', '.angular', 'out-tsc']);

/** Corpus cache, keyed by absolute source-root path. Lives for one lint process. */
const corpusCache = new Map();

/**
 * Strip `//` and block comments while leaving string and template
 * literals intact. String-aware so `https://` inside a string never
 * starts a comment, and `.field` inside an inline template survives.
 */
function stripTsComments(source) {
  let out = '';
  let i = 0;
  let mode = 'code';
  const n = source.length;
  while (i < n) {
    const c = source[i];
    const next = source[i + 1];
    if (mode === 'code') {
      if (c === '/' && next === '/') {
        mode = 'line';
        i += 2;
        continue;
      }
      if (c === '/' && next === '*') {
        mode = 'block';
        i += 2;
        continue;
      }
      if (c === "'" || c === '"' || c === '`') {
        mode = c;
      }
      out += c;
      i++;
      continue;
    }
    if (mode === 'line') {
      if (c === '\n') {
        mode = 'code';
        out += c;
      }
      i++;
      continue;
    }
    if (mode === 'block') {
      if (c === '*' && next === '/') {
        mode = 'code';
        i += 2;
        continue;
      }
      if (c === '\n') {
        out += c;
      }
      i++;
      continue;
    }
    // Inside a string / template literal.
    if (c === '\\') {
      out += c + (next ?? '');
      i += 2;
      continue;
    }
    if (c === mode) {
      mode = 'code';
    }
    out += c;
    i++;
  }
  return out;
}

function stripHtmlComments(source) {
  return source.replace(/<!--[\s\S]*?-->/g, '');
}

function walkCorpusFiles(dir, sink) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) {
        walkCorpusFiles(path.join(dir, entry.name), sink);
      }
      continue;
    }
    const isTs = entry.name.endsWith('.ts');
    const isHtml = entry.name.endsWith('.html');
    if (!isTs && !isHtml) {
      continue;
    }
    if (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.d.ts')) {
      continue;
    }
    sink.push(path.join(dir, entry.name));
  }
}

function loadCorpus(rootAbs) {
  const cached = corpusCache.get(rootAbs);
  if (cached) {
    return cached;
  }
  const files = [];
  walkCorpusFiles(rootAbs, files);
  const corpus = files.map((file) => {
    let text = '';
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      // unreadable file: treat as empty, never as a reader
    }
    return { file, text: file.endsWith('.html') ? stripHtmlComments(text) : stripTsComments(text) };
  });
  corpusCache.set(rootAbs, corpus);
  return corpus;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildReaderPattern(fieldName) {
  const name = escapeRegExp(fieldName);
  // `.field` covers plain and optional chaining (`?.field` contains
  // `.field`); the bracket alternative covers `cfg['field']`.
  return new RegExp(`\\.${name}\\b|\\[\\s*['"]${name}['"]\\s*\\]`);
}

function hasCorpusReader(corpus, declaringFileAbs, fieldName) {
  const pattern = buildReaderPattern(fieldName);
  for (const { file, text } of corpus) {
    if (file === declaringFileAbs) {
      continue;
    }
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

function isDeprecated(sourceCode, member) {
  return sourceCode
    .getCommentsBefore(member)
    .some((comment) => comment.type === 'Block' && comment.value.includes('@deprecated'));
}

function fieldNameOf(member) {
  const key = member.key;
  if (!key) {
    return null;
  }
  if (key.type === 'Identifier') {
    return key.name;
  }
  if (key.type === 'Literal' && typeof key.value === 'string') {
    return key.value;
  }
  return null;
}

function accessedPropertyName(node) {
  if (node.computed) {
    const prop = node.property;
    if (prop?.type === 'Literal' && typeof prop.value === 'string') {
      return prop.value;
    }
    return null;
  }
  return node.property?.type === 'Identifier' ? node.property.name : null;
}

function enclosingFunctionName(ancestors) {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const node = ancestors[i];
    if (node.type === 'FunctionDeclaration' && node.id?.name) {
      return node.id.name;
    }
    if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
      const parent = ancestors[i - 1];
      if (parent?.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') {
        return parent.id.name;
      }
    }
  }
  return null;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require every field of an exported config / i18n / labels / templates ' +
        'interface to have at least one reader outside config plumbing. ' +
        'A field nobody reads is dead API surface.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          srcRoots: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
          interfacePattern: { type: 'string' },
          ignore: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      deadField:
        "'{{iface}}.{{field}}' is declared but never read (searched {{roots}}, " +
        'excluding config plumbing). Wire a consumer or remove the field. A field ' +
        "that only consumers read belongs on this rule's ignore list with a reason.",
    },
  },

  create(context) {
    const options = context.options[0] ?? {};
    const srcRoots = options.srcRoots ?? DEFAULT_SRC_ROOTS;
    const interfacePattern = new RegExp(options.interfacePattern ?? DEFAULT_INTERFACE_PATTERN);
    const ignore = new Set(options.ignore ?? []);
    const cwd = context.cwd ?? process.cwd();
    const declaringFileAbs = path.resolve(context.filename ?? context.getFilename());
    const rootLabels = srcRoots.join(', ');
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    /** Property names read in this file outside plumbing (with-/provide-/define-) bodies. */
    const localReads = new Set();
    /** Matching interfaces collected during the traversal. */
    const interfaces = [];

    function isIgnored(ifaceName, fieldName) {
      return ignore.has(`${ifaceName}.${fieldName}`) || ignore.has(`${ifaceName}.*`);
    }

    return {
      MemberExpression(node) {
        const name = accessedPropertyName(node);
        if (!name || localReads.has(name)) {
          return;
        }
        const fnName = enclosingFunctionName(sourceCode.getAncestors(node));
        if (fnName && PLUMBING_FN_PATTERN.test(fnName)) {
          return;
        }
        localReads.add(name);
      },

      TSInterfaceDeclaration(node) {
        const ifaceName = node.id?.name;
        if (!ifaceName || !interfacePattern.test(ifaceName)) {
          return;
        }
        if (node.parent?.type !== 'ExportNamedDeclaration') {
          return;
        }
        interfaces.push(node);
      },

      'Program:exit'() {
        if (interfaces.length === 0) {
          return;
        }
        const corpus = srcRoots.flatMap((root) => loadCorpus(path.resolve(cwd, root)));
        for (const iface of interfaces) {
          const ifaceName = iface.id.name;
          for (const member of iface.body?.body ?? []) {
            if (member.type !== 'TSPropertySignature' && member.type !== 'TSMethodSignature') {
              continue;
            }
            const fieldName = fieldNameOf(member);
            if (!fieldName || isIgnored(ifaceName, fieldName)) {
              continue;
            }
            if (isDeprecated(sourceCode, member)) {
              continue;
            }
            if (localReads.has(fieldName)) {
              continue;
            }
            if (hasCorpusReader(corpus, declaringFileAbs, fieldName)) {
              continue;
            }
            context.report({
              node: member,
              messageId: 'deadField',
              data: { iface: ifaceName, field: fieldName, roots: rootLabels },
            });
          }
        }
      },
    };
  },
};
