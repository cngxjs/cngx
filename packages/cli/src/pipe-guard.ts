// `cngx list | head -1` closes the read end early; the next write fails with
// EPIPE, and an unhandled stream 'error' would crash with a stack trace. The
// guard swallows exactly that case and rethrows every other stream error, so a
// real I/O failure still surfaces. The exit code is never touched.

/** The part of a writable stream the guard needs. */
export interface ErrorEmitter {
  on(event: 'error', listener: (error: NodeJS.ErrnoException) => void): unknown;
}

/** True for the error a closed downstream pipe produces. */
export function isClosedPipe(error: NodeJS.ErrnoException): boolean {
  return error.code === 'EPIPE';
}

/** Swallow EPIPE on `stream`; rethrow any other error it emits. */
export function installPipeGuard(stream: ErrorEmitter): void {
  stream.on('error', (error) => {
    if (isClosedPipe(error)) {
      return;
    }
    throw error;
  });
}
