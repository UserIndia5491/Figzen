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

test('bundled plugin uses the converter architecture (run npm run build first)', () => {
  const bundled = path.join(__dirname, '..', 'dist', 'code.js');
  assert.ok(
    fs.existsSync(bundled),
    'dist/code.js missing - run npm run build first'
  );

  const posted = [];
  globalThis.figma = {
    showUI: (html) => assert.equal(typeof html, 'string'),
    ui: { postMessage: (message) => posted.push(message) },
    currentPage: { selection: [] },
    mixed: Symbol('mixed')
  };
  globalThis.__html__ = '<div/>';

  eval(fs.readFileSync(bundled, 'utf8'));

  const frame = {
    type: 'FRAME',
    name: 'Root',
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    visible: true,
    rotation: 0,
    opacity: 1,
    layoutMode: 'NONE',
    fills: [],
    strokes: [],
    children: [
      {
        type: 'RECTANGLE',
        name: 'Photo',
        x: 10,
        y: 10,
        width: 60,
        height: 60,
        visible: true,
        rotation: 0,
        opacity: 1,
        cornerRadius: 0,
        fills: [{ type: 'IMAGE', imageHash: 'x', opacity: 1, visible: true }],
        strokes: []
      },
      {
        type: 'LINE',
        name: 'Divider',
        x: 0,
        y: 100,
        width: 300,
        height: 2,
        visible: true,
        rotation: 0,
        opacity: 1,
        strokes: [
          { type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 }, opacity: 1, visible: true }
        ],
        strokeWeight: 2
      },
      {
        type: 'ELLIPSE',
        name: 'Dot',
        x: 0,
        y: 120,
        width: 40,
        height: 40,
        visible: true,
        rotation: 0,
        opacity: 1,
        fills: [{ type: 'SOLID', color: { r: 0, g: 1, b: 0 }, opacity: 1, visible: true }],
        strokes: []
      }
    ]
  };

  figma.currentPage.selection = [frame];
  figma.ui.onmessage({ type: 'export' });

  const result = posted[0];
  assert.ok(result.ok);

  // New node types must actually be emitted (not the old Phase 1 fallback).
  assert.match(result.content, /\[node name="Divider" type="Line2D"/);
  assert.match(result.content, /\[node name="Photo" type="TextureRect"/);

  // Converter warnings must reach the UI.
  assert.ok(
    result.warnings.some((warning) => warning.message.includes('Image fills'))
  );
  assert.ok(
    result.warnings.some((warning) => warning.message.includes('Ellipse'))
  );

  delete globalThis.figma;
  delete globalThis.__html__;
});
