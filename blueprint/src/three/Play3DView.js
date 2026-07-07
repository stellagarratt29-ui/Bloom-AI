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

const DAY_SKY = 0xbfd8e8;
const NIGHT_SKY = 0x0c1220;

function makeAvatar() {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xE8B89B });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x5C87A6 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x3A3733 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x4A342A });

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), skin);
  head.position.y = 1.55;
  const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.32), hair);
  hairMesh.position.y = 1.68;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.26), shirt);
  torso.position.y = 1.14;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 0.2), pants);
  legL.position.set(-0.11, 0.58, 0);
  const legR = legL.clone(); legR.position.x = 0.11;
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.45, 0.13), shirt);
  armL.position.set(-0.28, 1.15, 0);
  const armR = armL.clone(); armR.position.x = 0.28;

  group.add(head, hairMesh, torso, legL, legR, armL, armR);
  group.userData.legs = [legL, legR];
  group.userData.arms = [armL, armR];
  return group;
}

function makeFurnitureMesh(cellData) {
  const piece = pieceById[cellData.pieceId];
  if (!piece) return null;
  const shape = CATEGORY_SHAPE[piece.category] || CATEGORY_SHAPE.decor;
  const hex = new THREE.Color(colorHex(cellData.color));
  const mat = new THREE.MeshStandardMaterial({ color: hex });
  let mesh;
  if (shape.kind === 'sphere') {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(shape.r, 12, 12), mat);
  } else if (shape.kind === 'plant') {
    const group = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.22, 10), new THREE.MeshStandardMaterial({ color: 0x8a6a52 }));
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
  useEffect(() => { activeRef.current = { piece: activePiece, color: activeColor }; }, [activePiece, activeColor]);
  useEffect(() => { daytimeRef.current = daytime; if (stateRef.current.applyLighting) stateRef.current.applyLighting(); }, [daytime]);
  useEffect(() => { flyingRef.current = flying; }, [flying]);
  useEffect(() => { runningRef.current = running; }, [running]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = false;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 0.9);
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    sun.position.set(4, 8, 3);
    scene.add(hemi, sun);

    const applyLighting = () => {
      const day = daytimeRef.current;
      scene.background = new THREE.Color(day ? DAY_SKY : NIGHT_SKY);
      hemi.intensity = day ? 0.9 : 0.35;
      sun.intensity = day ? 1.0 : 0.15;
      sun.color.set(day ? 0xffffff : 0x6c85c9);
    };
    applyLighting();
    stateRef.current.applyLighting = applyLighting;

    const furnitureGroup = new THREE.Group();
    const roomGroup = new THREE.Group();
    scene.add(roomGroup, furnitureGroup);

    const buildRoom = () => {
      roomGroup.clear();
      const r = roomRef.current;
      if (!r) return;
      const floorMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex(r.floorColor)) });
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(r.gridW, r.gridH), floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(r.gridW / 2, 0, r.gridH / 2);
      roomGroup.add(floor);

      const wallMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex(r.wallColor)) });
      const wallH = 2.4, t = 0.08;
      const mk = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat); m.position.set(x, wallH / 2, z); return m; };
      roomGroup.add(
        mk(r.gridW + t, t, r.gridW / 2, 0),
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

    const avatar = makeAvatar();
    const bounds = { w: () => roomRef.current?.gridW || 8, h: () => roomRef.current?.gridH || 6 };
    avatar.position.set(bounds.w() / 2, 0, bounds.h() / 2);
    scene.add(avatar);

    const keys = {};
    const onKeyDown = (e) => { keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); };
    const onKeyUp = (e) => { keys[e.code] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let yaw = Math.PI, pitch = 0.12;
    let dragging = false, lastX = 0, lastY = 0, moved = false, downOnCanvas = false;
    const onPointerDown = (e) => { dragging = true; downOnCanvas = true; lastX = e.clientX; lastY = e.clientY; moved = false; };
    const onPointerMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      yaw -= dx * 0.006;
      pitch = Math.max(-0.3, Math.min(0.75, pitch - dy * 0.004));
      lastX = e.clientX; lastY = e.clientY;
    };
    const raycaster = new THREE.Raycaster();
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const onPointerUp = (e) => {
      dragging = false;
      if (!downOnCanvas || moved) { downOnCanvas = false; return; }
      downOnCanvas = false;
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const active = activeRef.current.piece;
      if (active) {
        const hit = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(floorPlane, hit)) {
          const r = roomRef.current;
          const gx = Math.min(r.gridW - 1, Math.max(0, Math.floor(hit.x)));
          const gy = Math.min(r.gridH - 1, Math.max(0, Math.floor(hit.z)));
          onPlaceCellRef.current && onPlaceCellRef.current(gx, gy);
        }
      } else {
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
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const speed = (runningRef.current ? 5.5 : 2.8) * dt;
      const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      const right = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2));
      let mx = 0, mz = 0;
      if (keys['KeyW']) { mx += fwd.x; mz += fwd.z; }
      if (keys['KeyS']) { mx -= fwd.x; mz -= fwd.z; }
      if (keys['KeyA']) { mx -= right.x; mz -= right.z; }
      if (keys['KeyD']) { mx += right.x; mz += right.z; }
      const mag = Math.hypot(mx, mz);
      if (mag > 0.001) {
        avatar.position.x += (mx / mag) * speed;
        avatar.position.z += (mz / mag) * speed;
        avatar.rotation.y = Math.atan2(mx, mz);
        const t = now / 120;
        avatar.userData.legs[0].rotation.x = Math.sin(t) * 0.6;
        avatar.userData.legs[1].rotation.x = -Math.sin(t) * 0.6;
        avatar.userData.arms[0].rotation.x = -Math.sin(t) * 0.5;
        avatar.userData.arms[1].rotation.x = Math.sin(t) * 0.5;
      } else {
        avatar.userData.legs.forEach(l => l.rotation.x *= 0.8);
        avatar.userData.arms.forEach(a => a.rotation.x *= 0.8);
      }

      const margin = 0.35;
      avatar.position.x = Math.max(margin, Math.min(bounds.w() - margin, avatar.position.x));
      avatar.position.z = Math.max(margin, Math.min(bounds.h() - margin, avatar.position.z));

      if (flyingRef.current) {
        if (keys['Space']) avatar.position.y += 2.2 * dt;
        if (keys['ShiftLeft'] || keys['ShiftRight']) avatar.position.y = Math.max(0, avatar.position.y - 2.2 * dt);
      } else if (keys['Space'] && jumpT <= 0) {
        jumpT = 0.5;
      }
      if (jumpT > 0) {
        jumpT -= dt;
        avatar.position.y = Math.max(0, Math.sin((1 - jumpT / 0.5) * Math.PI) * 0.55);
      } else if (!flyingRef.current) {
        avatar.position.y = 0;
      }

      const camMargin = 0.4;
      let camDist = 4.2;
      camDist = Math.min(camDist, bounds.w() / 2 - camMargin, bounds.h() / 2 - camMargin, camDist);
      camDist = Math.max(camDist, 1.2);
      const camHoriz = camDist * Math.cos(pitch);
      const camHeight = avatar.position.y + 2.0 + camDist * Math.sin(pitch);
      const camX = Math.max(camMargin, Math.min(bounds.w() - camMargin, avatar.position.x - Math.sin(yaw) * camHoriz));
      const camZ = Math.max(camMargin, Math.min(bounds.h() - camMargin, avatar.position.z - Math.cos(yaw) * camHoriz));
      camera.position.set(camX, camHeight, camZ);
      camera.lookAt(avatar.position.x, avatar.position.y + 1.2, avatar.position.z);

      onAvatarPosRef.current && onAvatarPosRef.current(avatar.position);
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
