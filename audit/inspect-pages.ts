import { get, mainContent, stripTags } from '../src/lib/http.js';
for (const u of ['https://www.quatt.io/zakelijk/partner-programma', 'https://www.niko.eu/en/need-help/where-to-buy']) {
  const r = await get(u, { timeout: 25000, force: true });
  const text = r.body ? stripTags(mainContent(r.body)) : '';
  console.log(`\n${u}\n  status=${r.status} rawHtml=${r.body?.length ?? 0} extractedText=${text.length}`);
  console.log('  ' + (text.slice(0, 300).replace(/\s+/g, ' ') || '(empty — client-side rendered)'));
}
