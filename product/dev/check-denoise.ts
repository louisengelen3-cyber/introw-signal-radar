import { denoise } from '../../src/lib/http.js';
const cases: [string, string][] = [
  ['prose kept', 'Together We Reinvented .sr-only, .herotext { position: absolute; width: 1px; } more copy'],
  ['nested selector', 'Hello world div.wrap > a:hover { color: red } tail'],
  ['media-ish', 'Intro text @media (max-width: 600px) { .a { color: red } } end'],
  ['svg soup', 'Datadog Technology Partner Program Guide width="18px" viewBox="0 0 25 23" style="height: calc(18px +'],
];
for (const [name, input] of cases) console.log(name.padEnd(16), JSON.stringify(denoise(input)));
const t0 = Date.now(); denoise('a, '.repeat(24000) + '{color:red}');
console.log('24k selector run:', Date.now() - t0, 'ms');
