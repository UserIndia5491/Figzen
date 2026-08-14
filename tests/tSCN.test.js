const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('sample scene has valid-looking Godot 4 structure', () => {
  const file = fs.readFileSync(path.join(__dirname, '..', 'examples', 'sample.tscn'), 'utf8');
  assert.match(file, /^\[gd_scene .*format=3\]/);
  assert.match(file, /\[node name="Root" type="Control"\]/);
  assert.match(file, /\[node name="Background" type="ColorRect" parent="Root"\]/);
  assert.match(file, /\[node name="Title" type="Label" parent="Root"\]/);
});

test('ui contains a self-contained ZIP writer and no networking', () => {
  const ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.html'), 'utf8');
  assert.match(ui, /function createZip/);
  assert.doesNotMatch(ui, /fetch\s*\(/);
  assert.doesNotMatch(ui, /XMLHttpRequest/);
  assert.doesNotMatch(ui, /https?:\/\//);
});
