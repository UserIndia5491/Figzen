const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = process.cwd();
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

// Compile every TypeScript source under src/ to ES modules in dist/.
const sources = [];
function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(full);
    else if (entry.name.endsWith('.ts')) sources.push(full);
  }
}
collect(path.join(root, 'src'));

execFileSync('tsc', ['--target', 'ES2020', '--module', 'ES2020', '--moduleResolution', 'Node', '--strict', '--skipLibCheck', '--outDir', dist, ...sources], { stdio: 'inherit', cwd: root });

fs.copyFileSync(path.join(root, 'src/ui.html'), path.join(dist, 'ui.html'));
fs.copyFileSync(path.join(root, 'manifest.json'), path.join(dist, 'manifest.json'));

// Figma accepts a single JS entry without external modules. Convert the emitted ES modules to one
// script: order modules by dependency (cycles are safe here because all cross-module references are
// function declarations), strip import/export statements, then append code.js last so its top-level
// figma.showUI() runs only after every definition has been loaded.
const importRe = /^import\s+(?:.*?\s+from\s+)?['"][^'"]+['"];?\s*$/gm;
const exportStarRe = /^export\s+\*\s+from\s+['"][^'"]+['"];?\s*$/gm;
const exportNamedFromRe = /^export\s+\{[^}]*\}\s+from\s+['"][^'"]+['"];?\s*$/gm;
const exportPrefixRe = /^(export\s+)(?:default\s+)?(?:async\s+)?(?:function|const|let|var|class)\b/gm;
const exportEmptyRe = /^export\s*\{\};\s*$/gm;

function cleanModule(source) {
  return source
    .replace(importRe, '')
    .replace(exportStarRe, '')
    .replace(exportNamedFromRe, '')
    .replace(exportPrefixRe, (match, prefix) => match.slice(prefix.length))
    .replace(exportEmptyRe, '')
    .replace(/^export\s+default\s+/gm, '');
}

function listJs(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listJs(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const codeEntry = path.join(dist, 'code.js');
const modules = listJs(dist).filter((file) => file !== codeEntry);

const dependencyMap = new Map();
for (const file of modules) {
  const source = fs.readFileSync(file, 'utf8');
  const deps = [];
  const importPattern = /from\s+['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = importPattern.exec(source)) !== null) {
    let target = path.resolve(path.dirname(file), match[1]);
    if (!path.extname(target)) {
      if (fs.existsSync(`${target}.js`)) target += '.js';
      else target = path.join(target, 'index.js');
    }
    deps.push(target);
  }
  dependencyMap.set(file, deps);
}

const ordered = [];
const visited = new Set();
function visit(file, chain) {
  if (visited.has(file) || chain.has(file)) return;
  chain.add(file);
  for (const dep of dependencyMap.get(file) || []) visit(dep, chain);
  chain.delete(file);
  visited.add(file);
  ordered.push(file);
}
for (const file of modules) visit(file, new Set());

const body = ordered
  .map((file) => cleanModule(fs.readFileSync(file, 'utf8')).replace(/\s+$/, '\n'))
  .join('\n');

const code = cleanModule(fs.readFileSync(codeEntry, 'utf8')).replace(/\s+$/, '\n');

fs.writeFileSync(codeEntry, `${body}\n${code}`);

for (const file of modules) fs.rmSync(file);

// Remove empty module directories left behind after stripping per-file outputs.
for (const dir of fs.readdirSync(dist, { withFileTypes: true })) {
  if (dir.isDirectory()) {
    fs.rmSync(path.join(dist, dir.name), { recursive: true, force: true });
  }
}

fs.rmSync(path.join(root, 'figzen-plugin.zip'), { force: true });
execFileSync('zip', ['-qr', path.join(root, 'figzen-plugin.zip'), '.'], { cwd: dist, stdio: 'inherit' });
console.log('Built dist/ and figzen-plugin.zip');
