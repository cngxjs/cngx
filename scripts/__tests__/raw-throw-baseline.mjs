// Raw `throw new <X>Error(...)` sites not yet migrated to CngxRuntimeError, per
// lib. Shrink-only: the raw-throw guard fails on a raw site not listed here and
// on a row that no longer matches the source exactly, so every migration
// commit drops its rows. Removed once every lib is migrated.

export const RAW_THROW_BASELINE = {
  common: [
    { file: 'projects/common/data/async-state/operators.ts', count: 1 },
    { file: 'projects/common/interactive/button-toggle/button-toggle.directive.ts', count: 2 },
    { file: 'projects/common/interactive/tree-controller/tree-controller.ts', count: 1 },
  ],
  forms: [
    { file: 'projects/forms/controls/typed-control.directive.ts', count: 1 },
    { file: 'projects/forms/filter-builder/filter-builder.utils.ts', count: 5 },
    { file: 'projects/forms/select/shared/chip-removal-handler.ts', count: 1 },
  ],
  ui: [
    { file: 'projects/ui/feedback/alert/alert-on.directive.ts', count: 1 },
    { file: 'projects/ui/feedback/banner/banner-on.directive.ts', count: 1 },
    { file: 'projects/ui/feedback/banner/banner-trigger.ts', count: 1 },
    { file: 'projects/ui/feedback/toast/toast-on.directive.ts', count: 1 },
    { file: 'projects/ui/feedback/toast/toast.component.ts', count: 1 },
    { file: 'projects/ui/sidenav/sidenav-content.ts', count: 1 },
  ],
};
