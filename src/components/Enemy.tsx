import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useSafeTexture } from '../lib/safeTexture';
import { ProjectileData } from '../types';

const ENEMY_TEXTURE = 'https://raw.githubusercontent.com/banyapon/banyapon.github.io/refs/heads/main/studio/images/enemy.png';

interface EnemyProps {
  id: string;
  initialPosition: [number, number, number];
  playerPosRef: React.RefObject<THREE.Vector3>;
  playerHealth: number;
  onPlayerHit: () => void;
  onDefeated: (id: string) => void;
  playerAttacking: boolean;
  playerFacingRight: boolean;
  playerAction: string;
  onShoot?: (position: THREE.Vector3, direction: THREE.Vector3) => void;
  projectiles?: ProjectileData[];
}

export function Enemy({
  id,
  initialPosition,
  playerPosRef,
  onPlayerHit,
  onDefeated,
  playerAttacking,
  playerFacingRight,
  playerAction,
  onShoot,
  projectiles,
}: EnemyProps) {
  // Load texture
  const baseTexture = useSafeTexture(ENEMY_TEXTURE, 'enemy');
  const texture = useMemo(() => {
    const t = baseTexture.clone();
    t.needsUpdate = true;
    return t;
  }, [baseTexture]);

  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  const tilesHoriz = 4;
  const tilesVert = 2; // Row 1: Standing/Walking, Row 2: Injured
  texture.repeat.set(1 / tilesHoriz, 1 / tilesVert);

  const pos = useRef(new THREE.Vector3(...initialPosition));
  const [enemyState, setEnemyState] = useState<'walk' | 'injured' | 'dead'>('walk');
  const [facingLeft, setFacingLeft] = useState(true);
  const [isFlashingRed, setIsFlashingRed] = useState(false);
  const [isFlashingWhite, setIsFlashingWhite] = useState(false);

  const currentFrame = useRef(0);
  const frameClock = useRef(new THREE.Clock());
  const attackCooldown = useRef(0);
  const shootCooldown = useRef(1.5 + Math.random() * 2.0); // Randomized delay so they don't fire simultaneously
  const stateTimer = useRef(0);
  const hitCount = useRef(0);

  // Motion physics
  const knockbackVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const launchVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const rotationZ = useRef(0);
  const scale = useRef(new THREE.Vector3(1, 1, 1));
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Tracking hit vulnerability
  const hasBeenHitByCurrentAttack = useRef(false);

  useEffect(() => {
    // Reset hit flag when player is not attacking anymore
    if (playerAction !== 'attack' && playerAction !== 'dance') {
      hasBeenHitByCurrentAttack.current = false;
    }
  }, [playerAction]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // 1. Decay Physics/Knockbacks
    if (knockbackVelocity.current.lengthSq() > 0.01) {
      pos.current.addScaledVector(knockbackVelocity.current, delta);
      knockbackVelocity.current.multiplyScalar(0.9); // drag
    } else {
      knockbackVelocity.current.set(0, 0, 0);
    }

    if (enemyState === 'dead') {
      // Fly up, spin, scale down
      pos.current.addScaledVector(launchVelocity.current, delta);
      launchVelocity.current.y -= 15 * delta; // gravity
      rotationZ.current += 10 * delta;
      
      const newScale = scale.current.x - 2 * delta;
      if (newScale <= 0.1) {
        onDefeated(id);
        return;
      }
      scale.current.set(newScale, newScale, newScale);
      groupRef.current.scale.copy(scale.current);
      groupRef.current.position.copy(pos.current);
      
      // Flash rapidly
      setIsFlashingWhite(Math.floor(state.clock.getElapsedTime() * 15) % 2 === 0);
      return;
    }

    // 2. Collision detection with Player Projectiles
    if (projectiles) {
      projectiles.forEach((proj) => {
        if (proj.type === 'player' && proj.currentPosition) {
          const dist = pos.current.distanceTo(proj.currentPosition);
          if (dist < 1.35 && !proj.hasHitEnemyIds?.includes(id)) {
            if (!proj.hasHitEnemyIds) {
              proj.hasHitEnemyIds = [];
            }
            proj.hasHitEnemyIds.push(id);

            // Trigger hit
            hitCount.current += 1;
            const knockbackDir = new THREE.Vector3()
              .subVectors(pos.current, proj.currentPosition)
              .setY(0)
              .normalize();

            if (hitCount.current === 1) {
              setEnemyState('injured');
              stateTimer.current = 0.8;
              knockbackVelocity.current.copy(knockbackDir).multiplyScalar(15);
              setIsFlashingRed(true);
              setTimeout(() => setIsFlashingRed(false), 300);
            } else {
              setEnemyState('dead');
              launchVelocity.current.copy(knockbackDir).multiplyScalar(8);
              launchVelocity.current.y = 18;
              setIsFlashingWhite(true);
            }
          }
        }
      });
    }

    // Check if within hitting range of Player's melee attack/dance
    if (playerPosRef.current && (playerAction === 'attack' || playerAction === 'dance')) {
      const distanceToPlayer = pos.current.distanceTo(playerPosRef.current);
      
      // Attack has to be close. Let's say action is attack (closer) or dance (wider skill shockwave)
      const range = playerAction === 'dance' ? 5.5 : 2.5;

      if (distanceToPlayer < range && !hasBeenHitByCurrentAttack.current) {
        hasBeenHitByCurrentAttack.current = true;
        hitCount.current += 1;

        // Calculate direction away from player
        const knockbackDir = new THREE.Vector3()
          .subVectors(pos.current, playerPosRef.current)
          .setY(0)
          .normalize();

        if (hitCount.current === 1) {
          // First hit: Knock back, play injured, and flash
          setEnemyState('injured');
          stateTimer.current = 0.8; // injured state duration
          knockbackVelocity.current.copy(knockbackDir).multiplyScalar(15);
          setIsFlashingRed(true);
          setTimeout(() => setIsFlashingRed(false), 300);
        } else {
          // Second hit: Knocked out of field (Dead)
          setEnemyState('dead');
          launchVelocity.current.copy(knockbackDir).multiplyScalar(8);
          launchVelocity.current.y = 18; // fly high
          setIsFlashingWhite(true);
        }
      }
    }

    // 3. State & Timer updates
    if (stateTimer.current > 0) {
      stateTimer.current -= delta;
      if (stateTimer.current <= 0) {
        setEnemyState('walk');
      }
    }

    // Always face player if alive
    if (playerPosRef.current) {
      if (playerPosRef.current.x < pos.current.x) {
        setFacingLeft(true);
      } else {
        setFacingLeft(false);
      }
    }

    // 4. Move towards player and fire projectiles
    if (enemyState === 'walk' && playerPosRef.current) {
      const target = playerPosRef.current;
      const distance = pos.current.distanceTo(target);

      if (distance > 1.6) {
        // Walk towards player
        const moveDir = new THREE.Vector3()
          .subVectors(target, pos.current)
          .setY(0)
          .normalize();
        
        pos.current.addScaledVector(moveDir, 2.5 * delta);
        setIsFlashingRed(false);
      } else {
        // Within attack range: Initiate attack & flash red
        setIsFlashingRed(Math.floor(state.clock.getElapsedTime() * 8) % 2 === 0);

        if (attackCooldown.current <= 0) {
          onPlayerHit();
          attackCooldown.current = 1.5; // 1.5 seconds cool down
        }
      }

      // Fire slow projectiles at player on a random cooldown
      if (onShoot) {
        if (shootCooldown.current > 0) {
          shootCooldown.current -= delta;
        } else {
          if (distance > 2.5 && distance < 18) {
            const shootDir = new THREE.Vector3()
              .subVectors(target, pos.current)
              .setY(0)
              .normalize();

            const spawnPos = pos.current.clone().addScaledVector(shootDir, 1.2);
            spawnPos.y = 1.5; // torso height

            onShoot(spawnPos, shootDir);
            shootCooldown.current = 3.5 + Math.random() * 2.0; // 3.5 - 5.5s cooldown
          }
        }
      }
    }

    if (attackCooldown.current > 0) {
      attackCooldown.current -= delta;
    }

    // 5. Handle Sprite Frame Tiling
    if (frameClock.current.getElapsedTime() > 0.15) {
      frameClock.current.start();
      currentFrame.current = (currentFrame.current + 1) % tilesHoriz;
    }

    // Rows: Row 1 is Standing/Walking (top of texture, offset.y = 0.5)
    // Row 2 is Injured (bottom of texture, offset.y = 0)
    let vOffset = 0.5;
    if (enemyState === 'injured') {
      vOffset = 0.0;
    }

    let uOffset = currentFrame.current * (1 / tilesHoriz);

    // Left-facing is default for enemy.png
    if (facingLeft) {
      texture.repeat.x = Math.abs(texture.repeat.x);
      texture.offset.x = uOffset;
    } else {
      texture.repeat.x = -Math.abs(texture.repeat.x);
      texture.offset.x = uOffset + Math.abs(texture.repeat.x);
    }
    texture.offset.y = vOffset;

    // Apply translation to group position
    groupRef.current.position.copy(pos.current);
    groupRef.current.rotation.z = rotationZ.current;

    // Apply color modification for flashing
    if (materialRef.current) {
      if (isFlashingRed) {
        materialRef.current.color.setRGB(3.0, 0.2, 0.2); // Intense Red
      } else if (isFlashingWhite) {
        materialRef.current.color.setRGB(3.0, 3.0, 3.0); // Bright White glow
      } else {
        materialRef.current.color.setRGB(1.0, 1.0, 1.0); // Normal
      }
    }
  });

  return (
    <group ref={groupRef}>
      <Billboard follow={true}>
        <mesh>
          <planeGeometry args={[2.5, 2.5]} />
          <meshStandardMaterial
            ref={materialRef}
            map={texture}
            transparent
            alphaTest={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Billboard>
    </group>
  );
}
