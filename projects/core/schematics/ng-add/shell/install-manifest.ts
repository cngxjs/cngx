import { type Tree } from '../../engine';
import {
  INSTALL_MANIFEST_PATH,
  type InstallManifest,
  parseInstallManifest,
  type UnreadableManifest,
} from '../steps/manifest';

/**
 * What a previous `ng add` left in the tree. A file that exists but does
 * not parse as this release's manifest is `unreadable`, never read as no
 * previous install: a run that took it for absent would drop every record
 * in it without a word.
 */
export type InstallManifestState =
  | { readonly state: 'absent' }
  /** `content` is the file's bytes, so a copy keeps even a file that is not UTF-8. */
  | ({ readonly state: 'unreadable' } & UnreadableManifest)
  | { readonly state: 'read'; readonly manifest: InstallManifest };

/** The install manifest in the tree. Shell only: the rules read it and hand it to the pure steps. */
export function readInstallManifest(tree: Tree): InstallManifestState {
  if (!tree.exists(INSTALL_MANIFEST_PATH)) {
    return { state: 'absent' };
  }
  const content = tree.read(INSTALL_MANIFEST_PATH) ?? Buffer.alloc(0);
  const text = decodeUtf8(content);
  if (text === undefined) {
    return { state: 'unreadable', cause: 'not-utf8', content };
  }
  if (!isJson(text)) {
    return { state: 'unreadable', cause: 'not-json', content };
  }
  const manifest = parseInstallManifest(text);
  return manifest === undefined ? { state: 'unreadable', cause: 'not-a-record', content } : { state: 'read', manifest };
}

function isJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

// `tree.readText` throws on bytes that are not UTF-8; such a file is
// unreadable like any other, not a reason to abort the run.
function decodeUtf8(content: Buffer): string | undefined {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(content);
  } catch {
    return undefined;
  }
}

/** The manifest of a `read` state, `undefined` for the other two. */
export function manifestOf(state: InstallManifestState): InstallManifest | undefined {
  return state.state === 'read' ? state.manifest : undefined;
}

/**
 * Where an unreadable manifest is kept: `.cngx/install.json.unreadable`,
 * then `-2`, `-3`, so an earlier copy is never written over.
 */
export function unreadableCopyPath(exists: (path: string) => boolean): string {
  const base = `${INSTALL_MANIFEST_PATH}.unreadable`;
  let path = base;
  for (let suffix = 2; exists(path); suffix++) {
    path = `${base}-${suffix}`;
  }
  return path;
}
