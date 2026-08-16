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

export function convertRectangle(
  node: RectangleNode,
  context: ConversionContext
): SceneNode {
  const color =
    getSolidColor(node.fills);

  const hasRadius =
    node.cornerRadius !== figma.mixed &&
    typeof node.cornerRadius === 'number' &&
    node.cornerRadius > 0;

  if (hasRadius) {
    const sceneNode = createNode(
      node.name,
      'Panel',
      node
    );

    sceneNode.properties.push({
      key: 'metadata/figzen_corner_radius',
      value: String(node.cornerRadius)
    });

    if (color) {
      sceneNode.properties.push({
        key: 'metadata/figzen_fill',
        value: `"${color}"`
      });
    } else {
      warn(
        context,
        node.name,
        'Rectangle has no supported solid fill.'
      );
    }

    return sceneNode;
  }

  const sceneNode = createNode(
    node.name,
    'ColorRect',
    node
  );

  if (color) {
    sceneNode.properties.push({
      key: 'color',
      value: color
    });
  } else {
    warn(
      context,
      node.name,
      'Rectangle has no supported solid fill.'
    );
  }

  return sceneNode;
}