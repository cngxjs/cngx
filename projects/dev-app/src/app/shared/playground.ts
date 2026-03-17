import { signal, WritableSignal } from '@angular/core';

// ── Control types ─────────────────────────────────────────────────────────────

export interface BooleanControl {
  readonly type: 'boolean';
  readonly label: string;
  readonly description?: string;
  readonly value: WritableSignal<boolean>;
}

export interface TextControl {
  readonly type: 'text';
  readonly label: string;
  readonly description?: string;
  readonly placeholder?: string;
  readonly value: WritableSignal<string>;
}

export interface NumberControl {
  readonly type: 'number';
  readonly label: string;
  readonly description?: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly value: WritableSignal<number>;
}

export interface SelectControl<T = unknown> {
  readonly type: 'select';
  readonly label: string;
  readonly description?: string;
  readonly options: ReadonlyArray<{ readonly label: string; readonly value: T }>;
  readonly value: WritableSignal<T>;
}

export interface RangeControl {
  readonly type: 'range';
  readonly label: string;
  readonly description?: string;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly value: WritableSignal<number>;
}

export type PlaygroundControl =
  | BooleanControl
  | TextControl
  | NumberControl
  | SelectControl
  | RangeControl;

// ── Playground bag ────────────────────────────────────────────────────────────

/**
 * Holds a set of typed, signal-backed controls for an interactive playground.
 *
 * Usage:
 * ```ts
 * readonly mode = Playground.select('selectionMode', [...], 'none');
 * readonly checks = Playground.bool('showCheckboxes', false);
 * readonly pg = new Playground([this.mode, this.checks]);
 * ```
 * Then pass `[playground]="pg"` to `<app-playground>` and bind
 * `mode.value()` / `checks.value()` directly on the showcased component.
 */
export class Playground {
  constructor(public readonly controls: readonly PlaygroundControl[]) {}

  static bool(
    label: string,
    def = false,
    opts?: Pick<BooleanControl, 'description'>,
  ): BooleanControl {
    return { type: 'boolean', label, value: signal(def), ...opts };
  }

  static text(
    label: string,
    def = '',
    opts?: Pick<TextControl, 'description' | 'placeholder'>,
  ): TextControl {
    return { type: 'text', label, value: signal(def), ...opts };
  }

  static number(
    label: string,
    def = 0,
    opts?: Pick<NumberControl, 'description' | 'min' | 'max' | 'step'>,
  ): NumberControl {
    return { type: 'number', label, value: signal(def), ...opts };
  }

  static select<T>(
    label: string,
    options: ReadonlyArray<{ readonly label: string; readonly value: T }>,
    def: T,
    opts?: Pick<SelectControl, 'description'>,
  ): SelectControl<T> {
    return { type: 'select', label, options, value: signal<T>(def), ...opts };
  }

  static range(
    label: string,
    min: number,
    max: number,
    def: number,
    step = 1,
    opts?: Pick<RangeControl, 'description'>,
  ): RangeControl {
    return { type: 'range', label, min, max, value: signal(def), step, ...opts };
  }
}
