import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useSafeTexture } from '../lib/safeTexture';
import { ProjectileData, Controls } from '../types';
import { playSound } from '../lib/sound';

const TEXTURE_URL = 'https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/player.png';

interface PlayerProps {
  isPaused: boolean;
  playerPosRef: React.RefObject<THREE.Vector3>;
  playerActionRef: React.MutableRefObject<string>;
  playerFacingRightRef: React.MutableRefObject<boolean>;
  onShoot?: (position: THREE.Vector3, facingRight: boolean) => void;
  projectiles?: ProjectileData[];
  onPlayerHit?: () => void;
  controls: Controls;
}

export function Player({
  isPaused,
  playerPosRef,
  playerActionRef,
  playerFacingRightRef,
  onShoot,
  projectiles,
  onPlayerHit,
  controls,
}: PlayerProps) {
  const texture = useSafeTexture(TEXTURE_URL, 'player');
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  const tilesHoriz = 4;
  const tilesVert = 4;
  texture.repeat.set(1 / tilesHoriz, 1 / tilesVert);

  const [action, setAction] = useState('idle');
  const [facingRight, setFacingRight] = useState(true);

  // Position is synced with ref passed from parent
  const currentFrame = useRef(0);
  const clock = useRef(new THREE.Clock());
  
  const keys = useRef<{ [key: string]: boolean }>({});
  const shootCooldown = useRef(0);

  // Ultimate majestic spell visual effects refs
  const skillRingRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const pillarRef = useRef<THREE.Mesh>(null);

  const skillRingScale = useRef(0);
  const pillarScale = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let keyName = e.key.toLowerCase();
      if (e.code === 'Space') keyName = 'space'; // normalize space
      keys.current[keyName] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      let keyName = e.key.toLowerCase();
      if (e.code === 'Space') keyName = 'space'; // normalize space
      keys.current[keyName] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (isPaused) {
      keys.current = {};
      return;
    }

    const checkKey = (boundKey: string) => {
      if (!boundKey) return false;
      const lower = boundKey.toLowerCase();
      if (lower === 'space') return !!keys.current['space'] || !!keys.current[' '];
      return !!keys.current[lower];
    };

    // Capture controls dynamically from prop
    let isMoving = false;
    let isAttacking = checkKey(controls.action);
    let isDancing = checkKey(controls.ultimate);
    
    let nextAction = 'idle';
    if (isAttacking) nextAction = 'attack';
    else if (isDancing) nextAction = 'dance';

    let moveX = 0;
    let moveZ = 0;
    const speed = 6;

    // Support both configured keys and arrow keys as fallback
    if (checkKey(controls.up) || keys.current['arrowup']) moveZ -= 1;
    if (checkKey(controls.down) || keys.current['arrowdown']) moveZ += 1;
    if (checkKey(controls.left) || keys.current['arrowleft']) {
      moveX -= 1;
      if (!isAttacking && !isDancing) {
        setFacingRight(false);
        playerFacingRightRef.current = false;
      }
    }
    if (checkKey(controls.right) || keys.current['arrowright']) {
      moveX += 1;
      if (!isAttacking && !isDancing) {
        setFacingRight(true);
        playerFacingRightRef.current = true;
      }
    }

    // Move character if controls are active
    if (moveX !== 0 || moveZ !== 0) {
      isMoving = true;
      if (nextAction === 'idle') nextAction = 'walk';
      
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      moveX /= length;
      moveZ /= length;
      
      if (playerPosRef.current) {
        // Limit movement to the 50x50 ground plane boundary (e.g., -24 to 24)
        playerPosRef.current.x = THREE.MathUtils.clamp(playerPosRef.current.x + moveX * speed * delta, -24, 24);
        playerPosRef.current.z = THREE.MathUtils.clamp(playerPosRef.current.z + moveZ * speed * delta, -24, 24);
      }
    }

    if (shootCooldown.current > 0) {
      shootCooldown.current -= delta;
    }

    if (action !== nextAction) {
      if (nextAction === 'dance') {
        playSound('skill');
      }
      setAction(nextAction);
      playerActionRef.current = nextAction;
      currentFrame.current = 0; 
    }

    if (nextAction === 'attack' && shootCooldown.current <= 0 && playerPosRef.current && onShoot) {
      // Spawn bullet slightly offset in front of player
      const shootPos = playerPosRef.current.clone();
      shootPos.y = 1.5; // aligned to torso height
      onShoot(shootPos, facingRight);
      playSound('shoot');
      shootCooldown.current = 0.35; // shoot cooldown
    }

    // Check collision with enemy projectiles
    if (projectiles && playerPosRef.current && onPlayerHit) {
      projectiles.forEach((proj) => {
        if (proj.type === 'enemy' && proj.currentPosition) {
          const dist = playerPosRef.current.distanceTo(proj.currentPosition);
          if (dist < 1.15 && !proj.hasHitPlayer) {
            proj.hasHitPlayer = true;
            onPlayerHit();
          }
        }
      });
    }

    // Animation frame timing
    if (clock.current.getElapsedTime() > 0.12) {
      clock.current.start();
      currentFrame.current = (currentFrame.current + 1) % tilesHoriz;
    }

    // Sprite sheet vertical coordinates mapping
    // Row 1 (Standing/Idle): vOffset = 0.75
    // Row 2 (Walking): vOffset = 0.50
    // Row 3 (Punching/Attack): vOffset = 0.25
    // Row 4 (Dancing Skill): vOffset = 0.00
    let vOffset = 0.75; 
    if (action === 'walk') vOffset = 0.5;
    else if (action === 'attack') vOffset = 0.25;
    else if (action === 'dance') vOffset = 0;

    let uOffset = currentFrame.current * (1 / tilesHoriz);
    
    if (facingRight) {
      texture.repeat.x = Math.abs(texture.repeat.x);
      texture.offset.x = uOffset;
    } else {
      texture.repeat.x = -Math.abs(texture.repeat.x);
      texture.offset.x = uOffset + Math.abs(texture.repeat.x);
    }
    texture.offset.y = vOffset;

    // Apply synchronized position to mesh group
    if (groupRef.current && playerPosRef.current) {
      groupRef.current.position.copy(playerPosRef.current);
    }

    // Camera follow smoothly
    if (playerPosRef.current) {
      const idealCameraPos = new THREE.Vector3(playerPosRef.current.x, playerPosRef.current.y + 4.5, playerPosRef.current.z + 8);
      state.camera.position.lerp(idealCameraPos, 0.1);
      
      const idealLookAt = new THREE.Vector3(playerPosRef.current.x, playerPosRef.current.y, playerPosRef.current.z);
      state.camera.lookAt(idealLookAt);
    }

    // Handle Ultimate Spell rotating and expanding effects (สร้างให้อลังการสะกดทุกสายตา!)
    if (action === 'dance') {
      // 1. Core expanding shockwave
      skillRingScale.current += delta * 18.0; // Fast expanding speed
      if (skillRingScale.current > 8.5) {
        skillRingScale.current = 0.1;
      }
      if (skillRingRef.current) {
        skillRingRef.current.scale.set(skillRingScale.current, skillRingScale.current, 1);
        const opacity = 1.0 - (skillRingScale.current / 8.5);
        const mat = skillRingRef.current.material as THREE.MeshStandardMaterial;
        mat.opacity = opacity;
        mat.visible = true;
      }

      // 2. Majestic Outer Runic Ring (glowing pink)
      if (outerRingRef.current) {
        outerRingRef.current.rotation.z += delta * 2.8; // Spin clockwise
        outerRingRef.current.scale.set(7.5, 7.5, 1);
        const mat = outerRingRef.current.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.7 * (Math.sin(state.clock.getElapsedTime() * 12) * 0.25 + 0.75);
        mat.visible = true;
      }

      // 3. Majestic Inner Sacred Ring (glowing gold/cyan)
      if (innerRingRef.current) {
        innerRingRef.current.rotation.z -= delta * 4.5; // Spin counter-clockwise fast
        innerRingRef.current.scale.set(4.5, 4.5, 1);
        const mat = innerRingRef.current.material as THREE.MeshStandardMaterial;
        mat.opacity = 0.9 * (Math.cos(state.clock.getElapsedTime() * 16) * 0.2 + 0.8);
        mat.visible = true;
      }

      // 4. Devastating Pillar of Dragon Flame shooting up to heaven
      if (pillarRef.current) {
        pillarScale.current += delta * 3.5;
        if (pillarScale.current > 1.5) {
          pillarScale.current = 0.1;
        }
        pillarRef.current.scale.set(
          4.0 * (1.5 - pillarScale.current),
          12.0 * pillarScale.current,
          4.0 * (1.5 - pillarScale.current)
        );
        pillarRef.current.rotation.y += delta * 6;
        const mat = pillarRef.current.material as THREE.MeshStandardMaterial;
        mat.opacity = (1 - (pillarScale.current / 1.5)) * 0.85;
        mat.visible = true;
      }
    } else {
      skillRingScale.current = 0;
      pillarScale.current = 0;
      if (skillRingRef.current) (skillRingRef.current.material as THREE.MeshStandardMaterial).visible = false;
      if (outerRingRef.current) (outerRingRef.current.material as THREE.MeshStandardMaterial).visible = false;
      if (innerRingRef.current) (innerRingRef.current.material as THREE.MeshStandardMaterial).visible = false;
      if (pillarRef.current) (pillarRef.current.material as THREE.MeshStandardMaterial).visible = false;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 1. Core expanding shockwave ring */}
      <mesh
        ref={skillRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.4, 0]} 
      >
        <ringGeometry args={[0.9, 1.1, 32]} />
        <meshStandardMaterial
          color={0xec4899}
          emissive={0xd946ef}
          emissiveIntensity={6}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Majestic Outer runic magic ring */}
      <mesh
        ref={outerRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.38, 0]}
      >
        <ringGeometry args={[0.95, 1.05, 8, 1]} />
        <meshStandardMaterial
          color={0xf59e0b}
          emissive={0xd97706}
          emissiveIntensity={4}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          wireframe={true}
        />
      </mesh>

      {/* 3. Majestic Inner celestial ring */}
      <mesh
        ref={innerRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.39, 0]}
      >
        <ringGeometry args={[0.8, 1.0, 6, 1]} />
        <meshStandardMaterial
          color={0x06b6d4}
          emissive={0x0891b2}
          emissiveIntensity={8}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          wireframe={true}
        />
      </mesh>

      {/* 4. Giant energy beam pillar */}
      <mesh
        ref={pillarRef}
        position={[0, 2.0, 0]} 
      >
        <cylinderGeometry args={[1.5, 2.5, 1, 16, 1, true]} />
        <meshStandardMaterial
          color={0xec4899}
          emissive={0xf43f5e}
          emissiveIntensity={10}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <Billboard follow={true}>
        <mesh>
          <planeGeometry args={[3, 3]} />
          <meshStandardMaterial map={texture} transparent alphaTest={0.5} side={THREE.DoubleSide} />
        </mesh>
      </Billboard>
    </group>
  );
}
