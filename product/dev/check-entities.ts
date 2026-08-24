import { collectPositioning } from '../../src/evidence/positioning.js';
const p = await collectPositioning('glovoapp.com', 2);
for (const i of p.items.slice(0, 3)) console.log(`[${i.sourceType}] ${i.text.slice(0, 120)}`);
