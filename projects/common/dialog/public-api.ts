/**
 * @module @cngx/common/dialog
 */
export { type DialogRef, type DialogState, DIALOG_REF } from './src/dialog/dialog-ref';
export { CngxDialog } from './src/dialog/dialog.directive';
export { CngxDialogTitle } from './src/dialog/dialog-title.directive';
export { CngxDialogDescription } from './src/dialog/dialog-description.directive';
export { CngxDialogClose } from './src/dialog/dialog-close.directive';
export { CngxDialogStack, provideDialogStack } from './src/dialog/dialog-stack';
export { CNGX_DIALOG_DATA, type CngxDialogConfig } from './src/dialog/dialog-config';
export { CngxDialogOpener, CngxDialogRef, provideDialog } from './src/dialog/dialog.service';
export { CngxBottomSheet } from './src/bottom-sheet/bottom-sheet.directive';
export { CngxDialogDraggable } from './src/draggable/dialog-draggable.directive';
