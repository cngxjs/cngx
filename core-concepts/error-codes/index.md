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

Diagnostics are development-only. The message and its code sit behind Angular's `ngDevMode` flag, so a production build drops both; the behaviour around them (an English fallback, a kept placeholder) stays the same. A console entry with a `CNGX` code in production means a CNGX bug; please report it.

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

## Reading a page

Each code has one page, listed in the sidebar under this one. A page has three parts:

- **The intro** - what triggers the message, why CNGX checks it, and what goes wrong when it is ignored, usually with an example of the failing code.
- **Fixing the warning** (or **error**) - the change that makes the message go away, with one or more options and their code.
- **Debugging the warning** (or **error**) - what the message tells you, when the check runs, and how to find the place that caused it.

A warning flags a likely mistake that CNGX works around. An error flags a setup that leaves a feature broken or wrong; it is still a console message, not a thrown exception.

One code stands for one condition. A code is never reused: when a check is removed, its page stays and says in which version the code was retired.

Codes are also listed in `scripts/manifests/error-codes.json` in the repository, for tools that want the code, library, severity and source files without parsing the pages.
