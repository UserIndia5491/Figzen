import type {
  ConversionContext,
  SceneNode
} from '../exporter/types';

import {
  createNode
} from './base';

import {
  getSolidColor,
  warn
} from './utils';

export function convertLine(
  node: LineNode,
  context: ConversionContext
): SceneNode {
  const sceneNode = createNode(
    node.name,
    'Line2D',
    node
  );

  const color =
    getSolidColor(node.strokes);

  if (color) {
    sceneNode.properties.push({
      key: 'default_color',
      value: color
    });
  }

  if (
    node.strokeWeight !== figma.mixed
  ) {
    sceneNode.properties.push({
      key: 'width',
      value: String(node.strokeWeight)
    });
  }

  sceneNode.properties.push({
    key: 'points',
    value: `PackedVector2Array(0, 0, ${node.width}, ${node.height})`
  });

  if (!color) {
    warn(
      context,
      node.name,
      'Line has no supported solid stroke.'
    );
  }

  return sceneNode;
}