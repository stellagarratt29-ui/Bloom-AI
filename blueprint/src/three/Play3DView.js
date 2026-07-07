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
  const data = new Uint8Array([90, 90, 90, 255, 160, 160, 160, 255, 215, 215, 215, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
})();
const toonMat = (hex, extra) => new THREE.MeshToonMaterial({ color: hex, gradientMap: GRADIENT_MAP, ...extra });

function makeSkyTexture(day) {
  const c = document.createElement('canvas');
  c.width = 2; c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  if (day) {
    grad.addColorStop(0, '#5F9BD6');
    grad.addColorStop(0.55, '#BFE0EE');
    grad.addColorStop(1, '#F3E8D8');
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
  return group;
}

function makeTree(scale = 1) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.9, 8), toonMat(0x8a6a4a));
  trunk.position.y = 0.45;
  const foliageMat = toonMat(0x6f9a5c);
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), foliageMat); c1.position.y = 1.15;
  const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), foliageMat); c2.position.set(0.28, 0.95, 0.1);
  const c3 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), foliageMat); c3.position.set(-0.25, 0.9, -0.15);
  group.add(trunk, c1, c2, c3);
  group.scale.setScalar(scale);
  group.userData.sway = Math.random() * Math.PI * 2;
  group.userData.foliage = [c1, c2, c3];
  return group;
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
  return group;
}

function makeHouse(color, roofColor) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 2.2), toonMat(color));
  body.position.y = 0.8;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.0, 4), toonMat(roofColor));
  roof.position.y = 2.1;
  roof.rotation.y = Math.PI / 4;
  group.add(body, roof);
  return group;
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
  return mesh;
}

export default function Play3DView({ room, daytime, flying, running, activePiece, activeColor, onPlaceCell, onRemoveCell, onAvatarPos }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({});
  const roomRef = useRef(room);
  const activeRef = useRef({ piece: activePiece, color: activeColor });
  const onPlaceCellRef = useRef(onPlaceCell);
  const onRemoveCellRef = useRef(onRemoveCell);
  const onAvatarPosRef = useRef(onAvatarPos);
  onPlaceCellRef.current = onPlaceCell;
  onRemoveCellRef.current = onRemoveCell;
  onAvatarPosRef.current = onAvatarPos;
  const daytimeRef = useRef(daytime);
  const flyingRef = useRef(flying);
  const runningRef = useRef(running);

  useEffect(() => { roomRef.current = room; if (stateRef.current.rebuildFurniture) stateRef.current.rebuildFurniture(); }, [room]);
  useEffect(() => { activeRef.current = { piece: activePiece, color: activeColor }; if (stateRef.current.rebuildGhost) stateRef.current.rebuildGhost(); }, [activePiece, activeColor]);
  useEffect(() => { daytimeRef.current = daytime; if (stateRef.current.applyLighting) stateRef.current.applyLighting(); }, [daytime]);
  useEffect(() => { flyingRef.current = flying; }, [flying]);
  useEffect(() => { runningRef.current = running; }, [running]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 150);

    const hemi = new THREE.HemisphereLight(0xfff3e0, 0x53514a, 1.0);
    const sun = new THREE.DirectionalLight(0xffe8c2, 1.15);
    sun.position.set(6, 10, 4);
    const fill = new THREE.DirectionalLight(0x9db8d8, 0.35);
    fill.position.set(-6, 4, -4);
    scene.add(hemi, sun, fill);

    const applyLighting = () => {
      const day = daytimeRef.current;
      scene.background = makeSkyTexture(day);
      scene.fog = new THREE.Fog(day ? 0xcfe3ee : 0x0c1120, 14, day ? 55 : 40);
      hemi.intensity = day ? 1.0 : 0.32;
      hemi.groundColor.set(day ? 0x53514a : 0x14141c);
      sun.intensity = day ? 1.15 : 0.12;
      sun.color.set(day ? 0xffe8c2 : 0x6c85c9);
      fill.intensity = day ? 0.35 : 0.15;
    };
    applyLighting();
    stateRef.current.applyLighting = applyLighting;

    // ---- static world: ground, road, houses, trees ----
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const buildNeighborhood = (gridW, gridH) => {
      worldGroup.clear();
      const groundMat = toonMat(0x9CB07A);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(gridW + OUT * 2, gridH + OUT * 2), groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(gridW / 2, -0.01, gridH / 2);
      worldGroup.add(ground);

      const roadZ = -5;
      const road = new THREE.Mesh(new THREE.PlaneGeometry(gridW + OUT * 2, 3.4), toonMat(0x4a4a48));
      road.rotation.x = -Math.PI / 2;
      road.position.set(gridW / 2, 0.005, roadZ);
      worldGroup.add(road);
      for (let x = -OUT; x < gridW + OUT; x += 1.6) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.12), toonMat(0xE7C55A));
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.01, roadZ);
        worldGroup.add(dash);
      }

      const houseColors = [[0xE8DCC8, 0xB05A3C], [0xCFE0E6, 0x5C6B6F]];
      [gridW * 0.18, gridW * 0.82].forEach((x, i) => {
        const h = makeHouse(houseColors[i][0], houseColors[i][1]);
        h.position.set(x, 0, roadZ - 4.5);
        h.rotation.y = i === 0 ? 0.2 : -0.2;
        worldGroup.add(h);
      });

      const treeSpots = [
        [-2.5, 1.5], [-2.5, gridH - 1.5], [gridW + 2.5, 1.5], [gridW + 2.5, gridH - 1.5],
        [-2, -2.5], [gridW * 0.35, -2.7], [gridW * 0.9, -2.4], [-1.5, gridH * 0.6],
        [gridW + 1.8, gridH * 0.4], [gridW * 0.6, gridH + 2],
      ];
      treeSpots.forEach(([x, z], i) => {
        const t = makeTree(0.85 + (i % 3) * 0.12);
        t.position.set(x, 0, z);
        worldGroup.add(t);
      });
    };
    buildNeighborhood(roomRef.current?.gridW || 8, roomRef.current?.gridH || 6);

    // ---- moving extras: cars, NPCs, birds, clouds ----
    const extrasGroup = new THREE.Group();
    scene.add(extrasGroup);
    const gw = roomRef.current?.gridW || 8;
    const cars = [makeCar(0xB2452F), makeCar(0x3E5C76)];
    cars.forEach((c, i) => { c.userData.phase = i * 6; c.userData.speed = 1.4 + i * 0.3; extrasGroup.add(c); });
    const roadLen = gw + OUT * 2 - 2;

    const npcs = [makeAvatar({ skin: 0xE0B48E, top: 0x7C9473, bottom: 0x4A4238, hair: 0x2B2620 }), makeAvatar({ skin: 0xF0C29B, top: 0x5C87A6, bottom: 0x3A3733, hair: 0x6B4A2A })];
    npcs.forEach((n, i) => { n.userData.baseY = 0; n.userData.phase = i * 3; n.userData.center = gw * (0.3 + i * 0.4); n.position.set(n.userData.center, 0, -2.2); extrasGroup.add(n); });

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

    const buildRoom = () => {
      roomGroup.clear();
      const r = roomRef.current;
      if (!r) return;
      const floorMat = toonMat(new THREE.Color(colorHex(r.floorColor)));
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(r.gridW, r.gridH), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(r.gridW / 2, 0.002, r.gridH / 2);
      roomGroup.add(floor);

      const wallMat = toonMat(new THREE.Color(colorHex(r.wallColor)));
      const wallH = 2.4, t = 0.08;
      const mk = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat); m.position.set(x, wallH / 2, z); return m; };
      const doorHalf = Math.min(0.9, r.gridW * 0.15);
      const doorCenter = r.gridW / 2;
      roomGroup.add(
        mk(doorCenter - doorHalf, t, (doorCenter - doorHalf) / 2, 0),
        mk(r.gridW - (doorCenter + doorHalf), t, doorCenter + doorHalf + (r.gridW - (doorCenter + doorHalf)) / 2, 0),
        mk(r.gridW + t, t, r.gridW / 2, r.gridH),
        mk(t, r.gridH + t, 0, r.gridH / 2),
        mk(t, r.gridH + t, r.gridW, r.gridH / 2),
      );
    };
    buildRoom();

    const rebuildFurniture = () => {
      furnitureGroup.clear();
      const r = roomRef.current;
      if (!r) return;
      Object.entries(r.cells).forEach(([key, cellData]) => {
        const [gx, gy] = key.split(',').map(Number);
        const mesh = makeFurnitureMesh(cellData);
        if (!mesh) return;
        mesh.position.x += gx + 0.5;
        mesh.position.z += gy + 0.5;
        mesh.userData.cellKey = key;
        furnitureGroup.add(mesh);
      });
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
    const bounds = { w: () => roomRef.current?.gridW || 8, h: () => roomRef.current?.gridH || 6 };
    player.position.set(bounds.w() / 2, 0, bounds.h() / 2);
    scene.add(player);

    const keys = {};
    const onKeyDown = (e) => { keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); };
    const onKeyUp = (e) => { keys[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let yaw = 0, pitch = 0.12;
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
      if (!downOnCanvas || moved) { downOnCanvas = false; return; }
      downOnCanvas = false;
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

      const camMargin = 0.4;
      let camDist = 4.6;
      camDist = Math.max(camDist, 1.2);
      const camHoriz = camDist * Math.cos(pitch);
      const camHeight = player.position.y + 2.0 + camDist * Math.sin(pitch);
      const camX = Math.max(-OUT + camMargin, Math.min(bounds.w() + OUT - camMargin, player.position.x - Math.sin(yaw) * camHoriz));
      const camZ = Math.max(-OUT + camMargin, Math.min(bounds.h() + OUT - camMargin, player.position.z - Math.cos(yaw) * camHoriz));
      camera.position.set(camX, camHeight, camZ);
      camera.lookAt(player.position.x, player.position.y + 1.2, player.position.z);

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
