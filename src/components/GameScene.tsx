import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Player } from './Player';
import { Ground } from './Ground';
import { Enemy } from './Enemy';
import { Item } from './Item';
import { ProjectileContainer } from './Projectile';
import { ProjectileData, Controls } from '../types';
import { Boss } from './Boss';
import { playSound } from '../lib/sound';

interface GameSceneProps {
  isPaused: boolean;
  playerHealth: number;
  setPlayerHealth: React.Dispatch<React.SetStateAction<number>>;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  onGameComplete: () => void;
  bossActive: boolean;
  setBossActive: React.Dispatch<React.SetStateAction<boolean>>;
  bossHealth: number;
  setBossHealth: React.Dispatch<React.SetStateAction<number>>;
  normalKills: number;
  setNormalKills: React.Dispatch<React.SetStateAction<number>>;
  warpPortalActive: boolean;
  setWarpPortalActive: React.Dispatch<React.SetStateAction<boolean>>;
  controls: Controls;
}

interface FireballData {
  id: string;
  targetX: number;
  targetZ: number;
  currentY: number;
  delay: number;
  hasExploded: boolean;
}

interface ExplosionData {
  id: string;
  x: number;
  z: number;
  size: number;
  opacity: number;
}

// Warp Portal sub-component
interface WarpPortalProps {
  position: [number, number, number];
}

export function WarpPortal({ position }: WarpPortalProps) {
  const portalRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!portalRef.current) return;
    const time = state.clock.getElapsedTime();
    
    const outerCylinder = portalRef.current.children[0] as THREE.Mesh;
    const innerCylinder = portalRef.current.children[1] as THREE.Mesh;
    const groundRing = portalRef.current.children[2] as THREE.Mesh;

    if (outerCylinder) outerCylinder.rotation.y = time * 1.5;
    if (innerCylinder) innerCylinder.rotation.y = -time * 0.8;
    if (groundRing) {
      groundRing.rotation.z = time * 2.0;
      groundRing.scale.setScalar(1.0 + Math.sin(time * 5) * 0.12);
    }
  });

  return (
    <group ref={portalRef} position={position}>
      {/* Outer cylinder wireframe */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 2.4, 16, 2, true]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>

      {/* Inner cylinder solid translucent */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 2.2, 12, 1, true]} />
        <meshBasicMaterial
          color="#8b5cf6"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floor ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.1, 1.5, 32]} />
        <meshBasicMaterial
          color="#ec4899"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <pointLight color="#3b82f6" intensity={4.0} distance={10} />
    </group>
  );
}

// Nested controller inside Canvas to run useFrame for projectiles, warp overlap, fireballs
interface GameControllerProps {
  isPaused: boolean;
  playerPosRef: React.RefObject<THREE.Vector3>;
  onPlayerHit: () => void;
  onGameComplete: () => void;
  warpPortalActive: boolean;
  portalPosition: [number, number, number];
  fireballs: FireballData[];
  setFireballs: React.Dispatch<React.SetStateAction<FireballData[]>>;
  explosions: ExplosionData[];
  setExplosions: React.Dispatch<React.SetStateAction<ExplosionData[]>>;
}

export function GameController({
  isPaused,
  playerPosRef,
  onPlayerHit,
  onGameComplete,
  warpPortalActive,
  portalPosition,
  fireballs,
  setFireballs,
  explosions,
  setExplosions,
}: GameControllerProps) {
  
  useFrame((state, delta) => {
    if (isPaused) return;

    // 1. Warp portal proximity check
    if (warpPortalActive && playerPosRef.current) {
      const portalVec = new THREE.Vector3(...portalPosition);
      const dist = playerPosRef.current.distanceTo(portalVec);
      if (dist < 1.4) {
        onGameComplete();
      }
    }

    // 2. Update falling fireballs coordinates and trigger explosions
    setFireballs((prev) => {
      let changed = false;
      const next = prev.map((fb) => {
        if (fb.hasExploded) return fb;

        let nextDelay = fb.delay - delta;
        let nextY = fb.currentY;
        let nextHasExploded = false;

        if (nextDelay <= 0) {
          nextY -= 14.0 * delta; // falling velocity
          if (nextY <= 0.2) {
            nextHasExploded = true;
            changed = true;

            // Spawn explosion ring
            setExplosions((exp) => [
              ...exp,
              {
                id: `exp-${Date.now()}-${Math.random()}`,
                x: fb.targetX,
                z: fb.targetZ,
                size: 0.2,
                opacity: 0.95,
              },
            ]);

            // Damage player if close
            if (playerPosRef.current) {
              const dx = playerPosRef.current.x - fb.targetX;
              const dz = playerPosRef.current.z - fb.targetZ;
              const dist2D = Math.sqrt(dx * dx + dz * dz);
              if (dist2D < 1.9) {
                onPlayerHit();
              }
            }
          }
        }

        if (nextDelay !== fb.delay || nextY !== fb.currentY || nextHasExploded !== fb.hasExploded) {
          changed = true;
          return {
            ...fb,
            delay: nextDelay,
            currentY: nextY,
            hasExploded: nextHasExploded,
          };
        }
        return fb;
      }).filter((fb) => !fb.hasExploded);

      return changed ? next : prev;
    });

    // 3. Update explosions size and opacity fade
    setExplosions((prev) => {
      if (prev.length === 0) return prev;
      let changed = false;
      const next = prev.map((exp) => {
        const nextSize = exp.size + 4.5 * delta;
        const nextOpacity = exp.opacity - 2.2 * delta;
        changed = true;
        return {
          ...exp,
          size: nextSize,
          opacity: nextOpacity,
        };
      }).filter((exp) => exp.opacity > 0);

      return changed ? next : prev;
    });
  });

  return (
    <group>
      {/* Render Falling Fireballs warnings and models */}
      {fireballs.map((fb) => {
        const isWarning = fb.delay > 0;
        return (
          <group key={fb.id}>
            {/* Pulsing warning circle on the ground */}
            {isWarning && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[fb.targetX, 0.05, fb.targetZ]}>
                <ringGeometry args={[0.1, 1.8, 32]} />
                <meshBasicMaterial
                  color="#ef4444"
                  transparent
                  opacity={0.35 + Math.sin(Date.now() * 0.012) * 0.15}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                />
              </mesh>
            )}

            {/* Falling orange sphere */}
            {!isWarning && (
              <mesh position={[fb.targetX, fb.currentY, fb.targetZ]}>
                <sphereGeometry args={[0.45, 16, 16]} />
                <meshBasicMaterial color="#f97316" />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Render Expansion Explosion Rings */}
      {explosions.map((exp) => (
        <mesh key={exp.id} rotation={[-Math.PI / 2, 0, 0]} position={[exp.x, 0.08, exp.z]}>
          <ringGeometry args={[exp.size * 0.5, exp.size, 32]} />
          <meshBasicMaterial
            color="#ef4444"
            transparent
            opacity={exp.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// Glowing neon particles floating in the air for atmosphere
function CyberParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  
  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = time * 0.03;
    pointsRef.current.position.y = Math.sin(time * 0.15) * 0.4;
  });

  const [positions, colors] = useMemo(() => {
    const count = 120;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Spawn particles inside a 3D box region
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = 0.5 + Math.random() * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;

      // Random color: neon pink/magenta or neon cyan/blue
      const isPink = Math.random() > 0.5;
      cols[i * 3] = isPink ? 0.95 : 0.05;
      cols[i * 3 + 1] = isPink ? 0.28 : 0.72;
      cols[i * 3 + 2] = isPink ? 0.95 : 0.95;
    }
    return [pos, cols];
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        vertexColors
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export function GameScene({
  isPaused,
  playerHealth,
  setPlayerHealth,
  setScore,
  onGameComplete,
  bossActive,
  setBossActive,
  bossHealth,
  setBossHealth,
  normalKills,
  setNormalKills,
  warpPortalActive,
  setWarpPortalActive,
  controls,
}: GameSceneProps) {
  // Shared ref for player position so enemies and items can query distance instantly
  const playerPosRef = useRef(new THREE.Vector3(0, 1.5, 0));
  const playerActionRef = useRef('idle');
  const playerFacingRightRef = useRef(true);

  // Lists of active entities
  const [enemies, setEnemies] = useState<Array<{ id: string; position: [number, number, number] }>>([]);
  const [items, setItems] = useState<Array<{ id: string; position: [number, number, number] }>>([]);

  // Radar Canvas Ref and Render Loop
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let active = true;

    const renderRadar = () => {
      if (!active) return;
      const canvas = radarCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // 1. Draw radar sweep circles and grid lines
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(w / 2, h / 2, w / 4, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
          ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
          ctx.stroke();

          // Green/indigo radar sweeping beam overlay
          const sweepAngle = (Date.now() * 0.003) % (Math.PI * 2);
          ctx.fillStyle = 'rgba(99, 102, 241, 0.04)';
          ctx.beginPath();
          ctx.moveTo(w / 2, h / 2);
          ctx.arc(w / 2, h / 2, w / 2 - 2, sweepAngle, sweepAngle + 0.35);
          ctx.closePath();
          ctx.fill();

          // 2. Draw Items (glowing amber dots)
          ctx.fillStyle = '#fbbf24';
          items.forEach((item) => {
            // Map 3D ground bounds (-25 to 25) to 100x100 canvas space
            const rx = w / 2 + (item.position[0] / 25) * (w / 2 - 4);
            const rz = h / 2 + (item.position[2] / 25) * (h / 2 - 4);
            ctx.beginPath();
            ctx.arc(rx, rz, 2, 0, Math.PI * 2);
            ctx.fill();
          });

          // 3. Draw Normal Enemies (red dots)
          ctx.fillStyle = '#f43f5e';
          enemies.forEach((enemy) => {
            const rx = w / 2 + (enemy.position[0] / 25) * (w / 2 - 4);
            const rz = h / 2 + (enemy.position[2] / 25) * (h / 2 - 4);
            ctx.beginPath();
            ctx.arc(rx, rz, 2.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // 4. Draw Boss Overlord (blinking larger red/magenta star)
          if (bossActive) {
            ctx.fillStyle = '#ec4899';
            const rx = w / 2;
            const rz = h / 2 - 14; // located slightly north
            ctx.beginPath();
            ctx.arc(rx, rz, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Ripple ring warning around boss pos
            ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
            ctx.beginPath();
            ctx.arc(rx, rz, 4.5 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
            ctx.stroke();
          }

          // 5. Draw Warp Portal (swirling spiral ring)
          if (warpPortalActive) {
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 5 + Math.sin(Date.now() * 0.015) * 2, 0, Math.PI * 2);
            ctx.stroke();
          }

          // 6. Draw Player (cyan pointer arrow)
          if (playerPosRef.current) {
            const px = w / 2 + (playerPosRef.current.x / 25) * (w / 2 - 4);
            const pz = h / 2 + (playerPosRef.current.z / 25) * (h / 2 - 4);

            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            if (playerFacingRightRef.current) {
              ctx.moveTo(px + 4, pz);
              ctx.lineTo(px - 3, pz - 3);
              ctx.lineTo(px - 3, pz + 3);
            } else {
              ctx.moveTo(px - 4, pz);
              ctx.lineTo(px + 3, pz - 3);
              ctx.lineTo(px + 3, pz + 3);
            }
            ctx.closePath();
            ctx.fill();
          }
        }
      }
      requestAnimationFrame(renderRadar);
    };

    renderRadar();
    return () => {
      active = false;
    };
  }, [enemies, items, bossActive, warpPortalActive]);
  const [projectiles, setProjectiles] = useState<ProjectileData[]>([]);

  // State for falling fireballs & explosions
  const [fireballs, setFireballs] = useState<FireballData[]>([]);
  const [explosions, setExplosions] = useState<ExplosionData[]>([]);

  const [portalPosition] = useState<[number, number, number]>([0, 0.1, 0]);

  // Function to shoot a projectile from the player (cyan circle/ring)
  const handlePlayerShoot = (pos: THREE.Vector3, facingRight: boolean) => {
    if (isPaused || playerHealth <= 0) return;
    const id = `proj-player-${Date.now()}-${Math.random()}`;
    const speed = 16.0;
    const velocityX = facingRight ? speed : -speed;
    setProjectiles((prev) => [
      ...prev,
      {
        id,
        position: [pos.x + (facingRight ? 0.6 : -0.6), pos.y, pos.z],
        velocity: [velocityX, 0, 0],
        type: 'player',
        maxLife: 0.42, // short range
      },
    ]);
  };

  // Function to shoot a projectile from an enemy (magma slow-ball)
  const handleEnemyShoot = (pos: THREE.Vector3, dir: THREE.Vector3) => {
    if (isPaused || playerHealth <= 0) return;
    const id = `proj-enemy-${Date.now()}-${Math.random()}`;
    const speed = 4.0; // slow-speed bullet so the player can dodge easily
    setProjectiles((prev) => [
      ...prev,
      {
        id,
        position: [pos.x, pos.y, pos.z],
        velocity: [dir.x * speed, 0, dir.z * speed],
        type: 'enemy',
        maxLife: 4.5, // 18 units max range
      },
    ]);
  };

  // Generate random positions on 50x50 map (ground is size 50, so coords are between -22 and 22)
  const getRandomMapPosition = (minDistFromPlayer = 5): [number, number, number] => {
    while (true) {
      const x = (Math.random() - 0.5) * 44;
      const z = (Math.random() - 0.5) * 44;
      const pos = new THREE.Vector3(x, 1.5, z);
      
      if (playerPosRef.current.distanceTo(pos) > minDistFromPlayer) {
        return [x, 1.5, z];
      }
    }
  };

  const getSpawnFromAllDirections = (): [number, number, number] => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 16 + Math.random() * 6; // spawn 16-22 units away from player
    let x = playerPosRef.current.x + Math.cos(angle) * distance;
    let z = playerPosRef.current.z + Math.sin(angle) * distance;

    x = THREE.MathUtils.clamp(x, -23, 23);
    z = THREE.MathUtils.clamp(z, -23, 23);

    return [x, 1.5, z];
  };

  // Initialize entities on load
  useEffect(() => {
    // Initial Items on the ground
    const initialItems = Array.from({ length: 4 }, (_, i) => ({
      id: `item-${Date.now()}-${i}`,
      position: getRandomMapPosition(3),
    }));
    setItems(initialItems);

    // Initial Enemies
    const initialEnemies = Array.from({ length: 3 }, (_, i) => ({
      id: `enemy-${Date.now()}-${i}`,
      position: getRandomMapPosition(10),
    }));
    setEnemies(initialEnemies);
  }, []);

  // Spawn new enemies over time (1 to 3 seconds random delay, paused during boss or portal)
  useEffect(() => {
    if (isPaused || playerHealth <= 0 || bossActive || warpPortalActive) return;

    let timeoutId: NodeJS.Timeout;

    const spawnNext = () => {
      setEnemies((prev) => {
        if (prev.length >= 8) return prev; // max 8 concurrent enemies
        const pos = getSpawnFromAllDirections();
        return [
          ...prev,
          {
            id: `enemy-${Date.now()}-${Math.random()}`,
            position: pos,
          },
        ];
      });

      const nextDelay = 1000 + Math.random() * 2000; // random 1-3 seconds
      timeoutId = setTimeout(spawnNext, nextDelay);
    };

    const firstDelay = 1000 + Math.random() * 2000;
    timeoutId = setTimeout(spawnNext, firstDelay);

    return () => clearTimeout(timeoutId);
  }, [isPaused, playerHealth, bossActive, warpPortalActive]);

  // Handle Player damage from enemy attack
  const handlePlayerHit = () => {
    if (playerHealth <= 0 || isPaused) return;
    setPlayerHealth((prev) => Math.max(0, prev - 1));
    playSound('hurt');
  };

  // Handle Enemy defeated
  const handleEnemyDefeated = (id: string) => {
    setEnemies((prev) => prev.filter((enemy) => enemy.id !== id));
    setScore((prev) => prev + 15);
    playSound('kill');
    
    // Increment normal kills
    setNormalKills((prev) => {
      const nextKills = prev + 1;
      if (nextKills >= 10 && !bossActive && !warpPortalActive) {
        setBossActive(true);
        setBossHealth(15);
        playSound('portal');
        // Wipe all remaining normal enemies to stage the battlefield for the Boss!
        setEnemies([]);
      }
      return nextKills;
    });

    // Respawn one after a short delay if boss is not active & goal not met
    if (!bossActive && normalKills < 9) {
      setTimeout(() => {
        if (playerHealth <= 0 || bossActive || warpPortalActive) return;
        setEnemies((prev) => {
          if (prev.length >= 8) return prev;
          const pos = getSpawnFromAllDirections();
          return [
            ...prev,
            {
              id: `enemy-${Date.now()}-${Math.random()}`,
              position: pos,
            },
          ];
        });
      }, 2500);
    }
  };

  // Handle Item collection (power up)
  const handleItemCollect = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    
    // Add point & replenish health
    setScore((prev) => prev + 5);
    setPlayerHealth((prev) => Math.min(5, prev + 1)); // replenishment cap at 5
    playSound('powerup');

    // Respawn item in random place
    setTimeout(() => {
      if (playerHealth <= 0) return;
      setItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          position: getRandomMapPosition(5),
        },
      ]);
    }, 4000);
  };

  // Boss actions
  const handleBossHit = (currentHp: number) => {
    setBossHealth(currentHp);
    setScore((prev) => prev + 40); // small hit bonus
    playSound('hurt');
  };

  const handleBossDefeated = () => {
    setBossActive(false);
    setScore((prev) => prev + 500); // 500 points for boss slayer!
    setWarpPortalActive(true);
    playSound('portal');
  };

  const handleLaunchBossFireballs = (targetPos: THREE.Vector3) => {
    // Launch 4 target warnings around the player
    const newFireballs = Array.from({ length: 4 }).map((_, i) => {
      const angle = (i * Math.PI * 2) / 4 + (Math.random() - 0.5) * 0.4;
      const dist = 1.0 + Math.random() * 3.5;
      const targetX = targetPos.x + Math.cos(angle) * dist;
      const targetZ = targetPos.z + Math.sin(angle) * dist;

      return {
        id: `fb-${Date.now()}-${i}-${Math.random()}`,
        targetX: THREE.MathUtils.clamp(targetX, -22, 22),
        targetZ: THREE.MathUtils.clamp(targetZ, -22, 22),
        currentY: 25.0, // starts high up
        delay: 1.8 + i * 0.3, // staggered warnings for rich dodging pattern
        hasExploded: false,
      };
    });

    setFireballs((prev) => [...prev, ...newFireballs]);
  };

  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }} shadows>
        {/* Modern Cyberpunk Nightsky colors and deep volumetric fog */}
        <color attach="background" args={["#020208"]} />
        <fog attach="fog" args={["#020208", 12, 28]} />

        {/* Ambient light with cool purple aura */}
        <ambientLight intensity={0.25} color="#581c87" />

        {/* Primary sharp cyan key light */}
        <directionalLight 
          position={[6, 16, 6]} 
          intensity={1.5} 
          color="#06b6d4"
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />

        {/* Rim back-light with neon magenta aura */}
        <directionalLight 
          position={[-8, 10, -6]} 
          intensity={1.2} 
          color="#ec4899"
        />

        {/* Interactive warm floor fill light */}
        <pointLight position={[0, 3, 0]} intensity={1.5} color="#8b5cf6" distance={25} />

        {/* Atmospheric Floating Embers Particle System */}
        <CyberParticles />
        
        <Player 
          isPaused={isPaused || playerHealth <= 0} 
          playerPosRef={playerPosRef}
          playerActionRef={playerActionRef}
          playerFacingRightRef={playerFacingRightRef}
          onShoot={handlePlayerShoot}
          projectiles={projectiles}
          onPlayerHit={handlePlayerHit}
          controls={controls}
        />

        {/* Dynamic Enemies Rendering (only rendered if Boss is not active) */}
        {!bossActive && enemies.map((enemy) => (
          <Enemy
            key={enemy.id}
            id={enemy.id}
            initialPosition={enemy.position}
            playerPosRef={playerPosRef}
            playerHealth={playerHealth}
            onPlayerHit={handlePlayerHit}
            onDefeated={handleEnemyDefeated}
            playerAttacking={playerActionRef.current === 'attack'}
            playerFacingRight={playerFacingRightRef.current}
            playerAction={playerActionRef.current}
            onShoot={handleEnemyShoot}
            projectiles={projectiles}
          />
        ))}

        {/* Render the Epic Boss if Spawned */}
        {bossActive && (
          <Boss
            id="boss-guardian"
            initialPosition={[0, 3.2, -8]}
            playerPosRef={playerPosRef}
            playerAction={playerActionRef.current}
            projectiles={projectiles}
            onBossHit={handleBossHit}
            onDefeated={handleBossDefeated}
            onLaunchFireballs={handleLaunchBossFireballs}
            isPaused={isPaused || playerHealth <= 0}
            bossHealth={bossHealth}
          />
        )}

        {/* Warp Portal rendering */}
        {warpPortalActive && (
          <WarpPortal position={portalPosition} />
        )}

        {/* Dynamic Projectiles Rendering */}
        <ProjectileContainer
          projectiles={projectiles}
          setProjectiles={setProjectiles}
          isPaused={isPaused || playerHealth <= 0}
        />

        {/* Dynamic Items Rendering */}
        {items.map((item) => (
          <Item
            key={item.id}
            id={item.id}
            position={item.position}
            playerPosRef={playerPosRef}
            onCollect={handleItemCollect}
          />
        ))}

        {/* Ground mesh */}
        <Ground />

        {/* Game Loop Controller for animations and collision handlers inside R3F Context */}
        <GameController
          isPaused={isPaused || playerHealth <= 0}
          playerPosRef={playerPosRef}
          onPlayerHit={handlePlayerHit}
          onGameComplete={onGameComplete}
          warpPortalActive={warpPortalActive}
          portalPosition={portalPosition}
          fireballs={fireballs}
          setFireballs={setFireballs}
          explosions={explosions}
          setExplosions={setExplosions}
        />
      </Canvas>

      {/* Tactical Holographic Radar Map */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col items-center space-y-2 pointer-events-auto bg-slate-950/80 border border-indigo-500/30 p-2.5 rounded-xl backdrop-blur-md shadow-[0_0_25px_rgba(99,102,241,0.25)]">
        <div className="flex items-center space-x-1.5 text-[9px] font-mono font-black tracking-wider text-indigo-400">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span>SYS_RADAR // ACTIVE</span>
        </div>
        <canvas 
          ref={radarCanvasRef} 
          width={100} 
          height={100} 
          className="w-24 h-24 rounded-full bg-slate-950/90 border border-indigo-500/20 shadow-inner" 
        />
        <div className="text-[8px] font-mono text-slate-400 uppercase tracking-widest text-center leading-none">
          {bossActive ? "TARGET: OVERLORD" : `HOSTILES: ${enemies.length}`}
        </div>
      </div>
    </div>
  );
}
