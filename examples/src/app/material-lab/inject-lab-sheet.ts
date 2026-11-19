import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject } from '@angular/core';

/**
 * Links a non-injected lab theme bundle (angular.json `inject: false`) while
 * the calling page is mounted and removes it on destroy, so the 16px root and
 * the Material theme leave with the page. Lab pages are route siblings, so
 * exactly one lab bundle is linked at a time. Call in an injection context.
 */
export function injectLabSheet(bundle: string): void {
  const doc = inject(DOCUMENT);
  const sheet = doc.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = `${bundle}.css`;
  doc.head.appendChild(sheet);
  inject(DestroyRef).onDestroy(() => sheet.remove());
}
