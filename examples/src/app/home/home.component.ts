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
  totalRoutes: number;
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
    .map(([lib, cats]) => {
      const categories: CategoryNode[] = [...cats.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, demos]) => {
          const demosArr: DemoNode[] = [...demos.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([demo, sections]) => ({
              demo,
              sections: [...sections].sort((a, b) => a.section.localeCompare(b.section)),
            }));
          const totalRoutes = demosArr.reduce((n, d) => n + d.sections.length, 0);
          return { category, demos: demosArr, totalRoutes };
        });
      const totalRoutes = categories.reduce((n, c) => n + c.totalRoutes, 0);
      return { lib, categories, totalRoutes };
    });
}

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1>Index of /cngx-examples</h1>

    <div class="filter-row">
      <label for="q">Filter:</label>
      <input
        id="q"
        name="q"
        #search
        type="search"
        autofocus
        placeholder="lib · category · demo · section · API symbol"
        [value]="term()"
        (input)="setTerm(search.value)"
      />
      <span class="meta">{{ routesMatched() }} of {{ totalRoutes }} entries</span>
    </div>

    <hr />

    <div class="row head">
      <span class="ico">[ICO]</span>
      <span class="name">Name</span>
      <span class="size">Sections</span>
    </div>

    <hr />

    @if (tree().length === 0) {
      <div class="row"><span class="ico">[ ]</span><span class="name empty">No matches.</span></div>
    }

    @for (lib of tree(); track lib.lib) {
      <details open>
        <summary class="row lvl-0">
          <span class="ico">[DIR]</span>
          <span class="name">&#64;cngx/{{ lib.lib }}/</span>
          <span class="size">{{ lib.totalRoutes }}</span>
        </summary>

        @for (cat of lib.categories; track cat.category) {
          <details [attr.open]="autoOpen() ? '' : null">
            <summary class="row lvl-1">
              <span class="ico">[DIR]</span>
              <span class="name">{{ cat.category || '_uncategorised' }}/</span>
              <span class="size">{{ cat.totalRoutes }}</span>
            </summary>

            @for (demo of cat.demos; track demo.demo) {
              <details [attr.open]="autoOpen() ? '' : null">
                <summary class="row lvl-2">
                  <span class="ico">[DIR]</span>
                  <span class="name">{{ demo.demo }}/</span>
                  <span class="size">{{ demo.sections.length }}</span>
                </summary>
                @for (sec of demo.sections; track sec.path) {
                  <div class="row lvl-3">
                    <span class="ico">[&nbsp;&nbsp;&nbsp;]</span>
                    <span class="name">
                      <a [routerLink]="['/', ...sec.path.split('/')]">{{ sec.section }}</a>
                    </span>
                    <span class="size">—</span>
                  </div>
                }
              </details>
            }
          </details>
        }
      </details>
    }

    <hr />
    <address>cngx/examples · {{ totalRoutes }} routes</address>
  `,
  styles: [
    `
      :host {
        display: block;
        max-width: 980px;
        margin: 0 auto;
        padding: 14px 16px 32px;
        font-family: Verdana, Geneva, Arial, sans-serif;
        font-size: 14px;
        color: #000;
        background: #fff;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 1.5rem;
        font-weight: 700;
      }
      .filter-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        font-size: 0.875rem;
      }
      .filter-row label { color: #000; }
      .filter-row input {
        flex: 1;
        max-width: 420px;
        padding: 2px 6px;
        font: inherit;
        font-size: 0.875rem;
        border: 1px solid #888;
        background: #fff;
        color: #000;
        border-radius: 0;
      }
      .filter-row input:focus-visible {
        outline: 1px dotted #000;
        outline-offset: 1px;
      }
      .filter-row .meta { color: #555; font-size: 0.8125rem; }
      hr {
        border: none;
        border-top: 1px solid #888;
        margin: 6px 0;
      }
      .row {
        display: grid;
        grid-template-columns: 56px 1fr 100px;
        gap: 12px;
        align-items: baseline;
        padding: 1px 4px;
        line-height: 1.5;
      }
      .row.head {
        font-weight: 700;
        color: #000;
      }
      .row .ico {
        font-family: 'Courier New', Courier, monospace;
        color: #555;
        font-size: 0.8125rem;
      }
      .row .size {
        text-align: right;
        color: #555;
        font-size: 0.8125rem;
      }
      .row .name {
        color: #000;
        font-size: 0.875rem;
      }
      .row .name.empty { color: #888; font-style: italic; }
      .row.lvl-0 .name { font-weight: 700; }
      .row.lvl-1 .name { padding-left: 18px; }
      .row.lvl-2 .name { padding-left: 36px; font-weight: 600; }
      .row.lvl-3 { grid-template-columns: 56px 1fr 100px; }
      .row.lvl-3 .name { padding-left: 54px; }
      details > summary {
        list-style: none;
        cursor: pointer;
      }
      details > summary::-webkit-details-marker { display: none; }
      details > summary:hover { background: #f4f4f4; }
      details > summary .ico::before {
        content: '[+] ';
        font-weight: normal;
        color: #555;
        font-family: 'Courier New', monospace;
        font-size: 0.8125rem;
      }
      details[open] > summary .ico::before { content: '[-] '; }
      details > summary .ico {
        position: relative;
      }
      /* Pre-marker eats space; hide the original [DIR] text after the toggle. */
      details > summary .ico { font-size: 0; }
      details > summary .ico::after {
        content: '';
      }
      a {
        color: #0000ee;
        text-decoration: underline;
      }
      a:visited { color: #551a8b; }
      a:hover { color: #cc0000; background: #ffffcc; }
      address {
        font-style: normal;
        font-size: 0.75rem;
        color: #555;
        margin-top: 8px;
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
