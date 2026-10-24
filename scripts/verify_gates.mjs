import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Expected 10 standard gates
const GATES = [
  'G1', 'G2', 'G3', 'G4', 'G5',
  'G6', 'G7', 'G8', 'G9', 'G10'
];

function getTargetSha() {
  const args = process.argv.slice(2);
  const shaIdx = args.indexOf('--sha');
  if (shaIdx !== -1 && args[shaIdx + 1]) {
    return args[shaIdx + 1].trim();
  }
  try {
    return execSync('git rev-parse HEAD', { cwd: rootDir }).toString().trim();
  } catch (e) {
    return null;
  }
}

function verifyGates() {
  const targetSha = getTargetSha();
  const evidenceDir = path.join(rootDir, 'evidence');
  const failingGates = [];
  const results = {};

  for (const gate of GATES) {
    const filePath = path.join(evidenceDir, `${gate}.json`);
    if (!fs.existsSync(filePath)) {
      failingGates.push(gate);
      results[gate] = { status: 'FAIL', reason: 'evidence file missing' };
      continue;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);

      // Verify SHA match
      const shaMatch = targetSha && (data.sha === targetSha || targetSha.startsWith(data.sha) || data.sha.startsWith(targetSha));
      if (!shaMatch) {
        failingGates.push(gate);
        results[gate] = { status: 'FAIL', reason: `stale SHA (expected ${targetSha?.slice(0, 7)}, got ${data.sha?.slice(0, 7)})` };
        continue;
      }

      // Verify PASS result
      if (data.result !== 'PASS') {
        failingGates.push(gate);
        results[gate] = { status: 'FAIL', reason: `result is ${data.result}` };
        continue;
      }

      results[gate] = { status: 'PASS', metrics: data.metrics };
    } catch (err) {
      failingGates.push(gate);
      results[gate] = { status: 'FAIL', reason: `invalid JSON: ${err.message}` };
    }
  }

  const isDetails = process.argv.includes('--details');

  if (failingGates.length > 0) {
    if (isDetails) {
      console.log(JSON.stringify({ targetSha, failingGates, results }, null, 2));
    }
    console.log(`THINAI IS NOT READY - failing gates: ${failingGates.join(', ')}.`);
    process.exit(1);
  } else {
    if (isDetails) {
      console.log(JSON.stringify({ targetSha, results }, null, 2));
    }
    console.log(`THINAI IS READY TO USE - tested at commit ${targetSha.slice(0, 7)}, all gates G1-G10 pass with evidence; known limitations are listed in THINAI_FINAL_REPORT.md.`);
    process.exit(0);
  }
}

verifyGates();
