import { DestroyRef, inject } from '@angular/core';

/**
 * Demo chrome: while `when()` is true, `navigator.clipboard.writeText`
 * rejects the way a browser does when the page lacks clipboard permission,
 * so a story can show the failed-copy path on demand. The patch is an own
 * property on the clipboard instance, removed again when the calling
 * component is destroyed. Call it in an injection context (a `setupChrome`
 * field initializer). No-op where the Clipboard API is missing.
 */
export function refuseClipboardWhile(when: () => boolean): void {
  const clipboard = globalThis.navigator?.clipboard;
  if (!clipboard) {
    return;
  }
  const own = Object.getOwnPropertyDescriptor(clipboard, 'writeText');
  const original = clipboard.writeText.bind(clipboard);
  Object.defineProperty(clipboard, 'writeText', {
    configurable: true,
    writable: true,
    value: (text: string): Promise<void> =>
      when()
        ? Promise.reject(new DOMException('Write permission denied.', 'NotAllowedError'))
        : original(text),
  });
  inject(DestroyRef).onDestroy(() => {
    if (own) {
      Object.defineProperty(clipboard, 'writeText', own);
      return;
    }
    Reflect.deleteProperty(clipboard, 'writeText');
  });
}
