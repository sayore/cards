import { PhysicsEntity } from "../PhisicsEntity";
import { CollisionRegistry } from "./CollisionRegistry";
import { ShapeType } from "./PrimitiveChecks";

let collisionRegistry = new CollisionRegistry();

// Das kennst du schon: Die Box
export interface AABB {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

// Das Item, das wir speichern (Box + Referenz auf dein Entity)
export interface QuadItem<T> {
    aabb: AABB;
    data: T; // Dein Entity, Collider oder was auch immer
}

export class Quadtree<T> {
    // --- KONFIGURATION ---
    private readonly MAX_OBJECTS = 8; // Wie viele Objekte bevor Split?
    private readonly MAX_LEVELS = 5;  // Wie tief verschachteln wir?

    // --- STATUS ---
    private level: number;
    private bounds: AABB;
    private objects: QuadItem<T>[] = [];
    private nodes: Quadtree<T>[] = []; // Die 4 Kinder (NW, NE, SW, SE)

    constructor(bounds: AABB, level: number = 0) {
        this.bounds = bounds;
        this.level = level;
    }

    /**
     * Löscht den Baum rekursiv.
     * WICHTIG: Wir werfen die Arrays nicht weg (Garbage Collection vermeiden),
     * sondern setzen nur die Länge auf 0.
     */
    clear(): void {
        this.objects = []; // Array leeren
        
        for (let i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i]) {
                this.nodes[i].clear();
            }
        }
        // Wir behalten die Nodes im Speicher, um 'new Quadtree' im nächsten Frame zu sparen!
        // Nur die Objekte darin sind weg.
        // Option B (radikal): this.nodes = []; wenn Speicher knapp ist.
        this.nodes = []; 
    }

    /**
     * Teilt den Knoten in 4 Unter-Knoten (NW, NE, SW, SE)
     */
    private split(): void {
        const subWidth = (this.bounds.maxX - this.bounds.minX) / 2;
        const subHeight = (this.bounds.maxY - this.bounds.minY) / 2;
        const x = this.bounds.minX;
        const y = this.bounds.minY;

        // 0: Nord-Ost (Rechts Oben)
        this.nodes[0] = new Quadtree({
            minX: x + subWidth, maxX: x + subWidth * 2,
            minY: y, maxY: y + subHeight
        }, this.level + 1);

        // 1: Nord-West (Links Oben)
        this.nodes[1] = new Quadtree({
            minX: x, maxX: x + subWidth,
            minY: y, maxY: y + subHeight
        }, this.level + 1);

        // 2: Süd-West (Links Unten)
        this.nodes[2] = new Quadtree({
            minX: x, maxX: x + subWidth,
            minY: y + subHeight, maxY: y + subHeight * 2
        }, this.level + 1);

        // 3: Süd-Ost (Rechts Unten)
        this.nodes[3] = new Quadtree({
            minX: x + subWidth, maxX: x + subWidth * 2,
            minY: y + subHeight, maxY: y + subHeight * 2
        }, this.level + 1);
    }

    /**
     * Bestimmt den Index (Quadrant), in den das Rect passt.
     * -1 bedeutet: Es passt nicht komplett rein (liegt auf einer Linie -> Parent)
     */
    private getIndex(rect: AABB): number {
        let index = -1;
        
        const verticalMidpoint = this.bounds.minX + (this.bounds.maxX - this.bounds.minX) / 2;
        const horizontalMidpoint = this.bounds.minY + (this.bounds.maxY - this.bounds.minY) / 2;

        // Passt es komplett in die obere Hälfte?
        const topQuadrant = (rect.minY < horizontalMidpoint && rect.maxY < horizontalMidpoint);
        // Passt es komplett in die untere Hälfte?
        const bottomQuadrant = (rect.minY > horizontalMidpoint);

        // Passt es komplett links rein?
        if (rect.minX < verticalMidpoint && rect.maxX < verticalMidpoint) {
            if (topQuadrant) index = 1;      // NW
            else if (bottomQuadrant) index = 2; // SW
        }
        // Passt es komplett rechts rein?
        else if (rect.minX > verticalMidpoint) {
            if (topQuadrant) index = 0;      // NE
            else if (bottomQuadrant) index = 3; // SE
        }

        return index;
    }

    /**
     * Fügt ein Objekt ein.
     */
    insert(item: QuadItem<T>): void {
        // 1. Wenn wir Kinder haben, versuchen wir es nach unten durchzureichen
        if (this.nodes.length > 0) {
            const index = this.getIndex(item.aabb);

            if (index !== -1) {
                this.nodes[index].insert(item);
                return;
            }
        }

        // 2. Passt nirgendwo rein oder wir sind Leaf -> Hier speichern
        this.objects.push(item);

        // 3. Sollten wir splitten?
        if (this.objects.length > this.MAX_OBJECTS && this.level < this.MAX_LEVELS) {
            if (this.nodes.length === 0) {
                this.split();
            }

            // 4. Re-Balancing: Existierende Objekte in die neuen Kinder verschieben
            let i = 0;
            while (i < this.objects.length) {
                const index = this.getIndex(this.objects[i].aabb);
                if (index !== -1) {
                    // Objekt passt in ein Kind -> verschieben und aus Parent löschen
                    const movedItem = this.objects.splice(i, 1)[0];
                    this.nodes[index].insert(movedItem);
                } else {
                    // Objekt muss hier bleiben (liegt auf Linie)
                    i++;
                }
            }
        }
    }

    /**
     * Gibt alle Objekte zurück, die mit dem Such-Rect kollidieren KÖNNTEN.
     * @param returnCandidates Ein Array, das befüllt wird (um 'new Array' zu sparen)
     */
    retrieve(searchRect: AABB, returnCandidates: QuadItem<T>[] = []): QuadItem<T>[] {
        // 1. Der Index sagt uns, in welchen Quadranten das Such-Rect passt
        const index = this.getIndex(searchRect);

        // 2. Wenn wir Kinder haben...
        if (this.nodes.length > 0) {
            // Wenn das Such-Rect komplett in einen Quadranten passt (z.B. NW),
            // dann müssen wir auch NUR dort suchen.
            if (index !== -1) {
                this.nodes[index].retrieve(searchRect, returnCandidates);
            } 
            // WENN index == -1: Das Such-Rect liegt genau auf der Trennlinie.
            // Das bedeutet, es könnte Objekte in ALLEN 4 Quadranten berühren.
            // Wir müssen also leider alle Kinder durchsuchen.
            else {
                for (let i = 0; i < this.nodes.length; i++) {
                    this.nodes[i].retrieve(searchRect, returnCandidates);
                }
            }
        }

        // 3. Füge IMMER die Objekte dieses Knotens hinzu
        // (Das sind die, die auf den Linien liegen oder weil dies ein Leaf ist)
        // Wir pushen einzeln, um Array-Concat Overhead zu vermeiden.
        for (const obj of this.objects) {
            returnCandidates.push(obj);
        }

        return returnCandidates;
    }
}

// --- KOMPONENTEN ---

class Transform {
    x: number = 0;
    y: number = 0;
    rotation: number = 0;
    
    // Wichtig: Markiert, dass sich was geändert hat
    // Muss am Ende des Frames (nach Physik) wieder auf false gesetzt werden
    isDirty: boolean = true; 

    move(dx: number, dy: number) {
        this.x += dx;
        this.y += dy;
        this.isDirty = true;
    }
}

class Collider {
    // Die statische Form (lokal, z.B. Breite 10)
    localShape: ShapeType; 
    
    // Die "Welt"-Box (Wird wiederverwendet!)
    worldAABB: AABB;

    constructor(shape: ShapeType) {
        this.localShape = shape;
        // Leeres Objekt initialisieren, damit wir später keinen Speicher reservieren müssen
        this.worldAABB = { minX:0, maxX:0, minY:0, maxY:0 };
    }
}

// --- DAS SYSTEM (Dein Loop) ---

export class PhysicsSystem {
    // Deine "gesonderte Liste"
    colliders: { transform: Transform, collider: Collider, entity: PhysicsEntity }[] = [];
    
    quadtree: Quadtree<PhysicsEntity>;

    constructor(bounds: AABB) {
        this.quadtree = new Quadtree(bounds);
    }

    update() {
        // SCHRITT A: Quadtree leeren (schneller als reparieren)
        this.quadtree.clear();

        // SCHRITT B: AABBs updaten & in Quadtree werfen
        for (const item of this.colliders) {
            const { transform, collider, entity } = item;

            // OPTIMIERUNG: Nur rechnen, wenn sich was bewegt hat!
            if (transform.isDirty) {
                // Hier werden nur die Zahlen in worldAABB überschrieben
                this.updateAABB(collider, transform);
            }

            // Immer in den Quadtree einfügen (denn der wurde ja geleert)
            this.quadtree.insert({ aabb: collider.worldAABB, data: entity });
        }

        // SCHRITT C: Kollisionen prüfen
        for (const item of this.colliders) {
            const { collider, entity } = item;

            // 1. Broadphase: Wen gibt's in der Nähe?
            const candidates = this.quadtree.retrieve(collider.worldAABB);

            for (const candidate of candidates) {
                if (candidate.data === entity) continue; // Nicht mit sich selbst

                // 2. Pre-Check (AABB Overlap) - Ganz billig
                // Der Quadtree ist grob, deshalb hier nochmal exakt AABB prüfen
                if (!checkAABBOverlap(collider.worldAABB, candidate.aabb)) {
                    continue;
                }

                // 3. Narrowphase (Teuer: SAT / Dispatcher)
                if (collisionRegistry.resolve(collider.localShape, candidate.data.shapeId, collider.worldAABB, candidate.aabb)) {
                    // BOOM! Kollision.
                    console.log("Hit!");
                }
            }
        }
        
        // SCHRITT D: Dirty Flags resetten (optional hier oder im Render System)
        // for (const item of this.colliders) item.transform.isDirty = false;
    }

    // Dein Punkt 3: Die Update Funktion
    private updateAABB(c: Collider, t: Transform) {
        // Logik je nach Shape Typ
        // Bei Kreis: t.x - radius ...
        // Bei Polygon: Loop über gedrehte Punkte und min/max finden
        // Ergebnis direkt in c.worldAABB schreiben
    }
}

function checkAABBOverlap(a: AABB, b: AABB) {
  return (a.minX < b.maxX && a.maxX > b.minX) &&
         (a.minY < b.maxY && a.maxY > b.minY);
}
