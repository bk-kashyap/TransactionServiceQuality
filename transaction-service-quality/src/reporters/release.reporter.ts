import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
export default class ReleaseReporter implements Reporter {
  private skipped = 0;
  onTestEnd(_test: TestCase, result: TestResult) { if (result.status === 'skipped') this.skipped++; }
  async onEnd(_result: FullResult) {
    if (process.env.RELEASE_GATE === '1' && this.skipped > 0) {
      console.error(`Release gate BLOCKED: ${this.skipped} skipped verification(s).`);
      return { status: 'failed' as const };
    }
  }
}
