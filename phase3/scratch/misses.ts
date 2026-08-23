/**
 * Would a careful human researcher have recognised the partner motion from the same
 * public web? Read the actual partner pages of the four customers the classifier missed.
 */
import { get, mainContent } from '../../src/lib/http.js';
const TARGETS: [string, string[]][] = [
  ['ringover.com', ['/partner-program', '/become-a-partner', '/partners']],
  ['xelix.com', ['/partners', '/partner-enquiry']],
  ['zenity.io', ['/partners', '/partner-program']],
  ['payflip.be', ['/nl/partners', '/en/partners', '/en/partner-leads']],
];
for (const [domain, paths] of TARGETS) {
  console.log('='.repeat(70));
  console.log(domain);
  for (const p of paths) {
    const r = await get(`https://www.${domain}${p}`);
    if (!r.ok || !r.body) { console.log(`  ${p} -> ${r.status}`); continue; }
    const t = mainContent(r.body);
    console.log(`  --- ${p}  (${t.length} chars)`);
    console.log('  ' + t.slice(0, 700).replace(/\s+/g, ' '));
  }
}
