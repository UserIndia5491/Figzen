import type {
  ConversionContext,
  SceneNode
} from '../exporter/types';

import {
  warn
} from './utils';

import {
  createNode
} from './base';

import {
  convertFrame
} from './frame';

import {
  convertRectangle
} from './rectangle';

import {
  convertText
} from './text';

import {
  convertEllipse
} from './ellipse';

import {
  convertLine
} from './line';

import {
  convertComponent
} from './component';

import {
  convertVector
} from './vector';

import {
  convertImage
} from './image';

export function convertNode(
  node: BaseNode,
  context: ConversionContext
): SceneNode {
  switch (node.type) {
    case 'FRAME':
      return convertFrame(
        node as FrameNode,
        context
      );

    case 'GROUP':
      return convertFrame(
        node as GroupNode,
        context
      );

    case 'SECTION':
      return convertFrame(
        node as SectionNode,
        context
      );

    case 'RECTANGLE': {
      const rectangle = node as RectangleNode;

      const hasImage =
        rectangle.fills !== figma.mixed &&
        Array.isArray(rectangle.fills) &&
        rectangle.fills.some(
          (paint: Paint) => paint.type === 'IMAGE'
        );

      if (hasImage) {
        return convertImage(
          rectangle,
          context
        );
      }

      return convertRectangle(
        rectangle,
        context
      );
    }

    case 'TEXT':
      return convertText(
        node as TextNode,
        context
      );

    case 'ELLIPSE':
      return convertEllipse(
        node as EllipseNode,
        context
      );

    case 'LINE':
      return convertLine(
        node as LineNode,
        context
      );

    case 'COMPONENT':
      return convertComponent(
        node as ComponentNode,
        context
      );

    case 'COMPONENT_SET':
      return convertComponent(
        node as ComponentSetNode,
        context
      );

    case 'INSTANCE':
      return convertComponent(
        node as InstanceNode,
        context
      );

    case 'VECTOR':
      return convertVector(
        node as VectorNode,
        context
      );

    case 'BOOLEAN_OPERATION':
      return convertVector(
        node as BooleanOperationNode,
        context
      );

    case 'STAR':
      return convertVector(
        node as StarNode,
        context
      );

    case 'POLYGON':
      return convertVector(
        node as PolygonNode,
        context
      );

    default: {
      const generic = node as unknown as {
        name: string;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        visible?: boolean;
        rotation?: number;
        opacity?: number;
        children?: readonly BaseNode[];
      };

      warn(
        context,
        generic.name,
        `${node.type} is not directly supported. Exported as a Control container.`
      );

      const sceneNode = createNode(
        generic.name,
        'Control',
        {
          x: generic.x ?? 0,
          y: generic.y ?? 0,
          width: generic.width ?? 0,
          height: generic.height ?? 0,
          visible: generic.visible ?? true,
          rotation: generic.rotation ?? 0,
          opacity: generic.opacity ?? 1
        }
      );

      if (generic.children) {
        sceneNode.children = convertChildren(
          generic.children,
          context
        );
      }

      return sceneNode;
    }
  }
}

export function convertChildren(
  children: readonly BaseNode[],
  context: ConversionContext
): SceneNode[] {
  const converted: SceneNode[] = [];

  for (const child of children) {
    converted.push(
      convertNode(child, context)
    );
  }

  return converted;
}
