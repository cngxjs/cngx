// The optional `version` input every version-scoped query tool shares. One
// definition, six consumers (find_component, get_api, get_slots,
// get_theme_tokens, get_di_tokens, get_config): the description names
// behaviour - offline default, fail-safe gh fetch - that must not drift
// between tools, so it exists exactly once.

import { z } from 'zod';

export const versionInput = z
  .string()
  .optional()
  .describe(
    'Optional cngx version to ground the answer against, e.g. "0.2.0". Omit to answer from the ' +
      'bundled snapshot offline; a non-bundled version fetches that release snapshot via gh (fail-safe).',
  );
