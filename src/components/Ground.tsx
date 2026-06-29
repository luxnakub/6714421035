import * as THREE from 'three';
import { useSafeTexture } from '../lib/safeTexture';

const GROUND_TEXTURE = 'https://res.cloudinary.com/dsucg33fv/image/upload/v1782439980/ground_d1kjrx.png';

export function Ground() {
  const texture = useSafeTexture(GROUND_TEXTURE, 'ground');
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(25, 25);
  texture.colorSpace = THREE.SRGBColorSpace; // better colors

  return (
    <group>
      {/* Ground plane mesh with brick texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial 
          map={texture} 
          roughness={0.9} 
          metalness={0.4} 
        />
      </mesh>

      {/* Cyberpunk Glowing grid lines on top of the ground */}
      <gridHelper 
        args={[50, 50, '#f43f5e', '#6366f1']} 
        position={[0, 0.05, 0]} 
      />

      {/* Outer border neon fence ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[24.8, 25, 64]} />
        <meshBasicMaterial color="#ec4899" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
