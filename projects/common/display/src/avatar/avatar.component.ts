import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

/**
 * Display atom for user/person/entity avatars.
 *
 * Rendering cascade:
 * 1. Image (`src` set and not errored).
 * 2. Initials (`initials` set).
 * 3. Projected content (`<ng-content>`) — typically a `<cngx-icon>`.
 *
 * Optional status indicator dot via `status`. Size and shape driven by
 * CSS custom properties.
 *
 * @category display
 */
@Component({
  selector: 'cngx-avatar',
  exportAs: 'cngxAvatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './avatar.component.scss',
  host: {
    class: 'cngx-avatar',
    '[class.cngx-avatar--xs]': 'size() === "xs"',
    '[class.cngx-avatar--sm]': 'size() === "sm"',
    '[class.cngx-avatar--md]': 'size() === "md"',
    '[class.cngx-avatar--lg]': 'size() === "lg"',
    '[class.cngx-avatar--xl]': 'size() === "xl"',
    '[class.cngx-avatar--square]': 'shape() === "square"',
    '[class.cngx-avatar--circle]': 'shape() === "circle"',
  },
  template: `
    @if (showImage()) {
      <img
        class="cngx-avatar__img"
        [src]="src()!"
        [alt]="alt() ?? ''"
        (load)="handleLoad()"
        (error)="handleError()"
      />
    } @else if (initials()) {
      <span class="cngx-avatar__initials" aria-hidden="true">{{ initials() }}</span>
    } @else {
      <ng-content />
    }
    @if (status()) {
      <span
        class="cngx-avatar__status"
        [class.cngx-avatar__status--online]="status() === 'online'"
        [class.cngx-avatar__status--offline]="status() === 'offline'"
        [class.cngx-avatar__status--busy]="status() === 'busy'"
        [class.cngx-avatar__status--away]="status() === 'away'"
        [attr.aria-label]="status()"
      ></span>
    }
  `,
})
export class CngxAvatar {
  /** Image URL. When set and loads successfully, the image is shown. */
  readonly src = input<string | undefined>(undefined);
  /** Alternate text for the image. Required when `src` is used. */
  readonly alt = input<string | undefined>(undefined);
  /** Initials fallback used when no image loads. */
  readonly initials = input<string | undefined>(undefined);
  /** Size preset driving CSS custom properties on the host. */
  readonly size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  /** Visual shape. */
  readonly shape = input<'circle' | 'square'>('circle');
  /** Optional user-presence status indicator. */
  readonly status = input<'online' | 'offline' | 'busy' | 'away' | undefined>(undefined);

  private readonly imageLoadedState = signal(false);
  private readonly imageErroredState = signal(false);

  /** Whether the image loaded successfully. */
  readonly imageLoaded = this.imageLoadedState.asReadonly();

  /** Whether the fallback path (initials or ng-content) is currently rendered. */
  readonly showFallback = computed<boolean>(() => !this.showImage());

  /** Whether the `<img>` element should be rendered. */
  readonly showImage = computed<boolean>(() => !!this.src() && !this.imageErroredState());

  protected handleLoad(): void {
    this.imageLoadedState.set(true);
    this.imageErroredState.set(false);
  }

  protected handleError(): void {
    this.imageLoadedState.set(false);
    this.imageErroredState.set(true);
  }
}
