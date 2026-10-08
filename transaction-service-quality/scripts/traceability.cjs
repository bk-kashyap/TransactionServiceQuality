const fs = require('node:fs');
const path = require('node:path');
const report = JSON.parse(fs.readFileSync(path.join(__dirname, '../test-results/report.json'), 'utf8'));
const rows = [];
function walk(suites) {
  for (const suite of suites) {
    for (const spec of suite.specs ?? []) for (const test of spec.tests) {
      const metadata = Object.fromEntries((test.annotations ?? []).map(a => [a.type, a.description]));
      for (const key of ['case', 'oracle', 'risk', 'defect', 'gate']) if (!metadata[key]) throw new Error(`Missing ${key}: ${spec.title}`);
      rows.push({ ...metadata, file: spec.file.replaceAll('\\', '/'), line: spec.line, status: test.results.at(-1)?.status });
    }
    walk(suite.suites ?? []);
  }
}
walk(report.suites);
if (!rows.some(row => row.case === 'T1-COUNT') || !rows.some(row => row.case === 'T3-JOURNEY')) throw new Error('Run the FULL suite before generating submission traceability');
if (new Set(rows.map(row => row.case)).size !== rows.length) throw new Error('Duplicate case IDs');
const cell = value => String(value).replaceAll('|', '/').replaceAll('\n', ' ');
let text = '# Executed case traceability\n\nGenerated from a full run with `npm run traceability`. Status describes that environment only. Mock passes do not retire real-service risk.\n\n';
text += `Environment: ${rows[0].environment}; cases: ${rows.length}; run: ${report.stats.startTime}.\n\n`;
text += '| Case | C1 risk | Defect caught | Oracle | CI gate | Source | Last result |\n|---|---|---|---|---|---|---|\n';
for (const row of rows.sort((a, b) => a.case.localeCompare(b.case))) text += `| ${[row.case, row.risk, row.defect, row.oracle, row.gate, row.file + ':' + row.line, row.status].map(cell).join(' | ')} |\n`;
fs.writeFileSync(path.join(__dirname, '../docs/TRACEABILITY.md'), text);
fs.mkdirSync(path.join(__dirname, '../docs/evidence'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../docs/evidence/mock-run.json'), JSON.stringify({ stats: report.stats,
  meaning: 'Synthetic reference mock execution; not provider correctness or release evidence', cases: rows }, null, 2) + '\n');
console.log(`Generated traceability for ${rows.length} cases.`);
