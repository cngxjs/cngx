import {
  Directive,
  effect,
  inject,
  input,
  reflectComponentType,
  signal,
  untracked,
  ViewContainerRef,
  type ComponentRef,
  type Type,
} from '@angular/core';
import { arrayEqual } from '@cngx/utils';

import type { CngxFilterEditorComponent } from './filter-builder-editor.contract';
import type { FilterExpression, FilterFieldDef } from './filter-builder.types';

/**
 * Mounts a registered custom value editor ({@link CngxFilterEditorComponent})
 * with the documented contract actually honoured: `value`, `fieldDef`,
 * `expression` and `disabled` are projected onto the mounted instance, and
 * the instance's `value` model is read back into the row's write sink.
 * Replaces the historical bare `*ngComponentOutlet` branch, which mounted
 * the component with no inputs and no read-back - a registered editor
 * rendered disconnected from the expression value.
 *
 * `NgComponentOutlet` cannot observe a mounted component's `ModelSignal`,
 * so the fix is a dedicated dynamic mount, not outlet bindings. Sync
 * discipline mirrors the `createFieldSync` bridge: one effect pushes the
 * host-side inputs (imperative `setInput` calls inside `untracked()`),
 * one effect reads `instance.value()` as its tracked source and calls the
 * sink inside `untracked()`. Both directions break the cycle through
 * `valueEquals` - default: `arrayEqual` when both sides are arrays (fresh
 * `[min, max]` / list references from `between` / `in` editors must not
 * defeat the guard), `Object.is` otherwise. Override per mount for
 * structured editor values.
 *
 * Inputs the mounted component does not declare are skipped
 * (`reflectComponentType` gate), so a minimal editor with only the
 * required `value` model mounts cleanly.
 *
 * @category forms/filter-builder/slots
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-value-editor-host.directive.ts
 * @since 0.1.0
 * @relatedTo CngxFilterEditorComponent, CNGX_FILTER_EDITORS, CngxFilterRow, CngxFilterExpressionRow
 */
@Directive({
  selector: '[cngxFilterValueEditorHost]',
  standalone: true,
})
export class CngxFilterValueEditorHost {
  private readonly viewContainer = inject(ViewContainerRef);

  /** Editor component class resolved from the `CNGX_FILTER_EDITORS` registry. */
  readonly component = input.required<Type<CngxFilterEditorComponent<unknown>>>({
    alias: 'cngxFilterValueEditorHost',
  });

  /** Current expression value pushed onto the editor's `value` model. */
  readonly value = input<unknown>(undefined);

  /** Field metadata projected onto the editor's optional `fieldDef` input. */
  readonly fieldDef = input<FilterFieldDef | undefined>(undefined);

  /** Full expression node projected onto the editor's optional `expression` input. */
  readonly expression = input<FilterExpression | undefined>(undefined);

  /** Disabled state projected onto the editor's optional `disabled` input. */
  readonly disabled = input<boolean>(false);

  /**
   * Cycle-break equality for the value round trip. Default: `arrayEqual`
   * when both sides are arrays, `Object.is` otherwise. Provide a custom
   * fn for structured (non-array object) editor values.
   */
  readonly valueEquals = input<((a: unknown, b: unknown) => boolean) | undefined>(undefined);

  /** Write sink for editor-originated value changes (the row controller's `setValue`). */
  readonly setValue = input<((value: unknown) => void) | undefined>(undefined);

  /**
   * Mounted instance bookkeeping as a signal so both sync effects
   * re-track after a remount. The single writer is the mount effect
   * below - one tracked trigger (`component`), write-deduped on the
   * component type, everything inside `untracked()` (the accepted
   * reconciliation shape; `linkedSignal` cannot own a
   * `createComponent` side effect).
   */
  private readonly mounted = signal<ComponentRef<CngxFilterEditorComponent<unknown>> | null>(null);

  private declaredInputs: ReadonlySet<string> = new Set();

  constructor() {
    effect(() => {
      const component = this.component();
      untracked(() => this.mount(component));
    });

    // Push branch: host inputs -> mounted instance. Imperative setInput
    // calls stay inside untracked so the effect tracks only the host-side
    // sources; the value push carries the valueEquals echo guard.
    effect(() => {
      const ref = this.mounted();
      const value = this.value();
      const fieldDef = this.fieldDef();
      const expression = this.expression();
      const disabled = this.disabled();
      if (!ref) {
        return;
      }
      untracked(() => {
        if (this.declaredInputs.has('value') && !this.equals(ref.instance.value(), value)) {
          ref.setInput('value', value);
        }
        if (this.declaredInputs.has('fieldDef')) {
          ref.setInput('fieldDef', fieldDef);
        }
        if (this.declaredInputs.has('expression')) {
          ref.setInput('expression', expression);
        }
        if (this.declaredInputs.has('disabled')) {
          ref.setInput('disabled', disabled);
        }
      });
    });

    // Read-back branch: instance.value() is the only tracked source
    // besides the mount; the sink call is untracked and guarded, so an
    // echo of our own push never re-enters the sink.
    effect(() => {
      const ref = this.mounted();
      if (!ref) {
        return;
      }
      const editorValue = ref.instance.value();
      untracked(() => {
        if (this.equals(editorValue, this.value())) {
          return;
        }
        this.setValue()?.(editorValue);
      });
    });
  }

  private mount(component: Type<CngxFilterEditorComponent<unknown>>): void {
    const current = this.mounted();
    if (current?.componentType === component) {
      return;
    }
    current?.destroy();
    this.declaredInputs = new Set(
      reflectComponentType(component)?.inputs.map((entry) => entry.propName) ?? [],
    );
    this.mounted.set(this.viewContainer.createComponent(component));
  }

  private equals(a: unknown, b: unknown): boolean {
    const custom = this.valueEquals();
    if (custom) {
      return custom(a, b);
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      return arrayEqual(a, b);
    }
    return Object.is(a, b);
  }
}
