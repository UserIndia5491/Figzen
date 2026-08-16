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

export function convertImage(
  node: RectangleNode,
  context: ConversionContext
): SceneNode {
  const sceneNode = createNode(
    node.name,
    'TextureRect',
    node
  );

  warn(
    context,
    node.name,
    'Image fills require binary asset export. The TextureRect was created, but the image texture must be added by the asset pipeline.'
  );

  return sceneNode;
}