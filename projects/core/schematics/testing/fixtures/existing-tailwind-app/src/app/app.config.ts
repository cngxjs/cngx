import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, Injectable, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { provideRouter, RouterStateSnapshot, TitleStrategy } from '@angular/router';

import { routes } from './app.routes';

@Injectable()
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    this.title.setTitle(page ? `${page} | Tailwind App` : 'Tailwind App');
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideAppInitializer(() => {
      document.documentElement.lang = navigator.language;
    }),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
};
