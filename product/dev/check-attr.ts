import { isPartnerSource } from '../../src/dossier/attribution.js';
for (const u of ['https://trengo.com/partner-terms-and-conditions','https://x.com/partners','https://x.com/partner-program','https://x.com/blog/x','https://x.com/pricing','https://x.com/partnership-agreement'])
  console.log(String(isPartnerSource(u)).padEnd(6), u);
