<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Error Codes

Every developer diagnostic CNGX writes to the console carries a code and a link to its page:

```text
CNGX0001: [cngx/i18n] "de_DE" is not a BCP 47 locale; reading it as English. Find more at https://cngxjs.github.io/cngx/additional-documentation/error-codes/cngx0001.html
```

The text after the code says what happened at that call site. The page says why CNGX checks it and how to fix it.

Console diagnostics are development-only. The message and its code sit behind Angular's `ngDevMode` flag, so a production build drops both; the behaviour around them (an English fallback, a kept placeholder) stays the same. A console entry with a `CNGX` code in production means a CNGX bug; please report it.

Thrown errors are different: they keep their code in production by design, so a `CNGX` code in a production error is expected. See [Thrown errors](#thrown-errors).

## Ranges

Each library emits codes in its own range, so the code tells you where to look.

|Range|Library|
|-|-|
|`CNGX0001` - `CNGX0899`|`@cngx/core`|
|`CNGX0900` - `CNGX0999`|`@cngx/utils`|
|`CNGX1000` - `CNGX1999`|`@cngx/common`|
|`CNGX2000` - `CNGX2999`|`@cngx/forms`|
|`CNGX3000` - `CNGX3999`|`@cngx/ui`|
|`CNGX4000` - `CNGX4999`|`@cngx/data-display`|
|`CNGX5000` - `CNGX5999`|`@cngx/interop`|

## Thrown errors

Some misuse cannot be worked around, for example a directive placed outside the parent it needs. CNGX throws a `CngxRuntimeError` there, with the same code and page as a console diagnostic.

In development the message reads like a console diagnostic:

```text
CNGX1044: CngxChipInteraction must NOT be used inside <cngx-chip-group> / <cngx-multi-chip-group>; use [cngxChipInGroup] instead. Find more at https://cngxjs.github.io/cngx/additional-documentation/error-codes/cngx1044.html
```

In a production build the message is the bare code, `CNGX1044`. The text and the link are dropped, the code stays, so a production error report still tells you which page to read.

To handle a thrown error in code, check the class and the code, never the message:

```typescript
import { CngxRuntimeError } from '@cngx/utils';

try {
  state.updateAtPath(path, node);
} catch (err) {
  if (err instanceof CngxRuntimeError && err.code === 'CNGX2010') {
    // the path no longer exists
  }
}
```

The message differs between development and production, while `.code` is the same in both.

## Reading a page

Each code has one page, listed in the sidebar under this one. A page has three parts:

- **The intro** - what triggers the message, why CNGX checks it, and what goes wrong when it is ignored, usually with an example of the failing code.
- **Fixing the warning** (or **error**) - the change that makes the message go away, with one or more options and their code.
- **Debugging the warning** (or **error**) - what the message tells you, when the check runs, and how to find the place that caused it.

A warning flags a likely mistake that CNGX works around. An error flags a setup that leaves a feature broken or wrong; it is still a console message, not a thrown exception.

One code stands for one condition. A code is never reused: when a check is removed, its page stays and says in which version the code was retired.

Codes are also listed in `scripts/manifests/error-codes.json` in the repository, for tools that want the code, library, severity and source files without parsing the pages.
