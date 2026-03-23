import { Injectable } from '@angular/core';
import type { CngxDisclosure } from './disclosure.directive';

/** Minimal interface for nav group instances tracked by the registry. */
export interface NavGroupRef {
  readonly disclosure: CngxDisclosure;
}

/**
 * Scoped registry for single-accordion coordination.
 *
 * Provided at the sidebar/nav container level — only groups within the
 * same provider scope coordinate. Not `providedIn: 'root'` on purpose.
 *
 * @usageNotes
 * ```typescript
 * @Component({
 *   providers: [
 *     provideNavConfig({ singleAccordion: true }),
 *     CngxNavGroupRegistry,
 *   ],
 * })
 * ```
 */
@Injectable()
export class CngxNavGroupRegistry {
  private readonly groups = new Set<NavGroupRef>();

  /** @internal */
  register(group: NavGroupRef): void {
    this.groups.add(group);
  }

  /** @internal */
  unregister(group: NavGroupRef): void {
    this.groups.delete(group);
  }

  /** Closes all groups except the specified one. */
  closeOthers(except: NavGroupRef): void {
    for (const group of this.groups) {
      if (group !== except && group.disclosure.opened()) {
        group.disclosure.close();
      }
    }
  }
}
