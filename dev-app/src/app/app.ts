import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  readonly theme = signal<'light' | 'dark'>('light');

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly showNav = computed(() => {
    const url = this.url();
    return url !== '/' && url !== '/#/' && url !== '';
  });

  constructor() {
    // Scroll to top + scroll sidebar to active item on route change
    effect(() => {
      this.url(); // track
      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0 });
        // Delay slightly so Angular updates the active class first
        setTimeout(() => {
          const active = document.querySelector('.nav a.active') as HTMLElement | null;
          active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 50);
      }
    });

    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('cngx-theme') as 'light' | 'dark' | null;
      const initial =
        stored ??
        (globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      this.theme.set(initial);
      document.documentElement.dataset['theme'] = initial;
    }

    effect(() => {
      const t = this.theme();
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.dataset['theme'] = t;
        localStorage.setItem('cngx-theme', t);
      }
    });
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }
}
