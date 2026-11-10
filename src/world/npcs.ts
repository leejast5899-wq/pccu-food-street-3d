import * as THREE from 'three';
import { NPC_STUDENT_DIALOGUES } from '../data/shops';
import { createStylizedPerson } from './alleyBuilder';

export interface StudentNPC {
  id: string;
  mesh: THREE.Group;
  umbrella: THREE.Group;
  speaker: string;
  lines: string[];
  lineIndex: number;
  baseX: number;
  minZ: number;
  maxZ: number;
  direction: 1 | -1;
  speed: number;
  pauseTimer: number;
}

export class StudentNPCManager {
  public npcs: StudentNPC[] = [];
  public group = new THREE.Group();

  constructor(scene: THREE.Scene) {
    scene.add(this.group);
    const configs = [
      { x: -2.2, z: 10, minZ: -20, maxZ: 22, shirt: '#3b82f6', hair: '#1e1b4b', dIdx: 0 },
      { x: 2.3, z: -4, minZ: -26, maxZ: 20, shirt: '#10b981', hair: '#451a03', dIdx: 1 },
      { x: -1.3, z: -18, minZ: -38, maxZ: 12, shirt: '#f59e0b', hair: '#1f2937', dIdx: 2 },
      { x: 1.4, z: 18, minZ: -12, maxZ: 23, shirt: '#ec4899', hair: '#312e81', dIdx: 3 },
    ];

    configs.forEach((cfg, idx) => {
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

      person.position.set(cfg.x, 0, cfg.z);
      this.group.add(person);

      const dlg = NPC_STUDENT_DIALOGUES[cfg.dIdx];
      this.npcs.push({
        id: `student-${idx}`,
        mesh: person,
        umbrella,
        speaker: dlg.speaker,
        lines: dlg.lines,
        lineIndex: 0,
        baseX: cfg.x,
        minZ: cfg.minZ,
        maxZ: cfg.maxZ,
        direction: idx % 2 === 0 ? -1 : 1,
        speed: 1.15 + idx * 0.15,
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
          // Politely pause and turn slightly toward player when close
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

      npc.mesh.position.z += npc.direction * npc.speed * dt;
      // Natural walking stride swing for legs & arms
      const stride = Math.sin(elapsed * 6.5 + idx * 1.3);
      npc.mesh.position.y = Math.abs(stride) * 0.032;
      npc.mesh.rotation.y = npc.direction > 0 ? 0 : Math.PI;
      if (limbs.leftLegPivot) limbs.leftLegPivot.rotation.x = stride * 0.48;
      if (limbs.rightLegPivot) limbs.rightLegPivot.rotation.x = -stride * 0.48;
      if (limbs.leftArmPivot) limbs.leftArmPivot.rotation.x = -stride * 0.36;
      if (limbs.rightArmPivot) limbs.rightArmPivot.rotation.x = useUmbrella ? -0.55 : stride * 0.36;

      if (npc.mesh.position.z >= npc.maxZ) {
        npc.direction = -1;
        npc.pauseTimer = 1.6 + Math.random() * 2;
      } else if (npc.mesh.position.z <= npc.minZ) {
        npc.direction = 1;
        npc.pauseTimer = 1.6 + Math.random() * 2;
      }
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
