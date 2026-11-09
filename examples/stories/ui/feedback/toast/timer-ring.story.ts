import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToastOutlet: timer ring skin',
  subtitle: 'A countdown ring around the icon, drawn from the outlet timer hooks with no library change.',
  description: 'The ring replaces the default countdown bar and reads only the public timer hooks: <code>--cngx-toast-timer-duration</code>, <code>--cngx-toast-timer-offset</code>, <code>data-timer</code> and the <code>.cngx-toast__timer</code> element. The outlet re-creates that element on every timer segment, so the ring restarts after a repeated message and resumes at the exact remaining time after a hover or focus pause. A persistent toast gets no ring. Set the visible count to 1 and fire several toasts: the waiting ones hold their ring until they are shown. Under reduced motion the ring does not render, like the bar. The story scopes its own <code>CngxToaster</code> so these toasts render only in this outlet.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxToastOutlet', 'CngxToaster'],
  moduleImports: [
    'import { CngxToaster, CngxToastOutlet } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxToastOutlet'],
  viewProviders: ['CngxToaster'],
  setup: `private readonly toaster = inject(CngxToaster);
  protected readonly maxVisible = signal(3);
  private saved = 0;
  protected showTimed(): void {
    this.toaster.show({ message: \`Draft \${++this.saved} saved\`, severity: 'success' });
  }
  protected showWithAction(): void {
    this.toaster.show({
      message: 'Message archived',
      severity: 'info',
      action: { label: 'Undo', handler: () => this.toaster.show({ message: 'Message restored', severity: 'success' }) },
    });
  }
  protected showPersistent(): void {
    this.toaster.show({ message: 'Sync paused until you reconnect', severity: 'warning', duration: 'persistent' });
  }
  protected showTitled(): void {
    this.toaster.show({ title: 'Upload complete', message: 'report.pdf is ready to share', severity: 'success' });
  }
  protected showRepeated(): void {
    this.toaster.show({ message: 'New comment on your post', severity: 'info' });
  }`,
  template: `
  <cngx-toast-outlet class="cngx-ex-toast-ring" [maxVisible]="maxVisible()" />
  <div class="demo-inline-actions">
    <button (click)="showTimed()" class="chip" type="button">Timed (5s)</button>
    <button (click)="showWithAction()" class="chip" type="button">With Undo (10s)</button>
    <button (click)="showPersistent()" class="chip" type="button">Persistent</button>
    <button (click)="showTitled()" class="chip" type="button">With title</button>
    <button (click)="showRepeated()" class="chip" type="button">Repeat same message</button>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <span>Visible toasts:</span>
    <button type="button" class="chip" [attr.aria-pressed]="maxVisible() === 1" (click)="maxVisible.set(1)">1</button>
    <button type="button" class="chip" [attr.aria-pressed]="maxVisible() === 3" (click)="maxVisible.set(3)">3</button>
  </div>`,
  css: `/* Unlayered, so it wins over the default bar in @layer cngx.components. */
@property --cngx-ex-toast-ring-progress {
  syntax: '<number>';
  inherits: false;
  initial-value: 1;
}

.cngx-ex-toast-ring {
  /* Space between the icon and the ring, and the ring stroke. */
  --cngx-ex-toast-ring-gap: 4px;
  --cngx-ex-toast-ring-stroke: 2px;
}

.cngx-ex-toast-ring .cngx-toast__timer {
  --cngx-ex-toast-ring-size: calc(
    var(--cngx-toast-icon-size, 20px) + 2 * var(--cngx-ex-toast-ring-gap, 4px)
  );
  /* Drop the default bar and sit over the icon cell. */
  border: 0;
  inset: auto;
  inset-inline-start: calc(var(--cngx-space-md, 16px) - var(--cngx-ex-toast-ring-gap, 4px));
  inset-block-start: 50%;
  inline-size: var(--cngx-ex-toast-ring-size);
  block-size: var(--cngx-ex-toast-ring-size);
  margin-block-start: calc(var(--cngx-ex-toast-ring-size) / -2);
  border-radius: 50%;
  background: conic-gradient(
    var(--cngx-toast-accent, currentColor) calc(var(--cngx-ex-toast-ring-progress) * 1turn),
    transparent 0
  );
  /* Keep a 2px stroke of the disc. */
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - var(--cngx-ex-toast-ring-stroke, 2px)),
    #000 calc(100% - var(--cngx-ex-toast-ring-stroke, 2px))
  );
  transform: none;
  /* The two runtime tokens start the ring at the exact remaining time. */
  animation: cngx-ex-toast-ring var(--cngx-toast-timer-duration, 0s) linear
    var(--cngx-toast-timer-offset, 0s) forwards;
}

.cngx-ex-toast-ring .cngx-toast[data-timer='paused'] .cngx-toast__timer {
  animation-play-state: paused;
}

/* A titled toast keeps its icon level with the title, at the top of the row.
   The default glyph box is 22/21 of the icon size, so its centre sits 11/21
   of the icon size below the top padding. */
.cngx-ex-toast-ring .cngx-toast:has(.cngx-toast__title) .cngx-toast__timer {
  inset-block-start: calc(var(--cngx-space-sm, 8px) + var(--cngx-toast-icon-size, 20px) * 11 / 21);
}

@keyframes cngx-ex-toast-ring {
  from {
    --cngx-ex-toast-ring-progress: 1;
  }
  to {
    --cngx-ex-toast-ring-progress: 0;
  }
}`,
};
