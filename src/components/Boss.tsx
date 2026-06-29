import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useSafeTexture } from '../lib/safeTexture';
import { ProjectileData } from '../types';

const BOSS_TEXTURE = 'https://res.cloudinary.com/dsucg33fv/image/upload/v1782709455/boss_e8jti1.png';

interface BossProps {
  id: string;
  initialPosition: [number, number, number];
  playerPosRef: React.RefObject<THREE.Vector3>;
  playerAction: string;
  projectiles?: ProjectileData[];
  onBossHit: (currentHp: number) => void;
  onDefeated: () => void;
  onLaunchFireballs: (targetPos: THREE.Vector3) => void;
  isPaused: boolean;
  bossHealth: number;
}

export function Boss({
  id,
  initialPosition,
  playerPosRef,
  playerAction,
  projectiles,
  onBossHit,
  onDefeated,
  onLaunchFireballs,
  isPaused,
  bossHealth,
}: BossProps) {
  const baseTexture = useSafeTexture(BOSS_TEXTURE, 'enemy');
  const texture = useMemo(() => {
    const t = baseTexture.clone();
    t.needsUpdate = true;
    return t;
  }, [baseTexture]);

  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  const tilesHoriz = 4;
  const tilesVert = 2; // 2 rows: Row 0 (top): hovering, Row 1 (bottom): charging/attacking
  texture.repeat.set(1 / tilesHoriz, 1 / tilesVert);

  const pos = useRef(new THREE.Vector3(...initialPosition));
  const [bossState, setBossState] = useState<'hover' | 'dash' | 'charge' | 'injured' | 'dead'>('hover');
  const [facingLeft, setFacingLeft] = useState(true);
  const [isFlashingRed, setIsFlashingRed] = useState(false);
  const [isFlashingWhite, setIsFlashingWhite] = useState(false);

  const currentFrame = useRef(0);
  const frameClock = useRef(new THREE.Clock());
  const stateTimer = useRef(0);
  const patternTimer = useRef(3.0); // cycles between states
  const chargePulse = useRef(0);

  // Motion and kinematics
  const targetDashPos = useRef(new THREE.Vector3());
  const hoverOffset = useRef(0);
  const velocity = useRef(new THREE.Vector3());
  const scale = useRef(new THREE.Vector3(5.0, 5.0, 5.0)); // Boss is larger and more epic!
  const rotationZ = useRef(0);

  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const hasBeenHitByCurrentAttack = useRef(false);

  useEffect(() => {
    if (playerAction !== 'attack' && playerAction !== 'dance') {
      hasBeenHitByCurrentAttack.current = false;
    }
  }, [playerAction]);

  useFrame((state, delta) => {
    if (isPaused || !groupRef.current) return;

    const time = state.clock.getElapsedTime();

    // 1. Check Collision with player projectiles
    if (projectiles && bossState !== 'dead') {
      projectiles.forEach((proj) => {
        if (proj.type === 'player' && proj.currentPosition) {
          // Check X-Z distance to ignore flying height mismatch
          const dx = pos.current.x - proj.currentPosition.x;
          const dz = pos.current.z - proj.currentPosition.z;
          const dist2D = Math.sqrt(dx * dx + dz * dz);
          
          if (dist2D < 2.0 && !proj.hasHitEnemyIds?.includes(id)) {
            if (!proj.hasHitEnemyIds) proj.hasHitEnemyIds = [];
            proj.hasHitEnemyIds.push(id);

            // Trigger hit on Boss
            handleHit();
          }
        }
      });
    }

    // 2. Check Collision with player melee attacks
    if (playerPosRef.current && (playerAction === 'attack' || playerAction === 'dance')) {
      const dx = pos.current.x - playerPosRef.current.x;
      const dz = pos.current.z - playerPosRef.current.z;
      const dist2D = Math.sqrt(dx * dx + dz * dz);

      const range = playerAction === 'dance' ? 8.5 : 2.8;
      if (dist2D < range && !hasBeenHitByCurrentAttack.current && bossState !== 'dead') {
        hasBeenHitByCurrentAttack.current = true;
        handleHit();
      }
    }

    // 3. State-Specific updates
    if (bossState === 'dead') {
      // Spinning, flying up and shrinking death sequence
      pos.current.addScaledVector(velocity.current, delta);
      velocity.current.y -= 12 * delta; // gravity pull
      rotationZ.current += 8 * delta;

      const newScale = scale.current.x - 2.5 * delta;
      if (newScale <= 0.1) {
        onDefeated();
        return;
      }
      scale.current.set(newScale, newScale, newScale);
      groupRef.current.scale.copy(scale.current);
      groupRef.current.position.copy(pos.current);
      groupRef.current.rotation.z = rotationZ.current;

      setIsFlashingWhite(Math.floor(time * 18) % 2 === 0);
      return;
    }

    // Flinch/Injured timer decay
    if (stateTimer.current > 0) {
      stateTimer.current -= delta;
      if (stateTimer.current <= 0) {
        setBossState('hover');
        setIsFlashingRed(false);
      }
    }

    // Gentle hover animation (offset Y axis)
    if (bossState === 'hover') {
      hoverOffset.current = Math.sin(time * 3.5) * 0.45;
      
      // Face the player
      if (playerPosRef.current) {
        setFacingLeft(playerPosRef.current.x < pos.current.x);
        
        // Drifts slowly towards player to stay in action range
        const toPlayer = new THREE.Vector3().subVectors(playerPosRef.current, pos.current);
        toPlayer.y = 0; // ignore vertical
        const dist = toPlayer.length();
        
        if (dist > 8) {
          toPlayer.normalize();
          pos.current.addScaledVector(toPlayer, 2.5 * delta);
        } else if (dist < 4) {
          toPlayer.normalize();
          pos.current.addScaledVector(toPlayer, -2.0 * delta); // back away slightly
        }
      }

      // Smoothly level Y back to hover altitude
      pos.current.y = THREE.MathUtils.lerp(pos.current.y, 3.2 + hoverOffset.current, 5 * delta);

      // Decrement the timer to change pattern
      patternTimer.current -= delta;
      if (patternTimer.current <= 0) {
        // Choose next action: 60% charge fireballs, 40% dash pounce
        if (Math.random() < 0.6) {
          setBossState('charge');
          stateTimer.current = 1.8; // charging period
          chargePulse.current = 0;
        } else {
          setBossState('dash');
          stateTimer.current = 1.5; // dash period
          if (playerPosRef.current) {
            // Dash close to player
            const dir = new THREE.Vector3().subVectors(playerPosRef.current, pos.current).setY(0).normalize();
            targetDashPos.current.copy(pos.current).addScaledVector(dir, 12);
            // keep on map boundary
            targetDashPos.current.x = THREE.MathUtils.clamp(targetDashPos.current.x, -21, 21);
            targetDashPos.current.z = THREE.MathUtils.clamp(targetDashPos.current.z, -21, 21);
          }
        }
        patternTimer.current = 3.5 + Math.random() * 2.5; // reset pattern timer
      }
    }

    if (bossState === 'dash') {
      // Dash quickly towards target position
      pos.current.lerp(targetDashPos.current, 6.0 * delta);
      // Dip slightly to the ground during dash
      pos.current.y = THREE.MathUtils.lerp(pos.current.y, 1.5, 6.0 * delta);

      if (stateTimer.current > 0) {
        stateTimer.current -= delta;
        if (stateTimer.current <= 0) {
          setBossState('hover');
        }
      }
    }

    if (bossState === 'charge') {
      // Squash and stretch telegraphed scaling effect
      chargePulse.current += delta * 15;
      const stretch = 1.0 + Math.sin(chargePulse.current) * 0.15;
      const squash = 1.0 - Math.sin(chargePulse.current) * 0.15;
      groupRef.current.scale.set(5.0 * stretch, 5.0 * squash, 5.0);

      // Stay stationary and hover slightly
      pos.current.y = THREE.MathUtils.lerp(pos.current.y, 3.5, 4 * delta);

      if (stateTimer.current > 0) {
        stateTimer.current -= delta;
        if (stateTimer.current <= 0) {
          // Launch fireballs!
          if (playerPosRef.current) {
            onLaunchFireballs(playerPosRef.current);
          }
          setBossState('hover');
          // Reset scale
          groupRef.current.scale.set(5.0, 5.0, 5.0);
        }
      }
    }

    if (bossState === 'injured') {
      // Pushed slightly back on injury
      if (playerPosRef.current) {
        const knockbackDir = new THREE.Vector3().subVectors(pos.current, playerPosRef.current).setY(0).normalize();
        pos.current.addScaledVector(knockbackDir, 6.0 * delta);
      }
    }

    // Apply translation to container
    groupRef.current.position.copy(pos.current);

    // 4. Animate Sprite Sheet frame tiling
    if (frameClock.current.getElapsedTime() > 0.12) {
      frameClock.current.start();
      currentFrame.current = (currentFrame.current + 1) % tilesHoriz;
      texture.offset.x = currentFrame.current / tilesHoriz;

      // Select row: Row 0 (top, offset.y = 0.5) for idle/hover/dash
      // Row 1 (bottom, offset.y = 0.0) for charging/injured/dead
      const bStateStr = bossState as string;
      if (bStateStr === 'charge' || bStateStr === 'injured' || bStateStr === 'dead') {
        texture.offset.y = 0.0;
      } else {
        texture.offset.y = 0.5;
      }
    }
  });

  const handleHit = () => {
    if (bossState === 'dead' || isPaused) return;

    const newHp = bossHealth - 1;
    onBossHit(newHp);

    if (newHp <= 0) {
      setBossState('dead');
      velocity.current.set((Math.random() - 0.5) * 6, 12, (Math.random() - 0.5) * 6);
      setIsFlashingWhite(true);
    } else {
      setBossState('injured');
      stateTimer.current = 0.45; // flinch time
      setIsFlashingRed(true);
    }
  };

  return (
    <group ref={groupRef} position={initialPosition} scale={[5, 5, 5]}>
      <Billboard follow={true}>
        <mesh>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial
            ref={materialRef}
            map={texture}
            transparent={true}
            side={THREE.DoubleSide}
            alphaTest={0.05}
            // Use custom color multiplying for flashing highlights
            color={isFlashingRed ? '#ef4444' : isFlashingWhite ? '#ffffff' : '#ffffff'}
            emissive={isFlashingRed ? '#7f1d1d' : isFlashingWhite ? '#475569' : '#000000'}
          />
        </mesh>
      </Billboard>
    </group>
  );
}
