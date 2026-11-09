import { afterEach, describe, expect, it } from 'vitest';
import { CNGX_LIVE_SURFACE_ATTR } from '@cngx/core/utils';
import { createInertSiblings as create } from './inert-siblings';

// Each call follows the scope until released; release every one so no
// observer outlives its test.
const releases: (() => void)[] = [];
function createInertSiblings(...args: Parameters<typeof create>): () => void {
  const release = create(...args);
  releases.push(release);
  return release;
}

const mutationsDelivered = () => new Promise<void>((resolve) => setTimeout(resolve));

function mount(html: string): HTMLElement {
  const root = document.createElement('div');
  root.className = 'root';
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

describe('createInertSiblings', () => {
  let root: HTMLElement | null = null;

  afterEach(() => {
    releases.splice(0).forEach((release) => release());
    root?.remove();
    root = null;
  });

  const q = (sel: string) => root?.querySelector(sel) as HTMLElement;

  const layout = `
    <header class="header"><button>Menu</button></header>
    <div class="layout">
      <div class="cdk-visually-hidden cdk-focus-trap-anchor start" tabindex="0"></div>
      <aside class="host"><button>Inside</button></aside>
      <div class="cdk-visually-hidden cdk-focus-trap-anchor end" tabindex="0"></div>
      <main class="content">Content</main>
      <div class="pre" inert>Pre-existing</div>
    </div>
    <section class="chrome">
      <button class="chip">Chip</button>
      <div class="announcer" aria-live="polite"></div>
    </section>
    <p class="status" role="status"></p>
  `;

  describe("scope 'siblings'", () => {
    it('inerts the host siblings only and keeps the trap anchors live', () => {
      root = mount(layout);
      const release = createInertSiblings(q('.host'));

      expect(q('.content').hasAttribute('inert')).toBe(true);
      expect(q('.start').hasAttribute('inert')).toBe(false);
      expect(q('.end').hasAttribute('inert')).toBe(false);
      expect(q('.header').hasAttribute('inert')).toBe(false);
      expect(q('.chrome').hasAttribute('inert')).toBe(false);
      release();
      expect(q('.content').hasAttribute('inert')).toBe(false);
    });

    it('honours exclude', () => {
      root = mount(layout);
      createInertSiblings(q('.host'), { exclude: (el) => el.classList.contains('content') });
      expect(q('.content').hasAttribute('inert')).toBe(false);
    });
  });

  describe("scope 'outside'", () => {
    it('inerts the siblings of every ancestor up to body', () => {
      root = mount(layout);
      const bodyLevel = document.createElement('div');
      document.body.appendChild(bodyLevel);
      try {
        createInertSiblings(q('.host'), { scope: 'outside' });

        expect(q('.content').hasAttribute('inert')).toBe(true);
        expect(q('.header').hasAttribute('inert')).toBe(true);
        expect(bodyLevel.hasAttribute('inert')).toBe(true);
        expect(q('.layout').hasAttribute('inert')).toBe(false);
        expect(root.hasAttribute('inert')).toBe(false);
        expect(q('.host').hasAttribute('inert')).toBe(false);
      } finally {
        bodyLevel.remove();
      }
    });

    it('keeps the focus-trap anchors next to the host live', () => {
      root = mount(layout);
      createInertSiblings(q('.host'), { scope: 'outside' });
      expect(q('.start').hasAttribute('inert')).toBe(false);
      expect(q('.end').hasAttribute('inert')).toBe(false);
    });

    it('keeps live regions live and inerts their container children instead', () => {
      root = mount(layout);
      createInertSiblings(q('.host'), { scope: 'outside' });

      expect(q('.status').hasAttribute('inert')).toBe(false);
      expect(q('.announcer').hasAttribute('inert')).toBe(false);
      expect(q('.chrome').hasAttribute('inert')).toBe(false);
      expect(q('.chip').hasAttribute('inert')).toBe(true);
    });

    it('keeps alert, log, announcer and overlay containers live', () => {
      root = mount(`
        <aside class="host"></aside>
        <div class="alert" role="alert"></div>
        <div class="log" role="log"></div>
        <div class="cdk-live-announcer-element"></div>
        <div class="cdk-overlay-container"></div>
        <div class="marked-region" role="region" ${CNGX_LIVE_SURFACE_ATTR}></div>
        <div class="marked" ${CNGX_LIVE_SURFACE_ATTR}></div>
        <div class="plain"></div>
      `);
      createInertSiblings(q('.host'), { scope: 'outside' });

      const live = [
        '.alert',
        '.log',
        '.cdk-live-announcer-element',
        '.cdk-overlay-container',
        '.marked-region',
        '.marked',
      ];
      for (const sel of live) {
        expect(q(sel).hasAttribute('inert')).toBe(false);
      }
      expect(q('.plain').hasAttribute('inert')).toBe(true);
    });

    it('keeps a marked live surface live and inerts its other container children', () => {
      root = mount(`
        <aside class="host"></aside>
        <div class="shell">
          <section class="surface" ${CNGX_LIVE_SURFACE_ATTR}></section>
          <div class="sibling"></div>
        </div>
      `);
      createInertSiblings(q('.host'), { scope: 'outside' });

      expect(q('.surface').hasAttribute('inert')).toBe(false);
      expect(q('.shell').hasAttribute('inert')).toBe(false);
      expect(q('.sibling').hasAttribute('inert')).toBe(true);
    });

    it('preserves a pre-existing inert on release', () => {
      root = mount(layout);
      const release = createInertSiblings(q('.host'), { scope: 'outside' });
      expect(q('.pre').hasAttribute('inert')).toBe(true);

      release();
      expect(q('.pre').hasAttribute('inert')).toBe(true);
      expect(q('.content').hasAttribute('inert')).toBe(false);
      expect(q('.header').hasAttribute('inert')).toBe(false);
      expect(q('.chip').hasAttribute('inert')).toBe(false);
    });

    it('is idempotent and leaves a later consumer inert alone', () => {
      root = mount(layout);
      const release = createInertSiblings(q('.host'), { scope: 'outside' });
      release();
      q('.content').setAttribute('inert', '');
      release();
      expect(q('.content').hasAttribute('inert')).toBe(true);
    });

    it('inerts an element rendered next to an ancestor after engagement', async () => {
      root = mount(layout);
      const release = createInertSiblings(q('.host'), { scope: 'outside' });
      const late = document.createElement('div');
      const lateInLayout = document.createElement('p');
      root.appendChild(late);
      q('.layout').appendChild(lateInLayout);
      await mutationsDelivered();

      expect(late.hasAttribute('inert')).toBe(true);
      expect(lateInLayout.hasAttribute('inert')).toBe(true);

      release();
      expect(late.hasAttribute('inert')).toBe(false);
      expect(lateInLayout.hasAttribute('inert')).toBe(false);
    });

    it('keeps a late dialog, popover or live region live', async () => {
      root = mount(layout);
      createInertSiblings(q('.host'), { scope: 'outside' });
      const dialogHost = document.createElement('div');
      dialogHost.innerHTML = '<dialog open>Confirm</dialog><span class="sibling">x</span>';
      const popover = document.createElement('div');
      popover.setAttribute('popover', 'manual');
      const region = document.createElement('div');
      region.setAttribute('aria-live', 'polite');
      root.append(dialogHost, popover, region);
      await mutationsDelivered();

      expect(dialogHost.hasAttribute('inert')).toBe(false);
      expect(dialogHost.querySelector('dialog')?.hasAttribute('inert')).toBe(false);
      expect(dialogHost.querySelector('.sibling')?.hasAttribute('inert')).toBe(true);
      expect(popover.hasAttribute('inert')).toBe(false);
      expect(region.hasAttribute('inert')).toBe(false);
    });

    it('stops following the scope once released', async () => {
      root = mount(layout);
      const release = createInertSiblings(q('.host'), { scope: 'outside' });
      release();
      const late = document.createElement('div');
      root.appendChild(late);
      await mutationsDelivered();
      expect(late.hasAttribute('inert')).toBe(false);
    });

    it('does nothing for a host outside the document', () => {
      const detached = document.createElement('aside');
      const other = document.createElement('div');
      document.body.appendChild(other);
      try {
        createInertSiblings(detached, { scope: 'outside' });
        expect(other.hasAttribute('inert')).toBe(false);
      } finally {
        other.remove();
      }
    });
  });
});
