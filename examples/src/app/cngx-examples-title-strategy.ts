import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
  TitleStrategy,
} from '@angular/router';

/**
 * The story routes carry their title under `data.title` rather than the
 * top-level `title` property Angular's default strategy reads. Walk the
 * route tree, pull the deepest `data.title`, and write it to the document
 * with a trailing `- CNGX examples` suffix so direct-loaded story URLs no
 * longer all share the same generic page title.
 */
@Injectable({ providedIn: 'root' })
export class CngxExamplesTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const dataTitle = this.findTitle(snapshot.root);
    this.title.setTitle(dataTitle ? `${dataTitle} - CNGX examples` : 'CNGX examples');
  }

  private findTitle(route: ActivatedRouteSnapshot): string | undefined {
    const dataTitle = route.data['title'];
    if (typeof dataTitle === 'string' && dataTitle.length > 0) {
      return dataTitle;
    }
    for (const child of route.children) {
      const found = this.findTitle(child);
      if (found) {
        return found;
      }
    }
    return undefined;
  }
}
