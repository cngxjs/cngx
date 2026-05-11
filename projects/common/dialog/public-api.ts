/**
 * @module @cngx/common/dialog
 */
export { type DialogRef, type DialogState, DIALOG_REF } from './dialog/dialog-ref';
export { CngxDialog } from './dialog/dialog.directive';
export { CngxDialogTitle } from './dialog/dialog-title.directive';
export { CngxDialogDescription } from './dialog/dialog-description.directive';
export { CngxDialogClose } from './dialog/dialog-close.directive';
export { CngxDialogStack, provideDialogStack } from './dialog/dialog-stack';
export { CNGX_DIALOG_DATA, type CngxDialogConfig } from './dialog/dialog-config';
export { CngxDialogOpener, CngxDialogRef, provideDialog } from './dialog/dialog.service';
export { CngxBottomSheet } from './bottom-sheet/bottom-sheet.directive';
export { CngxDialogDraggable } from './draggable/dialog-draggable.directive';
