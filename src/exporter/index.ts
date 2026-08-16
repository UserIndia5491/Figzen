import type {
  ConversionContext,
  ExportResult,
  ExportWarning,
  SceneNode,
  SerializableNode
} from './types';

import {
  flattenScene
} from './tree';

import {
  serializeScene
} from './serializer';

export * from './types';
export * from './naming';

/*
 * New architecture:
 *
 * const result = buildTscn(sceneNode)
 *
 * Old architecture compatibility:
 *
 * const content = buildTscn(serializableNode, warnings)
 */
export function buildTscn(
  root: SceneNode
): ExportResult;

export function buildTscn(
  root: SceneNode,
  context: ConversionContext
): ExportResult;

export function buildTscn(
  root: SerializableNode,
  warnings: ExportWarning[]
): string;

export function buildTscn(
  root: SceneNode | SerializableNode,
  warnings?: ExportWarning[] | ConversionContext
): ExportResult | string {
  const isLegacyExport =
    Array.isArray(warnings);

  const exportWarnings: ExportWarning[] =
    isLegacyExport
      ? warnings
      : warnings !== undefined
        ? warnings.warnings
        : [];

  const sceneRoot = isLegacyNode(root)
    ? convertLegacyNode(root, exportWarnings)
    : root;

  const flattened =
    flattenScene(sceneRoot);

  const tscn =
    serializeScene(
      flattened,
      exportWarnings
    );

  if (isLegacyExport) {
    return tscn;
  }

  return {
    tscn,
    warnings: exportWarnings
  };
}

function isLegacyNode(
  node: SceneNode | SerializableNode
): node is SerializableNode {
  return !('properties' in node);
}

function convertLegacyNode(
  node: SerializableNode,
  warnings: ExportWarning[]
): SceneNode {
  const properties = [];

  if (
    node.type === 'ColorRect' &&
    node.color
  ) {
    properties.push({
      key: 'color',
      value: `Color("${escapeColor(node.color)}")`
    });
  }

  if (
    node.type === 'ColorRect' &&
    !node.color
  ) {
    warnings.push({
      node: node.name,
      message:
        'No supported solid color found; Godot default ColorRect color is used.'
    });
  }

  if (node.type === 'Label') {
    properties.push({
      key: 'text',
      value: `"${escapeText(node.text ?? '')}"`
    });

    if (node.fontSize) {
      properties.push({
        key: 'theme_override_font_sizes/font_size',
        value: String(
          Math.round(node.fontSize)
        )
      });
    }
  }

  return {
    name: node.name,
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    visible: node.visible,
    properties,
    children: node.children.map(
      child =>
        convertLegacyNode(
          child,
          warnings
        )
    )
  };
}

export function colorFromSolidPaints(
  fills: readonly Paint[] | typeof figma.mixed
): string | undefined {
  if (
    fills === figma.mixed ||
    !Array.isArray(fills)
  ) {
    return undefined;
  }

  const paint = fills.find(
    (item: any) =>
      item &&
      item.type === 'SOLID' &&
      item.visible !== false
  );

  if (!paint) {
    return undefined;
  }

  const r = clampByte(
    (paint.color?.r ?? 0) * 255
  );

  const g = clampByte(
    (paint.color?.g ?? 0) * 255
  );

  const b = clampByte(
    (paint.color?.b ?? 0) * 255
  );

  const a = clampByte(
    (paint.opacity ?? 1) * 255
  );

  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
}

export function safeFilename(
  value: string
): string {
  const cleaned = value
    .replace(
      /[^a-zA-Z0-9._-]+/g,
      '_'
    )
    .replace(
      /^\.+|\.+$/g,
      ''
    );

  return cleaned || 'figzen-scene';
}

export function createConversionContext(): ConversionContext {
  return {
    warnings: []
  };
}

function escapeText(
  value: string
): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n');
}

function escapeColor(
  value: string
): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

function clampByte(
  value: number
): number {
  return Math.max(
    0,
    Math.min(
      255,
      Math.round(value)
    )
  );
}

function toHex(
  value: number
): string {
  return value
    .toString(16)
    .padStart(2, '0');
}
