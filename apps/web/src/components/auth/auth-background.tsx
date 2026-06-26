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

// Generate 50 beautifully varied geometric shapes
const SHAPES = Array.from({ length: 50 }).map(() => {
  let x = 0;
  let y = 0;
  
  // The left column is roughly 600px wide and 800px tall.
  // Center is at 0,0.
  // We want to generate shapes within the visible area (-350 to +350 for X, -450 to +450 for Y)
  // Safe Zone: Keep an empty 300x200px area in the center for the logo (-150 to +150 for X)
  do {
    x = randomRange(-350, 350);
    y = randomRange(-450, 450);
  } while (Math.abs(x) < 150 && Math.abs(y) < 100);

  const isHollow = random() > 0.65;
  const isGlowing = random() > 0.8;
  
  // Make them proper orthogonal boxes/squares
  let w = randomRange(40, 160);
  let h = random() > 0.7 ? randomRange(w * 0.8, w * 1.5) : w; // Some are rectangles, most are perfect squares
  
  const color = randomChoice(colors);
  const glowAmount = isGlowing ? randomRange(15, 40) : 0;
  
  return {
    w,
    h,
    x,
    y,
    bg: isHollow ? "transparent" : color,
    border: isHollow ? color : null,
    br: "0px", // Crisp sharp square boxes, as requested
    glow: glowAmount > 0 ? `0 0 ${glowAmount}px ${color}` : "none",
    op: randomRange(0.15, 0.85), // Wide range of opacity for depth
    a: Math.floor(randomRange(1, 5)), // asteroid1 to asteroid4
    d: randomRange(20, 60), // slow tumbling
    transform: "",
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
            border: s.border ? `2px solid ${s.border}` : "none",
            borderRadius: s.br,
            boxShadow: s.glow,
            opacity: s.op,
            animationDuration: `${s.d}s`,
            animationDelay: `${(i % 10) * -4}s`,
          } as React.CSSProperties}
        />
      ))}
      <div className={styles.logoContainer} style={{ zIndex: 50, position: 'relative' }}>
        <Image src={Logo} alt="SpaceJam" className={styles.logoImage} priority />
      </div>
    </div>
  );
}
