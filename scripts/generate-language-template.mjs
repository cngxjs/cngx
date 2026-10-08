// Generates the English language template `@cngx/core/i18n/en` from the
// English sections the libs export.
//
// Every lib entry exports its English section as `CNGX_<AREA>_LANGUAGE_EN`
// and adds its area to `CngxLanguagePack` by module augmentation. This script
// reads both from the built `dist/` (run `npm run build:libs` first): the area
// key and section type from the `.d.ts` augmentation, the value from the
// const's object literal in the FESM bundle. No lib code runs; the literal is
// pure data. The result is written as one literal data object, so the shipped
// template imports no lib and core stays below common.
//
//   node scripts/generate-language-template.mjs           write the template
//   node scripts/generate-language-template.mjs --check   exit 1 when stale

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as prettier from 'prettier';
import ts from 'typescript';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const LIBS = ['utils', 'core', 'common', 'interop', 'forms', 'data-display', 'ui'];

export const TEMPLATE_PATH = join(ROOT, 'projects/core/i18n/en/language-en.ts');

const EN_CONST = /^CNGX_\w+_LANGUAGE_EN$/;

function filesOf(dir, extension) {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter((name) => name.endsWith(extension))
    .map((name) => join(dir, name));
}

/** Top-level statements of a file, parsed without type information. */
function statementsOf(file) {
  const kind = file.endsWith('.mjs') ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  return ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ES2022, true, kind)
    .statements;
}

/** Names listed in the file's `export { ... }` clauses. */
function exportedNames(statements) {
  const names = new Set();
  for (const statement of statements) {
    if (ts.isExportDeclaration(statement) && statement.exportClause) {
      for (const element of statement.exportClause.elements) {
        names.add(element.name.text);
      }
    }
  }
  return names;
}

/**
 * From the `.d.ts` bundles: section type -> pack area (from the
 * `CngxLanguagePack` augmentation) and exported English const -> section type.
 */
function readDeclarations() {
  const areaOfType = new Map();
  const typeOfConst = new Map();
  for (const lib of LIBS) {
    for (const file of filesOf(join(DIST, lib, 'types'), '.d.ts')) {
      const statements = statementsOf(file);
      const exported = exportedNames(statements);
      for (const statement of statements) {
        if (ts.isModuleDeclaration(statement) && statement.name.text === '@cngx/core/i18n') {
          for (const member of statement.body?.statements ?? []) {
            if (!ts.isInterfaceDeclaration(member) || member.name.text !== 'CngxLanguagePack') {
              continue;
            }
            for (const property of member.members) {
              if (ts.isPropertySignature(property) && property.type) {
                areaOfType.set(property.type.getText(), property.name.getText());
              }
            }
          }
        }
        if (ts.isVariableStatement(statement)) {
          for (const declaration of statement.declarationList.declarations) {
            const name = declaration.name.getText();
            if (EN_CONST.test(name) && exported.has(name) && declaration.type) {
              typeOfConst.set(name, declaration.type.getText());
            }
          }
        }
      }
    }
  }
  return { areaOfType, typeOfConst };
}

/** From the FESM bundles: English const name -> its evaluated object literal. */
function readValues(names) {
  const values = new Map();
  for (const lib of LIBS) {
    for (const file of filesOf(join(DIST, lib, 'fesm2022'), '.mjs')) {
      for (const statement of statementsOf(file)) {
        if (!ts.isVariableStatement(statement)) {
          continue;
        }
        for (const declaration of statement.declarationList.declarations) {
          const name = declaration.name.getText();
          if (!names.has(name)) {
            continue;
          }
          const initializer = declaration.initializer;
          if (!initializer || !ts.isObjectLiteralExpression(initializer)) {
            throw new Error(`${name} in ${file} is not an object literal`);
          }
          const value = new Function(`return (${initializer.getText()});`)();
          const previous = values.get(name);
          if (previous && JSON.stringify(previous) !== JSON.stringify(value)) {
            throw new Error(`${name} differs between bundles`);
          }
          values.set(name, value);
        }
      }
    }
  }
  return values;
}

/** The English pack: `locale` plus every exported English section by area. */
export function collectEnglishPack() {
  if (!existsSync(join(DIST, 'core', 'package.json'))) {
    throw new Error('dist/ lacks core - run `npm run build:libs` first');
  }
  const { areaOfType, typeOfConst } = readDeclarations();
  const values = readValues(new Set(typeOfConst.keys()));
  const sections = [];
  for (const [name, type] of typeOfConst) {
    const area = areaOfType.get(type);
    if (!area) {
      throw new Error(`${name} has type ${type}, which no CngxLanguagePack augmentation maps`);
    }
    if (!values.has(name)) {
      throw new Error(`${name} is declared but no bundle defines it`);
    }
    sections.push([area, values.get(name)]);
  }
  sections.sort(([a], [b]) => a.localeCompare(b, 'en'));
  return { locale: 'en', ...Object.fromEntries(sections) };
}

/** The formatted source of `projects/core/i18n/en/language-en.ts`. */
export async function renderEnglishTemplate() {
  const source = `// Generated by scripts/generate-language-template.mjs from the English
// sections of the cngx libs. Do not edit; rebuild the libs and re-run it.

/**
 * The English language pack: every cngx section in English, as plain data.
 * Copy it as the template for a new language file, or pass it to
 * \`withPack\` to switch back to English explicitly.
 *
 * @category core/i18n
 * @since 0.1.0
 * @relatedTo provideCngxI18n, withPack
 */
export const CNGX_LANGUAGE_EN = ${JSON.stringify(collectEnglishPack(), null, 2)};
`;
  const options = (await prettier.resolveConfig(TEMPLATE_PATH)) ?? {};
  return prettier.format(source, { ...options, filepath: TEMPLATE_PATH });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rendered = await renderEnglishTemplate();
  const current = existsSync(TEMPLATE_PATH) ? readFileSync(TEMPLATE_PATH, 'utf8') : '';
  if (process.argv.includes('--check')) {
    if (current !== rendered) {
      console.error(
        'projects/core/i18n/en/language-en.ts is stale. Run `npm run build:libs` and ' +
          '`node scripts/generate-language-template.mjs`.',
      );
      process.exit(1);
    }
  } else if (current !== rendered) {
    writeFileSync(TEMPLATE_PATH, rendered);
    console.log('Wrote projects/core/i18n/en/language-en.ts');
  }
}
