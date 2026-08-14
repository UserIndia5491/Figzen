const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = process.cwd();
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

execFileSync('tsc', ['--target', 'ES2020', '--module', 'ES2020', '--moduleResolution', 'Node', '--strict', '--skipLibCheck', '--outDir', dist, 'src/code.ts', 'src/exporter.ts', 'src/figma.d.ts'], { stdio: 'inherit', cwd: root });
fs.copyFileSync(path.join(root, 'src/ui.html'), path.join(dist, 'ui.html'));
fs.copyFileSync(path.join(root, 'manifest.json'), path.join(dist, 'manifest.json'));

// Figma accepts a JS entry without external modules. Convert the emitted ES modules to one script by using
// a tiny in-house concatenation wrapper: exporter first, then code with its import removed.
const exporter = fs.readFileSync(path.join(dist, 'exporter.js'), 'utf8').replace(/^export /gm, '');
const code = fs.readFileSync(path.join(dist, 'code.js'), 'utf8').replace(/^import .* from ['"]\.\/exporter['"];?\s*$/m, '');
fs.writeFileSync(path.join(dist, 'code.js'), `${exporter}\n${code}`);
fs.rmSync(path.join(dist, 'exporter.js'));

execFileSync('zip', ['-qr', path.join(root, 'figzen-plugin.zip'), '.'], { cwd: dist, stdio: 'inherit' });
console.log('Built dist/ and figzen-plugin.zip');
