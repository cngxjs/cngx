import { userEvent } from 'vitest/browser';

/**
 * Moves the real pointer to the bottom-right corner of the viewport, outside
 * anything a spec mounts.
 *
 * The geometry specs of one target share a page, so a pointer a spec left on
 * an element stays where it was and puts `:hover` on whatever the next spec
 * mounts there. `userEvent.unhover` is no way out: it hovers the centre of
 * `<body>`, whose box is only as tall as its content, so the pointer lands on
 * the mounted row itself.
 */
export async function parkPointer(): Promise<void> {
  const corner = document.createElement('div');
  corner.style.cssText =
    'position:fixed;inset-inline-end:0;inset-block-end:0;inline-size:1px;block-size:1px;z-index:2147483647';
  document.body.appendChild(corner);
  try {
    await userEvent.hover(corner);
  } finally {
    corner.remove();
  }
}
