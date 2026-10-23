#!/usr/bin/env node
// Usage:
//   npm run schematics:mcp   # rewrite the generated module
//
// Distils what the @cngx/mcp server registers - its tools with one example
// question each, its resources and its prompts - into the data the ng-add
// helper README renders as a capability table. The registrations are the
// single source; the schematic never carries a hand-written list, and
// `scripts/__tests__/schematics-mcp-capabilities.test.mjs` fails when the
// generated module falls behind them.
//
// The sources are read as TypeScript ASTs, not imported: the command
// definitions import zod and the resource and prompt registrations import the
// MCP SDK, neither of which the schematics build loads.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, posix, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import ts from 'typescript';

import { normalizeDashes } from './normalize-dashes.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The one place that knows where the registry lives. When the command
// definitions move, update these constants and the `example` lookup below.
export const MCP_REGISTRY_ROOT = 'packages/mcp/src';
export const OUT = 'projects/core/schematics/ng-add/steps/mcp-capabilities.generated.ts';

const TOOLS_DIR = posix.join(MCP_REGISTRY_ROOT, 'core/commands');
export const COMMAND_REGISTRY = posix.join(MCP_REGISTRY_ROOT, 'core/registry.ts');
const RESOURCES = posix.join(MCP_REGISTRY_ROOT, 'resources/register-resources.ts');
const PROMPTS = posix.join(MCP_REGISTRY_ROOT, 'prompts/register-prompts.ts');

/** The registry source files, in a stable order, relative to the repo root. */
export function registrySources(root = ROOT) {
  const tools = readdirSync(resolve(root, TOOLS_DIR))
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
    .sort()
    .map((file) => posix.join(TOOLS_DIR, file));
  return [...tools, RESOURCES, PROMPTS];
}

// A string literal, a no-substitution template or a `+` chain of them.
function stringValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isParenthesizedExpression(node)) {
    return stringValue(node.expression);
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = stringValue(node.left);
    const right = stringValue(node.right);
    return left === undefined || right === undefined ? undefined : left + right;
  }
  return undefined;
}

function property(object, name) {
  const found = object.properties.find(
    (member) =>
      ts.isPropertyAssignment(member) && ts.isIdentifier(member.name) && member.name.text === name,
  );
  return found === undefined ? undefined : stringValue(found.initializer);
}

function registrationCalls(source, method) {
  const calls = [];
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === method
    ) {
      calls.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return calls;
}

function exportedString(source, name) {
  for (const statement of source.statements) {
    const exported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!exported || !ts.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === name &&
        declaration.initializer
      ) {
        return stringValue(declaration.initializer);
      }
    }
  }
  return undefined;
}

function parse(path, text) {
  return ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
}

function fail(path, message) {
  throw new Error(`${path}: ${message}`);
}

function requireString(path, value, what) {
  return value === undefined
    ? fail(path, `${what} is not a string literal`)
    : normalizeDashes(value);
}

function defineCommandCalls(source) {
  const calls = [];
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'defineCommand'
    ) {
      calls.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return calls;
}

/** `defineCommand({ name, title, description })` plus the module's exported `example`. */
export function collectTools(files) {
  return files.flatMap(({ path, text }) => {
    const source = parse(path, text);
    return defineCommandCalls(source).map((call) => {
      const [definition] = call.arguments;
      if (definition === undefined || !ts.isObjectLiteralExpression(definition)) {
        fail(path, 'defineCommand argument is not an object literal');
      }
      return {
        name: requireString(path, property(definition, 'name'), 'the tool name'),
        title: requireString(path, property(definition, 'title'), 'title'),
        description: requireString(path, property(definition, 'description'), 'description'),
        example: requireString(path, exportedString(source, 'example'), 'the exported `example`'),
      };
    });
  });
}

// The exported const a definition file binds its `defineCommand(...)` to.
function definedCommandExports(source) {
  const names = [];
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      const init = declaration.initializer;
      const isDefinition =
        init !== undefined &&
        ts.isCallExpression(init) &&
        ts.isIdentifier(init.expression) &&
        init.expression.text === 'defineCommand';
      if (isDefinition && ts.isIdentifier(declaration.name)) {
        names.push(declaration.name.text);
      }
    }
  }
  return names;
}

/**
 * Cross-checks `COMMANDS` in the registry against the definition files. Returns
 * one problem per definition the registry does not list and per registry entry
 * that no definition file exports; empty when both agree.
 */
export function registryCoverage(registry, toolFiles) {
  const source = parse(registry.path, registry.text);
  const importedFrom = new Map();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    const bindings = statement.importClause?.namedBindings;
    if (bindings === undefined || !ts.isNamedImports(bindings)) {
      continue;
    }
    for (const element of bindings.elements) {
      importedFrom.set(element.name.text, statement.moduleSpecifier.text);
    }
  }

  const listed = [];
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      const init = declaration.initializer;
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === 'COMMANDS' &&
        init !== undefined &&
        ts.isArrayLiteralExpression(init)
      ) {
        listed.push(...init.elements.filter(ts.isIdentifier).map((element) => element.text));
      }
    }
  }

  const registryDir = posix.dirname(registry.path);
  const defined = new Map();
  for (const file of toolFiles) {
    for (const name of definedCommandExports(parse(file.path, file.text))) {
      defined.set(name, file.path);
    }
  }

  const problems = [];
  for (const name of listed) {
    const specifier = importedFrom.get(name);
    const file =
      specifier === undefined
        ? undefined
        : posix.join(registryDir, specifier.replace(/\.js$/, '.ts'));
    if (file === undefined || defined.get(name) !== file) {
      problems.push(`COMMANDS lists ${name} but no definition file exports it`);
    }
  }
  for (const [name, file] of defined) {
    if (!listed.includes(name)) {
      problems.push(`${file} defines ${name} but COMMANDS does not list it`);
    }
  }
  return problems;
}

// The URI is a literal or the first argument of `new ResourceTemplate(...)`.
function resourceUri(node) {
  if (ts.isNewExpression(node) && node.arguments?.[0]) {
    return stringValue(node.arguments[0]);
  }
  return stringValue(node);
}

/** `registerResource(name, uri | new ResourceTemplate(uri), { title, description })`. */
export function collectResources({ path, text }) {
  return registrationCalls(parse(path, text), 'registerResource').map((call) => {
    const [nameArg, uriArg, config] = call.arguments;
    if (config === undefined || !ts.isObjectLiteralExpression(config)) {
      fail(path, 'registerResource metadata is not an object literal');
    }
    return {
      name: requireString(path, stringValue(nameArg), 'the resource name'),
      uri: requireString(path, resourceUri(uriArg), 'the resource uri'),
      title: requireString(path, property(config, 'title'), 'title'),
      description: requireString(path, property(config, 'description'), 'description'),
    };
  });
}

/** `registerPrompt(name, { title, description })`. */
export function collectPrompts({ path, text }) {
  return registrationCalls(parse(path, text), 'registerPrompt').map((call) => {
    const [nameArg, config] = call.arguments;
    if (config === undefined || !ts.isObjectLiteralExpression(config)) {
      fail(path, 'registerPrompt config is not an object literal');
    }
    return {
      name: requireString(path, stringValue(nameArg), 'the prompt name'),
      title: requireString(path, property(config, 'title'), 'title'),
      description: requireString(path, property(config, 'description'), 'description'),
    };
  });
}

// Over the extracted entries, not the source text: a logic change inside a
// tool module leaves the capability list, and so the generated module, as is.
export function capabilityHash(capabilities) {
  return `sha256:${createHash('sha256').update(JSON.stringify(capabilities)).digest('hex')}`;
}

const quote = (text) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function entry(fields) {
  return [
    '  {',
    ...Object.entries(fields).map(([key, value]) => `    ${key}: ${quote(value)},`),
    '  },',
  ].join('\n');
}

/** The generated module for the registry files (`{ path, text }`, in `registrySources` order). */
export function renderCapabilityModule(files) {
  const toolFiles = files.filter(({ path }) => path.startsWith(`${TOOLS_DIR}/`));
  const resources = files.find(({ path }) => path === RESOURCES);
  const prompts = files.find(({ path }) => path === PROMPTS);
  if (resources === undefined || prompts === undefined) {
    throw new Error(`The registry needs ${RESOURCES} and ${PROMPTS}.`);
  }
  // Only what the helper README renders; the rest of a registration stays out of the bundle.
  const capabilities = {
    tools: collectTools(toolFiles).map(({ name, title, example }) => ({ name, title, example })),
    resources: collectResources(resources).map(({ uri, description }) => ({ uri, description })),
    prompts: collectPrompts(prompts).map(({ name, description }) => ({ name, description })),
  };
  return [
    `// Generated by scripts/schematics-mcp-capabilities.mjs from ${MCP_REGISTRY_ROOT}.`,
    '// Do not edit; run `npm run schematics:mcp`.',
    `// Capabilities: ${capabilityHash(capabilities)}`,
    '',
    '/** A tool the @cngx/mcp server registers, with one question it answers. */',
    'export interface McpTool {',
    '  readonly name: string;',
    '  readonly title: string;',
    '  readonly example: string;',
    '}',
    '',
    'export interface McpResource {',
    '  readonly uri: string;',
    '  readonly description: string;',
    '}',
    '',
    'export interface McpPrompt {',
    '  readonly name: string;',
    '  readonly description: string;',
    '}',
    '',
    'export const MCP_TOOLS: readonly McpTool[] = [',
    ...capabilities.tools.map(entry),
    '];',
    '',
    'export const MCP_RESOURCES: readonly McpResource[] = [',
    ...capabilities.resources.map(entry),
    '];',
    '',
    'export const MCP_PROMPTS: readonly McpPrompt[] = [',
    ...capabilities.prompts.map(entry),
    '];',
    '',
  ].join('\n');
}

export function readRegistry(root = ROOT) {
  return registrySources(root).map((path) => ({
    path,
    text: readFileSync(resolve(root, path), 'utf8'),
  }));
}

function main() {
  const files = readRegistry();
  writeFileSync(resolve(ROOT, OUT), renderCapabilityModule(files));
  const tools = collectTools(files.filter(({ path }) => path.startsWith(`${TOOLS_DIR}/`)));
  process.stdout.write(`${OUT}: ${tools.length} tools\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
