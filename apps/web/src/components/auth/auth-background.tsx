"use client";

import Image from "next/image";
import Logo from "@/assets/logo.png";
import styles from "@/app/(auth)/auth.module.css";
import React from "react";

// Seeded random generator for stable hydration
let seed = 999;
function random() {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}
function randomRange(min: number, max: number) {
  return min + random() * (max - min);
}
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

const colors = ["#FFC4A6", "#FFA782", "#FF946B", "#FFD7C4"];

// Generate 120 geometric shapes with true 3D depth and parallax physics
const SHAPES = Array.from({ length: 120 }).map(() => {
  let x = 0;
  let y = 0;
  
  // Safe Zone: Keep an empty 300x200px area in the center for the logo
  do {
    x = randomRange(-400, 400);
    y = randomRange(-500, 500);
  } while (Math.abs(x) < 160 && Math.abs(y) < 110);

  // Z represents depth (0 = far away background, 1 = right up close to camera)
  const z = random(); 
  
  const isHollow = random() > 0.6;
  const isGlass = isHollow && z > 0.5; // Only foreground hollow items become glass

  // Dimensions scale with depth (close = huge, far = tiny)
  const sizeBase = (z * 120) + 20; 
  let w = randomRange(sizeBase * 0.8, sizeBase * 1.5);
  let h = random() > 0.7 ? randomRange(w * 0.6, w * 1.5) : w; 
  
  const color = randomChoice(colors);
  
  // Depth of field physics
  const blur = (1 - z) * 10; // Items far away are blurry (up to 10px blur)
  const opacity = (z * 0.5) + 0.15; // Far away = 15% opacity, close = 65% opacity
  const zIndex = Math.floor(z * 40); // Layering based on depth
  
  // 3D Shadows
  const dropShadowY = z * 25; // Close items cast a longer shadow
  const dropShadowBlur = z * 40;
  const shadowOpacity = z * 0.3;
  
  // Parallax Speed (close = fast, far = incredibly slow)
  const duration = (1 - z) * 60 + 20; // 20s to 80s
  
  return {
    w,
    h,
    x,
    y,
    bg: isHollow ? "transparent" : color,
    border: isHollow ? color : null,
    isGlass,
    blur,
    shadow: `0px ${dropShadowY}px ${dropShadowBlur}px rgba(0, 0, 0, ${shadowOpacity})`,
    op: opacity,
    zIdx: zIndex,
    a: Math.floor(randomRange(1, 5)), // Animation class
    d: duration,
    delay: randomRange(-60, 0), // Randomize start phase so they don't sync up
  };
});

export function AuthBackground() {
  return (
    <div className={styles.leftSide}>
      {SHAPES.map((s, i) => (
        <div
          key={i}
          className={`${styles.baseShape} ${styles[`asteroid${s.a}`]}`}
          style={{
            width: `${s.w}px`,
            height: `${s.h}px`,
            marginLeft: `${s.x}px`,
            marginTop: `${s.y}px`,
            backgroundColor: s.bg,
            border: s.border ? `${s.zIdx > 20 ? 4 : 2}px solid ${s.border}` : "none",
            borderRadius: "0px", // Crisp 3D squares
            boxShadow: s.shadow,
            opacity: s.op,
            filter: `blur(${s.blur}px)`,
            backdropFilter: s.isGlass ? "blur(8px)" : "none",
            zIndex: s.zIdx,
            animationDuration: `${s.d}s`,
            animationDelay: `${s.delay}s`,
          } as React.CSSProperties}
        />
      ))}
      <div className={styles.logoContainer}>
        <Image src={Logo} alt="SpaceJam" className={styles.logoImage} priority />
      </div>
    </div>
  );
}
