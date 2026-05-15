import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROUTES_META, type RouteMeta } from '../_routes-meta';

interface DemoNode {
  demo: string;
  sections: RouteMeta[];
}
interface CategoryNode {
  category: string;
  demos: DemoNode[];
}
interface LibNode {
  lib: string;
  categories: CategoryNode[];
  totalRoutes: number;
}

function buildTree(routes: readonly RouteMeta[]): LibNode[] {
  const libs = new Map<string, Map<string, Map<string, RouteMeta[]>>>();
  for (const r of routes) {
    const lib = r.lib || 'misc';
    const category = r.category || '';
    if (!libs.has(lib)) libs.set(lib, new Map());
    const cats = libs.get(lib)!;
    if (!cats.has(category)) cats.set(category, new Map());
    const demos = cats.get(category)!;
    if (!demos.has(r.demo)) demos.set(r.demo, []);
    demos.get(r.demo)!.push(r);
  }
  return [...libs.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([lib, cats]) => ({
      lib,
      totalRoutes: [...cats.values()].reduce(
        (n, demos) => n + [...demos.values()].reduce((m, s) => m + s.length, 0),
        0,
      ),
      categories: [...cats.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, demos]) => ({
          category,
          demos: [...demos.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([demo, sections]) => ({
              demo,
              sections: [...sections].sort((a, b) => a.section.localeCompare(b.section)),
            })),
        })),
    }));
}

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <header class="hh">
      <h1>cngx examples</h1>
      <p>
        {{ routesMatched() }} of {{ totalRoutes }} routes
        @if (term()) { matching <code>{{ term() }}</code> }
      </p>
      <input
        #search
        type="search"
        autofocus
        placeholder="Filter — lib, category, demo, section, or API symbol…"
        [value]="term()"
        (input)="setTerm(search.value)"
      />
    </header>

    @if (tree().length === 0) {
      <p class="empty">No routes match.</p>
    }

    @for (lib of tree(); track lib.lib) {
      <details class="lib" open>
        <summary>
          <span class="badge">&#64;cngx/{{ lib.lib }}</span>
          <span class="count">{{ lib.totalRoutes }}</span>
        </summary>
        @for (cat of lib.categories; track cat.category) {
          <details class="cat" [attr.open]="autoOpen() ? '' : null" open>
            <summary>{{ cat.category || '(uncategorised)' }}</summary>
            @for (demo of cat.demos; track demo.demo) {
              <div class="demo">
                <h3>{{ demo.demo }}</h3>
                <ul>
                  @for (sec of demo.sections; track sec.path) {
                    <li>
                      <a [routerLink]="['/', ...sec.path.split('/')]">
                        {{ sec.section }}
                      </a>
                    </li>
                  }
                </ul>
              </div>
            }
          </details>
        }
      </details>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 900px;
        margin: 0 auto;
        padding: 24px 16px 64px;
        font-family: 'Courier New', Courier, monospace;
        color: #1a1a1a;
        background: #fdfaf0;
        min-height: 100vh;
      }
      .hh {
        margin-bottom: 24px;
        padding-bottom: 12px;
        border-bottom: 2px solid #1a1a1a;
      }
      .hh h1 {
        margin: 0 0 6px;
        font-family: 'Times New Roman', Times, serif;
        font-size: 1.875rem;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      .hh p {
        margin: 0 0 12px;
        font-size: 0.875rem;
        color: #555;
      }
      .hh p code {
        font-family: inherit;
        font-weight: 700;
        color: #1a1a1a;
        background: #f0e8c8;
        padding: 0 4px;
      }
      .hh input {
        width: 100%;
        box-sizing: border-box;
        padding: 6px 10px;
        font: inherit;
        font-size: 0.9375rem;
        color: #1a1a1a;
        background: #ffffff;
        border: 2px inset #999;
        border-radius: 0;
      }
      .hh input:focus-visible {
        outline: 1px dotted #1a1a1a;
        outline-offset: -3px;
      }
      .empty {
        color: #555;
        padding: 24px;
        text-align: center;
        font-style: italic;
      }
      details.lib {
        margin-bottom: 10px;
        border: 2px ridge #b8a878;
        background: #fffef7;
      }
      details.lib > summary {
        padding: 6px 10px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        background: #efe5c0;
        list-style: none;
      }
      details.lib > summary::before {
        content: '[+]';
        font-family: inherit;
        margin-right: 4px;
      }
      details.lib[open] > summary::before { content: '[-]'; }
      details.lib > summary:hover { background: #e8dbb0; }
      details.lib[open] > summary { border-bottom: 1px solid #b8a878; }
      .badge {
        font-size: 0.9375rem;
        color: #1a1a1a;
      }
      .count {
        margin-left: auto;
        padding: 0 6px;
        font-size: 0.75rem;
        color: #555;
        background: #fdfaf0;
        border: 1px solid #b8a878;
      }
      details.cat {
        margin: 4px 12px;
        border-left: 1px dashed #999;
      }
      details.cat > summary {
        padding: 4px 8px;
        cursor: pointer;
        font-weight: 700;
        font-size: 0.875rem;
        color: #1a1a1a;
        text-transform: capitalize;
        list-style: none;
      }
      details.cat > summary::before {
        content: '▸';
        margin-right: 6px;
        color: #777;
      }
      details.cat[open] > summary::before { content: '▾'; }
      details.cat > summary:hover { color: #0000cc; }
      .demo { padding: 2px 8px 6px 20px; }
      .demo h3 {
        margin: 6px 0 2px;
        font-size: 0.8125rem;
        font-weight: 700;
        color: #444;
      }
      .demo h3::before { content: '› '; color: #999; }
      .demo ul {
        list-style: square;
        padding-left: 28px;
        margin: 0;
      }
      .demo li {
        font-size: 0.875rem;
        line-height: 1.6;
      }
      .demo li::marker { color: #999; }
      .demo li a {
        color: #0000cc;
        text-decoration: underline;
      }
      .demo li a:hover {
        color: #cc0000;
        background: #f0e8c8;
      }
      .demo li a:visited {
        color: #551a8b;
      }
    `,
  ],
})
export class HomeComponent {
  protected readonly totalRoutes = ROUTES_META.length;
  protected readonly term = signal('');

  protected readonly filtered = computed<readonly RouteMeta[]>(() => {
    const t = this.term().trim().toLowerCase();
    if (!t) return ROUTES_META;
    return ROUTES_META.filter((r) => {
      const haystack = `${r.lib} ${r.category} ${r.demo} ${r.section} ${r.apiComponents.join(' ')}`.toLowerCase();
      return haystack.includes(t);
    });
  });

  protected readonly tree = computed(() => buildTree(this.filtered()));
  protected readonly routesMatched = computed(() => this.filtered().length);
  protected readonly autoOpen = computed(() => this.term().trim().length > 0);

  protected setTerm(value: string): void {
    this.term.set(value);
  }
}
