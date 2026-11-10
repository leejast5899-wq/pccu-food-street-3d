import * as THREE from 'three';
import { NPC_STUDENT_DIALOGUES } from '../data/shops';
import { normalizedToWorld } from './aerialMap';
import { createStylizedPerson } from './alleyBuilder';

export interface StudentNPC {
  id: string;
  mesh: THREE.Group;
  umbrella: THREE.Group;
  speaker: string;
  lines: string[];
  lineIndex: number;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  progress: number;
  direction: 1 | -1;
  speed: number;
  pauseTimer: number;
}

export class StudentNPCManager {
  public npcs: StudentNPC[] = [];
  public group = new THREE.Group();

  constructor(scene: THREE.Scene) {
    scene.add(this.group);

    // 8 Student NPCs patrolling all 3 real streets (光華路26巷・華岡路47巷2弄・華岡路47巷)
    const routes = [
      // 光華路26巷 (South food street)
      { a: [-22, 27], b: [6, 13], t: 0.35, shirt: '#3b82f6', hair: '#1e1b4b', dIdx: 0 },
      { a: [-8, 21], b: [24, 5], t: 0.62, shirt: '#10b981', hair: '#451a03', dIdx: 1 },
      { a: [4, 15], b: [36, 0], t: 0.25, shirt: '#ec4899', hair: '#312e81', dIdx: 3 },
      // 華岡路47巷2弄 (Central vertical alley)
      { a: [11, -35], b: [21, -5], t: 0.48, shirt: '#f59e0b', hair: '#1f2937', dIdx: 2 },
      { a: [13, -30], b: [23, -1], t: 0.78, shirt: '#8b5cf6', hair: '#1e293b', dIdx: 0 },
      // 華岡路47巷 (North bento street)
      { a: [-42, -23], b: [-14, -36], t: 0.4, shirt: '#ef4444', hair: '#292524', dIdx: 1 },
      { a: [-22, -32], b: [14, -40], t: 0.55, shirt: '#06b6d4', hair: '#1e1b4b', dIdx: 2 },
      { a: [2, -38], b: [30, -43], t: 0.3, shirt: '#f97316', hair: '#3f2e21', dIdx: 3 },
    ];

    routes.forEach((cfg, idx) => {
      const person = createStylizedPerson(cfg.shirt, '#f5d0b5', cfg.hair);
      // Sculpted rounded student backpack
      const bag = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.14, 0.22, 8, 12),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75 })
      );
      bag.scale.set(1.15, 1, 0.65);
      bag.position.set(0, 1.08, -0.2);
      person.add(bag);

      // Mini umbrella toggled in rain
      const umbrella = new THREE.Group();
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6),
        new THREE.MeshStandardMaterial({ color: 0x111827 })
      );
      handle.position.y = 0.35;
      const canopy = new THREE.Mesh(
        new THREE.ConeGeometry(0.62, 0.25, 8),
        new THREE.MeshStandardMaterial({
          color: idx % 2 === 0 ? 0x38bdf8 : 0xfb7185,
          roughness: 0.5,
          side: THREE.DoubleSide,
        })
      );
      canopy.position.y = 0.68;
      umbrella.add(handle, canopy);
      umbrella.position.set(0.28, 1.32, 0.12);
      umbrella.visible = false;
      person.add(umbrella);

      const startPos = normalizedToWorld(cfg.a[0], cfg.a[1]);
      const endPos = normalizedToWorld(cfg.b[0], cfg.b[1]);
      person.position.lerpVectors(startPos, endPos, cfg.t);
      this.group.add(person);

      const dlg = NPC_STUDENT_DIALOGUES[cfg.dIdx % NPC_STUDENT_DIALOGUES.length];
      this.npcs.push({
        id: `student-${idx}`,
        mesh: person,
        umbrella,
        speaker: dlg.speaker,
        lines: dlg.lines,
        lineIndex: 0,
        startPos,
        endPos,
        progress: cfg.t,
        direction: idx % 2 === 0 ? 1 : -1,
        speed: 1.25 + (idx % 3) * 0.2,
        pauseTimer: 0,
      });
    });
  }

  public update(dt: number, elapsed: number, rainIntensity: number, windStrength: number, playerPos: THREE.Vector3): void {
    const useUmbrella = rainIntensity > 0.25;

    this.npcs.forEach((npc, idx) => {
      npc.umbrella.visible = useUmbrella;
      if (useUmbrella) {
        npc.umbrella.rotation.z = Math.sin(elapsed * 4 + idx) * windStrength * 0.25;
      }

      const distToPlayer = npc.mesh.position.distanceTo(playerPos);
      const limbs = npc.mesh.userData as {
        leftLegPivot?: THREE.Group;
        rightLegPivot?: THREE.Group;
        leftArmPivot?: THREE.Group;
        rightArmPivot?: THREE.Group;
      };

      if (distToPlayer < 2.6 || npc.pauseTimer > 0) {
        if (limbs.leftLegPivot) limbs.leftLegPivot.rotation.x = 0;
        if (limbs.rightLegPivot) limbs.rightLegPivot.rotation.x = 0;
        if (limbs.leftArmPivot) limbs.leftArmPivot.rotation.x = 0;
        if (limbs.rightArmPivot) limbs.rightArmPivot.rotation.x = useUmbrella ? -0.55 : 0;

        if (distToPlayer < 2.6) {
          const lookAngle = Math.atan2(
            playerPos.x - npc.mesh.position.x,
            playerPos.z - npc.mesh.position.z
          );
          npc.mesh.rotation.y = lookAngle;
          return;
        }
        npc.pauseTimer -= dt;
        return;
      }

      const routeLen = Math.max(1, npc.startPos.distanceTo(npc.endPos));
      npc.progress += (npc.direction * npc.speed * dt) / routeLen;

      if (npc.progress >= 1) {
        npc.progress = 1;
        npc.direction = -1;
        npc.pauseTimer = 1.4 + Math.random() * 1.8;
      } else if (npc.progress <= 0) {
        npc.progress = 0;
        npc.direction = 1;
        npc.pauseTimer = 1.4 + Math.random() * 1.8;
      }

      npc.mesh.position.lerpVectors(npc.startPos, npc.endPos, npc.progress);

      const stride = Math.sin(elapsed * 6.5 + idx * 1.3);
      npc.mesh.position.y = Math.abs(stride) * 0.032;

      const travelVec =
        npc.direction > 0
          ? npc.endPos.clone().sub(npc.startPos)
          : npc.startPos.clone().sub(npc.endPos);
      npc.mesh.rotation.y = Math.atan2(travelVec.x, travelVec.z);

      if (limbs.leftLegPivot) limbs.leftLegPivot.rotation.x = stride * 0.48;
      if (limbs.rightLegPivot) limbs.rightLegPivot.rotation.x = -stride * 0.48;
      if (limbs.leftArmPivot) limbs.leftArmPivot.rotation.x = -stride * 0.36;
      if (limbs.rightArmPivot) limbs.rightArmPivot.rotation.x = useUmbrella ? -0.55 : stride * 0.36;
    });
  }

  public findNearest(playerPos: THREE.Vector3, maxDist = 2.9): StudentNPC | null {
    let best: StudentNPC | null = null;
    let bestDist = maxDist;
    for (const npc of this.npcs) {
      const d = npc.mesh.position.distanceTo(playerPos);
      if (d < bestDist) {
        bestDist = d;
        best = npc;
      }
    }
    return best;
  }

  public nextLine(npc: StudentNPC): string {
    const line = npc.lines[npc.lineIndex];
    npc.lineIndex = (npc.lineIndex + 1) % npc.lines.length;
    return line;
  }
}
