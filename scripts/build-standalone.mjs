import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, 'browser/standalone.html');
const sources = ['world.js', 'render.js', 'input.js', 'app.js'];
const [html, css, ...modules] = await Promise.all([
  readFile(resolve(root, 'browser/index.html'), 'utf8'),
  readFile(resolve(root, 'browser/style.css'), 'utf8'),
  ...sources.map(name => readFile(resolve(root, 'browser/src', name), 'utf8'))
]);
// This dependency-free build has named declarations and one-line local imports.
// Fail on unsupported syntax rather than silently producing a broken bundle.
const code = modules.map(source => source.replace(/^import .+;\r?\n/gm, '').replace(/^export (?=(?:const|function|class)\b)/gm, '')).join('\n');
if (/^\s*(?:import|export)\b/m.test(code)) throw new Error('Unsupported module syntax in standalone build.');
new Script(code, { filename: 'nova-striker-standalone.js' });
const bundled = html
  .replace('<link rel="stylesheet" href="style.css">', () => '<style>\n' + css + '\n</style>')
  .replace('<script type="module" src="src/app.js"></script>', () => '<script>\n(() => {\n' + code.replace(/<\/script/gi, '<\\/script') + '\n})();\n</script>')
  .replace('href="./" aria-label="Nova Striker browser lab"', 'href="#" aria-label="Nova Striker browser lab"');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, bundled, 'utf8');
console.log('Standalone browser lab: ' + output);
