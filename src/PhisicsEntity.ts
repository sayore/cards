import { AABB, QuadItem } from "./collision/CollisionSystem";
import { Entity } from "./Entity";
import { GameContext } from "./GameContext";

export abstract class PhysicsEntity extends Entity implements QuadItem<PhysicsEntity> {
  // Interface Implementierung
  aabb: AABB;
  data: PhysicsEntity; // Zeigt auf this

  // Zusätzliche Physik-Daten
  shapeId: number;     // Circle, Box, Polygon...
  category: number;    // Für Bitmask (Player, Enemy...)
  mask: number;        // Wen treffe ich?

  // Dirty Flag für Performance (siehe vorherige Diskussion)
  isDirty: boolean = true;

  constructor(id: string, x: number, y: number, shapeId: number) {
    super(id, x, y);
    
    // 1. Self-Reference für QuadItem Interface (Keine Kopie, nur Pointer!)
    this.data = this;

    // 2. Leere AABB initialisieren (vermeidet undefined errors)
    // Typ auf AABB setzen als Default
    this.aabb = { minX: x, minY: y, maxX: x, maxY: y };
    
    this.shapeId = shapeId;
    this.category = 1; // Default
    this.mask = 1;     // Default
  }

  // Wenn sich das Entity bewegt, setzen wir das Dirty Flag
  move(dx: number, dy: number) {
      this.position.x += dx;
      this.position.y += dy;
      this.isDirty = true; // Signalisiert dem System: "Bitte AABB neu berechnen"
  }
}