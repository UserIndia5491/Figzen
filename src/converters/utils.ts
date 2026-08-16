import type {
  ConversionContext,
  SceneNode
} from '../exporter/types';

export function createBaseNode(
  node: SceneNode,
  overrides: Partial<SceneNode> = {}
): SceneNode {
  return {
    ...node,
    ...overrides,
    properties: overrides.properties ?? node.properties,
    children: overrides.children ?? node.children
  };
}

export function baseFromFigma(
  node: SceneNode & {
    name?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    visible?: boolean;
    rotation?: number;
    opacity?: number;
  }
): SceneNode {
  return {
    name: node.name ?? 'Node',
    type: node.type,
    x: node.x ?? 0,
    y: node.y ?? 0,
    width: node.width ?? 0,
    height: node.height ?? 0,
    visible: node.visible ?? true,
    rotation: node.rotation ?? 0,
    opacity: node.opacity ?? 1,
    properties: [],
    children: []
  };
}

export function figmaBase(
  node: SceneNode
): Omit<SceneNode, 'type' | 'properties' | 'children'> {
  return {
    name: node.name,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    visible: node.visible,
    rotation: node.rotation,
    opacity: node.opacity
  };
}

export function warn(
  context: ConversionContext,
  nodeName: string,
  message: string
): void {
  context.warnings.push({
    node: nodeName,
    message
  });
}

export function colorToGodot(
  color: RGB,
  opacity = 1
): string {
  return `Color(${num(color.r)}, ${num(color.g)}, ${num(color.b)}, ${num(opacity)})`;
}

export function getSolidPaint(
  paints: readonly Paint[] | typeof figma.mixed
): SolidPaint | null {
  if (paints === figma.mixed || !Array.isArray(paints)) {
    return null;
  }

  const paint = paints.find(
    (item): item is SolidPaint =>
      item.type === 'SOLID' &&
      item.visible !== false
  );

  return paint ?? null;
}

export function getSolidColor(
  paints: readonly Paint[] | typeof figma.mixed
): string | null {
  const paint = getSolidPaint(paints);

  if (!paint) {
    return null;
  }

  return colorToGodot(
    paint.color,
    paint.opacity ?? 1
  );
}

export function num(value: number): string {
  const rounded =
    Math.round(value * 1000) / 1000;

  return String(rounded);
}