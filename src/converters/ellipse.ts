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

export function convertEllipse(
  node: EllipseNode,
  context: ConversionContext
): SceneNode {
  const sceneNode = createNode(
    node.name,
    'Control',
    node
  );

  const color =
    getSolidColor(node.fills);

  if (color) {
    sceneNode.properties.push({
      key: 'metadata/figzen_shape',
      value: '"ellipse"'
    });

    sceneNode.properties.push({
      key: 'metadata/figzen_fill',
      value: `"${color}"`
    });
  } else {
    warn(
      context,
      node.name,
      'Ellipse has no supported solid fill.'
    );
  }

  warn(
    context,
    node.name,
    'Ellipse is exported as a Control with Figzen metadata. Native ellipse rendering requires a custom Godot drawing implementation.'
  );

  return sceneNode;
}