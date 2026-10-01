import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const toolchain = spawnSync('pnpm', ['--version'], { encoding: 'utf8', timeout: 10 * 60 * 1000 });
if (toolchain.error) throw toolchain.error;
assert.equal(toolchain.status, 0);
assert.equal(toolchain.stdout.trim(), '8.15.9', 'Run via pnpm dlx --package=pnpm@8.15.9 pnpm test:package');
const scratch = await mkdtemp(join(tmpdir(), 'embed-consumer-'));
console.log('Consumer evidence:', scratch);
const baseline = process.argv.includes('--baseline');
const name = baseline ? '@evilkiwi/embed' : '@devlsh/embed';
const loggerName = baseline ? '@evilkiwi/logger' : '@devlsh/logger';
function run(command, args, cwd = scratch) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', timeout: 10 * 60 * 1000 });
  if (result.error?.code === 'ETIMEDOUT')
    throw new Error(`${command} ${args.join(' ')} exceeded the 10-minute subprocess limit. Re-run after resolving the stalled command.`);
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} ${args.join(' ')} failed`);
}
const suppliedTarball = process.argv.find(arg => arg.startsWith('--tarball='))?.slice('--tarball='.length);
if (!suppliedTarball) run('pnpm', ['pack', '--pack-destination', scratch], root);
const tarball =
  suppliedTarball ??
  join(
    scratch,
    (await readdir(scratch)).find(file => file.endsWith('.tgz')),
  );
const packed = spawnSync('tar', ['-xOf', tarball, 'package/package.json'], { encoding: 'utf8', timeout: 10 * 60 * 1000 });
assert.equal(packed.status, 0);
const manifest = JSON.parse(packed.stdout);
assert.equal(manifest.name, name, 'packed identity');
assert.equal(manifest.version, '1.3.0');
assert.equal(manifest.license, 'GPL-3.0-only');
assert.deepEqual(manifest.author, { name: 'Evil Kiwi Limited', url: 'https://evil.kiwi', email: 'support@evil.kiwi' });
assert.deepEqual(manifest.dependencies, { [loggerName]: '^1.1.0', nanoevents: '^8.0.0' });
assert.equal(manifest.devDependencies.vue, '^3.3.8');
assert.equal(manifest.main, './build/index.js');
assert.equal(manifest.module, './build/index.mjs');
assert.equal(manifest.types, './build/index.d.ts');
if (!baseline) {
  assert.deepEqual(manifest.peerDependencies, { vue: '^3.3.8' });
  assert.equal(manifest.homepage, 'https://github.com/devlsh/embed');
  assert.equal(manifest.bugs.url, 'https://github.com/devlsh/embed/issues');
  assert.equal(manifest.repository.url, 'git+https://github.com/devlsh/embed.git');
}
await writeFile(
  join(scratch, 'package.json'),
  JSON.stringify({
    private: true,
    type: 'module',
    dependencies: { [name]: `file:${tarball}`, vue: '3.3.8', typescript: '5.2.2', esbuild: '0.18.20' },
  }),
);
run('pnpm', ['install', '--ignore-scripts']);
const require = createRequire(join(scratch, 'package.json'));
const installed = dirname(require.resolve(`${name}/package.json`));
const packageRequire = createRequire(join(installed, 'package.json'));
assert.equal(JSON.parse(await readFile(packageRequire.resolve(`${loggerName}/package.json`), 'utf8')).version, '1.1.0');
assert.equal(JSON.parse(await readFile(packageRequire.resolve('nanoevents/package.json'), 'utf8')).version, '8.0.0');
assert.deepEqual(await readFile(join(installed, 'LICENSE')), await readFile(join(root, 'LICENSE')));
const cjs = require(name);
const esm = await import(pathToFileURL(join(installed, manifest.module)));
assert.equal(typeof cjs.useEmbed, 'function');
assert.equal(typeof esm.useEmbed, 'function');
assert.deepEqual(Object.keys(cjs).sort(), Object.keys(esm).sort());
console.log('PASS packed identity, dependency versions, license, native CJS/ESM on', process.version);
await writeFile(
  join(scratch, 'types.ts'),
  `import { useEmbed, type Context, type Frame, type Options, type PostObject, type Promises, type AsyncHandler, type Mode, type Type, type DefaultEventsMap } from '${name}';
import { ref } from 'vue';
type Logger = Context<DefaultEventsMap>['logger'];
const iframe: Frame = ref<HTMLIFrameElement>();
const options: Options = { id: 'typed', iframe, remote: 'https://example.com', timeout: 250, debug: true };
type Events = DefaultEventsMap & { value: (payload: { answer: number }) => void };
const context: Context<Events> = useEmbed<Events>('host', options);
const logger: Logger = context.logger;
logger.debug('debug', 1); logger.log('log'); logger.info('info'); logger.error('error');
logger.group('group', () => logger.info('inside'), true, undefined, { name: 'prefix', color: 'blue' });
logger.groupCollapsed('collapsed', () => logger.log('inside')); logger.groupEnd();
logger.setDisabled(true); const disabled: boolean = logger.disabled;
const child: Omit<Logger, 'useLogger'> = logger.useLogger(); child.group('child', undefined, false);
const off = context.events.on('value', payload => { const answer: number = payload.answer; void answer; }); off();
const handler: AsyncHandler<{ answer: number }> = async payload => payload.answer;
const remove: () => void = context.handle('answer', handler); remove();
const result: Promise<number> = context.send<number>('answer', { answer: 42 });
context.post('value', { answer: 42 }); context.destroy();
const mode: Mode = context.mode; const type: Type = 'value';
const post: PostObject = { id: 'typed', type, payload: {} }; const promises: Promises = {};
void disabled; void result; void mode; void post; void promises;
`,
);
run(process.execPath, [
  require.resolve('typescript/bin/tsc'),
  '--noEmit',
  '--strict',
  '--target',
  'ES2020',
  '--module',
  'ESNext',
  '--moduleResolution',
  'bundler',
  join(scratch, 'types.ts'),
]);
console.log('PASS complete installed declaration tree and legacy Logger signatures');

const servers = [];
let deadline;
let finished = false;
function finish(code) {
  if (finished) return;
  finished = true;
  clearTimeout(deadline);
  process.exitCode = code;
  for (const server of servers) server.close();
}
const expectedTests = 10;
async function serve(request, response) {
  try {
    if (request.url === '/result' && request.method === 'POST') {
      let body = '';
      for await (const chunk of request) body += chunk;
      const results = JSON.parse(body);
      assert.ok(
        Array.isArray(results) &&
          results.length === expectedTests &&
          results.every(
            result => typeof result.name === 'string' && typeof result.ok === 'boolean' && (result.ok || typeof result.error === 'string'),
          ),
      );
      await writeFile(join(scratch, 'browser-results.json'), JSON.stringify(results, null, 2));
      console.log(JSON.stringify(results, null, 2));
      response.end('Recorded');
      finish(results.every(result => result.ok) ? 0 : 1);
    } else if (request.url === '/fixture.js') {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(await readFile(join(scratch, 'fixture.js')));
    } else {
      response.setHeader('Content-Type', 'text/html');
      response.end('<div id="app"></div><pre id="result">Running</pre><script type="module" src="/fixture.js"></script>');
    }
  } catch (error) {
    console.error(error);
    response.statusCode = 500;
    response.end('Verification failed');
    finish(1);
  }
}
for (let i = 0; i < 3; i++) {
  const server = createServer(serve);
  servers.push(server);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
}
const [hostOrigin, clientOrigin, otherOrigin] = servers.map(server => `http://127.0.0.1:${server.address().port}`);
await writeFile(
  join(scratch, 'fixture.mjs'),
  `import { createApp, h, ref, nextTick } from 'vue';
import { useEmbed } from '${name}/build/index.mjs';
const hostOrigin = ${JSON.stringify(hostOrigin)}, clientOrigin = ${JSON.stringify(clientOrigin)}, otherOrigin = ${JSON.stringify(
    otherOrigin,
  )};
const check = (condition, message) => { if (!condition) throw new Error(message); };
const pause = () => new Promise(resolve => setTimeout(resolve, 50));
if (location.origin === otherOrigin || location.search === '?source-check') {
  window.parent.postMessage({ id: 'protocol', type: 'filtered', payload: 'filtered boundary' }, hostOrigin);
  window.parent.postMessage({ fixture: 'other-ready' }, hostOrigin);
} else if (location.origin === clientOrigin) {
  createApp({ setup() {
    const client = useEmbed('client', { id: 'protocol', remote: hostOrigin, timeout: 250 });
    const debug = useEmbed('client', { id: 'debug', remote: hostOrigin, debug: true });
    client.handle('echo', async payload => payload);
    client.handle('reverse', async payload => await client.send('from-client', payload));
    client.handle('sync', async payload => { client.post('value', payload); return true; });
    client.handle('error', async () => { throw new Error('remote failed'); });
    client.handle('sync-error', async () => { client.post('failure', new Error('sync failed')); return true; });
    client.handle('never', async () => await new Promise(() => {}));
    client.handle('removed', async () => 'registered')();
    client.handle('logger', async () => {
      let groups = 0;
      client.logger.debug('default-disabled logger');
      client.logger.group('default-disabled group', () => { groups++; });
      check(groups === 0, 'default logger enabled');
      debug.logger.log('legacy log'); debug.logger.info('legacy info'); debug.logger.error('legacy error'); debug.logger.debug('legacy debug');
      debug.logger.group('legacy group', () => debug.logger.info('inside'), true, 'info', { name: 'prefix' });
      debug.logger.groupCollapsed('legacy collapsed', () => debug.logger.log('inside')); debug.logger.groupEnd();
      const child = debug.logger.useLogger(); child.group('useLogger group', () => { groups++; });
      check(groups === 1, 'debug group callback or useLogger contract lost');
      debug.logger.setDisabled(true); child.group('disabled child', () => { groups++; });
      check(groups === 1, 'setDisabled failed to suppress groups');
      return true;
    });
    return () => h('p', 'Client mounted');
  } }).mount('#app');
} else {
  const results = [];
  async function test(name, run) { try { await run(); results.push({ name, ok: true }); } catch (error) { results.push({ name, ok: false, error: error.message }); } }
  let host, debug, frame;
  let loaded;
  const ready = new Promise(resolve => { loaded = resolve; });
  const app = createApp({ setup() {
    frame = ref();
    host = useEmbed('host', { id: 'protocol', iframe: frame, remote: clientOrigin, timeout: 250 });
    debug = useEmbed('host', { id: 'debug', iframe: frame, remote: clientOrigin, debug: true });
    host.events.on('_ek-loaded', loaded);
    host.handle('from-client', async payload => ({ reversed: payload }));
    return () => h('iframe', { ref: frame, src: clientOrigin });
  } });
  app.mount('#app'); await nextTick();
  await test('real Vue iframe ref and _ek-loaded handshake', async () => { await ready; check(frame.value instanceof HTMLIFrameElement, 'missing Vue iframe ref'); check(await host.send('echo', 'ready') === 'ready', 'handshake target failed'); });
  await test('sync events and nanoevents unsubscribe', async () => {
    let count = 0; const off = host.events.on('value', payload => { check(payload.answer === 42, 'payload changed'); count++; });
    await host.send('sync', { answer: 42 }); check(count === 1, 'sync event missing'); off();
    await host.send('sync', { answer: 42 }); check(count === 1, 'unsubscribe failed');
  });
  await test('bidirectional request-response', async () => { const value = await host.send('reverse', { answer: 42 }); check(value.reversed.answer === 42, 'reverse response failed'); });
  await test('encoded async and sync errors', async () => {
    let failure; try { await host.send('error'); } catch (error) { failure = error; }
    check(failure instanceof Error && failure.message === 'remote failed', 'async error not decoded');
    let event; const off = host.events.on('failure', error => { event = error; });
    await host.send('sync-error'); off(); check(event instanceof Error && event.message === 'sync failed', 'sync error not decoded');
  });
  await test('configured timeout', async () => { let failure; try { await host.send('never'); } catch (error) { failure = error; } check(failure instanceof Error && failure.message === 'Timed out', 'timeout missing'); });
  await test('handler removal', async () => { let failure; try { await host.send('removed'); } catch (error) { failure = error; } check(failure?.message === 'no handler for event "removed"', 'removed handler remained'); });
  await test('legacy Logger debug, group and useLogger behavior', async () => {
    let groups = 0; host.logger.group('disabled host', () => { groups++; });
    debug.logger.group('enabled host', () => { groups++; }); check(groups === 1, 'host logging default changed');
    check(await host.send('logger') === true, 'client legacy logger failed');
  });
  await test('remote origin and host iframe source filtering', async () => {
    let count = 0; const off = host.events.on('filtered', () => { count++; });
    const other = document.createElement('iframe');
    const notice = (node, origin, load) => new Promise(resolve => {
      const listener = event => { if (event.origin === origin && event.source === node.contentWindow && event.data?.fixture === 'other-ready') { window.removeEventListener('message', listener); resolve(); } };
      window.addEventListener('message', listener); load();
    });
    await notice(other, clientOrigin, () => { other.src = clientOrigin + '/?source-check'; document.body.append(other); });
    await pause(); other.remove(); check(count === 0, 'same-origin wrong-source message delivered');
    await notice(frame.value, otherOrigin, () => { frame.value.src = otherOrigin; });
    await pause(); check(count === 0, 'same-frame wrong-origin message delivered');
    await new Promise(resolve => { const loadedOff = host.events.on('_ek-loaded', () => { loadedOff(); resolve(); }); frame.value.src = clientOrigin; });
    check(await host.send('echo', 'restored') === 'restored', 'allowed origin did not reconnect'); off();
  });
  await test('JSON serialization boundary', async () => {
    const circular = {}; circular.self = circular; let failure;
    try { host.post('circular', circular); } catch (error) { failure = error; }
    check(failure?.message === 'Message cannot be serialized to JSON', 'circular payload accepted');
    check(await host.send('echo', false) === false, 'false payload changed');
  });
  await test('destroy removes listeners and ignores later iframe messages', async () => {
    let count = 0; host.events.on('value', () => { count++; });
    await host.send('sync', { answer: 42 }); check(count === 1, 'pre-destroy message missing');
    host.destroy(); debug.destroy();
    host.post('_async', { id: 9999999, type: 'sync', message: { answer: 42 } });
    await pause(); check(count === 1, 'post-destroy event delivered'); app.unmount();
  });
  document.getElementById('result').textContent = JSON.stringify(results, null, 2);
  await fetch('/result', { method: 'POST', body: JSON.stringify(results) });
}
`,
);
const { build } = require('esbuild');
try {
  await build({
    entryPoints: [join(scratch, 'fixture.mjs')],
    outfile: join(scratch, 'fixture.js'),
    bundle: true,
    format: 'esm',
    target: 'es2022',
  });
  deadline = setTimeout(
    () => {
      console.error('Browser verification limit: 10 minutes elapsed without results. Re-run and open the printed loopback URL.');
      finish(1);
    },
    10 * 60 * 1000,
  );
  console.log(`BROWSER REQUIRED: ${hostOrigin}/; evidence: ${scratch}`);
} catch (error) {
  finish(1);
  throw error;
}
