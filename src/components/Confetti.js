import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Animated } from 'react-native';
import { C } from '../constants/colors';

const COLORS = [C.moss, C.clay, C.gold, C.lavender, C.mint, C.sky, C.pink];
const COUNT = Platform.OS === 'web' ? 60 : 30;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

// Web canvas confetti
function WebConfetti({ onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: COUNT }, () => ({
      x: canvas.width / 2 + randomBetween(-60, 60),
      y: canvas.height * 0.45,
      vx: randomBetween(-8, 8),
      vy: randomBetween(-18, -6),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: randomBetween(6, 12),
      rotation: randomBetween(0, Math.PI * 2),
      rotV: randomBetween(-0.2, 0.2),
      opacity: 1,
    }));

    let frame;
    let start = null;
    const duration = 2000;

    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.5; // gravity
        p.rotation += p.rotV;
        p.opacity = Math.max(0, 1 - elapsed / duration);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });

      if (elapsed < duration) {
        frame = requestAnimationFrame(animate);
      } else {
        onDone?.();
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

// Native fallback — animated dots
function NativeConfetti({ onDone }) {
  const anims = useRef(
    Array.from({ length: 12 }, () => ({
      pos: new Animated.ValueXY({ x: 0, y: 0 }),
      opacity: new Animated.Value(1),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      angle: Math.random() * Math.PI * 2,
    }))
  ).current;

  useEffect(() => {
    Animated.parallel(
      anims.map(a =>
        Animated.parallel([
          Animated.timing(a.pos, {
            toValue: {
              x: Math.cos(a.angle) * 80 + randomBetween(-20, 20),
              y: Math.sin(a.angle) * -80 + 60,
            },
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(a.opacity, { toValue: 0, duration: 800, delay: 400, useNativeDriver: true }),
        ])
      )
    ).start(() => onDone?.());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={[
            ss.dot,
            { backgroundColor: a.color, opacity: a.opacity },
            { transform: [{ translateX: a.pos.x }, { translateY: a.pos.y }] },
          ]}
        />
      ))}
    </View>
  );
}

export default function Confetti({ onDone }) {
  if (Platform.OS === 'web') return <WebConfetti onDone={onDone} />;
  return <NativeConfetti onDone={onDone} />;
}

const ss = StyleSheet.create({
  dot: { position: 'absolute', top: '50%', left: '50%', width: 10, height: 5, borderRadius: 2 },
});
