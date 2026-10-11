/**
 * Evaluates the `STORY` object literal of a `*.story.ts` source. The one story
 * parser shared by the examples generator, the recipe pack tools and the
 * examples guard specs.
 *
 * It uses `new Function`. That is safe here and only here: the input is
 * first-party committed source under examples/stories and the callers run at
 * build or test time, never in shipped code. Do not point it at untrusted
 * input.
 *
 * Throws `No STORY export in <label>` when the export is missing and
 * `Cannot evaluate STORY in <label>: <cause>` when the literal does not
 * evaluate. It never returns `null`; each caller decides whether a throw
 * skips the story, warns or fails.
 */
export function parseStory(source, label) {
  const stripped = source.replace(/^import type[^\n]+\n/m, '');
  const match = stripped.match(/export const STORY[^=]*=\s*([\s\S]+?);?\s*$/);
  if (!match) {
    throw new Error(`No STORY export in ${label}`);
  }
  try {
    return new Function(`return (${match[1]})`)();
  } catch (err) {
    throw new Error(`Cannot evaluate STORY in ${label}: ${err.message}`);
  }
}
