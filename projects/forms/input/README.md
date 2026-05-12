# @cngx/forms/input

Smart input directives for Angular form fields. ARIA projection, autocomplete/spellcheck
inference, password visibility toggle, and live character counter.

## What it does

These directives enhance native `<input>`, `<textarea>`, and `<select>` elements with:
- Automatic ARIA attribute projection from `CngxFormFieldPresenter`
- Smart `autocomplete` inference from field names (14 built-in mappings)
- Smart `spellcheck="false"` for email, password, URL, phone, code fields
- Password show/hide toggle with correct ARIA labelling
- Live character counter with custom template support

## Exports

### Directives

| Export | Selector | Description |
|-|-|-|
| `CngxInput` | `input[cngxInput]`, `textarea[cngxInput]`, `select[cngxInput]` | ARIA projection, focus/empty tracking, smart attributes |
| `CngxPasswordToggle` | `input[cngxPasswordToggle]` | Toggles `type="password"` / `type="text"` |
| `CngxInputMask` | `input[cngxInputMask]` | Pattern-based input mask with presets (CVA) |
| `CngxNumericInput` | `input[cngxNumericInput]` | Locale-aware numeric input (CVA) |
| `CngxAutosize` | `textarea[cngxAutosize]` | Auto-resize textarea |
| `CngxInputClear` | `[cngxInputClear]` | Headless input clear behavior |
| `CngxCopyValue` | `[cngxCopyValue]` | Clipboard copy behavior |
| `CngxOtpInput` | `[cngxOtpInput]` | OTP/PIN container with auto-advance |
| `CngxOtpSlot` | `input[cngxOtpSlot]` | Single OTP slot input |
| `CngxInputFormat` | `input[cngxInputFormat]` | Display format on blur, raw on focus (CVA) |
| `CngxFileDrop` | `[cngxFileDrop]` | Headless drag-and-drop file behavior |

### Components

| Export | Selector | Description |
|-|-|-|
| `CngxCharCount` | `cngx-char-count` | Live character counter with custom template support |

### Types

`CngxCharCountContext`, `MaskTokenDef`, `MaskTokenMap`, `FormatFn`, `ParseFn`, `FileRejection`

## CngxInput

Projects these attributes automatically when inside a `cngx-form-field`:

`id`, `aria-describedby`, `aria-labelledby`, `aria-invalid`, `aria-required`,
`aria-busy`, `aria-errormessage`, `aria-readonly`, `disabled`, `autocomplete`, `spellcheck`

### Smart Autocomplete Mappings

| Field name | autocomplete value |
|-|-|
| `email` | `email` |
| `username` | `username` |
| `password` | `current-password` |
| `newpassword` / `confirmpassword` | `new-password` |
| `name` | `name` |
| `firstname` | `given-name` |
| `lastname` | `family-name` |
| `phone` / `tel` | `tel` |
| `address` | `street-address` |
| `city` | `address-level2` |
| `zip` / `postalcode` | `postal-code` |
| `country` | `country-name` |
| `organization` | `organization` |
| `url` / `website` | `url` |

Extend via `withAutocompleteMappings()` from `@cngx/forms/field`.

### Standalone Mode

Works without `cngx-form-field` as a no-op -- no crash, no ARIA projection, just focus/empty tracking.

## CngxPasswordToggle

```html
<input cngxInput cngxPasswordToggle #pwd="cngxPasswordToggle" type="password" />
<button (click)="pwd.toggle()"
  [attr.aria-label]="pwd.visible() ? 'Hide password' : 'Show password'">
  {{ pwd.visible() ? 'Hide' : 'Show' }}
</button>
```

**Signals:** `visible`
**Methods:** `toggle()`, `show()`, `hide()`

Auto-sets `spellcheck="false"` and `autocomplete="current-password"`.

## CngxCharCount

Listens to DOM `input` events on the sibling input for reliable value tracking.

```html
<!-- Default: "12/140" -->
<cngx-char-count [max]="140" />

<!-- Custom template: -->
<cngx-char-count [max]="140">
  <ng-template let-remaining="remaining" let-over="over">
    @if (over) { {{ -remaining! }} over limit }
    @else { {{ remaining }} remaining }
  </ng-template>
</cngx-char-count>
```

**Inputs:** `max`, `min`
**CSS class:** `cngx-char-count--over`
**CSS vars:** `--cngx-field-char-count-font-size`, `--cngx-field-char-count-color`, `--cngx-field-char-count-over-color`

### Template Context (`CngxCharCountContext`)

| Property | Type | Description |
|-|-|-|
| `$implicit` | `number` | Current length (use as `let-count`) |
| `current` | `number` | Current length |
| `max` | `number \| undefined` | Max constraint |
| `min` | `number \| undefined` | Min constraint |
| `over` | `boolean` | Whether value exceeds max |
| `remaining` | `number \| undefined` | Characters until max |

## CngxInputMask

Pattern-based input mask with locale-aware presets, multi-pattern support, and custom tokens.
Implements `ControlValueAccessor` for Reactive Forms.

```html
<!-- Locale-aware phone -->
<input cngxInputMask="phone" />

<!-- Custom pattern with prefix -->
<input cngxInputMask="000.000.000-00" [prefix]="'CPF: '" />

<!-- Hex color with custom token -->
<input cngxInputMask="\#HHHHHH"
       [customTokens]="{ H: { pattern: /[0-9a-fA-F]/, transform: c => c.toUpperCase() } }" />

<!-- Multi-pattern (auto-selects by length) -->
<input cngxInputMask="(00) 0000-0000|(00) 00000-0000" />
```

### Built-in Mask Tokens

| Token | Description | Regex |
|-|-|-|
| `0` | Required digit | `[0-9]` |
| `9` | Optional digit | `[0-9]?` |
| `A` | Required letter | `[a-zA-Z]` |
| `a` | Optional letter | `[a-zA-Z]?` |
| `*` | Required alphanumeric | `[a-zA-Z0-9]` |
| `\\` | Escape next char as literal | -- |

### Locale-Aware Presets

Pass a preset name instead of a pattern. Region suffix optional -- defaults to `LOCALE_ID`.

| Preset | Example | Notes |
|-|-|-|
| `date` | `cngxInputMask="date"` | DD/MM/YYYY or MM/DD/YYYY per locale |
| `date:short` | `cngxInputMask="date:short"` | 2-digit year |
| `time` / `time:24` | `cngxInputMask="time"` | HH:MM (24h) |
| `time:12` | `cngxInputMask="time:12"` | HH:MM AM/PM |
| `datetime` | `cngxInputMask="datetime"` | Date + time |
| `phone` | `cngxInputMask="phone:CH"` | Country-specific (US, DE, CH, AT, FR, UK, IT, ES, JP, BR) |
| `creditcard` | `cngxInputMask="creditcard"` | Amex/Visa/MC auto-switch |
| `iban` | `cngxInputMask="iban:CH"` | Country-specific grouping (CH, DE, AT, FR, IT, ES, NL, GB) |
| `zip` | `cngxInputMask="zip:DE"` | Country-specific (US, DE, CH, AT, FR, UK, JP) |
| `ip` / `ipv4` | `cngxInputMask="ip"` | `099.099.099.099` |
| `mac` | `cngxInputMask="mac"` | `AA:AA:AA:AA:AA:AA` |

## CngxNumericInput

Locale-aware numeric input. Uses `Intl.NumberFormat` for display formatting on blur,
raw value on focus. Arrow Up/Down (+ Shift for 10x) for increment/decrement with min/max clamping.
Sets `inputmode="decimal"` and `role="spinbutton"` with ARIA `aria-valuemin`/`aria-valuemax`/`aria-valuenow`.
Implements `ControlValueAccessor` for Reactive Forms.

```html
<input cngxNumericInput #num="cngxNumericInput"
       [min]="0" [max]="100" [step]="0.5" [decimals]="2" />
<span>Value: {{ num.numericValue() }}</span>

<!-- Currency (always 2 decimals, Swiss locale) -->
<input cngxNumericInput [decimals]="2" [min]="0" [locale]="'de-CH'" />

<!-- Integer-only -->
<input cngxNumericInput [decimals]="0" [allowNegative]="false" />
```

## CngxAutosize

Auto-resize textarea based on content. Signal-first alternative to `cdkTextareaAutosize`.
Measures via `scrollHeight` and reacts to `input` events + `ResizeObserver`.
Sets `resize: none` and `box-sizing: border-box` on the host.

```html
<textarea cngxAutosize [minRows]="2" [maxRows]="10" #auto="cngxAutosize"></textarea>
<span>Height: {{ auto.height() }}px</span>
```

## CngxInputClear

Headless clear behavior for an input or textarea. Place on a button or any element.

```html
<input #nameInput />
<button [cngxInputClear]="nameInput" #clr="cngxInputClear">
  @if (clr.hasValue()) { Clear }
</button>
```

## CngxCopyValue

Clipboard copy behavior for input fields, tokens, API keys. Place on a button or any clickable element.
Shows `copied` feedback that auto-resets after `resetDelay`.

```html
<input #tokenInput readonly [value]="token()" />
<button [cngxCopyValue] [source]="tokenInput" #cp="cngxCopyValue">
  {{ cp.copied() ? 'Copied!' : 'Copy' }}
</button>

<!-- With explicit value -->
<button [cngxCopyValue]="apiKey()">Copy API Key</button>
```

## CngxOtpInput + CngxOtpSlot

OTP/PIN input with auto-advance, paste support, and arrow key navigation.
The consumer provides slot `<input>` elements inside the container.

```html
<div cngxOtpInput [length]="6" #otp="cngxOtpInput" (completed)="verify($event)">
  @for (i of otp.indices(); track i) {
    <input [cngxOtpSlot]="i" />
  }
</div>
```

## CngxInputFormat

Display formatting on blur, raw value on focus. Applies a `format` function on blur
and a `parse` function on focus. Implements `ControlValueAccessor` for Reactive Forms.

```html
<!-- Currency formatting -->
<input [cngxInputFormat]="formatCurrency" [parse]="parseCurrency" />
```

## CngxFileDrop

Headless drag-and-drop file behavior on any element. Validates files against `accept` MIME types
and `maxSize`. Provides a `browse()` method for programmatic file picker access.

```html
<div cngxFileDrop [accept]="['image/*']" [maxSize]="5_000_000"
     #drop="cngxFileDrop" (filesChange)="upload($event)">
  @if (drop.dragging()) {
    <p>Drop files here</p>
  } @else {
    <p>Drag files or <button (click)="drop.browse()">browse</button></p>
  }
</div>
```

## Global Configuration

Configure defaults for all input directives via `provideInputConfig()` with feature functions.
Input-level bindings always take precedence over global config.

```typescript
// app.config.ts
import {
  provideInputConfig,
  withMaskPlaceholder,
  withPhonePatterns,
  withIbanPatterns,
  withCustomTokens,
  withNumericDefaults,
  withCopyResetDelay,
  withFileMaxSize,
} from '@cngx/forms/input';

export const appConfig: ApplicationConfig = {
  providers: [
    provideInputConfig(
      // Mask defaults
      withMaskPlaceholder('·'),
      withMaskGuide(true),
      withCustomTokens({
        H: { pattern: /[0-9a-fA-F]/, transform: c => c.toUpperCase() },
      }),

      // Extend built-in presets
      withPhonePatterns({ LI: '+000 000 00 00', SG: '+00 0000 0000' }),
      withIbanPatterns({ LI: 'AA00 0000 0000 0000 0000 000' }),
      withZipPatterns({ SG: '000000' }),
      withDateFormats({ th: '00/00/0000' }),

      // Numeric defaults
      withNumericDefaults({ locale: 'de-CH', decimals: 2, step: 0.5 }),

      // Utility defaults
      withCopyResetDelay(3000),
      withFileMaxSize(10_000_000),
    ),
  ],
};
```

### Token

`CNGX_INPUT_CONFIG` -- `InjectionToken<InputConfig>`, `providedIn: 'root'` (empty default).

### Feature Functions

| Function | Affects | Description |
|-|-|-|
| `withMaskPlaceholder(char)` | `CngxInputMask` | Default placeholder character |
| `withMaskGuide(bool)` | `CngxInputMask` | Default guide mode |
| `withCustomTokens(map)` | `CngxInputMask` | Global custom mask tokens |
| `withPhonePatterns(map)` | `CngxInputMask` | Add/override phone patterns by region |
| `withIbanPatterns(map)` | `CngxInputMask` | Add/override IBAN patterns by country |
| `withZipPatterns(map)` | `CngxInputMask` | Add/override ZIP patterns by country |
| `withDateFormats(map)` | `CngxInputMask` | Add/override date patterns by language |
| `withNumericDefaults(opts)` | `CngxNumericInput` | Default locale, decimals, step |
| `withCopyResetDelay(ms)` | `CngxCopyValue` | Default reset delay |
| `withFileMaxSize(bytes)` | `CngxFileDrop` | Default max file size |

### Precedence

Input binding > Global config > Built-in default

```html
<!-- Uses global placeholder ('·') -->
<input cngxInputMask="phone" />

<!-- Overrides globally to '•' for this instance -->
<input cngxInputMask="phone" placeholder="•" />
```

## Types

`MaskTokenDef`, `MaskTokenMap`, `FormatFn`, `ParseFn`, `FileRejection`, `InputConfig`, `InputConfigFeature`

## Dependency

Imports `CngxFormFieldPresenter`, `CNGX_FORM_FIELD_CONFIG`, `CNGX_FORM_FIELD_CONTROL` from `@cngx/forms/field`.
Must be used alongside `@cngx/forms/field` for full functionality.
