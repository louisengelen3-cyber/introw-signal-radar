import { collectPositioning } from '/Users/louisengelen/Introw-signal-radar/src/evidence/positioning.js';
const DEV = (process.argv.slice(2).length ? process.argv.slice(2) : ['deloitte.com','bain.com','sequoiacap.com','accenture.com','kpmg.com','infosys.com']);
for (const d of DEV) {
  const p = await collectPositioning(d, 3);
  console.log('\n### ' + d + '  (items=' + p.items.length + ')');
  for (const i of p.items.slice(0, 4)) console.log('  [' + i.sourceType + '] ' + i.text.replace(/\s+/g, ' ').slice(0, 170));
}
