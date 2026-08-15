const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('sample scene has valid-looking Godot 4 structure', () => {
  const file = fs.readFileSync(
    path.join(__dirname, '..', 'examples', 'sample.tscn'),
    'utf8'
  );

  assert.match(file, /^\[gd_scene .*format=3\]/);

  // Root has no parent attribute.
  assert.match(
    file,
    /\[node name="Root" type="Control"\]/
  );

  // Direct children of root use parent="."
  assert.match(
    file,
    /\[node name="Background" type="ColorRect" parent="\."\]/
  );

  assert.match(
    file,
    /\[node name="Title" type="Label" parent="\."\]/
  );

  assert.match(
    file,
    /\[node name="Card" type="Control" parent="\."\]/
  );

  // Children of Card use Card as their relative parent path.
  assert.match(
    file,
    /\[node name="CardFill" type="ColorRect" parent="Card"\]/
  );

  assert.match(
    file,
    /\[node name="Body" type="Label" parent="Card"\]/
  );

  // Duplicate sibling names must be resolved before paths are generated.
  assert.match(
    file,
    /\[node name="Rectangle" type="ColorRect" parent="Card"\]/
  );

  assert.match(
    file,
    /\[node name="Rectangle2" type="ColorRect" parent="Card"\]/
  );

  // The root name must never appear in any parent path.
  assert.doesNotMatch(file, /parent="Root/);
});

test('ui contains a self-contained ZIP writer and no networking', () => {
  const ui = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'ui.html'),
    'utf8'
  );

  assert.match(ui, /function createZip/);
  assert.doesNotMatch(ui, /fetch\s*\(/);
  assert.doesNotMatch(ui, /XMLHttpRequest/);
  assert.doesNotMatch(ui, /https?:\/\//);
});
