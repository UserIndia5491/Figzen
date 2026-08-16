import type {
  ExportWarning,
  FlattenedNode,
  GodotProperty
} from './types';

export function serializeScene(
  nodes: FlattenedNode[],
  warnings: ExportWarning[]
): string {
  const lines: string[] = [
    '[gd_scene load_steps=1 format=3]',
    ''
  ];

  for (const entry of nodes) {
    writeNode(
      lines,
      entry,
      warnings
    );
  }

  return lines.join('\n').trimEnd() + '\n';
}

function writeNode(
  lines: string[],
  entry: FlattenedNode,
  warnings: ExportWarning[]
): void {
  const { node, parentPath } = entry;

  const parent =
    parentPath === null
      ? ''
      : ` parent="${escapeString(parentPath)}"`;

  lines.push(
    `[node name="${escapeString(node.name)}" type="${node.type}"${parent}]`
  );

  if (!node.visible) {
    lines.push('visible = false');
  }

  if (
    typeof node.opacity === 'number' &&
    node.opacity < 1
  ) {
    lines.push(
      `modulate = Color(1, 1, 1, ${formatNumber(node.opacity)})`
    );
  }

  if (
    typeof node.rotation === 'number' &&
    node.rotation !== 0
  ) {
    lines.push(
      `rotation = ${formatNumber(node.rotation)}`
    );
  }

  if (isNode2DType(node.type)) {
    lines.push(
      `position = Vector2(${formatNumber(node.x)}, ${formatNumber(node.y)})`
    );
  } else {
    lines.push(
      `offset_left = ${formatNumber(node.x)}`
    );

    lines.push(
      `offset_top = ${formatNumber(node.y)}`
    );

    lines.push(
      `offset_right = ${formatNumber(node.x + node.width)}`
    );

    lines.push(
      `offset_bottom = ${formatNumber(node.y + node.height)}`
    );
  }

  writeProperties(
    lines,
    node.properties,
    warnings,
    node.name
  );

  lines.push('');
}

const node2dTypes = new Set<string>([
  'Line2D',
  'Polygon2D'
]);

function isNode2DType(type: string): boolean {
  return node2dTypes.has(type);
}

function writeProperties(
  lines: string[],
  properties: GodotProperty[],
  _warnings: ExportWarning[],
  _nodeName: string
): void {
  for (const property of properties) {
    lines.push(
      `${property.key} = ${property.value}`
    );
  }
}

function escapeString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n');
}

export function formatNumber(value: number): string {
  const rounded =
    Math.round(value * 1000) / 1000;

  return Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded);
}
