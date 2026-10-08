import { defineConfig } from '@playwright/test';
import { environment } from './src/config/environment';
export default defineConfig({
  testDir: './tests', fullyParallel: true, forbidOnly: !!process.env.CI,
  retries: 0, workers: process.env.CI ? 4 : undefined, timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/report.json' }], ['./src/reporters/release.reporter.ts']],
  use: {
    baseURL: environment.baseURL,
    extraHTTPHeaders: { Accept: 'application/json', ...(process.env.API_TOKEN ? { Authorization: `Bearer ${process.env.API_TOKEN}` } : {}) },
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'api' }],
  webServer: environment.mode === 'staging' || process.env.MANAGE_MOCK === '0' ? undefined : {
    command: environment.mode === 'prism'
      ? `node node_modules/@stoplight/prism-cli/dist/index.js mock contract/transactions-service.v1.yaml --host 127.0.0.1 --port ${environment.port}`
      : 'node scripts/mock-server.cjs',
    url: environment.mode === 'prism' ? `${environment.baseURL}/accounts/1` : `${environment.baseURL}/__qa/health`,
    reuseExistingServer: false, timeout: 30_000, env: { MOCK_PORT: String(environment.port) },
  },
});
