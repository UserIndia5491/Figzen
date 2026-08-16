import type {
  ConversionContext,
  SceneNode
} from '../exporter/types';

import {
  createNode
} from './base';

import {
  warn
} from './utils';

export function convertVector(
  node: VectorNode | BooleanOperationNode | StarNode | PolygonNode,
  context: ConversionContext
): SceneNode {
  const sceneNode = createNode(
    node.name,
    'Control',
    node
  );

  sceneNode.properties.push({
    key: 'metadata/figzen_original_type',
    value: `"${node.type}"`
  });

  warn(
    context,
    node.name,
    `${node.type} geometry is preserved as a placeholder Control. SVG/vector path export should be implemented as a dedicated asset pipeline.`
  );

  return sceneNode;
}