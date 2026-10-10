// Pure helpers shared by the live example component and its TypeScript code
// panel. No fs access, so scripts/__tests__ can import this module without
// running the generator (index.mjs calls main() on import).

export function stripCommentsForScan(s) {
  return String(s ?? '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

export function dedent(s) {
  const lines = String(s).split('\n');
  const meaningful = lines.filter((l) => l.trim().length > 0);
  if (meaningful.length === 0) return '';
  let minIndent = Infinity;
  for (const l of meaningful) {
    const m = new RegExp(/^[ \t]*/).exec(l);
    minIndent = Math.min(minIndent, m[0].length);
  }
  if (!Number.isFinite(minIndent) || minIndent === 0) {
    return s.replace(/^\s*\n/, '').replace(/\s+$/, '');
  }
  return lines
    .map((l) => l.slice(minIndent))
    .join('\n')
    .replace(/^\s*\n/, '')
    .replace(/\s+$/, '');
}

export function importedSymbols(importLine) {
  const m = importLine.match(/import\s+(?:type\s+)?\{([^}]+)\}/);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => {
      const parts = s
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/);
      return (parts.length > 1 ? parts[1] : parts[0])?.trim();
    })
    .filter(Boolean);
}

export function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The conditional `@angular/core` symbols a class needs, sorted as the
 * import line lists them. `classText` is the comment-stripped class body;
 * `providersText` holds the `viewProviders` expressions, which only count
 * for the symbols a decorator expression can use (`inject`, `forwardRef`,
 * `TemplateRef`). `ChangeDetectionStrategy` and `Component` are the
 * caller's.
 */
export function coreSymbolsFor(classText, providersText) {
  const classAndProviders = classText + '\n' + (providersText ?? []).join('\n');

  const usesSignal = /\bsignal\s*[<(]/.test(classText);
  const usesComputed = /\bcomputed\s*[<(]/.test(classText);
  const usesInject = /\binject\s*\(/.test(classAndProviders);
  const usesAfterRender = /\bafterNextRender\s*\(/.test(classText);
  const usesEffect = /\beffect\s*\(/.test(classText);
  const usesViewChild = /\bviewChild\b/.test(classText);
  const usesElementRef = /\bElementRef\b/.test(classText);
  const usesDestroyRef = /\bDestroyRef\b/.test(classText);
  const usesUntracked = /\buntracked\s*\(/.test(classText);
  const usesLinkedSignal = /\blinkedSignal\s*[<(]/.test(classText);
  const usesForwardRef = /\bforwardRef\s*\(/.test(classAndProviders);
  const usesTemplateRef = /\bTemplateRef\b/.test(classAndProviders);

  return [
    ...(usesAfterRender ? ['afterNextRender'] : []),
    ...(usesComputed ? ['computed'] : []),
    ...(usesDestroyRef ? ['DestroyRef'] : []),
    ...(usesEffect ? ['effect'] : []),
    ...(usesElementRef ? ['ElementRef'] : []),
    ...(usesForwardRef ? ['forwardRef'] : []),
    ...(usesInject ? ['inject'] : []),
    ...(usesLinkedSignal ? ['linkedSignal'] : []),
    ...(usesSignal ? ['signal'] : []),
    ...(usesTemplateRef ? ['TemplateRef'] : []),
    ...(usesUntracked ? ['untracked'] : []),
    ...(usesViewChild ? ['viewChild'] : []),
  ];
}

/**
 * Keeps the specifiers of a named import line whose local name passes
 * `isReferenced`. Returns `null` when none survives and the line unchanged
 * when it is not a named import.
 */
export function filterImportLine(line, isReferenced) {
  const match = line.match(
    /^(\s*import\s*(?:type\s+)?\{)([^}]+)(\}\s*from\s*['"][^'"]+['"];?\s*)$/,
  );
  if (!match) return line;
  const [, head, body, tail] = match;
  const kept = body
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((spec) => {
      const parts = spec.replace(/^type\s+/, '').split(/\s+as\s+/);
      const id = (parts.length > 1 ? parts[1] : parts[0])?.trim();
      return isReferenced(id);
    });
  if (kept.length === 0) return null;
  return `${head} ${kept.join(', ')} ${tail.trim()}`;
}

/**
 * Whether a template uses a class: by name, or by one of its selectors
 * (`selectorMap` maps class name to selectors). Non-Cngx classes and Cngx
 * classes with no known selector always count as used.
 */
export function templateUsesClass(cls, tpl, selectorMap) {
  if (!cls.startsWith('Cngx')) return true;
  if (new RegExp(String.raw`\b${cls}\b`).test(tpl)) return true;
  const selectors = selectorMap?.get(cls) ?? [];
  if (selectors.length === 0) return true;
  for (const sel of selectors) {
    const elementMatch = sel.match(/^[a-z][a-z0-9-]*$/);
    if (elementMatch) {
      if (new RegExp(`<${sel}(?![a-z0-9-])`).test(tpl)) return true;
      continue;
    }
    const attrMatch = sel.match(/^\[([\w-]+)(?:[*~|^$]?=[^\]]*)?\]$/);
    if (attrMatch) {
      if (new RegExp(String.raw`\b${attrMatch[1]}\b`).test(tpl)) return true;
      continue;
    }
    const compoundMatch = sel.match(/^([a-z][a-z0-9-]*)\[([\w-]+)(?:[*~|^$]?=[^\]]*)?\]$/);
    if (compoundMatch) {
      const [, tag, attr] = compoundMatch;
      const tagOpenRe = new RegExp(String.raw`<${tag}\b[^>]*\b${attr}\b`);
      if (tagOpenRe.test(tpl)) return true;
      continue;
    }
    // `input[cngxInputMask][formControl]`: every attribute must sit on one opening tag.
    const multiAttrMatch = sel.match(
      /^([a-z][a-z0-9-]*)?((?:\[[\w-]+(?:[*~|^$]?=[^\]]*)?\]){2,})$/,
    );
    if (multiAttrMatch) {
      const [, tag, attrPart] = multiAttrMatch;
      const attrs = [...attrPart.matchAll(/\[([\w-]+)/g)].map((m) => m[1]);
      const openTagRe = new RegExp(String.raw`<${tag ?? '[a-z][a-z0-9-]*'}\b[^>]*>`, 'g');
      for (const [openTag] of tpl.matchAll(openTagRe)) {
        if (attrs.every((attr) => new RegExp(String.raw`\b${attr}\b`).test(openTag))) {
          return true;
        }
      }
      continue;
    }
    if (tpl.includes(sel)) return true;
  }
  return false;
}

const indentOf = (line) => /^[ \t]*/.exec(line)[0].length;

/**
 * Dedent for a class body. Story `setup` strings usually start flush on the
 * backtick line while every later member sits at two spaces, so `dedent`
 * finds a minimum of 0 and leaves the later lines shifted. Here a flush
 * line 1 counts as sitting at member column: the base indent is
 * `min(2, minIndent(lines 2..n))`, sliced from lines 2..n only. Every other
 * shape goes through `dedent`.
 */
export function dedentClassBody(s) {
  const lines = String(s).split('\n');
  const [first, ...rest] = lines;
  const meaningfulRest = rest.filter((l) => l.trim().length > 0);
  const flushFirst = first.trim().length > 0 && indentOf(first) === 0;
  if (!flushFirst || meaningfulRest.length === 0) {
    return dedent(s);
  }
  const base = Math.min(2, ...meaningfulRest.map(indentOf));
  return [first, ...rest.map((l) => l.slice(base))].join('\n').replace(/\s+$/, '');
}

export function indent(s, n) {
  const pad = ' '.repeat(n);
  return s
    .split('\n')
    .map((l) => (l.length ? pad + l : l))
    .join('\n');
}

/**
 * The text of the TypeScript code panel: the component a consumer would
 * write for the artifact half of a story. The decorator mirrors the live one
 * (`imports`, `hostDirectives`, `viewProviders`), with Cngx `imports` matched
 * against `template` alone, so a class only the chrome uses drops out, and
 * `templateUrl` naming the Template panel. `importLines` are the live
 * component's import lines, filtered a second time against what the panel
 * shows (`setup`, `template`, the decorator), so imports only the chrome
 * needs (rxjs `delay`, fail-flag helpers, log buffers) drop out.
 */
export function buildDisplayedTs({
  story,
  importLines,
  selector,
  className,
  fileBase,
  selectorMap,
}) {
  const classText = stripCommentsForScan(story.setup ?? '');
  const template = story.template ?? '';
  const hostDirectives = (story.hostDirectives ?? []).filter(Boolean);
  const viewProviders = (story.viewProviders ?? []).filter(Boolean);
  const imports = (story.imports ?? []).filter((cls) =>
    templateUsesClass(cls, template, selectorMap),
  );

  const coreSymbols = [
    'ChangeDetectionStrategy',
    'Component',
    ...coreSymbolsFor(classText, viewProviders),
  ];
  const coreLine = `import { ${coreSymbols.join(', ')} } from '@angular/core';`;

  const scan = [classText, template, ...hostDirectives, ...viewProviders].join('\n');
  const explicitRefs = new Set([...imports, ...hostDirectives]);
  const isReferenced = (id) =>
    explicitRefs.has(id) || new RegExp(String.raw`\b${escapeRegExp(id)}\b`).test(scan);
  const otherLines = importLines
    .filter((l) => !l.includes("from '@angular/core'"))
    .map((line) => filterImportLine(line, isReferenced))
    .filter((l) => l !== null);

  const decorator = [
    '@Component({',
    `  selector: '${selector}',`,
    '  changeDetection: ChangeDetectionStrategy.OnPush,',
    ...(imports.length > 0 ? [`  imports: [${imports.join(', ')}],`] : []),
    ...(hostDirectives.length > 0 ? [`  hostDirectives: [${hostDirectives.join(', ')}],`] : []),
    ...(viewProviders.length > 0 ? [`  viewProviders: [${viewProviders.join(', ')}],`] : []),
    `  templateUrl: './${fileBase}.html',`,
    '})',
  ].join('\n');

  const body = dedentClassBody(story.setup ?? '');
  const classBlock = body
    ? `export class ${className} {\n${indent(body, 2)}\n}`
    : `export class ${className} {}`;

  return [[coreLine, ...otherLines].join('\n'), `${decorator}\n${classBlock}`].join('\n\n');
}
