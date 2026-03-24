export { CngxInput } from './input.directive';
export { CngxPasswordToggle } from './password-toggle.directive';
export { CngxCharCount, type CngxCharCountContext } from './char-count.component';
export { CngxInputMask, type MaskTokenDef, type MaskTokenMap } from './input-mask.directive';
export { CngxNumericInput } from './numeric-input.directive';
export { CngxAutosize } from './autosize.directive';
export { CngxInputClear } from './input-clear.directive';
export { CngxCopyValue } from './copy-value.directive';
export { CngxOtpInput, CngxOtpSlot } from './otp-input.directive';
export { CngxInputFormat, type FormatFn, type ParseFn } from './input-format.directive';
export { CngxFileDrop, type FileRejection } from './file-drop.directive';
export {
  CNGX_INPUT_CONFIG,
  type InputConfig,
  type InputConfigFeature,
  provideInputConfig,
  withPhonePatterns,
  withIbanPatterns,
  withZipPatterns,
  withDateFormats,
  withMaskPlaceholder,
  withMaskGuide,
  withCustomTokens,
  withNumericDefaults,
  withCopyResetDelay,
  withFileMaxSize,
} from './input-config';
