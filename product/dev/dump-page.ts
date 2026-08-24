import { get, mainContent, stripTags } from '../../src/lib/http.js';
const r = await get(process.argv[2]);
const t = stripTags(mainContent(r.body ?? ''));
console.log('len', t.length);
console.log(t.slice(0, 1600));
