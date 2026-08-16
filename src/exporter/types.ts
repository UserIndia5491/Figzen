export type GodotNodeType =
  | 'Control'
  | 'ColorRect'
  | 'Label'
  | 'Panel'
  | 'TextureRect'
  | 'Polygon2D'
  | 'Line2D'
  | 'HBoxContainer'
  | 'VBoxContainer';

export interface ExportWarning {
  node: string;
  message: string;
}

export interface GodotProperty {
  key: string;
  value: string;
}

export interface SceneNode {
  name: string;
  type: GodotNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  rotation?: number;
  opacity?: number;
  properties: GodotProperty[];
  children: SceneNode[];
}

/*
 * Compatibility type for the original Figzen exporter.
 * This lets the existing src/code.ts continue working while
 * the new converter architecture is being added.
 */
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

export interface FlattenedNode {
  node: SceneNode;
  parentPath: string | null;
}

export interface ExportResult {
  tscn: string;
  warnings: ExportWarning[];
}

export interface ConversionContext {
  warnings: ExportWarning[];
}