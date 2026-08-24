import { get } from '../../src/lib/http.js';
const ATS = /(boards|job-boards)\.greenhouse\.io|jobs\.(eu\.)?lever\.co|jobs\.ashbyhq\.com|smartrecruiters\.com|recruitee\.com|apply\.workable\.com|jobs\.personio\.|teamtailor\.com|join\.com|homerun\.co|workday|successfactors|jobvite|bamboohr|breezy\.hr|jazzhr|pinpointhq|welcometothejungle|otys|hr\.nl/i;
for (const d of process.argv.slice(2)) {
  const found: string[] = [];
  for (const p of ['/careers', '/jobs', '/en/careers', '/company/careers', '/about/careers', '/vacatures', '/careers/open-positions', '/werken-bij']) {
    const r = await get(`https://www.${d}${p}`);
    if (!r.ok || !r.body) continue;
    const m = r.body.match(ATS);
    if (m) found.push(`${p} -> ${m[0]}`);
  }
  console.log(`${d.padEnd(20)} ${found.length ? found.join(' | ') : 'no ATS link on any careers path'}`);
}
