/* The MCP limiter keeps no address and forgets counts older than a minute.
   npx tsx scripts/test/mcp_limiter.test.mts */
import { limitKey, limiterCheck, limiterState } from '../../lib/mcp';

let failed = 0;
const check = (name: string, ok: boolean, info: unknown = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : '  ' + JSON.stringify(info)}`);
  if (!ok) failed++;
};

const t0 = Date.UTC(2026, 10, 22, 12, 0, 0);
const ip = '203.0.113.7';

const key = await limitKey(ip, t0);
check('key holds no address', !key.includes(ip) && !key.includes('203') && /^mcp:[0-9a-f]{24}$/.test(key), key);
check('same address, same day → same key', key === (await limitKey(ip, t0 + 3_600_000)));
check('next day → another key', key !== (await limitKey(ip, t0 + 86_400_000)));

for (let i = 0; i < 60; i++) await limiterCheck(ip, t0 + i);
check('61st request in a minute is refused', (await limiterCheck(ip, t0 + 100)).ok === false);
check('one count held', limiterState(t0 + 200).entries === 1, limiterState(t0 + 200));

await limiterCheck('198.51.100.1', t0 + 30_000);
check('two addresses, two counts', limiterState(t0 + 30_000).entries === 2);

// 71 s later another client's request comes: the first address's minute is over → swept
await limiterCheck('192.0.2.9', t0 + 71_000);
const s = limiterState(t0 + 71_000);
check('counts older than a minute are swept at the next request', s.entries === 2 && s.oldestMs <= 60_000, s);
check('the first address may ask again', (await limiterCheck(ip, t0 + 71_001)).ok === true);

// 2 min of silence then one request: everything older than a minute goes
await limiterCheck('192.0.2.10', t0 + 200_000);
const s2 = limiterState(t0 + 200_000);
check('after silence only fresh counts remain', s2.entries === 1 && s2.oldestMs === 0, s2);

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
