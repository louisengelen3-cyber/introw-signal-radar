import { get, mainContent, stripTags } from '../../src/lib/http.js';
const PATHS = ['/partners','/partner','/partner-program','/partners/','/en/partners','/partner-programme','/resellers','/agencies','/partnerships','/become-a-partner','/partner-network','/integrations/partners'];
for (const d of process.argv.slice(2)) {
  const found: string[] = [];
  for (const p of PATHS) {
    const r = await get(`https://www.${d}${p}`);
    if (r.ok && r.body && r.body.length > 2000) {
      const t = stripTags(mainContent(r.body));
      if (/\bpartner/i.test(t)) found.push(`${p} (${r.status}, ${t.length}ch)`);
    }
  }
  console.log(`${d.padEnd(20)} ${found.length ? found.join(' | ') : 'NO PARTNER PAGE FOUND'}`);
}
