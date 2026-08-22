/**
 * Field test for the participant detector.
 * The suitability benchmark contains almost no channel participants by construction, so
 * the detector has never been exercised on real data. These companies are resellers,
 * MSPs and systems integrators — definitionally participants in other vendors' programmes.
 */
import { assessCompany } from '../../src/pipeline/assess.js';

const PARTICIPANTS = [
  'softcat.com', 'computacenter.com', 'bechtle.com', 'insight.com', 'crayon.com', 'sopra-steria.com',
];
for (const d of PARTICIPANTS) {
  try {
    const a = await assessCompany(d, { usePathProbing: false });
    const op = a.operator;
    console.log(
      d.padEnd(22),
      'chan=' + (a.classification?.commerciality ?? '-').padEnd(15),
      'dir=' + (op?.direction ?? '-').padEnd(22),
      'fit=' + (a.suitability?.state ?? '-').padEnd(18),
      'participatesIn=' + (op?.participatesIn.map((p) => p.owner).join('/') || 'none'),
    );
  } catch (e) { console.log(d, 'ERR', (e as Error).message); }
}
