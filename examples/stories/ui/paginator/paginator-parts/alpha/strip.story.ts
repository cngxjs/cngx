import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginatorAlpha: Alphabetical chip strip',
  subtitle:
    'The <code>cngx-pgn-alpha</code> part in isolation - a <code>role="group"</code> toggle strip over the <code>cngxBucketPaginate</code> range model. One chip per bucket; the active chip carries <code>aria-pressed</code>, an empty bucket is disabled.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxPaginatorAlpha', 'CngxBucketPaginate'],
  moduleImports: [
    "import { CngxBucketPaginate, type CngxBucket } from '@cngx/common/data';",
    "import { CngxPaginatorAlpha } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxBucketPaginate', 'CngxPaginatorAlpha'],
  setup: `protected readonly names = signal<readonly string[]>([
    'Ada', 'Bram', 'Cleo', 'Dion', 'Mara', 'Theo',
  ]);
  protected readonly buckets: readonly CngxBucket<string>[] = [
    { label: 'A-C', match: (n: string) => this.inRange(n, 'A', 'C') },
    { label: 'D-F', match: (n: string) => this.inRange(n, 'D', 'F') },
    { label: 'G-I', match: (n: string) => this.inRange(n, 'G', 'I') },
    { label: 'J-L', match: (n: string) => this.inRange(n, 'J', 'L') },
    { label: 'M-O', match: (n: string) => this.inRange(n, 'M', 'O') },
    { label: 'P-R', match: (n: string) => this.inRange(n, 'P', 'R') },
    { label: 'S-U', match: (n: string) => this.inRange(n, 'S', 'U') },
    { label: 'V-Z', match: (n: string) => this.inRange(n, 'V', 'Z') },
  ];
  protected readonly active = signal<string | null>(null);
  private inRange(n: string, lo: string, hi: string): boolean {
    const c = n[0]?.toUpperCase() ?? '';
    return c >= lo && c <= hi;
  }`,
  template: `  <div
    cngxBucketPaginate
    [buckets]="buckets"
    [items]="names()"
    [active]="active()"
    (activeChange)="active.set($event)"
  >
    <cngx-pgn-alpha />
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active bucket</span><span class="event-value">{{ active() ?? 'none' }}</span></div>
  </div>`,
};
