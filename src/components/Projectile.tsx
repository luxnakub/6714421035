import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { ProjectileData } from '../types';

interface ProjectileMeshProps {
  data: ProjectileData;
  isPaused: boolean;
  onDestroy: (id: string) => void;
}

export function ProjectileMesh({ data, isPaused, onDestroy }: ProjectileMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(...data.position));
  const vel = useRef(new THREE.Vector3(...data.velocity));

  // Auto clean-up after lifetime expires
  useEffect(() => {
    const timer = setTimeout(() => {
      onDestroy(data.id);
    }, data.maxLife * 1000);
    return () => clearTimeout(timer);
  }, [data.id, data.maxLife, onDestroy]);

  useFrame((state, delta) => {
    if (isPaused || !groupRef.current) return;

    // Advance position
    pos.current.addScaledVector(vel.current, delta);
    groupRef.current.position.copy(pos.current);

    // Write current position to shared state so collisions can be checked by other meshes
    data.currentPosition = pos.current;
  });

  return (
    <group ref={groupRef} position={data.position}>
      <Billboard follow={true}>
        {data.type === 'player' ? (
          // Player's projectile: "ลูกวงกลมสั้นๆ บางๆ" (thin glowing cyan ring/disc)
          <mesh>
            <ringGeometry args={[0.2, 0.45, 24]} />
            <meshBasicMaterial
              color="#06b6d4"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ) : (
          // Enemy's slow projectile: "กระสุนวงกลม ช้าๆ" (magma glowing orange circle with inner yellow sphere)
          <group>
            {/* Outer orange glowing ring */}
            <mesh>
              <ringGeometry args={[0.22, 0.42, 24]} />
              <meshBasicMaterial
                color="#f97316"
                transparent
                opacity={0.9}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            {/* Inner yellow core */}
            <mesh scale={0.5}>
              <ringGeometry args={[0, 0.35, 24]} />
              <meshBasicMaterial
                color="#eab308"
                transparent
                opacity={0.95}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </group>
        )}
      </Billboard>
    </group>
  );
}

interface ProjectileContainerProps {
  projectiles: ProjectileData[];
  setProjectiles: React.Dispatch<React.SetStateAction<ProjectileData[]>>;
  isPaused: boolean;
}

export function ProjectileContainer({ projectiles, setProjectiles, isPaused }: ProjectileContainerProps) {
  const onDestroy = (id: string) => {
    setProjectiles((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <group>
      {projectiles.map((p) => (
        <ProjectileMesh
          key={p.id}
          data={p}
          isPaused={isPaused}
          onDestroy={onDestroy}
        />
      ))}
    </group>
  );
}
