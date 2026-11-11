import {mkdir, readdir, readFile, writeFile} from 'node:fs/promises';

const assets = {};
for (const filename of await readdir('public')) {
  assets[filename] = (await readFile('public/' + filename)).toString('base64');
}
await mkdir('dist/server', {recursive: true});
await writeFile('dist/server/index.js',
  'const assets = ' + JSON.stringify(assets) + ';\n' + await readFile('worker/index.js', 'utf8'));
