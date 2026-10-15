import { describe, expect, it } from 'vitest';

import { listLanAddresses } from '../serve-lan.mjs';

describe('serve-lan - listLanAddresses', () => {
  it('keeps external IPv4 addresses only', () => {
    const addresses = listLanAddresses({
      lo0: [
        { address: '127.0.0.1', family: 'IPv4', internal: true },
        { address: '::1', family: 'IPv6', internal: true },
      ],
      en0: [
        { address: 'fe80::1c2a:4bff:fe11:2233', family: 'IPv6', internal: false },
        { address: '192.168.1.23', family: 'IPv4', internal: false },
      ],
      en5: [{ address: '10.0.0.7', family: 'IPv4', internal: false }],
    });

    expect(addresses).toEqual(['192.168.1.23', '10.0.0.7']);
  });

  it('accepts the numeric family older Node versions report', () => {
    expect(
      listLanAddresses({ eth0: [{ address: '172.16.0.4', family: 4, internal: false }] }),
    ).toEqual(['172.16.0.4']);
  });

  it('returns an empty list when only loopback and IPv6 exist', () => {
    expect(
      listLanAddresses({
        lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
        en0: [{ address: '2001:db8::1', family: 'IPv6', internal: false }],
        utun0: undefined,
      }),
    ).toEqual([]);
  });
});
