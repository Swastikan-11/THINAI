import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const EVIDENCE_DIR = path.resolve('evidence');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function fetchWithAudit(label, url, options = {}) {
  const start = Date.now();
  console.log(`\nAuditing [${label}] -> ${url}`);
  try {
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
    const latencyMs = Date.now() - start;
    const contentType = res.headers.get('content-type') || '';
    let bodyText = '';
    let bodyJson = null;

    if (contentType.includes('application/json')) {
      bodyJson = await res.json();
      bodyText = JSON.stringify(bodyJson, null, 2);
    } else {
      bodyText = await res.text();
    }

    const payloadBytes = Buffer.byteLength(bodyText, 'utf8');
    const result = {
      label,
      url: url.replace(/key=[^&]+/g, 'key=[REDACTED]').replace(/api-key=[^&]+/g, 'api-key=[REDACTED]'),
      status: res.status,
      statusText: res.statusText,
      latencyMs,
      payloadBytes,
      headers: Object.fromEntries(res.headers.entries()),
      bodySnippet: bodyText.slice(0, 1000),
      isOk: res.ok
    };

    const outPath = path.join(EVIDENCE_DIR, `${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`  Status: ${res.status} | Latency: ${latencyMs}ms | Size: ${payloadBytes} bytes -> Saved to ${path.basename(outPath)}`);
    return result;
  } catch (err) {
    const latencyMs = Date.now() - start;
    const result = {
      label,
      url: url.replace(/key=[^&]+/g, 'key=[REDACTED]').replace(/api-key=[^&]+/g, 'api-key=[REDACTED]'),
      status: 'NETWORK_ERROR',
      error: err.message,
      latencyMs,
      isOk: false
    };
    const outPath = path.join(EVIDENCE_DIR, `${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`  ERROR: ${err.message} (${latencyMs}ms) -> Saved to ${path.basename(outPath)}`);
    return result;
  }
}

async function runAudit() {
  console.log('====================================================');
  console.log('🔍 THINAI LIVE DATA INTEGRITY & NETWORK AUDIT PASS');
  console.log('====================================================');

  const results = [];

  // 1. Open-Meteo Coimbatore coordinates
  results.push(await fetchWithAudit(
    'Open_Meteo_Coimbatore_Live',
    'https://api.open-meteo.com/v1/forecast?latitude=11.0168&longitude=76.9558&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&hourly=precipitation_probability&daily=precipitation_sum&timezone=auto'
  ));

  // 2. Agmarknet / data.gov.in (Unauthenticated to audit fallback behavior)
  results.push(await fetchWithAudit(
    'Agmarknet_DataGovIn_Mandi',
    'https://api.data.gov.in/resource/9ef84268-d588-436a-a309-c80ca147ff22?format=json&filters[state]=Tamil+Nadu&limit=10'
  ));

  // 3. Government Scheme Portals
  results.push(await fetchWithAudit('PM_KISAN_Portal', 'https://pmkisan.gov.in'));
  results.push(await fetchWithAudit('PMFBY_Crop_Insurance', 'https://pmfby.gov.in'));
  results.push(await fetchWithAudit('TNAU_Agritech_Portal', 'https://agritech.tnau.ac.in'));
  results.push(await fetchWithAudit('Tamil_Nadu_WRD_Water_Resources', 'https://wrd.tn.gov.in'));

  // 4. AgriCoop MSP Benchmark
  results.push(await fetchWithAudit('AgriCoop_Gov_In', 'https://agricoop.nic.in'));

  // Save audit master summary
  const summaryPath = path.join(EVIDENCE_DIR, 'live_data_audit_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nAudit finished. Master summary saved to: ${summaryPath}`);
}

runAudit();
