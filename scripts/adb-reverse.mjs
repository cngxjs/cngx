// Forwards the examples app (4200) and the docs server (8080) from the dev
// machine to an Android phone over USB, so the phone opens them at
// http://localhost. Needs USB debugging enabled and the phone authorised.
//
// adb is resolved from $ANDROID_HOME/platform-tools, then the default macOS SDK
// location, then PATH.
//
// Exit codes: 0 forwarded, 1 adb missing, 2 no authorised device, 3 an adb
// command failed.
//
// Usage: npm run devices:android

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const PORTS = [4200, 8080];

// Returns the adb executable to run: the first SDK location `exists` accepts,
// else plain `adb` when `onPath` reports it on PATH, else null.
export function resolveAdbPath(env, home, exists, onPath = () => false) {
  const candidates = [];
  if (env.ANDROID_HOME) {
    candidates.push(join(env.ANDROID_HOME, 'platform-tools', 'adb'));
  }
  candidates.push(join(home, 'Library', 'Android', 'sdk', 'platform-tools', 'adb'));
  const found = candidates.find((candidate) => exists(candidate));
  if (found) {
    return found;
  }
  return onPath() ? 'adb' : null;
}

// Parses `adb devices` output into [{ serial, state }]. Only `device` is a
// usable state; `unauthorized` and `offline` are listed so the error can say
// what is wrong.
export function parseDevices(stdout) {
  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('List of devices') && !line.startsWith('*'))
    .map((line) => {
      const [serial, state = ''] = line.split(/\s+/);
      return { serial, state };
    });
}

function isAdbOnPath() {
  return spawnSync('adb', ['version'], { stdio: 'ignore' }).status === 0;
}

function fail(message, code) {
  process.stderr.write(`devices:android - ${message}\n`);
  return code;
}

export function run() {
  const adb = resolveAdbPath(process.env, homedir(), existsSync, isAdbOnPath);
  if (adb === null) {
    return fail('adb not found. Install the Android SDK platform-tools or set ANDROID_HOME.', 1);
  }

  const listed = spawnSync(adb, ['devices'], { encoding: 'utf8' });
  if (listed.status !== 0) {
    return fail(`\`adb devices\` failed:\n${listed.stderr}`, 3);
  }
  const devices = parseDevices(listed.stdout);
  const ready = devices.filter((device) => device.state === 'device');
  if (ready.length === 0) {
    const seen = devices.map((device) => `${device.serial} (${device.state})`).join(', ');
    const detail = seen === '' ? 'No device attached.' : `Not ready: ${seen}.`;
    return fail(
      `${detail} Connect the phone over USB, enable USB debugging and accept the authorisation prompt.`,
      2,
    );
  }

  for (const port of PORTS) {
    const reversed = spawnSync(adb, ['reverse', `tcp:${port}`, `tcp:${port}`], {
      encoding: 'utf8',
    });
    if (reversed.status !== 0) {
      return fail(`\`adb reverse tcp:${port}\` failed:\n${reversed.stderr}`, 3);
    }
  }

  process.stdout.write(
    [
      `Forwarded to ${ready.map((device) => device.serial).join(', ')}. Open on the phone:`,
      '  http://localhost:4200  examples (npm start)',
      '  http://localhost:8080  docs (npm run docs:serve)',
      '',
    ].join('\n'),
  );
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = run();
}
