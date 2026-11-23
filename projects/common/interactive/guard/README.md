# Unload Guard

Directives and functions that prevent accidental navigation when there are unsaved changes.

## Import

```typescript
import { CngxBeforeUnload, canDeactivateWhenClean } from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component, signal } from '@angular/core';
import { CngxBeforeUnload } from '@cngx/common/interactive';

@Component({
  selector: 'app-editor',
  template: `
    <form [cngxBeforeUnload]="isDirty()">
      <input [(ngModel)]="content" />
      <button (click)="save()">Save</button>
    </form>
  `,
  imports: [CngxBeforeUnload, FormsModule],
})
export class EditorComponent {
  readonly isDirty = signal(false);

  save() {
    // Save logic
    this.isDirty.set(false);
  }
}
```

## Accessibility

Unload guards are low-level navigation protection - no ARIA needed:

- **ARIA roles:** None (browser-managed dialog)
- **Keyboard interaction:**
  - CngxBeforeUnload: Browser handles the confirmation dialog
  - canDeactivateWhenClean: Browser handles the confirmation dialog
  - Escape key typically cancels; Enter or clicking "Leave" confirms
- **Screen reader:**
  - Browser announces the confirmation dialog
  - Message text is announced by the dialog
- **Focus management:**
  - Browser manages focus in the confirmation dialog

## Composition

Unload guards are orthogonal protection mechanisms:

- **Host directives:** None
- **Combines with:** Forms, route guards, any navigation scenario
- **Provides:** Browser and router-level navigation protection

### Example: Composition Pattern

```typescript
// canDeactivateWhenClean protects route navigation: the Router passes the
// routed component to the callback.
const routes: Routes = [
  {
    path: 'edit',
    component: EditComponent,
    canDeactivate: [canDeactivateWhenClean((page: EditComponent) => page.isDirty())],
  },
];

// CngxBeforeUnload protects browser close
@Component({
  template: `<form [cngxBeforeUnload]="isDirty()">...</form>`,
  imports: [CngxBeforeUnload],
})
export class EditComponent {
  readonly isDirty = signal(false);
}
```

## Styling

Unload guards have no styling - they show the browser's native confirmation dialog.

## i18n

Without a `message`, `canDeactivateWhenClean` reads `unsavedChanges` from `CNGX_INTERACTIVE_I18N` each time the guard runs, so the text follows the active language: English `'You have unsaved changes. Leave anyway?'`, German pack (`@cngx/core/i18n/de`) `'Es gibt ungespeicherte Änderungen. Trotzdem verlassen?'`. Override it app-wide with `provideInteractiveI18n(withInteractiveI18nLabels({ unsavedChanges: '...' }))`, or per route with `message`. `CngxBeforeUnload` has no text: browsers show their own unload dialog.

## Examples

### Form with Browser Protection

```typescript
@Component({
  selector: 'app-profile-form',
  template: `
    <form #form="ngForm" [cngxBeforeUnload]="!!form.dirty">
      <input type="text" [(ngModel)]="name" name="name" />
      <input type="email" [(ngModel)]="email" name="email" />
      <button type="submit" (click)="save(form)">Save</button>
    </form>
  `,
  imports: [CngxBeforeUnload, FormsModule],
})
export class ProfileFormComponent {
  name = '';
  email = '';

  save(form: NgForm) {
    if (form.valid) {
      // Save logic
      form.resetForm();
    }
  }
}
```

### Route Guard with Confirmation

```typescript
// app.routes.ts
import { canDeactivateWhenClean } from '@cngx/common/interactive';

const routes: Routes = [
  {
    path: 'edit/:id',
    component: EditComponent,
    canDeactivate: [
      canDeactivateWhenClean(
        (page: EditComponent) => page.isDirty(),
        'You have unsaved changes. Leave without saving?'
      ),
    ],
  },
];
```

### Reactive Form with Both Guards

```typescript
@Component({
  selector: 'app-settings',
  template: `
    <form [formGroup]="form" [cngxBeforeUnload]="form.dirty">
      <input formControlName="theme" />
      <input formControlName="language" />
      <button (click)="save()" [disabled]="form.invalid || form.pristine">
        Save
      </button>
    </form>
  `,
  imports: [CngxBeforeUnload, ReactiveFormsModule],
})
export class SettingsComponent {
  private readonly http = inject(HttpClient);

  readonly form = inject(FormBuilder).group({
    theme: ['light'],
    language: ['en'],
  });

  save() {
    this.http.put('/api/settings', this.form.value).subscribe(() => {
      this.form.markAsPristine();
    });
  }
}

// app.routes.ts
const routes: Routes = [
  {
    path: 'settings',
    component: SettingsComponent,
    canDeactivate: [
      canDeactivateWhenClean((page: SettingsComponent) => page.form.dirty, 'Save your changes?'),
    ],
  },
];
```

### Custom Confirmation Message

```typescript
const routes: Routes = [
  {
    path: 'blog/new',
    component: BlogEditorComponent,
    canDeactivate: [
      canDeactivateWhenClean(
        (page: BlogEditorComponent) => page.content() !== '',
        'Discard your draft? This cannot be undone.'
      ),
    ],
  },
];
```

### Disable Guard When Saved

```typescript
readonly isDirty = signal(false);
readonly content = signal('');

saveContent() {
  this.http.post('/api/content', { content: this.content() })
    .subscribe(() => {
      this.isDirty.set(false);  // Guard no longer blocks navigation
    });
}

<button [cngxBeforeUnload]="isDirty()">
  Save (guard active: {{ isDirty() }})
</button>
```

## Browser Compatibility

Both CngxBeforeUnload and canDeactivateWhenClean use standard browser APIs:

- `beforeunload` event - Supported in all modern browsers
- `window.confirm()` - Supported in all modern browsers

No polyfills or fallbacks needed.

## SSR Compatibility

Both guards check for `window` availability:

- CngxBeforeUnload: Skips if `DOCUMENT.defaultView` is null
- canDeactivateWhenClean: Returns `true` (allows navigation) if window is unavailable

This ensures SSR doesn't throw errors.

## See Also

- [API on compodocx](https://cngxjs.github.io/cngx/main/common/interactive/guard/)
- [Angular Route Guards](https://angular.io/guide/router-tutorial-toh#preventing-unsaved-changes)
- [MDN: beforeunload event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)
- Demo: `examples/stories/common/interactive/guard/`
- Tests: `projects/common/interactive/guard/before-unload.directive.spec.ts`
