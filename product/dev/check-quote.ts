import { snapToSentences } from '/Users/louisengelen/Introw-signal-radar/src/lib/http.js';
for (const q of [
  'evenue, and get support from our no-nonsense enablement and co-sell motions.',
  'gram Benefits Exclusive access to Aikido’s Partner Room for deal registration and tracking of commission fees',
  'Become a partner Enroll If you fit the partners we are looking for, we will be thrilled',
  'Our partners resell the platform. They earn margin on every deal closed.',
]) console.log(JSON.stringify(snapToSentences(q)));
