// Serves the examples app on every network interface so a phone on the same
// Wi-Fi can open it at http://<lan-ip>:4200. The dev server is then reachable
// by every device on that network, so the launcher says so before it starts
// and prints the addresses to open. Access by IP passes the dev server host
// check, no `allowedHosts` change needed.
//
// The warning is why this is a script and not a one-line package.json entry:
// JSON cannot carry it.
//
// Usage: npm run start:examples:lan

import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import { pathToFileURL } from 'node:url';

export const PORT = 4200;

// `interfaces` is the shape of `os.networkInterfaces()`. Returns the external
// IPv4 addresses, the ones a phone on the same network can reach.
export function listLanAddresses(interfaces) {
  const addresses = [];
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      const isIpv4 = entry.family === 'IPv4' || entry.family === 4;
      if (isIpv4 && !entry.internal) {
        addresses.push(entry.address);
      }
    }
  }
  return addresses;
}

function printBanner(addresses) {
  const lines = [
    '',
    'WARNING: the examples dev server listens on 0.0.0.0.',
    'Every device on this network can reach it while it runs. Use a trusted network only.',
    '',
  ];
  if (addresses.length === 0) {
    lines.push('No external IPv4 address found. Is this machine on a network?');
  } else {
    lines.push('Open on the phone (same Wi-Fi):');
    for (const address of addresses) {
      lines.push(`  http://${address}:${PORT}`);
    }
  }
  lines.push('');
  process.stdout.write(`${lines.join('\n')}\n`);
}

export function run() {
  printBanner(listLanAddresses(networkInterfaces()));
  const child = spawn('ng', ['serve', 'examples', '--port', String(PORT), '--host', '0.0.0.0'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  child.on('exit', (code, signal) => {
    process.exitCode = signal ? 1 : (code ?? 1);
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  run();
}
