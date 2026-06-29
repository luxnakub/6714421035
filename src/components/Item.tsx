import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useSafeTexture } from '../lib/safeTexture';

const ITEM_TEXTURE = 'https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/potion.png';

interface ItemProps {
  id: string;
  position: [number, number, number];
  playerPosRef: React.RefObject<THREE.Vector3>;
  onCollect: (id: string) => void;
}

export function Item({ id, position, playerPosRef, onCollect }: ItemProps) {
  const texture = useSafeTexture(ITEM_TEXTURE, 'item');
  texture.magFilter = THREE.NearestFilter;

  const groupRef = useRef<THREE.Group>(null);
  const startY = position[1];

  useFrame((state) => {
    if (!groupRef.current) return;

    // Gentle floating animation
    const time = state.clock.getElapsedTime();
    groupRef.current.position.y = startY + Math.sin(time * 3) * 0.15;
    groupRef.current.rotation.y = time * 0.5;

    // Check distance to player for collection
    if (playerPosRef.current) {
      const dist = playerPosRef.current.distanceTo(groupRef.current.position);
      if (dist < 1.4) {
        onCollect(id);
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Billboard follow={true}>
        <mesh>
          <planeGeometry args={[1.5, 1.5]} />
          <meshStandardMaterial
            map={texture}
            transparent
            alphaTest={0.5}
            emissive={new THREE.Color(0x221105)} // warm subtle glow
          />
        </mesh>
      </Billboard>
    </group>
  );
}
