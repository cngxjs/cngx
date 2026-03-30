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

## API

### CngxBeforeUnload

Directive that prevents accidental page navigation via browser `beforeunload` event.

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| cngxBeforeUnload | `boolean` | required | When true, shows browser confirmation dialog on page close |

#### Outputs

| Output | Emits | Description |
|-|-|-|
| — | — | — |

#### Signals

None

#### CSS Custom Properties

None

### canDeactivateWhenClean Function

Functional route guard that prevents navigation when a form is dirty.

#### Signature

```typescript
function canDeactivateWhenClean(
  isDirty: () => boolean,
  message?: string
): () => boolean
```

#### Parameters

- **isDirty** (() => boolean) — Callback that returns true when there are unsaved changes
- **message** (string, optional) — Confirmation dialog message. Default: `'You have unsaved changes. Leave anyway?'`

#### Returns

() => boolean — A functional guard compatible with Angular's `CanDeactivateFn`

## Accessibility

Unload guards are low-level navigation protection — no ARIA needed:

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
// CngxBeforeUnload protects browser close
// canDeactivateWhenClean protects route navigation
@Component({
  providers: [
    provideRouter(routes, withCanDeactivate([canDeactivateWhenClean(() => this.isDirty())]))
  ]
})
export class EditComponent {
  readonly isDirty = signal(false);

  // In template:
  // <form [cngxBeforeUnload]="isDirty()">
}
```

## Styling

Unload guards have no styling — they show the browser's native confirmation dialog.

## Examples

### Form with Browser Protection

```typescript
@Component({
  selector: 'app-profile-form',
  template: `
    <form [cngxBeforeUnload]="form.dirty">
      <input type="text" [(ngModel)]="name" name="name" />
      <input type="email" [(ngModel)]="email" name="email" />
      <button type="submit" (click)="save()">Save</button>
    </form>
  `,
  imports: [CngxBeforeUnload, FormsModule],
})
export class ProfileFormComponent {
  @ViewChild('form') form: NgForm | undefined;

  name = '';
  email = '';

  save() {
    if (this.form?.valid) {
      // Save logic
      this.form.resetForm();
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
        () => inject(EditComponent).isDirty(),
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
  providers: [
    withCanDeactivate([
      canDeactivateWhenClean(() => this.form.dirty, 'Save your changes?'),
    ]),
  ],
})
export class SettingsComponent {
  readonly form = this.fb.group({
    theme: ['light'],
    language: ['en'],
  });

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  save() {
    this.http.put('/api/settings', this.form.value).subscribe(() => {
      this.form.markAsPristine();
    });
  }
}
```

### Custom Confirmation Message

```typescript
const routes: Routes = [
  {
    path: 'blog/new',
    component: BlogEditorComponent,
    canDeactivate: [
      canDeactivateWhenClean(
        () => inject(BlogEditorComponent).content() !== '',
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

## Implementation Notes

### CngxBeforeUnload Behavior

The directive uses the browser's native `beforeunload` event:

```typescript
const handler = (event: BeforeUnloadEvent) => {
  if (this.enabled()) {
    event.preventDefault();
  }
};

window.addEventListener('beforeunload', handler);
```

When active (`enabled() === true`), the browser shows its native "Leave this site?" dialog. The user can click "Leave" or "Stay".

**Important:** This only protects against browser close, tab close, or URL bar navigation. It does NOT protect against:
- Router navigation (use `canDeactivate` guard for that)
- Programmatic `window.location` changes
- Browser refresh (F5)

### canDeactivateWhenClean Behavior

The function returns a guard compatible with Angular's `CanDeactivateFn`:

```typescript
return () => {
  if (!isDirty()) {
    return true;  // Allow navigation
  }

  const win = inject(DOCUMENT).defaultView;
  if (!win) {
    return true;  // SSR — allow navigation
  }

  return win.confirm(message);  // Show browser confirm dialog
};
```

Returns `true` (allow) or `false` (block) based on the user's choice in the confirmation dialog.

**Important:** The guard uses `inject()` which is valid in Angular's guard execution context.

### Coverage Recommendations

For complete protection, use both:

1. **CngxBeforeUnload** — Protects browser close (Cmd+W, Cmd+Q, browser close button)
2. **canDeactivateWhenClean** — Protects router navigation (routerLink, router.navigate)

Together they cover all navigation paths:

```typescript
@Component({
  template: `
    <form [cngxBeforeUnload]="isDirty()">
      <!-- Form content -->
    </form>
  `,
  imports: [CngxBeforeUnload],
  providers: [
    withCanDeactivate([
      canDeactivateWhenClean(() => this.isDirty())
    ])
  ]
})
export class EditComponent {
  readonly isDirty = signal(false);
}
```

## Browser Compatibility

Both CngxBeforeUnload and canDeactivateWhenClean use standard browser APIs:

- `beforeunload` event — Supported in all modern browsers
- `window.confirm()` — Supported in all modern browsers

No polyfills or fallbacks needed.

## SSR Compatibility

Both guards check for `window` availability:

- CngxBeforeUnload: Skips if `DOCUMENT.defaultView` is null
- canDeactivateWhenClean: Returns `true` (allows navigation) if window is unavailable

This ensures SSR doesn't throw errors.

## See Also

- [compodoc API documentation](../../../../../../../docs/modules/CngxBeforeUnload.html)
- [Angular Route Guards](https://angular.io/guide/router-tutorial-toh#preventing-unsaved-changes)
- [MDN: beforeunload event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)
- Demo: `dev-app/src/app/demos/common/guard-demo/`
- Tests: `projects/common/interactive/src/guard/before-unload.directive.spec.ts`
