import React, { useEffect, useRef } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import * as THREE from 'three';
import { PIECES, COLORS } from '../constants/catalog';

const pieceById = Object.fromEntries(PIECES.map(p => [p.id, p]));
const colorHex = (name) => (COLORS.find(c => c.name === name) || {}).hex || '#C1602E';

const CATEGORY_SHAPE = {
  living: { kind: 'box', w: 0.75, h: 0.5, d: 0.7, y: 0.25 },
  kitchen: { kind: 'box', w: 0.7, h: 0.9, d: 0.6, y: 0.45 },
  dining: { kind: 'box', w: 0.75, h: 0.5, d: 0.75, y: 0.25 },
  bedroom: { kind: 'box', w: 0.8, h: 0.55, d: 0.8, y: 0.28 },
  bathroom: { kind: 'box', w: 0.6, h: 0.5, d: 0.6, y: 0.25 },
  laundry: { kind: 'box', w: 0.6, h: 0.85, d: 0.6, y: 0.42 },
  office: { kind: 'box', w: 0.7, h: 0.7, d: 0.6, y: 0.35 },
  closet: { kind: 'box', w: 0.7, h: 1.5, d: 0.5, y: 0.75 },
  outdoor: { kind: 'box', w: 0.75, h: 0.45, d: 0.75, y: 0.22 },
  garage: { kind: 'box', w: 0.7, h: 0.8, d: 0.6, y: 0.4 },
  decor: { kind: 'box', w: 0.3, h: 0.3, d: 0.3, y: 0.5 },
  lighting: { kind: 'sphere', r: 0.16, y: 2.1 },
  plants: { kind: 'plant', y: 0 },
  wallart: { kind: 'box', w: 0.5, h: 0.5, d: 0.05, y: 1.5 },
  storage: { kind: 'box', w: 0.7, h: 1.3, d: 0.5, y: 0.65 },
};

const OUT = 11; // how far the neighborhood extends beyond the room
const ACCENT = 0xC1602E;

// --- Stylized toon shading: a soft 4-step gradient instead of physically-based
// shading, so Blueprint reads as its own illustrated look rather than a photoreal render.
const GRADIENT_MAP = (() => {
  const data = new Uint8Array([72, 64, 56, 255, 165, 148, 120, 255, 218, 200, 168, 255, 255, 250, 232, 255]);
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
})();
const toonMat = (hex, extra) => new THREE.MeshToonMaterial({ color: hex, gradientMap: GRADIENT_MAP, ...extra });
const enableShadows = (obj, cast = true, receive = true) => {
  obj.traverse((child) => {
    if (child.isMesh) { child.castShadow = cast; child.receiveShadow = receive; }
  });
  return obj;
};

function makeSkyTexture(day) {
  const c = document.createElement('canvas');
  c.width = 2; c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  if (day) {
    grad.addColorStop(0, '#4A85C9');
    grad.addColorStop(0.45, '#8FBFDE');
    grad.addColorStop(0.75, '#F6D9A8');
    grad.addColorStop(1, '#F4B97D');
  } else {
    grad.addColorStop(0, '#050814');
    grad.addColorStop(0.6, '#141B33');
    grad.addColorStop(1, '#2B3350');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function animateWalkCycle(group, t, moving) {
  if (moving) {
    group.userData.legL.rotation.x = Math.sin(t) * 0.55;
    group.userData.legR.rotation.x = -Math.sin(t) * 0.55;
    group.userData.armL.rotation.x = -Math.sin(t) * 0.45;
    group.userData.armR.rotation.x = Math.sin(t) * 0.45;
    group.position.y = group.userData.baseY + Math.abs(Math.sin(t)) * 0.03;
  } else {
    group.userData.legL.rotation.x *= 0.85;
    group.userData.legR.rotation.x *= 0.85;
    group.userData.armL.rotation.x *= 0.85;
    group.userData.armR.rotation.x *= 0.85;
  }
}

// A rounder, chibi-proportioned character — Blueprint's own look rather than blocky Roblox minifigs.
function makeAvatar({ skin = 0xF0C29B, top = ACCENT, bottom = 0x3A3733, hair = 0x4A342A } = {}) {
  const group = new THREE.Group();
  const skinMat = toonMat(skin);
  const topMat = toonMat(top);
  const bottomMat = toonMat(bottom);
  const hairMat = toonMat(hair);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2B2620 });
  const shoeMat = toonMat(0xFAF6EE);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), skinMat);
  head.position.y = 1.42;
  head.scale.set(1, 0.95, 0.92);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.255, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
  hairCap.position.y = 1.48;

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), eyeMat);
  eyeL.position.set(-0.085, 1.42, 0.205);
  const eyeR = eyeL.clone(); eyeR.position.x = 0.085;

  const cheekMat = new THREE.MeshBasicMaterial({ color: 0xE8927A, transparent: true, opacity: 0.55 });
  const cheekL = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10), cheekMat);
  cheekL.position.set(-0.14, 1.36, 0.195); cheekL.rotation.y = -0.3;
  const cheekR = cheekL.clone(); cheekR.position.x = 0.14; cheekR.rotation.y = 0.3;

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.165, 0.32, 4, 10), topMat);
  torso.position.y = 1.03;

  const legGeo = new THREE.CapsuleGeometry(0.075, 0.32, 4, 8);
  const legL = new THREE.Mesh(legGeo, bottomMat);
  legL.position.set(-0.09, 0.55, 0);
  const legR = legL.clone(); legR.position.x = 0.09;

  const shoeGeo = new THREE.SphereGeometry(0.09, 10, 8);
  const shoeL = new THREE.Mesh(shoeGeo, shoeMat);
  shoeL.position.set(-0.09, 0.22, 0.03); shoeL.scale.set(1, 0.7, 1.3);
  const shoeR = shoeL.clone(); shoeR.position.x = 0.09;

  const armGeo = new THREE.CapsuleGeometry(0.06, 0.28, 4, 8);
  const armL = new THREE.Mesh(armGeo, topMat);
  armL.position.set(-0.235, 1.05, 0);
  const armR = armL.clone(); armR.position.x = 0.235;
  const handGeo = new THREE.SphereGeometry(0.055, 8, 8);
  const handL = new THREE.Mesh(handGeo, skinMat); handL.position.set(0, -0.16, 0); armL.add(handL);
  const handR = handL.clone(); armR.add(handR);

  group.add(head, hairCap, eyeL, eyeR, cheekL, cheekR, torso, legL, legR, shoeL, shoeR, armL, armR);
  group.userData = { legL, legR, armL, armR, head, baseY: 0 };
  return enableShadows(group);
}

function makeTree(scale = 1, kind = 'round') {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.9, 8), toonMat(0x8a6a4a));
  trunk.position.y = 0.45;
  group.add(trunk);
  if (kind === 'pine') {
    const foliageMat = toonMat(0x4d7a4a);
    const tiers = [
      { r: 0.5, y: 1.0 }, { r: 0.4, y: 1.35 }, { r: 0.3, y: 1.65 },
    ];
    const foliage = tiers.map(t => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, 0.6, 9), foliageMat);
      cone.position.y = t.y;
      group.add(cone);
      return cone;
    });
    group.userData.sway = Math.random() * Math.PI * 2;
    group.userData.foliage = foliage;
  } else {
    const foliageMat = toonMat(0x6f9a5c);
    const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), foliageMat); c1.position.y = 1.15;
    const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), foliageMat); c2.position.set(0.28, 0.95, 0.1);
    const c3 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), foliageMat); c3.position.set(-0.25, 0.9, -0.15);
    group.add(c1, c2, c3);
    group.userData.sway = Math.random() * Math.PI * 2;
    group.userData.foliage = [c1, c2, c3];
  }
  group.scale.setScalar(scale);
  return enableShadows(group);
}

function makeFlowerBed(colors) {
  const group = new THREE.Group();
  const bedMat = toonMat(0x5C4A3A);
  const bed = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.12, 12), bedMat);
  bed.position.y = 0.06;
  group.add(bed);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), toonMat(colors[i % colors.length]));
    flower.position.set(Math.cos(a) * 0.3, 0.18, Math.sin(a) * 0.3);
    group.add(flower);
  }
  return enableShadows(group);
}

function makeFencePost() {
  const group = new THREE.Group();
  const mat = toonMat(0xEDE6D6);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.65, 0.07), mat);
  post.position.y = 0.325;
  group.add(post);
  return enableShadows(group);
}

function makeCar(color) {
  const group = new THREE.Group();
  const bodyMat = toonMat(color);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 0.55), bodyMat);
  body.position.y = 0.35;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 0.5), bodyMat);
  cabin.position.set(-0.05, 0.62, 0);
  const wheelMat = toonMat(0x2A2622);
  const wheelGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 12);
  const positions = [[-0.32, 0.16, 0.28], [0.32, 0.16, 0.28], [-0.32, 0.16, -0.28], [0.32, 0.16, -0.28]];
  positions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    group.add(wheel);
  });
  group.add(body, cabin);
  return enableShadows(group);
}

function makeVan(color) {
  const group = new THREE.Group();
  const bodyMat = toonMat(color);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.75, 0.68), bodyMat);
  body.position.y = 0.5;
  const wheelMat = toonMat(0x2A2622);
  const wheelGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 12);
  const positions = [[-0.5, 0.18, 0.34], [0.5, 0.18, 0.34], [-0.5, 0.18, -0.34], [0.5, 0.18, -0.34]];
  positions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    group.add(wheel);
  });
  group.add(body);
  return enableShadows(group);
}

function makeHouse(color, roofColor) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 2.2), toonMat(color));
  body.position.y = 0.8;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.0, 4), toonMat(roofColor));
  roof.position.y = 2.1;
  roof.rotation.y = Math.PI / 4;
  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.8), toonMat(roofColor));
  porchRoof.position.set(0, 1.5, 1.5);
  const porchPostGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
  const postMat = toonMat(0xF5F1E8);
  const postL = new THREE.Mesh(porchPostGeo, postMat); postL.position.set(-0.6, 0.75, 1.85);
  const postR = postL.clone(); postR.position.x = 0.6;
  const garage = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.06), toonMat(0xDCD3C0));
  garage.position.set(-0.9, 0.55, 1.13);
  group.add(body, roof, porchRoof, postL, postR, garage);
  return enableShadows(group);
}

function makeBench() {
  const group = new THREE.Group();
  const mat = toonMat(0x8a6a4a);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.4), mat);
  seat.position.y = 0.45;
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 0.06), mat);
  back.position.set(0, 0.68, -0.17);
  const legMat = toonMat(0x3A3733);
  [[-0.48, 0.22, 0.15], [0.48, 0.22, 0.15], [-0.48, 0.22, -0.15], [0.48, 0.22, -0.15]].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.06), legMat);
    leg.position.set(x, y, z);
    group.add(leg);
  });
  group.add(seat, back);
  return enableShadows(group);
}

function makeLamppost() {
  const group = new THREE.Group();
  const poleMat = toonMat(0x3A3733);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.2, 8), poleMat);
  pole.position.y = 1.1;
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xFFE9B0 });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), lampMat);
  lamp.position.y = 2.25;
  group.add(pole, lamp);
  return enableShadows(group, true, false);
}

function makeCafe() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 1.8), toonMat(0xE9D9BE));
  body.position.y = 0.7;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 2.0), toonMat(0x5C6B4F));
  roof.position.y = 1.46;
  const awning = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.6), toonMat(0xB0452F));
  awning.position.set(0, 1.1, 1.1);
  awning.rotation.x = -0.25;
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.06), toonMat(0xF5F1E8));
  sign.position.set(0, 1.55, 0.92);
  group.add(body, roof, awning, sign);
  return enableShadows(group);
}

function makeDog(color = 0x8a6a4a) {
  const group = new THREE.Group();
  const mat = toonMat(color);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.22, 4, 8), mat);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.16;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), mat);
  head.position.set(0.2, 0.2, 0);
  const earMat = toonMat(0x5C4A3A);
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 6), earMat);
  earL.position.set(0.24, 0.28, 0.06);
  const earR = earL.clone(); earR.position.z = -0.06;
  const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.16, 6);
  const legs = [];
  [[-0.12, 0.08, 0.07], [-0.12, 0.08, -0.07], [0.1, 0.08, 0.07], [0.1, 0.08, -0.07]].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, mat);
    leg.position.set(x, y, z);
    group.add(leg);
    legs.push(leg);
  });
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.18, 6), mat);
  tail.position.set(-0.22, 0.22, 0);
  tail.rotation.z = Math.PI / 3;
  group.add(body, head, earL, earR, tail);
  group.userData.legs = legs;
  return enableShadows(group);
}

function makeBike() {
  const group = new THREE.Group();
  const frameMat = toonMat(0x3E5C76);
  const wheelMat = toonMat(0x2A2622);
  const wheelGeo = new THREE.TorusGeometry(0.22, 0.025, 8, 16);
  const wheelF = new THREE.Mesh(wheelGeo, wheelMat); wheelF.position.set(0.32, 0.22, 0);
  const wheelB = new THREE.Mesh(wheelGeo, wheelMat); wheelB.position.set(-0.32, 0.22, 0);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.04), frameMat);
  frame.position.set(0, 0.32, 0);
  const seatPost = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6), frameMat);
  seatPost.position.set(-0.2, 0.44, 0);
  group.add(wheelF, wheelB, frame, seatPost);
  return enableShadows(group);
}

function makeBird() {
  const group = new THREE.Group();
  const mat = toonMat(0x3A3733);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), mat);
  body.scale.set(1.4, 0.8, 0.8);
  const wingGeo = new THREE.CircleGeometry(0.11, 8, 0, Math.PI);
  const wingL = new THREE.Mesh(wingGeo, mat);
  wingL.position.set(-0.05, 0, 0); wingL.rotation.y = Math.PI / 2;
  const wingR = wingL.clone(); wingR.position.x = 0.05;
  group.add(body, wingL, wingR);
  group.userData = { wingL, wingR };
  return group;
}

function makeFurnitureMesh(cellData, opacity = 1) {
  const piece = pieceById[cellData.pieceId];
  if (!piece) return null;
  const shape = CATEGORY_SHAPE[piece.category] || CATEGORY_SHAPE.decor;
  const hex = new THREE.Color(colorHex(cellData.color));
  const mat = toonMat(hex, opacity < 1 ? { transparent: true, opacity } : undefined);
  let mesh;
  if (shape.kind === 'sphere') {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(shape.r, 12, 12), mat);
  } else if (shape.kind === 'plant') {
    const group = new THREE.Group();
    const potMat = toonMat(0x8a6a52, opacity < 1 ? { transparent: true, opacity } : undefined);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.22, 10), potMat);
    pot.position.y = 0.11;
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), mat);
    foliage.position.y = 0.48;
    group.add(pot, foliage);
    mesh = group;
  } else {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(shape.w, shape.h, shape.d), mat);
  }
  mesh.position.y = shape.y;
  mesh.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
  return mesh;
}

export default function Play3DView({ room, plotW, plotH, daytime, flying, running, activePiece, activeColor, onPlaceCell, onRemoveCell, onAvatarPos, onFoundationPreview, onFoundationCommit }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({});
  const roomRef = useRef(room);
  const plotWRef = useRef(plotW || 14);
  const plotHRef = useRef(plotH || 11);
  const activeRef = useRef({ piece: activePiece, color: activeColor });
  const onPlaceCellRef = useRef(onPlaceCell);
  const onRemoveCellRef = useRef(onRemoveCell);
  const onAvatarPosRef = useRef(onAvatarPos);
  const onFoundationPreviewRef = useRef(onFoundationPreview);
  const onFoundationCommitRef = useRef(onFoundationCommit);
  onPlaceCellRef.current = onPlaceCell;
  onRemoveCellRef.current = onRemoveCell;
  onAvatarPosRef.current = onAvatarPos;
  onFoundationPreviewRef.current = onFoundationPreview;
  onFoundationCommitRef.current = onFoundationCommit;
  const daytimeRef = useRef(daytime);
  const flyingRef = useRef(flying);
  const runningRef = useRef(running);

  useEffect(() => {
    roomRef.current = room;
    if (stateRef.current.buildRoom) stateRef.current.buildRoom();
    if (stateRef.current.rebuildFurniture) stateRef.current.rebuildFurniture();
    if (stateRef.current.rebuildGridOverlay) stateRef.current.rebuildGridOverlay();
  }, [room]);
  useEffect(() => { plotWRef.current = plotW || 14; plotHRef.current = plotH || 11; }, [plotW, plotH]);
  useEffect(() => { activeRef.current = { piece: activePiece, color: activeColor }; if (stateRef.current.rebuildGhost) stateRef.current.rebuildGhost(); }, [activePiece, activeColor]);
  useEffect(() => { daytimeRef.current = daytime; if (stateRef.current.applyLighting) stateRef.current.applyLighting(); }, [daytime]);
  useEffect(() => { flyingRef.current = flying; }, [flying]);
  useEffect(() => { runningRef.current = running; }, [running]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    canvas.tabIndex = 0;
    canvas.style.outline = 'none';
    canvas.focus();
    const refocus = () => canvas.focus();
    canvas.addEventListener('pointerdown', refocus);
    canvas.addEventListener('mouseenter', refocus);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 150);

    const hemi = new THREE.HemisphereLight(0xfff0d8, 0x4a4438, 1.0);
    const sun = new THREE.DirectionalLight(0xffd9a0, 1.3);
    sun.position.set(10, 7, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -20; sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20; sun.shadow.camera.bottom = -20;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 45;
    sun.shadow.bias = -0.0015;
    const fill = new THREE.DirectionalLight(0xa9c3dd, 0.28);
    fill.position.set(-6, 4, -4);
    scene.add(hemi, sun, fill);

    const applyLighting = () => {
      const day = daytimeRef.current;
      scene.background = makeSkyTexture(day);
      scene.fog = new THREE.Fog(day ? 0xe8c9a0 : 0x0c1120, 16, day ? 58 : 40);
      hemi.intensity = day ? 1.05 : 0.32;
      hemi.groundColor.set(day ? 0x4a4438 : 0x14141c);
      sun.intensity = day ? 1.3 : 0.12;
      sun.color.set(day ? 0xffd9a0 : 0x6c85c9);
      fill.intensity = day ? 0.28 : 0.15;
    };
    applyLighting();
    stateRef.current.applyLighting = applyLighting;

    // ---- static world: ground, road, houses, trees ----
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const buildNeighborhood = (gridW, gridH) => {
      worldGroup.clear();
      const groundMat = toonMat(0x8FAD62);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(gridW + OUT * 2, gridH + OUT * 2), groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(gridW / 2, -0.01, gridH / 2);
      ground.receiveShadow = true;
      worldGroup.add(ground);

      // patchy grass texture: scattered soft tone variations so the lawn isn't one flat color
      const patchTones = [0x9BBF6E, 0x84A557, 0x7A9E50];
      for (let i = 0; i < 46; i++) {
        const px = (Math.sin(i * 12.9898) * 0.5 + 0.5) * (gridW + OUT * 2) - OUT;
        const pz = (Math.sin(i * 78.233 + 4) * 0.5 + 0.5) * (gridH + OUT * 2) - OUT;
        if (pz > -6.5 && pz < gridH + 1 && px > -1 && px < gridW + 1) continue; // keep near-lot clear-ish
        const patch = new THREE.Mesh(new THREE.CircleGeometry(0.7 + (i % 3) * 0.35, 8), toonMat(patchTones[i % patchTones.length]));
        patch.rotation.x = -Math.PI / 2;
        patch.position.set(px, 0, pz);
        worldGroup.add(patch);
      }

      const roadZ = -5;
      const road = new THREE.Mesh(new THREE.PlaneGeometry(gridW + OUT * 2, 3.4), toonMat(0x38352F));
      road.rotation.x = -Math.PI / 2;
      road.position.set(gridW / 2, 0.005, roadZ);
      road.receiveShadow = true;
      worldGroup.add(road);
      for (let x = -OUT; x < gridW + OUT; x += 1.6) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.12), toonMat(0xEDE0BE));
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.01, roadZ);
        worldGroup.add(dash);
      }
      [roadZ - 1.9, roadZ + 1.9].forEach(sz => {
        const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(gridW + OUT * 2, 1.1), toonMat(0xD8D0BE));
        sidewalk.rotation.x = -Math.PI / 2;
        sidewalk.position.set(gridW / 2, 0.006, sz);
        sidewalk.receiveShadow = true;
        worldGroup.add(sidewalk);
      });

      // low fence along the lot's side property lines
      const fenceRailMat = toonMat(0xEDE6D6);
      [-0.35, gridW + 0.35].forEach(fx => {
        for (let z = 0; z <= gridH; z += 0.9) {
          const post = makeFencePost();
          post.position.set(fx, 0, z);
          worldGroup.add(post);
        }
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, gridH), fenceRailMat);
        rail.position.set(fx, 0.5, gridH / 2);
        worldGroup.add(enableShadows(rail));
      });

      // flower beds flanking the front door
      const flowerPalette = [0xE6879B, 0xF2C94C, 0xF5F1E8, 0xB07CC6];
      [[gridW * 0.5 - 1.6, -0.6], [gridW * 0.5 + 1.6, -0.6]].forEach(([x, z]) => {
        const bed = makeFlowerBed(flowerPalette);
        bed.position.set(x, 0, z);
        worldGroup.add(bed);
      });

      const houseColors = [[0xE8DCC8, 0xB05A3C], [0xCFE0E6, 0x5C6B6F]];
      [gridW * 0.18, gridW * 0.82].forEach((x, i) => {
        const h = makeHouse(houseColors[i][0], houseColors[i][1]);
        h.position.set(x, 0, roadZ - 4.5);
        h.rotation.y = i === 0 ? 0.2 : -0.2;
        worldGroup.add(h);
      });

      // a small park: bench + lamppost + flowers, somewhere to walk to
      const parkX = gridW + 8, parkZ = -1.5;
      const parkBench = makeBench(); parkBench.position.set(parkX, 0, parkZ); parkBench.rotation.y = Math.PI * 0.4;
      const parkLamp = makeLamppost(); parkLamp.position.set(parkX + 1, 0, parkZ - 1);
      const parkFlowers = makeFlowerBed(flowerPalette); parkFlowers.position.set(parkX - 1, 0, parkZ + 0.5);
      worldGroup.add(parkBench, parkLamp, parkFlowers);
      [parkX - 1.8, parkX + 1.6].forEach((x, i) => {
        const t = makeTree(1.0, i % 2 === 0 ? 'pine' : 'round');
        t.position.set(x, 0, parkZ - 2.2);
        worldGroup.add(t);
      });

      // a cafe down the street
      const cafe = makeCafe();
      cafe.position.set(-8, 0, roadZ - 3.6);
      cafe.rotation.y = 0.3;
      worldGroup.add(cafe);

      const treeSpots = [
        [-2.5, 1.5], [-2.5, gridH - 1.5], [gridW + 2.5, 1.5], [gridW + 2.5, gridH - 1.5],
        [-2, -2.5], [gridW * 0.35, -2.7], [gridW * 0.9, -2.4], [-1.5, gridH * 0.6],
        [gridW + 1.8, gridH * 0.4], [gridW * 0.6, gridH + 2],
      ];
      treeSpots.forEach(([x, z], i) => {
        const t = makeTree(0.85 + (i % 3) * 0.12, i % 3 === 0 ? 'pine' : 'round');
        t.position.set(x, 0, z);
        worldGroup.add(t);
      });
    };
    buildNeighborhood(plotWRef.current, plotHRef.current);

    // distant mountain ridge for scenic depth beyond the neighborhood
    const mountainMat = toonMat(0x8FA3B8, { transparent: true, opacity: 0.85 });
    const ridgeGroup = new THREE.Group();
    const ridgePeaks = [
      [-0.6, 6.5, 5.5], [0.15, 9, 7], [0.55, 7.5, 6], [1.0, 10.5, 8], [1.5, 7, 5.5], [1.9, 8.5, 6.5],
    ];
    ridgePeaks.forEach(([fx, h, w]) => {
      const peak = new THREE.Mesh(new THREE.ConeGeometry(w, h, 5), mountainMat);
      peak.position.set(plotWRef.current * fx, h / 2 - 0.3, -OUT - 34);
      ridgeGroup.add(peak);
    });
    ridgeGroup.renderOrder = -1;
    scene.add(ridgeGroup);

    // ---- moving extras: cars, NPCs, birds, clouds ----
    const extrasGroup = new THREE.Group();
    scene.add(extrasGroup);
    const gw = plotWRef.current;
    const cars = [makeCar(0xB2452F), makeVan(0xE0DCC8)];
    cars.forEach((c, i) => { c.userData.phase = i * 6; c.userData.speed = 1.4 + i * 0.3; extrasGroup.add(c); });
    const roadLen = gw + OUT * 2 - 2;

    const npcs = [makeAvatar({ skin: 0xE0B48E, top: 0x7C9473, bottom: 0x4A4238, hair: 0x2B2620 }), makeAvatar({ skin: 0xF0C29B, top: 0x5C87A6, bottom: 0x3A3733, hair: 0x6B4A2A })];
    npcs.forEach((n, i) => { n.userData.baseY = 0; n.userData.phase = i * 3; n.userData.center = gw * (0.3 + i * 0.4); n.position.set(n.userData.center, 0, -2.2); extrasGroup.add(n); });

    const dog = makeDog();
    extrasGroup.add(dog);

    const cyclist = new THREE.Group();
    const rider = makeAvatar({ skin: 0xF0C29B, top: 0xC1602E, bottom: 0x2B2620, hair: 0x2B2620 });
    rider.position.y = 0.28;
    rider.scale.setScalar(0.92);
    const bike = makeBike();
    cyclist.add(bike, rider);
    cyclist.userData = { legL: rider.userData.legL, legR: rider.userData.legR, armL: rider.userData.armL, armR: rider.userData.armR, baseY: 0 };
    extrasGroup.add(cyclist);

    const birds = [makeBird(), makeBird(), makeBird()];
    birds.forEach((b, i) => { b.userData.phase = i * 2.1; extrasGroup.add(b); });

    const clouds = [];
    for (let i = 0; i < 4; i++) {
      const cloud = new THREE.Group();
      const cm = toonMat(0xffffff, { transparent: true, opacity: 0.9 });
      for (let j = 0; j < 3; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.9 + Math.random() * 0.4, 8, 6), cm);
        puff.position.set(j * 1.1 - 1, Math.random() * 0.3, 0);
        cloud.add(puff);
      }
      cloud.scale.setScalar(1.4);
      cloud.position.set((i / 4) * (gw + OUT * 2) - OUT, 11 + i * 0.6, gw * 0.3 - OUT * 0.4);
      cloud.userData.phase = i;
      clouds.push(cloud);
      scene.add(cloud);
    }

    // ---- room (with a doorway gap) + furniture ----
    const roomGroup = new THREE.Group();
    const furnitureGroup = new THREE.Group();
    scene.add(roomGroup, furnitureGroup);
    let risingGroup = null; // walls+roof group currently mid rise-animation
    let riseT = 1;

    // an empty lot still shows a defined, inviting foundation pad rather than bare lawn
    const padGroup = new THREE.Group();
    scene.add(padGroup);
    const buildFoundationPad = (gridW, gridH) => {
      padGroup.clear();
      const padMat = toonMat(0xC9BC9E);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(gridW, 0.06, gridH), padMat);
      pad.position.set(gridW / 2, 0.03, gridH / 2);
      pad.receiveShadow = true;
      padGroup.add(pad);
      const borderMat = new THREE.LineBasicMaterial({ color: 0xEDE6D6, transparent: true, opacity: 0.85 });
      const pts = [
        new THREE.Vector3(0, 0.065, 0), new THREE.Vector3(gridW, 0.065, 0),
        new THREE.Vector3(gridW, 0.065, gridH), new THREE.Vector3(0, 0.065, gridH),
        new THREE.Vector3(0, 0.065, 0),
      ];
      padGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), borderMat));
    };
    buildFoundationPad(plotWRef.current, plotHRef.current);

    // live drag/hover preview of the footprint the player is about to build, anchored at (0,0)
    const foundationPreviewGroup = new THREE.Group();
    scene.add(foundationPreviewGroup);
    const foundationPreviewMat = toonMat(ACCENT, { transparent: true, opacity: 0.4 });
    const foundationPreviewMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1), foundationPreviewMat);
    foundationPreviewGroup.add(foundationPreviewMesh);
    foundationPreviewGroup.visible = false;
    let pendingFoundation = { gridW: 8, gridH: 6 };
    const MIN_FOOTPRINT = 4;
    const setFoundationPreviewSize = (gridW, gridH) => {
      pendingFoundation = { gridW, gridH };
      foundationPreviewMesh.scale.set(gridW, 1, gridH);
      foundationPreviewMesh.position.set(gridW / 2, 0.09, gridH / 2);
      onFoundationPreviewRef.current && onFoundationPreviewRef.current({ gridW, gridH });
    };
    const updateFoundationPreview = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(floorPlane, hit)) return;
      const gridW = Math.min(plotWRef.current, Math.max(MIN_FOOTPRINT, Math.round(hit.x)));
      const gridH = Math.min(plotHRef.current, Math.max(MIN_FOOTPRINT, Math.round(hit.z)));
      foundationPreviewGroup.visible = true;
      setFoundationPreviewSize(gridW, gridH);
    };

    const buildRoom = () => {
      const r = roomRef.current;
      const wasRoomId = roomGroup.userData.roomId;
      roomGroup.clear();
      padGroup.visible = !r;
      foundationPreviewGroup.visible = false;
      if (!r) {
        buildFoundationPad(plotWRef.current, plotHRef.current);
        return;
      }
      const floorMat = toonMat(new THREE.Color(colorHex(r.floorColor)));
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(r.gridW, r.gridH), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(r.gridW / 2, 0.002, r.gridH / 2);
      floor.receiveShadow = true;
      roomGroup.add(floor);

      // walls + roof rise together so a freshly built room feels like it's under construction
      const risen = new THREE.Group();
      roomGroup.add(risen);

      const wallMat = toonMat(new THREE.Color(colorHex(r.wallColor)));
      const wallH = 2.4, t = 0.08;
      const mk = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat); m.position.set(x, wallH / 2, z); m.castShadow = true; m.receiveShadow = true; return m; };
      const doorHalf = Math.min(0.9, r.gridW * 0.15);
      const doorCenter = r.gridW / 2;
      risen.add(
        mk(doorCenter - doorHalf, t, (doorCenter - doorHalf) / 2, 0),
        mk(r.gridW - (doorCenter + doorHalf), t, doorCenter + doorHalf + (r.gridW - (doorCenter + doorHalf)) / 2, 0),
        mk(r.gridW + t, t, r.gridW / 2, r.gridH),
        mk(t, r.gridH + t, 0, r.gridH / 2),
        mk(t, r.gridH + t, r.gridW, r.gridH / 2),
      );

      // pitched roof so the house reads as a real building from outside, not an open box
      const roofRise = Math.min(1.3, r.gridW * 0.22);
      const halfSpan = r.gridW / 2;
      const slopeLen = Math.sqrt(halfSpan * halfSpan + roofRise * roofRise) + 0.3;
      const angle = Math.atan2(roofRise, halfSpan);
      const roofMat = toonMat(0x8B5A3C);
      const mkSlab = (sign) => {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.12, r.gridH + 0.6), roofMat);
        slab.position.set(r.gridW / 2 + sign * (halfSpan / 2) * 0.98, wallH + roofRise / 2, r.gridH / 2);
        slab.rotation.z = sign * angle;
        slab.castShadow = true;
        slab.receiveShadow = true;
        return slab;
      };
      risen.add(mkSlab(1), mkSlab(-1));

      risen.position.y = 0;
      risen.userData.riseOrigin = 0;
      if (wasRoomId !== r.id) {
        // genuinely new room: animate it rising out of the foundation
        risingGroup = risen;
        riseT = 0;
        risen.scale.y = 0.001;
      } else {
        risen.scale.y = 1;
      }
      roomGroup.userData.roomId = r.id;
    };
    buildRoom();
    stateRef.current.buildRoom = buildRoom;

    let knownCellKeys = new Set();
    const rebuildFurniture = () => {
      furnitureGroup.clear();
      const r = roomRef.current;
      if (!r) return;
      const nextKeys = new Set();
      Object.entries(r.cells).forEach(([key, cellData]) => {
        const [gx, gy] = key.split(',').map(Number);
        const mesh = makeFurnitureMesh(cellData);
        if (!mesh) return;
        mesh.position.x += gx + 0.5;
        mesh.position.z += gy + 0.5;
        mesh.userData.cellKey = key;
        nextKeys.add(key);
        if (!knownCellKeys.has(key)) mesh.userData.popT = 0;
        furnitureGroup.add(mesh);
      });
      knownCellKeys = nextKeys;
    };
    rebuildFurniture();
    stateRef.current.rebuildFurniture = rebuildFurniture;

    // ---- build feedback: grid overlay, ghost preview, target highlight ----
    const gridHelperGroup = new THREE.Group();
    scene.add(gridHelperGroup);
    const buildGridOverlay = () => {
      gridHelperGroup.clear();
      const r = roomRef.current;
      if (!r) return;
      const lineMat = new THREE.LineBasicMaterial({ color: 0x4C8FD1, transparent: true, opacity: 0.55 });
      const pts = [];
      for (let x = 0; x <= r.gridW; x++) pts.push(new THREE.Vector3(x, 0.012, 0), new THREE.Vector3(x, 0.012, r.gridH));
      for (let z = 0; z <= r.gridH; z++) pts.push(new THREE.Vector3(0, 0.012, z), new THREE.Vector3(r.gridW, 0.012, z));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      gridHelperGroup.add(new THREE.LineSegments(geo, lineMat));
    };
    buildGridOverlay();
    stateRef.current.rebuildGridOverlay = buildGridOverlay;

    const ghostGroup = new THREE.Group();
    scene.add(ghostGroup);
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0x4C8FD1, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    const highlight = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.96), highlightMat);
    highlight.rotation.x = -Math.PI / 2;
    highlight.visible = false;
    scene.add(highlight);

    const rebuildGhost = () => {
      ghostGroup.clear();
      const active = activeRef.current.piece;
      gridHelperGroup.visible = !!active;
      highlight.visible = false;
      if (!active) return;
      const ghostMesh = makeFurnitureMesh({ pieceId: active.id, color: activeRef.current.color }, 0.45);
      if (ghostMesh) ghostGroup.add(ghostMesh);
    };
    rebuildGhost();
    stateRef.current.rebuildGhost = rebuildGhost;
    let hoverCell = null;

    const player = makeAvatar();
    const bounds = { w: () => plotWRef.current, h: () => plotHRef.current };
    player.position.set(bounds.w() * 0.5, 0, bounds.h() * 0.65);
    scene.add(player);

    const keys = {};
    const onKeyDown = (e) => { keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); };
    const onKeyUp = (e) => { keys[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let yaw = 0, pitch = 0.12, camBlend = 0;
    let dragging = false, lastX = 0, lastY = 0, moved = false, downOnCanvas = false;
    const raycaster = new THREE.Raycaster();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    const updateHover = (clientX, clientY) => {
      const active = activeRef.current.piece;
      if (!active) return;
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(floorPlane, hit)) return;
      const r = roomRef.current;
      const gx = Math.min(r.gridW - 1, Math.max(0, Math.floor(hit.x)));
      const gy = Math.min(r.gridH - 1, Math.max(0, Math.floor(hit.z)));
      hoverCell = [gx, gy];
      ghostGroup.position.set(gx + 0.5, 0, gy + 0.5);
      highlight.position.set(gx + 0.5, 0.015, gy + 0.5);
      highlight.visible = true;
    };

    const onPointerDown = (e) => { dragging = true; downOnCanvas = true; lastX = e.clientX; lastY = e.clientY; moved = false; };
    const onPointerMove = (e) => {
      if (!roomRef.current) {
        // no room yet: dragging (or just hovering) sizes the foundation footprint instead of rotating the camera
        updateFoundationPreview(e.clientX, e.clientY);
        lastX = e.clientX; lastY = e.clientY;
        return;
      }
      if (dragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
        yaw -= dx * 0.006;
        pitch = Math.max(-0.3, Math.min(0.75, pitch - dy * 0.004));
        lastX = e.clientX; lastY = e.clientY;
      } else {
        updateHover(e.clientX, e.clientY);
      }
    };
    const onPointerUp = (e) => {
      dragging = false;
      if (!downOnCanvas) { downOnCanvas = false; return; }
      downOnCanvas = false;
      if (!roomRef.current) {
        onFoundationCommitRef.current && onFoundationCommitRef.current(pendingFoundation.gridW, pendingFoundation.gridH);
        return;
      }
      if (moved) return;
      const active = activeRef.current.piece;
      if (active && hoverCell) {
        onPlaceCellRef.current && onPlaceCellRef.current(hoverCell[0], hoverCell[1]);
      } else if (!active) {
        const rect = canvas.getBoundingClientRect();
        const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects(furnitureGroup.children, true);
        if (hits.length) {
          let obj = hits[0].object;
          while (obj && !obj.userData.cellKey && obj.parent) obj = obj.parent;
          if (obj && obj.userData.cellKey) onRemoveCellRef.current && onRemoveCellRef.current(obj.userData.cellKey);
        }
      }
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    let jumpT = 0;
    let raf = null;
    let last = performance.now();
    let elapsed = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += dt;

      const speed = (runningRef.current ? 5.5 : 2.8) * dt;
      const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2));
      let mx = 0, mz = 0;
      if (keys['KeyW']) { mx += fwd.x; mz += fwd.z; }
      if (keys['KeyS']) { mx -= fwd.x; mz -= fwd.z; }
      if (keys['KeyA']) { mx -= right.x; mz -= right.z; }
      if (keys['KeyD']) { mx += right.x; mz += right.z; }
      const mag = Math.hypot(mx, mz);
      const moving = mag > 0.001;
      if (moving) {
        player.position.x += (mx / mag) * speed;
        player.position.z += (mz / mag) * speed;
        player.rotation.y = Math.atan2(mx, mz);
      }
      animateWalkCycle(player, now / 110, moving);

      const margin = 0.3;
      player.position.x = Math.max(-OUT + margin, Math.min(bounds.w() + OUT - margin, player.position.x));
      player.position.z = Math.max(-OUT + margin, Math.min(bounds.h() + OUT - margin, player.position.z));

      if (flyingRef.current) {
        if (keys['Space']) player.position.y += 2.2 * dt;
        if (keys['ShiftLeft'] || keys['ShiftRight']) player.position.y = Math.max(0, player.position.y - 2.2 * dt);
      } else if (keys['Space'] && jumpT <= 0) {
        jumpT = 0.5;
      }
      if (jumpT > 0) {
        jumpT -= dt;
        player.position.y = Math.max(0, Math.sin((1 - jumpT / 0.5) * Math.PI) * 0.55);
      } else if (!flyingRef.current) {
        player.position.y = 0;
      }

      if (highlight.visible) highlight.position.y = 0.015 + Math.sin(elapsed * 3) * 0.004;

      // ambient life
      cars.forEach(c => {
        const x = ((elapsed * c.userData.speed + c.userData.phase) % roadLen) - roadLen / 2 + gw / 2;
        c.position.set(x, 0, -5);
        c.rotation.y = -Math.PI / 2;
      });
      npcs.forEach((n, i) => {
        const t = elapsed * 0.6 + n.userData.phase;
        const x = n.userData.center + Math.sin(t) * 3.2;
        n.position.x = x;
        n.rotation.y = Math.cos(t) >= 0 ? Math.PI / 2 : -Math.PI / 2;
        animateWalkCycle(n, elapsed * 6 + i, true);
      });
      {
        // dog trails just behind and to the side of the first NPC (its "owner")
        const owner = npcs[0];
        const trail = elapsed * 0.6 + npcs[0].userData.phase - 0.35;
        dog.position.set(owner.position.x - Math.sin(trail) * 0.6, 0, owner.position.z + 0.5);
        dog.rotation.y = owner.rotation.y;
        const dt2 = elapsed * 10;
        dog.userData.legs[0].rotation.x = Math.sin(dt2) * 0.7;
        dog.userData.legs[1].rotation.x = -Math.sin(dt2) * 0.7;
        dog.userData.legs[2].rotation.x = -Math.sin(dt2) * 0.7;
        dog.userData.legs[3].rotation.x = Math.sin(dt2) * 0.7;
      }
      {
        const ct = elapsed * 0.35;
        const cyRadius = gw / 2 + 3.6;
        cyclist.position.set(gw / 2 + Math.cos(ct) * cyRadius, 0, -3.3 + Math.sin(ct) * 1.2);
        cyclist.rotation.y = -ct + Math.PI / 2;
        const pedal = elapsed * 9;
        cyclist.userData.legL.rotation.x = Math.sin(pedal) * 0.8;
        cyclist.userData.legR.rotation.x = -Math.sin(pedal) * 0.8;
      }
      birds.forEach((b, i) => {
        const t = elapsed * 0.5 + b.userData.phase;
        const r = gw * 0.5 + 4;
        b.position.set(gw / 2 + Math.cos(t) * r, 6.5 + Math.sin(t * 0.7) * 0.8, gw * 0.3 + Math.sin(t) * r * 0.6);
        b.rotation.y = -t + Math.PI / 2;
        const flap = Math.sin(elapsed * 12 + i);
        b.userData.wingL.rotation.z = flap * 0.6;
        b.userData.wingR.rotation.z = -flap * 0.6;
      });
      clouds.forEach((c, i) => {
        c.position.x = ((elapsed * 0.15 + i * 3) % (gw + OUT * 2 + 6)) - OUT - 3;
      });

      if (risingGroup && riseT < 1) {
        riseT = Math.min(1, riseT + dt * 1.1);
        const overshoot = riseT < 1 ? 1 + Math.sin(riseT * Math.PI) * 0.1 * (1 - riseT) : 1;
        risingGroup.scale.y = Math.max(0.001, riseT * overshoot);
        if (riseT >= 1) { risingGroup.scale.y = 1; risingGroup = null; }
      }

      const targetBlend = activeRef.current.piece ? 1 : 0;
      camBlend += (targetBlend - camBlend) * Math.min(1, dt * 3);
      const camMargin = 0.4;
      const camDist = Math.max(1.2, 2.7 + camBlend * 1.9);
      const camBaseHeight = 1.5 + camBlend * 1.1;
      const camHoriz = camDist * Math.cos(pitch);
      const camHeight = player.position.y + camBaseHeight + camDist * Math.sin(pitch);
      const camX = Math.max(-OUT + camMargin, Math.min(bounds.w() + OUT - camMargin, player.position.x - Math.sin(yaw) * camHoriz));
      const camZ = Math.max(-OUT + camMargin, Math.min(bounds.h() + OUT - camMargin, player.position.z - Math.cos(yaw) * camHoriz));
      camera.position.set(camX, camHeight, camZ);
      camera.lookAt(player.position.x, player.position.y + 1.2, player.position.z);

      furnitureGroup.children.forEach((mesh) => {
        if (mesh.userData.popT !== undefined && mesh.userData.popT < 1) {
          mesh.userData.popT = Math.min(1, mesh.userData.popT + dt * 4.5);
          const t = mesh.userData.popT;
          const overshoot = t < 1 ? 1 + Math.sin(t * Math.PI) * 0.18 * (1 - t) : 1;
          mesh.scale.setScalar(t * overshoot);
        }
      });

      onAvatarPosRef.current && onAvatarPosRef.current(player.position);
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      const w = parent.clientWidth || 800;
      const h = parent.clientHeight || 600;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerdown', refocus);
      canvas.removeEventListener('mouseenter', refocus);
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>3D mode is available on the web build of Blueprint.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  fallbackText: { color: '#fff' },
});
