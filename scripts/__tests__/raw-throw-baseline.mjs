// Raw `throw new <X>Error(...)` sites not yet migrated to CngxRuntimeError, per
// lib. Shrink-only: the raw-throw guard fails on a raw site not listed here and
// on a row that no longer matches the source exactly, so every migration
// commit drops its rows. Removed once every lib is migrated.

export const RAW_THROW_BASELINE = {
  ui: [
    { file: 'projects/ui/feedback/alert/alert-on.directive.ts', count: 1 },
    { file: 'projects/ui/feedback/banner/banner-on.directive.ts', count: 1 },
    { file: 'projects/ui/feedback/banner/banner-trigger.ts', count: 1 },
    { file: 'projects/ui/feedback/toast/toast-on.directive.ts', count: 1 },
    { file: 'projects/ui/feedback/toast/toast.component.ts', count: 1 },
    { file: 'projects/ui/sidenav/sidenav-content.ts', count: 1 },
  ],
};
