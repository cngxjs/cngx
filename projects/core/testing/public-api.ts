/**
 * @module @cngx/core/testing
 */
export {
  createAnnouncementCapture,
  type CngxAnnouncementCapture,
  type CngxAnnouncementCaptureOptions,
} from './announcement-capture';
export {
  createAsyncStateMock,
  type CngxAsyncStateMock,
  type CngxAsyncStateMockPatch,
} from './async-state-mock';
export { provideCngxTesting } from './provide-testing';
export {
  injectTransitionLog,
  type CngxTransitionLog,
  type CngxTransitionLogOptions,
} from './transition-log';
