import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

import { provideTreetable, withHighlightOnHover } from '@cngx/data-display/treetable';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideTreetable(withHighlightOnHover()),
  ],
};
