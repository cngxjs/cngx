import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Alphabetical',
  subtitle:
    'Pagination by category instead of page number. <code>cngxBucketPaginate</code> partitions the list into letter-range buckets (A-C, D-F …) and <code>cngx-pgn-alpha</code> renders the chip strip - a sibling model to the page-index brain, not a flag on it.',
  description:
    'The range model is a separate directive: <code>cngxBucketPaginate</code> takes the buckets and the items, derives which buckets are empty, and tracks the active one via <code>[(active)]</code>. The chips inject <code>CNGX_BUCKET_PAGINATE_HOST</code>, so each is a <code>role="group"</code> toggle button - <code>aria-pressed</code> on the active bucket, <code>disabled</code> with a stated reason on empties (no silent dead controls). Selecting a chip filters the list; re-selecting it clears the filter. Empty/disabled state is derived from the predicates, never synced. Arrow keys rove the strip and skip the disabled chips, reusing the same roving primitive as the numbered page row.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxBucketPaginate', 'CngxPaginatorAlpha'],
  moduleImports: [
    "import { CngxBucketPaginate, type CngxBucket } from '@cngx/common/data';",
    "import { CngxPaginatorAlpha } from '@cngx/ui/paginator';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: ['CngxBucketPaginate', 'CngxPaginatorAlpha'],
  setup: `protected readonly people = signal<readonly Person[]>(PEOPLE);
  protected readonly buckets: readonly CngxBucket<Person>[] = [
    { label: 'A-C', match: (p: Person) => this.inRange(p, 'A', 'C') },
    { label: 'D-F', match: (p: Person) => this.inRange(p, 'D', 'F') },
    { label: 'G-I', match: (p: Person) => this.inRange(p, 'G', 'I') },
    { label: 'J-L', match: (p: Person) => this.inRange(p, 'J', 'L') },
    { label: 'M-O', match: (p: Person) => this.inRange(p, 'M', 'O') },
    { label: 'P-R', match: (p: Person) => this.inRange(p, 'P', 'R') },
    { label: 'S-U', match: (p: Person) => this.inRange(p, 'S', 'U') },
    { label: 'V-Z', match: (p: Person) => this.inRange(p, 'V', 'Z') },
  ];
  protected readonly active = signal<string | null>(null);
  protected readonly visible = computed<readonly Person[]>(() => {
    const label = this.active();
    if (label === null) {
      return this.people();
    }
    const bucket = this.buckets.find((b) => b.label === label);
    return bucket ? this.people().filter((p) => bucket.match(p)) : this.people();
  });
  private inRange(p: Person, lo: string, hi: string): boolean {
    const c = p.name[0]?.toUpperCase() ?? '';
    return c >= lo && c <= hi;
  }`,
  template: `  <div
    class="demo-pgn-alpha-stack"
    cngxBucketPaginate
    [buckets]="buckets"
    [items]="people()"
    [(active)]="active"
  >
    <cngx-pgn-alpha />
    <ul class="demo-list-flush">
      @for (p of visible(); track p.name) {
        <li class="demo-list-row"><strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}</li>
      }
    </ul>
  </div>`,
};
