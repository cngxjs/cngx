// The optional `version` input of the version-scoped query tools. One template,
// seven consumers: `versionInput` for the six that resolve a release snapshot
// (find_component, get_api, get_slots, get_theme_tokens, get_di_tokens,
// get_config) and `errorCodeVersionInput` for get_error_code, which resolves the
// release's error-code asset. The description names behaviour - offline default,
// fail-safe gh-then-HTTPS fetch - that must not drift between tools, so it exists
// exactly once.

import { z } from 'zod';

/** The description of a `version` input that fetches `source`. */
export function versionDescription(source: string): string {
  return (
    'Optional cngx version to ground the answer against, e.g. "0.2.0"; a leading "v" or "V" is accepted. Omit to answer from the ' +
    `bundled snapshot offline; a non-bundled version fetches ${source} via gh, or over HTTPS ` +
    'when gh is missing or fails (fail-safe).'
  );
}

export const versionInput = z.string().optional().describe(versionDescription('that release snapshot'));

export const errorCodeVersionInput = z.string().optional().describe(versionDescription("that release's error-code asset"));
