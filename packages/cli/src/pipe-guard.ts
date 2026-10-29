// `cngx list | head -1` closes the read end early; the next write fails with
// EPIPE, and an unhandled stream 'error' would crash with a stack trace. The
// guard swallows exactly that case. Any other stream error (ENOSPC, EIO) is a
// real I/O failure: one `cngx: internal error:` line and exit 3, like every
// other throw nobody expected, never a stack trace.

/** The part of a writable stream the guard needs. */
export interface ErrorEmitter {
  on(event: 'error', listener: (error: NodeJS.ErrnoException) => void): unknown;
}

/** Where the guard reports; injected so the unit spec needs no `process`. */
export interface PipeGuardDeps {
  stderr: (text: string) => void;
  setExitCode: (code: number) => void;
}

/** True for the error a closed downstream pipe produces. */
export function isClosedPipe(error: NodeJS.ErrnoException): boolean {
  return error.code === 'EPIPE';
}

/** Swallow EPIPE on `stream`; report the first other error it emits and set exit 3. */
export function installPipeGuard(stream: ErrorEmitter, deps: PipeGuardDeps): void {
  let reported = false;
  stream.on('error', (error) => {
    if (isClosedPipe(error) || reported) {
      return;
    }
    reported = true;
    deps.setExitCode(3);
    // stderr may be the stream that failed; losing the line must not lose the exit code.
    try {
      deps.stderr(`cngx: internal error: ${error.message}\n`);
    } catch {
      // nothing left to report to
    }
  });
}
