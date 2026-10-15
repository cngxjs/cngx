import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { parseDevices, resolveAdbPath } from '../adb-reverse.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = join(ROOT, 'scripts', 'adb-reverse.mjs');

const SDK_ADB = join('/sdk', 'platform-tools', 'adb');
const MAC_ADB = join('/home/me', 'Library', 'Android', 'sdk', 'platform-tools', 'adb');

describe('adb-reverse - resolveAdbPath', () => {
  it('prefers ANDROID_HOME over the default SDK location', () => {
    const exists = (path) => path === SDK_ADB || path === MAC_ADB;

    expect(resolveAdbPath({ ANDROID_HOME: '/sdk' }, '/home/me', exists)).toBe(SDK_ADB);
  });

  it('falls back to the default macOS SDK location', () => {
    const exists = (path) => path === MAC_ADB;

    expect(resolveAdbPath({ ANDROID_HOME: '/sdk' }, '/home/me', exists)).toBe(MAC_ADB);
    expect(resolveAdbPath({}, '/home/me', exists)).toBe(MAC_ADB);
  });

  it('falls back to PATH when no SDK location has adb', () => {
    expect(
      resolveAdbPath(
        {},
        '/home/me',
        () => false,
        () => true,
      ),
    ).toBe('adb');
  });

  it('returns null when adb is nowhere', () => {
    expect(
      resolveAdbPath(
        { ANDROID_HOME: '/sdk' },
        '/home/me',
        () => false,
        () => false,
      ),
    ).toBe(null);
  });
});

describe('adb-reverse - parseDevices', () => {
  it('parses serial and state, skipping the header and daemon lines', () => {
    const stdout = [
      '* daemon not running; starting now at tcp:5037',
      '* daemon started successfully',
      'List of devices attached',
      'R58N12ABCDE\tdevice',
      'emulator-5554\tunauthorized',
      '',
    ].join('\n');

    expect(parseDevices(stdout)).toEqual([
      { serial: 'R58N12ABCDE', state: 'device' },
      { serial: 'emulator-5554', state: 'unauthorized' },
    ]);
  });

  it('returns an empty list when nothing is attached', () => {
    expect(parseDevices('List of devices attached\n\n')).toEqual([]);
  });
});

// A fake adb on ANDROID_HOME whose `adb devices` prints the given output.
function fakeSdk(devicesOutput) {
  const sdk = mkdtempSync(join(tmpdir(), 'adb-reverse-'));
  const bin = join(sdk, 'platform-tools');
  mkdirSync(bin);
  const adb = join(bin, 'adb');
  writeFileSync(
    adb,
    `#!/bin/sh\nif [ "$1" = "devices" ]; then printf '%s' '${devicesOutput}'; fi\nexit 0\n`,
  );
  chmodSync(adb, 0o755);
  return sdk;
}

function check(env) {
  return spawnSync(process.execPath, [SCRIPT], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { PATH: '/nonexistent', HOME: tmpdir(), ...env },
  });
}

describe.skipIf(process.platform === 'win32')('adb-reverse - run', () => {
  it('fails with exit 1 when adb is missing', () => {
    const result = check({ ANDROID_HOME: join(tmpdir(), 'no-sdk-here') });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('adb not found');
  });

  it('fails with exit 2 when no device is attached', () => {
    const result = check({ ANDROID_HOME: fakeSdk('List of devices attached\n\n') });

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('No device attached');
  });

  it('fails with exit 2 and names the state when the device is unauthorized', () => {
    const result = check({
      ANDROID_HOME: fakeSdk('List of devices attached\nR58N12ABCDE\tunauthorized\n'),
    });

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('R58N12ABCDE (unauthorized)');
  });

  it('forwards both ports and prints the urls for an authorised device', () => {
    const result = check({
      ANDROID_HOME: fakeSdk('List of devices attached\nR58N12ABCDE\tdevice\n'),
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('http://localhost:4200');
    expect(result.stdout).toContain('http://localhost:8080');
  });
});
