import {
  computed,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  LOCALE_ID,
  output,
  signal,
  type Signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CNGX_INPUT_CONFIG, type InputConfig } from './input-config';

interface MaskToken {
  readonly kind: 'slot' | 'literal';
  /** For 'slot': regex the char must match. For 'literal': the literal char. */
  readonly test: RegExp | null;
  readonly char: string;
  readonly optional: boolean;
}

const SLOT_TOKENS: Record<string, { test: RegExp; optional: boolean }> = {
  '0': { test: /[0-9]/, optional: false },
  '9': { test: /[0-9]/, optional: true },
  A: { test: /[a-zA-Z]/, optional: false },
  a: { test: /[a-zA-Z]/, optional: true },
  '*': { test: /[a-zA-Z0-9]/, optional: false },
};

function parseMask(pattern: string, customTokens?: MaskTokenMap): MaskToken[] {
  const tokens: MaskToken[] = [];
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '\\' && i + 1 < pattern.length) {
      i++;
      tokens.push({ kind: 'literal', test: null, char: pattern[i], optional: false });
    } else if (customTokens?.[ch]) {
      const custom = customTokens[ch];
      tokens.push({
        kind: 'slot',
        test: custom.pattern,
        char: ch,
        optional: custom.optional ?? false,
      });
    } else if (SLOT_TOKENS[ch]) {
      const slot = SLOT_TOKENS[ch];
      tokens.push({ kind: 'slot', test: slot.test, char: ch, optional: slot.optional });
    } else {
      tokens.push({ kind: 'literal', test: null, char: ch, optional: false });
    }
  }
  return tokens;
}

function selectPattern(patterns: string[], rawLength: number, customTokens?: MaskTokenMap): string {
  if (patterns.length === 1) {
    return patterns[0];
  }

  // Shortest pattern whose slot count fits rawLength; longest pattern when rawLength exceeds all.
  let best = patterns[0];
  let bestSlots = slotCount(best, customTokens);

  for (const p of patterns) {
    const sc = slotCount(p, customTokens);
    if (rawLength <= sc && sc < bestSlots) {
      best = p;
      bestSlots = sc;
    } else if (sc > bestSlots && rawLength > bestSlots) {
      best = p;
      bestSlots = sc;
    }
  }
  return best;
}

function slotCount(pattern: string, customTokens?: MaskTokenMap): number {
  return parseMask(pattern, customTokens).filter((t) => t.kind === 'slot').length;
}

function applyMask(
  raw: string,
  tokens: MaskToken[],
  placeholder: string,
  guide: boolean,
): { masked: string; rawOut: string; complete: boolean } {
  let masked = '';
  let rawOut = '';
  let rawIdx = 0;

  for (const token of tokens) {
    if (token.kind === 'literal') {
      masked += token.char;
    } else {
      const ch = raw[rawIdx];
      if (ch != null && token.test!.test(ch)) {
        masked += ch;
        rawOut += ch;
        rawIdx++;
      } else if (token.optional) {
        if (guide) {
          masked += placeholder;
        }
      } else {
        if (guide) {
          masked += placeholder;
        }
      }
    }
  }

  let requiredCount = 0;
  let filledCount = 0;
  let ri = 0;
  for (const token of tokens) {
    if (token.kind === 'slot') {
      if (!token.optional) {
        requiredCount++;
      }
      const c = raw[ri];
      if (c != null && token.test!.test(c)) {
        if (!token.optional) {
          filledCount++;
        }
        ri++;
      }
    }
  }

  return { masked, rawOut, complete: filledCount >= requiredCount };
}

function nextSlotIndex(tokens: MaskToken[], from: number): number {
  for (let i = from; i < tokens.length; i++) {
    if (tokens[i].kind === 'slot') {
      return i;
    }
  }
  return tokens.length;
}

function prevSlotIndex(tokens: MaskToken[], from: number): number {
  for (let i = from - 1; i >= 0; i--) {
    if (tokens[i].kind === 'slot') {
      return i;
    }
  }
  return -1;
}

function firstEmptySlot(tokens: MaskToken[], masked: string, placeholder: string): number {
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].kind === 'slot' && (i >= masked.length || masked[i] === placeholder)) {
      return i;
    }
  }
  return tokens.length;
}

/** Date format order per locale prefix. */
const DATE_FORMATS: Record<string, string> = {
  // DD/MM/YYYY locales
  de: '00/00/0000',
  fr: '00/00/0000',
  es: '00/00/0000',
  it: '00/00/0000',
  pt: '00/00/0000',
  nl: '00-00-0000',
  ru: '00.00.0000',
  ja: '0000/00/00', // YYYY/MM/DD
  zh: '0000/00/00',
  ko: '0000.00.00',
  // MM/DD/YYYY locales
  en: '00/00/0000',
};

const DATE_SHORT_FORMATS: Record<string, string> = {
  de: '00/00/00',
  fr: '00/00/00',
  en: '00/00/00',
  ja: '00/00/00',
  zh: '00/00/00',
};

/** Phone patterns by country/region code. */
const PHONE_PATTERNS: Record<string, string> = {
  US: '(000) 000-0000',
  DE: '+00 000 00000000',
  CH: '+00 00 000 00 00',
  AT: '+00 0 000 0000',
  FR: '+00 0 00 00 00 00',
  UK: '+00 0000 000000',
  IT: '+00 000 000 0000',
  ES: '+00 000 000 000',
  JP: '+00 00-0000-0000',
  BR: '+00 (00) 00000-0000',
};

/** IBAN lengths and groupings by country. */
const IBAN_PATTERNS: Record<string, string> = {
  CH: 'AA00 0000 0000 0000 0000 0',
  DE: 'AA00 0000 0000 0000 0000 00',
  AT: 'AA00 0000 0000 0000 0000',
  FR: 'AA00 0000 0000 0000 0000 000',
  IT: 'AA00 A000 0000 0000 0000 0000 000',
  ES: 'AA00 0000 0000 0000 0000 0000',
  NL: 'AA00 AAAA 0000 0000 00',
  GB: 'AA00 AAAA 0000 0000 00',
};

const ZIP_PATTERNS: Record<string, string> = {
  US: '00000',
  DE: '00000',
  CH: '0000',
  AT: '0000',
  FR: '00000',
  UK: 'A0A 0AA|AA0 0AA|AA00 0AA|A0 0AA|A00 0AA',
  JP: '000-0000',
};

function resolvePreset(
  maskInput: string,
  locale: string,
  config?: InputConfig,
): { patterns: string[]; prefix?: string; suffix?: string } | null {
  const parts = maskInput.split(':');
  const name = parts[0].toLowerCase();
  const regionHint = parts[1]?.toUpperCase();
  const lang = locale.split('-')[0].toLowerCase();
  const region = regionHint ?? localeToRegion(locale);

  const phones = { ...PHONE_PATTERNS, ...config?.phonePatterns };
  const ibans = { ...IBAN_PATTERNS, ...config?.ibanPatterns };
  const zips = { ...ZIP_PATTERNS, ...config?.zipPatterns };
  const dates = { ...DATE_FORMATS, ...config?.dateFormats };

  switch (name) {
    case 'date':
      return { patterns: [dates[lang] ?? dates['en']] };
    case 'date:short':
      return { patterns: [DATE_SHORT_FORMATS[lang] ?? DATE_SHORT_FORMATS['en']] };
    case 'time':
    case 'time:24':
      return { patterns: ['00:00'] };
    case 'time:12':
      return { patterns: ['00:00 AA'] };
    case 'datetime':
      return { patterns: [(dates[lang] ?? dates['en']) + ' 00:00'] };
    case 'phone':
      return { patterns: [phones[region] ?? phones['US']] };
    case 'creditcard':
      return { patterns: ['0000 000000 00000|0000 0000 0000 0000'] };
    case 'iban':
      return { patterns: [ibans[region] ?? 'AA00 0000 0000 0000 0000 00'] };
    case 'zip':
      return resolveZip(region, zips);
    case 'ip':
    case 'ipv4':
      return { patterns: ['099.099.099.099'] };
    case 'mac':
      return { patterns: ['AA:AA:AA:AA:AA:AA'] };
    default:
      return null;
  }
}

function resolveZip(region: string, zips: Record<string, string>): { patterns: string[] } {
  const pattern = zips[region];
  if (!pattern) {
    return { patterns: ['00000'] };
  }
  if (pattern.includes('|')) {
    return { patterns: pattern.split('|') };
  }
  return { patterns: [pattern] };
}

function localeToRegion(locale: string): string {
  const parts = locale.split('-');
  if (parts.length >= 2) {
    return parts[1].toUpperCase();
  }
  // Map language to most common region.
  const fallback: Record<string, string> = {
    en: 'US',
    de: 'DE',
    fr: 'FR',
    it: 'IT',
    es: 'ES',
    pt: 'BR',
    nl: 'NL',
    ru: 'RU',
    ja: 'JP',
    zh: 'CN',
    ko: 'KR',
  };
  return fallback[parts[0].toLowerCase()] ?? 'US';
}

/**
 * Custom mask token definition. Use with the `customTokens` input to
 * define characters beyond the built-in `0`, `9`, `A`, `a`, `*`.
 *
 * @example
 * ```typescript
 * // Allow only uppercase hex digits for a color mask
 * customTokens = { H: { pattern: /[0-9A-F]/i } };
 * // mask: '#HHHHHH'
 * ```
 */
export interface MaskTokenDef {
  /** Regex pattern the character must match. */
  readonly pattern: RegExp;
  /** Whether this position is optional. Default: false. */
  readonly optional?: boolean;
  /** Transform function applied to matched char (e.g. `c => c.toUpperCase()`). */
  readonly transform?: (char: string) => string;
}

/** Map of single-char token names to their definitions. */
export type MaskTokenMap = Record<string, MaskTokenDef>;

/**
 * Pattern-based input mask directive.
 *
 * Supports custom patterns, locale-aware presets, multiple patterns (separated by `|`),
 * prefix/suffix, custom tokens, and character transforms.
 *
 * ## Mask tokens
 *
 * | Token | Description | Regex |
 * |-|-|-|
 * | `0` | Required digit | `[0-9]` |
 * | `9` | Optional digit | `[0-9]?` |
 * | `A` | Required letter | `[a-zA-Z]` |
 * | `a` | Optional letter | `[a-zA-Z]?` |
 * | `*` | Required alphanumeric | `[a-zA-Z0-9]` |
 * | `\\` | Escape next char as literal | — |
 *
 * ## Built-in presets
 *
 * Pass a preset name instead of a pattern. Region suffix optional (defaults to `LOCALE_ID`).
 *
 * | Preset | Example | Notes |
 * |-|-|-|
 * | `date` | `cngxInputMask="date"` | Locale-aware DD/MM/YYYY or MM/DD/YYYY |
 * | `date:short` | `cngxInputMask="date:short"` | 2-digit year |
 * | `time` / `time:24` | `cngxInputMask="time"` | HH:MM (24h) |
 * | `time:12` | `cngxInputMask="time:12"` | HH:MM AM/PM |
 * | `datetime` | `cngxInputMask="datetime"` | Date + time |
 * | `phone` | `cngxInputMask="phone:CH"` | Country-specific |
 * | `creditcard` | `cngxInputMask="creditcard"` | Amex/Visa/MC auto-switch |
 * | `iban` | `cngxInputMask="iban:CH"` | Country-specific grouping |
 * | `zip` | `cngxInputMask="zip:DE"` | Country-specific |
 * | `ip` / `ipv4` | `cngxInputMask="ip"` | `099.099.099.099` |
 * | `mac` | `cngxInputMask="mac"` | `AA:AA:AA:AA:AA:AA` |
 *
 * ## Multiple patterns
 *
 * Separate patterns with `|` — the directive selects the best match based on input length:
 * ```html
 * <input cngxInputMask="(00) 0000-0000|(00) 00000-0000" />
 * ```
 *
 * @example
 * ```html
 * <!-- Phone (locale-aware) -->
 * <input cngxInputMask="phone" />
 *
 * <!-- Date (locale-aware) -->
 * <input cngxInputMask="date" />
 *
 * <!-- Custom pattern with prefix -->
 * <input cngxInputMask="000.000.000-00" [prefix]="'CPF: '" />
 *
 * <!-- Custom token: hex color -->
 * <input cngxInputMask="\\#HHHHHH" [customTokens]="{ H: { pattern: /[0-9a-fA-F]/, transform: c => c.toUpperCase() } }" />
 *
 * <!-- Credit card with auto-format switching -->
 * <input cngxInputMask="creditcard" />
 * ```
 *
 * @category directives
 */
@Directive({
  selector: 'input[cngxInputMask]',
  standalone: true,
  exportAs: 'cngxInputMask',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CngxInputMask),
      multi: true,
    },
  ],
  host: {
    '(beforeinput)': 'handleBeforeInput($event)',
    '(keydown)': 'handleKeyDown($event)',
    '(mousedown)': 'focusedViaClick = true',
    '(focus)': 'handleFocus()',
    '(mouseup)': 'handleMouseUp()',
    '(blur)': 'handleBlurCva()',
    '(paste)': 'handlePaste($event)',
    '[attr.aria-placeholder]': 'ariaPlaceholder()',
  },
})
export class CngxInputMask implements ControlValueAccessor {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly locale = inject(LOCALE_ID);
  private readonly config = inject(CNGX_INPUT_CONFIG);

  /** Mask pattern, preset name, or `|`-separated patterns. */
  readonly mask = input.required<string>({ alias: 'cngxInputMask' });

  /** Placeholder char shown for unfilled positions. Falls back to global config. */
  readonly placeholder = input<string | undefined>(undefined);

  /** Whether to include literal chars in the raw value. */
  readonly includeLiterals = input<boolean>(false);

  /** Whether to guide cursor to the next empty position. Falls back to global config. */
  readonly guide = input<boolean | undefined>(undefined);

  /** Static text prepended to the display value (not part of mask or raw value). */
  readonly prefix = input<string>('');

  /** Static text appended to the display value (not part of mask or raw value). */
  readonly suffix = input<string>('');

  /** Transform function applied to each accepted character before insertion. */
  readonly transform = input<((char: string) => string) | undefined>(undefined);

  /** Custom token definitions beyond the built-in set. */
  readonly customTokens = input<MaskTokenMap | undefined>(undefined);

  /** Whether to clear the input when focus is lost and the mask is incomplete. */
  readonly clearOnBlur = input<boolean>(false);

  // Resolved config: input > global config > default.

  private readonly resolvedPlaceholder = computed(
    () => this.placeholder() ?? this.config.maskPlaceholder ?? '_',
  );

  private readonly resolvedGuide = computed(() => this.guide() ?? this.config.maskGuide ?? true);

  private readonly resolvedCustomTokens = computed(() => {
    const fromInput = this.customTokens();
    const fromConfig = this.config.customTokens;
    if (fromInput && fromConfig) {
      return { ...fromConfig, ...fromInput };
    }
    return fromInput ?? fromConfig;
  });

  /** Resolved patterns (handles presets, config overrides, and `|` splitting). */
  private readonly resolvedPatterns = computed(() => {
    const maskVal = this.mask();
    const preset = resolvePreset(maskVal, this.locale, this.config);
    if (preset) {
      return preset.patterns.flatMap((p) => p.split('|'));
    }
    return maskVal.split('|');
  });

  /** Active pattern selected based on current raw length. */
  private readonly activePattern = computed(() =>
    selectPattern(this.resolvedPatterns(), this.rawState().length, this.resolvedCustomTokens()),
  );

  private readonly tokens = computed(() =>
    parseMask(this.activePattern(), this.resolvedCustomTokens()),
  );

  private readonly rawState = signal('');

  /** Raw unmasked value (digits/letters only, no literals unless `includeLiterals`). */
  readonly rawValue: Signal<string> = this.rawState.asReadonly();

  /** Formatted value with mask applied (including prefix/suffix). */
  readonly maskedValue = computed(() => {
    const { masked } = applyMask(
      this.rawState(),
      this.tokens(),
      this.resolvedPlaceholder(),
      this.resolvedGuide(),
    );
    return this.prefix() + masked + this.suffix();
  });

  /** Formatted value without prefix/suffix (mask portion only). */
  readonly maskedValueCore = computed(() => {
    const { masked } = applyMask(
      this.rawState(),
      this.tokens(),
      this.resolvedPlaceholder(),
      this.resolvedGuide(),
    );
    return masked;
  });

  /** `true` when all required mask positions are filled. */
  readonly isComplete = computed(() => {
    const { complete } = applyMask(
      this.rawState(),
      this.tokens(),
      this.resolvedPlaceholder(),
      this.resolvedGuide(),
    );
    return complete;
  });

  /** The currently active pattern (useful when using multi-pattern or presets). */
  readonly currentPattern = this.activePattern;

  /** Emitted when `rawValue` changes. */
  readonly valueChange = output<string>();

  /** @internal */
  protected readonly ariaPlaceholder = computed(() => {
    const { masked } = applyMask('', this.tokens(), this.resolvedPlaceholder(), true);
    return this.prefix() + masked + this.suffix();
  });

  private prevMask: string | undefined;

  constructor() {
    // Sync masked value to DOM; the input event notifies co-located CngxInput / matInput.
    effect(() => {
      const masked = this.maskedValue();
      const el = this.el.nativeElement;
      if (el.value !== masked) {
        el.value = masked;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Reset raw state when the mask input changes.
    effect(() => {
      const currentMask = this.mask();
      if (this.prevMask != null && currentMask !== this.prevMask) {
        this.rawState.set('');
        this.valueChange.emit('');
      }
      this.prevMask = currentMask;
    });
  }

  private onChange = (_value: string): void => {
    /* noop until registerOnChange */
  };
  private onTouched = (): void => {
    /* noop until registerOnTouched */
  };

  writeValue(value: string | null): void {
    this.rawState.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** @internal */
  protected handleBlurCva(): void {
    this.onTouched();
    if (this.clearOnBlur() && !this.isComplete()) {
      this.clear();
    }
  }

  /** Programmatically set the raw value. Invalid chars are filtered out. */
  setValue(raw: string): void {
    this.updateRaw(raw);
  }

  /** Clear the mask value. */
  clear(): void {
    this.rawState.set('');
    this.valueChange.emit('');
  }

  /** @internal */
  protected handleBeforeInput(event: InputEvent): void {
    const el = this.el.nativeElement;
    const tokens = this.tokens();
    const prefixLen = this.prefix().length;

    if (event.inputType === 'insertText' && event.data) {
      event.preventDefault();
      const start = Math.max(0, (el.selectionStart ?? 0) - prefixLen);
      const end = Math.max(0, (el.selectionEnd ?? 0) - prefixLen);
      this.insertChars(event.data, start, end, tokens);
      return;
    }

    if (event.inputType === 'deleteContentBackward') {
      event.preventDefault();
      const start = Math.max(0, (el.selectionStart ?? 0) - prefixLen);
      const end = Math.max(0, (el.selectionEnd ?? 0) - prefixLen);
      this.deleteBackward(start, end, tokens);
      return;
    }

    if (event.inputType === 'deleteContentForward') {
      event.preventDefault();
      const start = Math.max(0, (el.selectionStart ?? 0) - prefixLen);
      const end = Math.max(0, (el.selectionEnd ?? 0) - prefixLen);
      this.deleteForward(start, end, tokens);
      return;
    }

    if (event.inputType === 'insertFromPaste') {
      // handlePaste owns this branch.
      return;
    }

    // Block other mutations.
    if (event.inputType.startsWith('insert') || event.inputType.startsWith('delete')) {
      event.preventDefault();
    }
  }

  /** @internal */
  protected handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (!pasted) {
      return;
    }

    const el = this.el.nativeElement;
    const tokens = this.tokens();
    const prefixLen = this.prefix().length;
    const start = Math.max(0, (el.selectionStart ?? 0) - prefixLen);
    const end = Math.max(0, (el.selectionEnd ?? 0) - prefixLen);

    if (start !== end) {
      this.deleteRange(start, end, tokens);
    }

    this.insertChars(pasted, start, start, tokens);
  }

  /** @internal */
  protected handleKeyDown(event: KeyboardEvent): void {
    const el = this.el.nativeElement;
    const tokens = this.tokens();
    const prefixLen = this.prefix().length;
    const pos = Math.max(0, (el.selectionStart ?? 0) - prefixLen);

    if (event.key === 'ArrowLeft' && !event.shiftKey) {
      const prev = prevSlotIndex(tokens, pos);
      if (prev >= 0) {
        event.preventDefault();
        el.setSelectionRange(prev + prefixLen, prev + prefixLen);
      }
      return;
    }

    if (event.key === 'ArrowRight' && !event.shiftKey) {
      const next = nextSlotIndex(tokens, pos + 1);
      if (next <= tokens.length) {
        event.preventDefault();
        const target = Math.min(next + 1, tokens.length);
        el.setSelectionRange(target + prefixLen, target + prefixLen);
      }
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      const first = nextSlotIndex(tokens, 0);
      el.setSelectionRange(first + prefixLen, first + prefixLen);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      const masked = this.maskedValueCore();
      const emptyPos = firstEmptySlot(tokens, masked, this.resolvedPlaceholder());
      el.setSelectionRange(emptyPos + prefixLen, emptyPos + prefixLen);
    }
  }

  /** @internal */
  /** @internal */
  protected focusedViaClick = false;

  protected handleFocus(): void {
    if (!this.resolvedGuide()) {
      return;
    }
    // Click focus is handled by handleMouseUp.
    if (this.focusedViaClick) {
      return;
    }
    const el = this.el.nativeElement;
    const tokens = this.tokens();
    const masked = this.maskedValueCore();
    const prefixLen = this.prefix().length;
    const emptyPos = firstEmptySlot(tokens, masked, this.resolvedPlaceholder());
    requestAnimationFrame(() => {
      el.setSelectionRange(emptyPos + prefixLen, emptyPos + prefixLen);
    });
  }

  /** @internal Snap cursor to nearest valid slot on click. */
  protected handleMouseUp(): void {
    this.focusedViaClick = false;
    const el = this.el.nativeElement;
    const tokens = this.tokens();
    const prefixLen = this.prefix().length;
    const masked = this.maskedValueCore();
    const placeholder = this.resolvedPlaceholder();
    const clickPos = Math.max(0, (el.selectionStart ?? 0) - prefixLen);

    // Snap to the first empty slot at or after the click; past all filled slots → snap to first empty.
    const firstEmpty = firstEmptySlot(tokens, masked, placeholder);
    const snapped = Math.min(clickPos, firstEmpty);

    // Skip literal positions to land on the nearest input slot.
    let pos = snapped;
    while (pos < tokens.length && tokens[pos].kind === 'literal') {
      pos++;
    }
    if (pos > firstEmpty) {
      pos = firstEmpty;
    }

    el.setSelectionRange(pos + prefixLen, pos + prefixLen);
  }

  private insertChars(chars: string, selStart: number, selEnd: number, tokens: MaskToken[]): void {
    const el = this.el.nativeElement;
    const prefixLen = this.prefix().length;
    const currentRaw = this.rawState();
    const rawBefore = this.rawIndexFromCursor(selStart, tokens);
    const transformFn = this.transform();
    const customDefs = this.resolvedCustomTokens();

    let raw = currentRaw;
    if (selStart !== selEnd) {
      const rawEnd = this.rawIndexFromCursor(selEnd, tokens);
      raw = raw.slice(0, rawBefore) + raw.slice(rawEnd);
    }

    // Multi-pattern: filter against the longest pattern's tokens so chars beyond
    // the current pattern's capacity aren't dropped before pattern switching.
    const patterns = this.resolvedPatterns();
    const filterTokens =
      patterns.length > 1
        ? parseMask(
            patterns.reduce((a, b) =>
              slotCount(a, customDefs) >= slotCount(b, customDefs) ? a : b,
            ),
            customDefs,
          )
        : tokens;

    let filtered = '';
    let tokenIdx = selStart;
    for (const ch of chars) {
      while (tokenIdx < filterTokens.length && filterTokens[tokenIdx].kind === 'literal') {
        tokenIdx++;
      }
      if (tokenIdx >= filterTokens.length) {
        break;
      }
      const token = filterTokens[tokenIdx];
      if (token.test!.test(ch)) {
        let transformed = ch;
        const customDef = customDefs?.[token.char];
        if (customDef?.transform) {
          transformed = customDef.transform(transformed);
        }
        if (transformFn) {
          transformed = transformFn(transformed);
        }
        filtered += transformed;
        tokenIdx++;
      }
    }

    if (!filtered) {
      return;
    }

    const newRaw = raw.slice(0, rawBefore) + filtered + raw.slice(rawBefore);

    // Truncate against the largest slot count across patterns so a longer pattern
    // can still absorb the input.
    const allPatterns = this.resolvedPatterns();
    const maxSlots =
      allPatterns.length > 1
        ? Math.max(...allPatterns.map((p) => slotCount(p, this.resolvedCustomTokens())))
        : tokens.filter((t) => t.kind === 'slot').length;
    const truncated = newRaw.slice(0, maxSlots);

    this.updateRaw(truncated);

    // Sync DOM eagerly so the maskedValue effect is a no-op.
    const newMasked = this.maskedValue();
    el.value = newMasked;

    const newCursorRawIdx = rawBefore + filtered.length;
    const newTokens = this.tokens();
    const cursorPos = this.cursorFromRawIndex(newCursorRawIdx, newTokens);
    el.setSelectionRange(cursorPos + prefixLen, cursorPos + prefixLen);
  }

  private deleteBackward(selStart: number, selEnd: number, tokens: MaskToken[]): void {
    const el = this.el.nativeElement;
    const prefixLen = this.prefix().length;

    if (selStart !== selEnd) {
      this.deleteRange(selStart, selEnd, tokens);
      this.syncDom(el);
      const cursorPos = this.adjustCursorAfterDelete(selStart, tokens);
      el.setSelectionRange(cursorPos + prefixLen, cursorPos + prefixLen);
      return;
    }

    if (selStart === 0) {
      return;
    }

    let target = selStart - 1;
    while (target >= 0 && tokens[target]?.kind === 'literal') {
      target--;
    }
    if (target < 0) {
      return;
    }

    const rawIdx = this.rawIndexFromCursor(target, tokens);
    const raw = this.rawState();
    this.updateRaw(raw.slice(0, rawIdx) + raw.slice(rawIdx + 1));
    this.syncDom(el);

    const cursorPos = this.adjustCursorAfterDelete(target, tokens);
    el.setSelectionRange(cursorPos + prefixLen, cursorPos + prefixLen);
  }

  private deleteForward(selStart: number, selEnd: number, tokens: MaskToken[]): void {
    const el = this.el.nativeElement;
    const prefixLen = this.prefix().length;

    if (selStart !== selEnd) {
      this.deleteRange(selStart, selEnd, tokens);
      this.syncDom(el);
      const cursorPos = this.adjustCursorAfterDelete(selStart, tokens);
      el.setSelectionRange(cursorPos + prefixLen, cursorPos + prefixLen);
      return;
    }

    let target = selStart;
    while (target < tokens.length && tokens[target].kind === 'literal') {
      target++;
    }
    if (target >= tokens.length) {
      return;
    }

    const rawIdx = this.rawIndexFromCursor(target, tokens);
    const raw = this.rawState();
    this.updateRaw(raw.slice(0, rawIdx) + raw.slice(rawIdx + 1));
    this.syncDom(el);

    el.setSelectionRange(selStart + prefixLen, selStart + prefixLen);
  }

  private deleteRange(start: number, end: number, tokens: MaskToken[]): void {
    const rawStart = this.rawIndexFromCursor(start, tokens);
    const rawEnd = this.rawIndexFromCursor(end, tokens);
    const raw = this.rawState();
    this.updateRaw(raw.slice(0, rawStart) + raw.slice(rawEnd));
  }

  private adjustCursorAfterDelete(pos: number, tokens: MaskToken[]): number {
    while (pos > 0 && tokens[pos - 1]?.kind === 'literal') {
      pos--;
    }
    return Math.max(0, pos);
  }

  private rawIndexFromCursor(cursorPos: number, tokens: MaskToken[]): number {
    let rawIdx = 0;
    for (let i = 0; i < cursorPos && i < tokens.length; i++) {
      if (tokens[i].kind === 'slot') {
        rawIdx++;
      }
    }
    return rawIdx;
  }

  private cursorFromRawIndex(rawIdx: number, tokens: MaskToken[]): number {
    let count = 0;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].kind === 'slot') {
        if (count === rawIdx) {
          return i;
        }
        count++;
      }
    }
    return tokens.length;
  }

  /** Sync DOM eagerly so the maskedValue effect is a no-op. */
  private syncDom(el: HTMLInputElement): void {
    const newMasked = this.maskedValue();
    el.value = newMasked;
  }

  private updateRaw(newRaw: string): void {
    const prev = this.rawState();
    // Resolve tokens for the target raw length so multi-pattern switching is honoured.
    const targetPattern = selectPattern(
      this.resolvedPatterns(),
      newRaw.length,
      this.resolvedCustomTokens(),
    );
    const targetTokens = parseMask(targetPattern, this.resolvedCustomTokens());

    let validated = '';
    let ti = 0;
    for (const ch of newRaw) {
      while (ti < targetTokens.length && targetTokens[ti].kind === 'literal') {
        ti++;
      }
      if (ti >= targetTokens.length) {
        break;
      }
      if (targetTokens[ti].test!.test(ch)) {
        validated += ch;
        ti++;
      }
    }

    this.rawState.set(validated);
    if (validated !== prev) {
      const emitValue = this.includeLiterals() ? this.maskedValueCore() : validated;
      this.valueChange.emit(emitValue);
      this.onChange(emitValue);
    }
  }
}
