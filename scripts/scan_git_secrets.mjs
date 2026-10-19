import { execSync } from "node:child_process";

console.log("=== THINAI GIT HISTORY SECRET SCAN ===");

const commitsRaw = execSync("git rev-list --all", { encoding: "utf-8" }).trim().split("\n");
console.log(`Total commits in history: ${commitsRaw.length}`);

const secretPatterns = [
  { name: "Keystore Password", regex: /(storePassword|keyPassword)\s*["'=:\s]+([^\s"']+)/gi },
  { name: "Private Key Header", regex: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi },
  { name: "Firebase API Key in Config", regex: /apiKey:\s*["']AIza[0-9A-Za-z-_]{35}["']/gi },
  { name: "Keystore Binary File", regex: /diff --git a\/(.+\.(jks|keystore))/gi }
];

const findings = [];

for (const commit of commitsRaw) {
  try {
    const show = execSync(`git show --format="Commit: %h | %s | %an" ${commit}`, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });
    const header = show.split("\n")[0];
    for (const pat of secretPatterns) {
      let match;
      while ((match = pat.regex.exec(show)) !== null) {
        findings.push({
          commit: commit.substring(0, 7),
          header,
          pattern: pat.name,
          redactedMatch: match[0].replace(/([a-zA-Z0-9_-]{4})[a-zA-Z0-9_-]{4,}/g, "$1[REDACTED]")
        });
      }
    }
  } catch (err) {
    // ignore binary errors
  }
}

console.log(`\nScan finished. Total findings: ${findings.length}\n`);
for (const f of findings) {
  console.log(`- Commit: ${f.commit} (${f.header})`);
  console.log(`  Type: ${f.pattern}`);
  console.log(`  Match: ${f.redactedMatch}`);
}
