import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterOutlet],
  template: `
    <header class="flex items-center gap-4 border-b border-slate-200 px-6 py-3">
      <a routerLink="/" class="font-semibold">Tailwind App</a>
    </header>
    <main class="p-6">
      <router-outlet />
    </main>
  `,
})
export class Shell {}
