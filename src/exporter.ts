export interface ExportWarning {
  node: string;
  message: string;
}

export interface SerializableNode {
  name: string;
  type: 'Control' | 'ColorRect' | 'Label';
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  color?: string;
  text?: string;
  fontSize?: number;
  children: SerializableNode[];
}

export function buildTscn(root: SerializableNode, warnings: ExportWarning[]): string {
  const flat: Array<{ node: SerializableNode; parentPath: string | null }> = [];
  flatten(root, null, flat);

  const lines = ['[gd_scene load_steps=1 format=3]', ''];

  for (const entry of flat) {
    const { node, parentPath } = entry;
    const parentPart = parentPath ? ` parent="${escapeTscn(parentPath)}"` : '';
    lines.push(`[node name="${escapeTscn(node.name)}" type="${node.type}"${parentPart}]`);

    if (!node.visible) lines.push('visible = false');
    lines.push(`offset_left = ${fmt(node.x)}`);
    lines.push(`offset_top = ${fmt(node.y)}`);
    lines.push(`offset_right = ${fmt(node.x + node.width)}`);
    lines.push(`offset_bottom = ${fmt(node.y + node.height)}`);

    if (node.type === 'ColorRect') {
      if (node.color) lines.push(`color = Color("${node.color}")`);
      else warnings.push({ node: node.name, message: 'No supported solid color found; Godot default ColorRect color is used.' });
    }

    if (node.type === 'Label') {
      lines.push(`text = "${escapeTscnString(node.text ?? '')}"`);
      if (node.fontSize) lines.push(`theme_override_font_sizes/font_size = ${Math.round(node.fontSize)}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}

function flatten(node: SerializableNode, parentPath: string | null, out: Array<{ node: SerializableNode; parentPath: string | null }>): void {
  out.push({ node, parentPath });
  const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
  for (const child of node.children) flatten(child, currentPath, out);
}

export function colorFromSolidPaints(fills: readonly any[]): string | undefined {
  if (!Array.isArray(fills) || fills.length !== 1) return undefined;
  const paint = fills[0];
  if (!paint || paint.type !== 'SOLID' || paint.visible === false) return undefined;
  const r = clampByte((paint.color?.r ?? 0) * 255);
  const g = clampByte((paint.color?.g ?? 0) * 255);
  const b = clampByte((paint.color?.b ?? 0) * 255);
  const a = clampByte((paint.opacity ?? 1) * 255);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
}

export function safeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^\.+|\.+$/g, '') || 'figzen-scene';
}

function escapeTscn(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeTscnString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n');
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function fmt(value: number): string {
  const rounded = round(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, '0');
}
