// Pure helpers shared by the live example component and its code panels,
// plus the selector extraction the generator and the chrome guard spec read.
// No fs access, so scripts/__tests__ can import this module without running
// the generator (index.mjs calls main() on import).

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

/** The local name of one import specifier: `type A` -> `A`, `a as b` -> `b`. */
export function localName(spec) {
  const parts = spec
    .trim()
    .replace(/^type\s+/, '')
    .split(/\s+as\s+/);
  return (parts.length > 1 ? parts[1] : parts[0])?.trim();
}

export function importedSymbols(importLine) {
  const m = importLine.match(/import\s+(?:type\s+)?\{([^}]+)\}/);
  if (!m) return [];
  return m[1].split(',').map(localName).filter(Boolean);
}

/**
 * Splits a one-line named import into `head` (`import {` or `import type {`),
 * the trimmed `specifiers`, `tail` (`} from '<module>';`), `isType` and
 * `module`. Returns `null` for any other line.
 */
export function parseNamedImport(line) {
  const match = line.match(
    /^(\s*import\s*(?:type\s+)?\{)([^}]+)(\}\s*from\s*['"]([^'"]+)['"];?\s*)$/,
  );
  if (!match) return null;
  const [, head, body, tail, module] = match;
  return {
    head,
    specifiers: body
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    tail,
    isType: /\btype\s*\{$/.test(head),
    module,
  };
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
  const parsed = parseNamedImport(line);
  if (!parsed) return line;
  const kept = parsed.specifiers.filter((spec) => isReferenced(localName(spec)));
  if (kept.length === 0) return null;
  return `${parsed.head} ${kept.join(', ')} ${parsed.tail.trim()}`;
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

/**
 * Strip demo-chrome divs from a displayed template - `event-grid`/`event-row`
 * (state readouts), `button-row`/`status-row` (config toggles), `cngx-ex-chrome`
 * (explicit opt-in marker). Walks balanced <div>/</div> so nested chrome
 * inside an outer chrome block is removed together. The live rendered
 * template keeps everything; this only affects the Template-panel display
 * and complements the `templateChrome` field for sections that haven't
 * been migrated to the split yet.
 */
export function stripDemoChrome(html) {
  const opener =
    /<div\b[^>]*\bclass=["'][^"']*\b(?:event-grid|event-row|button-row|status-row|cngx-ex-chrome)\b[^"']*["'][^>]*>/g;
  let result = html;
  while (true) {
    opener.lastIndex = 0;
    const m = opener.exec(result);
    if (!m) break;
    let depth = 1;
    let i = m.index + m[0].length;
    while (i < result.length && depth > 0) {
      const next = result.slice(i).match(/<\/?div\b[^>]*>/);
      if (!next) break;
      const absIdx = i + next.index;
      if (next[0].startsWith('</')) depth--;
      else depth++;
      i = absIdx + next[0].length;
    }
    result = result.slice(0, m.index).replace(/\s*$/, '') + result.slice(i);
  }
  return result;
}

/** The Template panel text: the artifact `template` minus chrome divs, dedented. */
export function buildDisplayedHtml(template) {
  return dedentMarkup(stripDemoChrome(template ?? ''));
}

/**
 * Cngx classes the panel decorator lists (they match the raw `template`) whose
 * only use sits inside a chrome div, so the Template panel hides them.
 */
export function chromeHiddenClasses(story, selectorMap) {
  const template = story.template ?? '';
  const shown = stripDemoChrome(template);
  return (story.imports ?? []).filter(
    (cls) =>
      cls.startsWith('Cngx') &&
      templateUsesClass(cls, template, selectorMap) &&
      !templateUsesClass(cls, shown, selectorMap),
  );
}

/** Whether a file under projects/ can declare a selector the generator maps. */
export function isSelectorSource(path) {
  return path.endsWith('.ts') && !path.endsWith('.spec.ts') && !path.endsWith('public-api.ts');
}

/**
 * `[className, selectors]` for every exported class in `src` with a
 * `selector:` or `exportAs:` before it (the last one of each wins).
 */
export function selectorsInSource(src) {
  const entries = [];
  for (const classMatch of src.matchAll(/\bexport\s+(?:abstract\s+)?class\s+([A-Z]\w*)/g)) {
    const className = classMatch[1];
    const before = src.slice(0, classMatch.index);
    const selectorMatches = [...before.matchAll(/selector:\s*['"]([^'"]+)['"]/g)];
    const exportAsMatches = [...before.matchAll(/exportAs:\s*['"]([^'"]+)['"]/g)];
    if (selectorMatches.length === 0 && exportAsMatches.length === 0) continue;
    const selectors = [];
    if (selectorMatches.length > 0) {
      const last = selectorMatches.at(-1);
      selectors.push(
        ...last[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      );
    }
    if (exportAsMatches.length > 0) {
      const last = exportAsMatches.at(-1);
      selectors.push(
        ...last[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      );
    }
    entries.push([className, selectors]);
  }
  return entries;
}

const indentOf = (line) => /^[ \t]*/.exec(line)[0].length;

/**
 * Dedent for template markup. A template that starts flush on the backtick
 * line has a minimum indent of 0, so `dedent` leaves every later line
 * shifted. In balanced markup the least-indented later line is a sibling of
 * line 1 or its closing tag, so that indent is line 1's column: it is sliced
 * from lines 2..n and line 1 stays as is. Every other shape goes through
 * `dedent`.
 */
export function dedentMarkup(s) {
  const lines = String(s).split('\n');
  const [first, ...rest] = lines;
  const meaningfulRest = rest.filter((l) => l.trim().length > 0);
  const flushFirst = first.trim().length > 0 && indentOf(first) === 0;
  if (!flushFirst || meaningfulRest.length === 0) {
    return dedent(s);
  }
  const base = Math.min(...meaningfulRest.map(indentOf));
  if (base === 0) {
    return dedent(s);
  }
  return [first, ...rest.map((l) => l.slice(base))].join('\n').replace(/\s+$/, '');
}

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
