const { spawn } = require('node:child_process');
const path = require('node:path');
const mode = process.argv[2] ?? 'all';
const env = { ...process.env };
const args = ['test'];
if (mode === 'prism') { env.TEST_ENV = 'prism'; args.push('--grep', '@contract'); }
else if (mode === 'pr') args.push('--grep', '@pr');
else if (mode === 'nightly') args.push('--grep', '@nightly|@release');
else if (mode === 'release') {
  env.TEST_ENV = 'staging'; env.RELEASE_GATE = '1'; args.push('--grep', '@release');
  if (!env.BASE_URL || env.APPROVED_POLICY !== 'qa-reference-v1' || !env.TRANSACTION_QUERY_PATH) {
    console.error('Release BLOCKED: require BASE_URL, explicit APPROVED_POLICY=qa-reference-v1, and an agreed TRANSACTION_QUERY_PATH.');
    process.exit(1);
  }
} else if (mode !== 'all') throw new Error(`Unknown suite: ${mode}`);
args.push(...process.argv.slice(3));
let server;
const kind = env.TEST_ENV ?? 'mock';
const port = Number(env.MOCK_PORT ?? (kind === 'prism' ? 4010 : 4011));
const endpoint = `http://127.0.0.1:${port}${kind === 'prism' ? '/accounts/1' : '/__qa/health'}`;
async function ready() {
  try { return (await fetch(endpoint, { signal: AbortSignal.timeout(1000) })).ok; } catch { return false; }
}
async function run() {
  if (kind !== 'staging' && env.MANAGE_MOCK !== '0') {
    if (await ready()) throw new Error(`Port ${port} already serves an API; use another MOCK_PORT rather than trusting an unknown process`);
    const serverArgs = kind === 'prism'
      ? [path.join(__dirname, '../node_modules/@stoplight/prism-cli/dist/index.js'), 'mock', path.join(__dirname, '../contract/transactions-service.v1.yaml'), '--host', '127.0.0.1', '--port', String(port)]
      : [path.join(__dirname, 'mock-server.cjs')];
    server = spawn(process.execPath, serverArgs, { env: { ...env, MOCK_PORT: String(port) }, stdio: ['ignore', 'ignore', 'pipe'] });
    let startupError;
    server.once('error', error => { startupError = error; });
    server.stderr.on('data', chunk => process.stderr.write(chunk));
    const deadline = Date.now() + 30000;
    while (!(await ready())) {
      if (startupError) throw startupError;
      if (server.exitCode !== null) throw new Error(`Mock exited during startup: ${server.exitCode}`);
      if (Date.now() > deadline) throw new Error('Mock readiness timed out');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    env.MANAGE_MOCK = '0';
  }
  const child = spawn(process.execPath, [path.join(__dirname, '../node_modules/@playwright/test/cli.js'), ...args], { stdio: 'inherit', env });
  process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)); });
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { if (server) server.kill(); });
