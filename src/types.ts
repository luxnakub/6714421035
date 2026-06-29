import * as THREE from 'three';

export type ScreenState = 'menu' | 'options' | 'game';

export interface Controls {
  up: string;
  down: string;
  left: string;
  right: string;
  action: string;
  ultimate: string;
}

export interface ProjectileData {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  type: 'player' | 'enemy';
  maxLife: number;
  currentPosition?: THREE.Vector3;
  hasHitEnemyIds?: string[];
  hasHitPlayer?: boolean;
}
