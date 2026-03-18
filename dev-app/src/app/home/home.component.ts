import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

interface Package {
  name: string;
  description: string;
  tags: string[];
  link?: string;
  soon?: boolean;
}
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home">
      <section class="hero">
        <div class="hero-eyebrow">Angular Component Library</div>
        <h1 class="hero-title">cng<span class="title-accent">x</span></h1>
        <p class="hero-desc">
          Headless, typed, production-grade Angular components — built for serious applications.
        </p>
        <div class="hero-rule"></div>
      </section>

      <section class="packages">
        <h2 class="section-label"><span class="label-dot"></span>Packages</h2>
        <div class="pkg-grid">
          <a class="pkg-card pkg-card--active" routerLink="/data-display/treetable">
            <span class="pkg-name">&#64;cngx/data&#8209;display</span>
            <p class="pkg-desc">
              Hierarchical data tables, tree views, and list components with full CDK and Material support.
            </p>
            <div class="pkg-footer">
              <span class="pkg-tag">Treetable</span>
              <span class="pkg-arrow">&#x2192;</span>
            </div>
          </a>

          <a class="pkg-card pkg-card--active" routerLink="/common/behaviors/sort">
            <span class="pkg-name">&#64;cngx/common</span>
            <p class="pkg-desc">Sort, filter, search behaviors and DataSource utilities — headless, Signal-first.</p>
            <div class="pkg-footer">
              <span class="pkg-tag">Sort · Filter · Search · DataSource</span>
              <span class="pkg-arrow">&#x2192;</span>
            </div>
          </a>

          <div class="pkg-card pkg-card--soon">
            <span class="pkg-name">&#64;cngx/ui</span>
            <p class="pkg-desc">Core UI components — layout primitives, overlays, and interaction patterns.</p>
            <div class="pkg-footer"><span class="pkg-badge">Soon</span></div>
          </div>

          <div class="pkg-card pkg-card--soon">
            <span class="pkg-name">&#64;cngx/forms</span>
            <p class="pkg-desc">Typed reactive form controls, validators, and form utilities.</p>
            <div class="pkg-footer"><span class="pkg-badge">Soon</span></div>
          </div>

          <div class="pkg-card pkg-card--soon">
            <span class="pkg-name">&#64;cngx/utils</span>
            <p class="pkg-desc">Array helpers, RxJS interop, and shared TypeScript utilities.</p>
            <div class="pkg-footer"><span class="pkg-badge">Soon</span></div>
          </div>

          <div class="pkg-card pkg-card--soon">
            <span class="pkg-name">&#64;cngx/core</span>
            <p class="pkg-desc">Tokens, abstract base classes, and core dependency injection patterns.</p>
            <div class="pkg-footer"><span class="pkg-badge">Soon</span></div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .home {
        max-width: 860px;
        display: flex;
        flex-direction: column;
        gap: 3.5rem;
      }

      .hero {
        padding-top: 0.5rem;
      }

      .title-accent {
        color: var(--accent);
      }

      .hero-rule {
        width: 36px;
        height: 2px;
        background: var(--accent);
        margin-top: 1.75rem;
        border-radius: 1px;
      }

      .hero-eyebrow {
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 0.875rem;
      }

      .hero-title {
        font-size: clamp(3.5rem, 10vw, 6rem);
        font-weight: 800;
        letter-spacing: -0.04em;
        color: var(--text-primary);
        line-height: 0.92;
        margin-bottom: 1.25rem;
      }

      .hero-desc {
        font-size: 1.0625rem;
        color: var(--text-muted);
        line-height: 1.6;
        max-width: 460px;
        font-weight: 400;
      }

      .section-label {
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 1.125rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .label-dot {
        display: inline-block;
        width: 5px;
        height: 5px;
        background: var(--accent);
        border-radius: 50%;
        flex-shrink: 0;
      }

      .pkg-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
        gap: 0.875rem;
      }

      .pkg-card {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 10px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        text-decoration: none;
        box-shadow: var(--card-shadow);
        transition:
          box-shadow 0.15s,
          border-color 0.15s,
          transform 0.15s;
      }

      a.pkg-card:hover {
        box-shadow:
          0 2px 8px rgba(0, 0, 0, 0.08),
          0 12px 32px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
        border-color: var(--accent);
      }

      .pkg-card--soon {
        opacity: 0.55;
      }

      .pkg-name {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: -0.01em;
        font-family: var(--font-mono);
      }

      .pkg-desc {
        font-size: 0.8125rem;
        color: var(--text-muted);
        line-height: 1.55;
        flex: 1;
      }

      .pkg-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 0.25rem;
      }

      .pkg-tag {
        font-size: 0.6875rem;
        font-weight: 600;
        padding: 0.1875rem 0.4375rem;
        background: rgba(245, 166, 35, 0.12);
        color: var(--accent);
        border-radius: 4px;
        letter-spacing: 0.02em;
      }

      .pkg-badge {
        font-size: 0.625rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
        padding: 0.1875rem 0.4375rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
      }

      .pkg-arrow {
        font-size: 0.875rem;
        color: var(--accent);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
     readonly version = '0.1.0';
  readonly githubUrl = 'https://github.com/cweiss/cngx';
  readonly npmUrl = 'https://www.npmjs.com/org/cngx';
 
  readonly copied = signal(false);
 
  readonly installCommand = 'npm install @cngx/common @cngx/data-display';
 
  readonly packages: Package[] = [
    {
      name: '@cngx/data-display',
      description: 'Hierarchical data tables, tree views, and list components with full CDK and Material support.',
      tags: ['Treetable'],
      link: '/demos/treetable',
    },
    {
      name: '@cngx/common',
      description: 'Sort, filter, search behaviors and DataSource utilities — headless, Signal-first.',
      tags: ['Sort', 'Filter', 'Search', 'DataSource'],
      link: '/demos/common',
    },
    {
      name: '@cngx/ui',
      description: 'Core UI components — layout primitives, overlays, and interaction patterns.',
      tags: [],
      soon: true,
    },
    {
      name: '@cngx/forms',
      description: 'Typed reactive form controls, validators, and form utilities.',
      tags: [],
      soon: true,
    },
    {
      name: '@cngx/utils',
      description: 'Array helpers, RxJS interop, and shared TypeScript utilities.',
      tags: [],
      soon: true,
    },
    {
      name: '@cngx/core',
      description: 'Tokens, abstract base classes, and core dependency injection patterns.',
      tags: [],
      soon: true,
    },
  ];
 
  readonly principles = [
    { icon: '⬡', title: 'Headless', body: 'Behavior without opinion. Drop in your own styles — or use Angular Material.' },
    { icon: '⚡', title: 'Signal-first', body: 'Built on Angular Signals throughout. No Zone.js required.' },
    { icon: '⌨', title: 'Declarative', body: 'Compose behaviors in templates — no imperative wiring in class code.' },
    { icon: '⬙', title: 'Composable', body: 'Atomic directives assembled via hostDirectives. Mix exactly what you need.' },
  ];
 
  async copyInstall(): Promise<void> {
    await navigator.clipboard.writeText(this.installCommand);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
