import { buildTscn, colorFromSolidPaints, ExportWarning, SerializableNode, safeFilename } from './exporter';

figma.showUI(__html__, { width: 420, height: 480, themeColors: true });

figma.ui.onmessage = (message: { type: string }) => {
  if (message.type === 'export') {
    const frame = figma.currentPage.selection.find((node: any) => node.type === 'FRAME');
    if (!frame) {
      figma.ui.postMessage({ type: 'result', ok: false, error: 'Select a Figma Frame first.' });
      return;
    }

    try {
      const warnings: ExportWarning[] = [];
      const root = convertNode(frame, warnings, true);
      const content = buildTscn(root, warnings);
      figma.ui.postMessage({
        type: 'result',
        ok: true,
        filename: `${safeFilename(frame.name || 'figzen-scene')}.tscn`,
        content,
        warnings
      });
    } catch (error) {
      figma.ui.postMessage({ type: 'result', ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (message.type === 'close') figma.closePlugin();
};

function convertNode(node: any, warnings: ExportWarning[], isRoot = false): SerializableNode {
  const type = mapType(node.type);
  if (!type) warnings.push({ node: node.name, message: `Unsupported Figma node type: ${node.type}; preserved as Control.` });

  const box = node.absoluteBoundingBox;
  const parentBox = !isRoot && node.parent && node.parent.absoluteBoundingBox ? node.parent.absoluteBoundingBox : null;
  const x = box && parentBox ? round(box.x - parentBox.x) : 0;
  const y = box && parentBox ? round(box.y - parentBox.y) : 0;
  const width = round(box?.width ?? 0);
  const height = round(box?.height ?? 0);

  const result: SerializableNode = {
    name: node.name || 'Unnamed',
    type: type ?? 'Control',
    x,
    y,
    width,
    height,
    visible: node.visible !== false,
    children: []
  };

  if (Array.isArray(node.fills)) {
    const color = colorFromSolidPaints(node.fills);
    if (color) result.color = color;
    else if (node.fills.length > 0) warnings.push({ node: node.name, message: 'Only solid fills are exported; other fill types are ignored.' });
  }

  if (node.type === 'TEXT') {
    result.text = node.characters ?? '';
    if (typeof node.fontSize === 'number') result.fontSize = round(node.fontSize);
    if (node.fontName && node.fontName !== figma.mixed) {
      warnings.push({ node: node.name, message: 'Font family/weight is not exported in Phase 1; Godot default font is used.' });
    }
  }

  if (typeof node.opacity === 'number' && node.opacity !== 1) {
    warnings.push({ node: node.name, message: 'Opacity is not exported in Phase 1.' });
  }

  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) result.children.push(convertNode(child, warnings));
  }

  return result;
}

function mapType(figmaType: string): SerializableNode['type'] | null {
  switch (figmaType) {
    case 'FRAME': return 'Control';
    case 'RECTANGLE': return 'ColorRect';
    case 'TEXT': return 'Label';
    case 'COMPONENT':
    case 'INSTANCE': return 'Control';
    default: return null;
  }
}

function round(value: number): number { return Math.round(value * 100) / 100; }
