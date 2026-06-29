import { useState, useEffect } from 'react';
import * as THREE from 'three';

export function createFallbackTexture(type: 'player' | 'enemy' | 'item' | 'ground'): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);
    
    if (type === 'item') {
      canvas.width = 256;
      canvas.height = 256;
      
      // Draw a highly polished pixel-art styled health potion bottle
      // Outer transparent glow
      const radialGlow = ctx.createRadialGradient(128, 130, 20, 128, 130, 110);
      radialGlow.addColorStop(0, 'rgba(236, 72, 153, 0.2)');
      radialGlow.addColorStop(1, 'rgba(236, 72, 153, 0)');
      ctx.fillStyle = radialGlow;
      ctx.beginPath();
      ctx.arc(128, 130, 110, 0, Math.PI * 2);
      ctx.fill();

      // Draw Glass bottle back
      ctx.fillStyle = '#1e293b'; // dark glass background outline
      ctx.beginPath();
      ctx.arc(128, 145, 68, 0, Math.PI * 2);
      ctx.fill();

      // Bottle neck
      ctx.fillStyle = '#94a3b8'; // silver/blue glass neck
      ctx.fillRect(110, 50, 36, 40);

      // Bottle lip
      ctx.fillStyle = '#64748b';
      ctx.fillRect(102, 42, 52, 12);
      
      // Wooden cork
      ctx.fillStyle = '#78350f'; // rich brown cork
      ctx.fillRect(114, 22, 28, 22);

      // Main flask potion body (Outer glass shine/tint)
      ctx.fillStyle = '#cbd5e1'; 
      ctx.beginPath();
      ctx.arc(128, 145, 60, 0, Math.PI * 2);
      ctx.fill();

      // Liquid base (Dark rose/crimson elixir)
      ctx.fillStyle = '#9f1239'; 
      ctx.beginPath();
      ctx.arc(128, 145, 52, 0, Math.PI * 2);
      ctx.fill();

      // Liquid active glow (Bright active pink-rose)
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(128, 152, 42, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle / Star on the bottle
      ctx.fillStyle = '#ffffff';
      // Center star sparkle
      ctx.beginPath();
      ctx.moveTo(128, 125);
      ctx.quadraticCurveTo(128, 137, 140, 137);
      ctx.quadraticCurveTo(128, 137, 128, 149);
      ctx.quadraticCurveTo(128, 137, 116, 137);
      ctx.quadraticCurveTo(128, 137, 128, 125);
      ctx.fill();

      // Side specular reflection highlights (glass shine)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(98, 122, 14, 28, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(155, 165, 8, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 'ground') {
      // Draw grid-pattern ground
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 512);

      // Ground brick block style
      ctx.fillStyle = '#1e293b';
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const x = i * 128;
          const y = j * 128;
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 6;
          ctx.strokeRect(x + 4, y + 4, 120, 120);

          // Subtle texture inside brick
          ctx.fillStyle = (i + j) % 2 === 0 ? '#111827' : '#1e293b';
          ctx.fillRect(x + 8, y + 8, 112, 112);

          // Little center dot pattern
          ctx.fillStyle = '#334155';
          ctx.fillRect(x + 58, y + 58, 12, 12);
        }
      }
    } else if (type === 'player') {
      // Draw 4x4 sprite sheet fallback
      // Row 1: Idle, Row 2: Walk, Row 3: Attack, Row 4: Dance
      const colors = ['#6366f1', '#4f46e5', '#312e81', '#4338ca'];
      
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const x = col * 128;
          const y = row * 128;

          // Draw shadows underneath character
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath();
          ctx.ellipse(x + 64, y + 115, 35, 12, 0, 0, Math.PI * 2);
          ctx.fill();

          // Character Body (A cute wizard/hero with a cape or hat)
          // Hat / head cover
          ctx.fillStyle = '#1e1b4b'; // deep navy/indigo dark hat
          ctx.beginPath();
          ctx.moveTo(x + 24, y + 60);
          ctx.lineTo(x + 64, y + 10); // tip
          ctx.lineTo(x + 104, y + 60);
          ctx.closePath();
          ctx.fill();

          // Hat gold buckle
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(x + 52, y + 52, 24, 8);

          // Head Face
          ctx.fillStyle = '#ffedd5'; // warm peach skin
          ctx.beginPath();
          ctx.arc(x + 64, y + 74, 25, 0, Math.PI * 2);
          ctx.fill();

          // Cape / Body robe
          ctx.fillStyle = colors[row];
          ctx.beginPath();
          ctx.moveTo(x + 44, y + 94);
          ctx.lineTo(x + 24, y + 120);
          ctx.lineTo(x + 104, y + 120);
          ctx.lineTo(x + 84, y + 94);
          ctx.closePath();
          ctx.fill();

          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 48, y + 68, 8, 10);
          ctx.fillRect(x + 72, y + 68, 8, 10);
          ctx.fillStyle = '#312e81';
          ctx.fillRect(x + 50, y + 72, 4, 6);
          ctx.fillRect(x + 74, y + 72, 4, 6);

          // Action specific changes
          if (row === 1) { // Walking (bouncing offset)
            const bob = Math.sin(col * Math.PI) * 5;
            ctx.fillStyle = '#ffffff';
            // Tiny shoes stepping
            ctx.fillRect(x + 42, y + 116 + bob, 14, 8);
            ctx.fillRect(x + 72, y + 116 - bob, 14, 8);
          } else if (row === 2) { // Attack: glowing fists
            ctx.fillStyle = '#f43f5e'; // glowing red hand/fist
            ctx.beginPath();
            ctx.arc(x + 95 + (col % 2) * 12, y + 84 + Math.sin(col) * 6, 14, 0, Math.PI * 2);
            ctx.fill();
            // fist aura outline
            ctx.strokeStyle = '#fda4af';
            ctx.lineWidth = 2;
            ctx.stroke();
          } else if (row === 3) { // Dance: magical stars above head
            ctx.fillStyle = '#a855f7';
            ctx.fillRect(x + 35 + (col * 15) % 40, y + 14 + Math.sin(col * 3) * 6, 8, 8);
          }
        }
      }
    } else if (type === 'enemy') {
      // Draw 4x2 sprite sheet fallback
      // Row 1: Walk, Row 2: Injured
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
          const x = col * 128;
          const y = row * 128;

          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.beginPath();
          ctx.ellipse(x + 64, y + 115, 30, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          // Main body (Angry magma slag / dark red golem)
          ctx.fillStyle = row === 1 ? '#ef4444' : '#7f1d1d'; // Crimson dark/bright
          ctx.beginPath();
          ctx.moveTo(x + 34, y + 40);
          ctx.lineTo(x + 94, y + 40);
          ctx.lineTo(x + 104, y + 110);
          ctx.lineTo(x + 24, y + 110);
          ctx.closePath();
          ctx.fill();

          // Magma cracks on the golem body
          ctx.strokeStyle = '#f97316'; // orange hot cracks
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x + 44, y + 55); ctx.lineTo(x + 64, y + 75);
          ctx.lineTo(x + 50, y + 95);
          ctx.moveTo(x + 84, y + 60); ctx.lineTo(x + 74, y + 85);
          ctx.stroke();

          // Angry mask/horns
          ctx.fillStyle = '#450a0a'; // very dark brown mask
          ctx.beginPath();
          ctx.moveTo(x + 30, y + 20);
          ctx.lineTo(x + 44, y + 45);
          ctx.lineTo(x + 84, y + 45);
          ctx.lineTo(x + 98, y + 20);
          ctx.lineTo(x + 80, y + 35);
          ctx.lineTo(x + 48, y + 35);
          ctx.closePath();
          ctx.fill();

          // Angry Glowing Eyes
          ctx.fillStyle = '#f97316'; // glowing fire orange
          ctx.fillRect(x + 44, y + 48, 12, 10);
          ctx.fillRect(x + 72, y + 48, 12, 10);
          ctx.fillStyle = '#fef08a'; // bright yellow pupils
          ctx.fillRect(x + 48, y + 52, 4, 4);
          ctx.fillRect(x + 76, y + 52, 4, 4);

          // State variations
          if (row === 1) { // Injured: Show cracking apart / crumbling rocks
            ctx.fillStyle = '#fca5a5';
            ctx.fillRect(x + 20, y + 100, 15, 15);
            ctx.fillRect(x + 90, y + 95, 12, 12);
            ctx.strokeStyle = '#ffffff'; // highlighted cracks
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 64, y + 40);
            ctx.lineTo(x + 64, y + 110);
            ctx.stroke();
          }
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function useSafeTexture(url: string, fallbackType: 'player' | 'enemy' | 'item' | 'ground'): THREE.Texture {
  // Pre-generate synchronous canvas texture as a robust starting value
  const [texture, setTexture] = useState<THREE.Texture>(() => createFallbackTexture(fallbackType));

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      url,
      (loadedTexture) => {
        if (active) {
          loadedTexture.magFilter = THREE.NearestFilter;
          loadedTexture.minFilter = THREE.NearestFilter;
          loadedTexture.wrapS = THREE.RepeatWrapping;
          loadedTexture.wrapT = THREE.RepeatWrapping;
          
          // Re-trigger rendering inside React by changing the state
          setTexture(loadedTexture);
        }
      },
      undefined,
      (err) => {
        // Log to console warn instead of throwing error/crashing
        console.warn(`Failed to load texture ${url}, staying with safe fallback...`, err);
      }
    );

    return () => {
      active = false;
    };
  }, [url, fallbackType]);

  return texture;
}
