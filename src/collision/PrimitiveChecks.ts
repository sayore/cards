// --- 1. Der Vektor (Basis aller Dinge) ---
export interface Vector2 {
    x: number;
    y: number;
}

// --- 2. Die IDs für unseren Dispatcher ---
export enum ShapeType {
    CIRCLE = 0,
    AABB = 1,
    POLYGON = 2
    // Platz für mehr (max 15 bei 4-Bit Shift)
}

// --- 3. Das Basis Interface ---
// Damit wir im Code immer wissen: "Das Ding hat einen Typ"
export interface IShape {
    typeId: ShapeType;
}

// --- 4. Der Kreis ---
export interface Circle extends IShape {
    typeId: ShapeType.CIRCLE;
    position: Vector2; // Welt-Position (Mittelpunkt)
    radius: number;
}

// --- 5. Die AABB (Axis Aligned Bounding Box) ---
// WICHTIG: Wir speichern min/max, NICHT x/y/width/height.
// Grund: Kollisionschecks brauchen min/max. So sparen wir uns
// in jedem Frame 4 Rechenoperationen (Additionen).
export interface AABB extends IShape {
    typeId: ShapeType.AABB;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

// --- 6. Das Polygon ---
export interface Polygon extends IShape {
    typeId: ShapeType.POLYGON;
    
    // Die Eckpunkte (im Uhrzeigersinn definiert!)
    // Wichtig: Für den Check müssen diese in "World Space" sein (also rotierte/verschobene Punkte).
    vertices: Vector2[]; 

    // Die Normalen (Senkrechte auf den Kanten).
    // WICHTIG FÜR SAT: Diese berechnen wir einmalig ("Baking"), 
    // damit wir das nicht jeden Frame tun müssen.
    normals: Vector2[]; 
}

export class PrimitiveChecks {

    // ==========================================
    // 1. PUNKT CHECKS (Sehr billig)
    // ==========================================

    /**
     * Punkt in Kreis: Distanz zum Quadrat (vermeidet Wurzelziehen -> schneller)
     */
    static pointInCircle(p: Vector2, c: Circle): boolean {
        const dx = p.x - c.position.x;
        const dy = p.y - c.position.y;
        // Ist der Abstand² kleiner als Radius²?
        return (dx * dx + dy * dy) <= (c.radius * c.radius);
    }

    /**
     * Punkt in AABB: Einfacher Koordinaten-Vergleich
     */
    static pointInAABB(p: Vector2, b: AABB): boolean {
        return (p.x >= b.minX && p.x <= b.maxX) &&
               (p.y >= b.minY && p.y <= b.maxY);
    }

    /**
     * Punkt in Polygon: Ray-Casting Algorithmus (Even-Odd Rule)
     * Funktioniert auch für konkave Polygone!
     */
    static pointInPolygon(p: Vector2, poly: Polygon): boolean {
        let inside = false;
        const vs = poly.vertices;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i].x, yi = vs[i].y;
            const xj = vs[j].x, yj = vs[j].y;
            
            const intersect = ((yi > p.y) !== (yj > p.y))
                && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
            
            if (intersect) inside = !inside;
        }
        return inside;
    }

    // ==========================================
    // 2. KREIS CHECKS (Mittel teuer)
    // ==========================================

    /**
     * Kreis gegen Kreis: Der schnellste Physik-Check überhaupt.
     */
    static circleVsCircle(c1: Circle, c2: Circle): boolean {
        const dx = c1.position.x - c2.position.x;
        const dy = c1.position.y - c2.position.y;
        const radii = c1.radius + c2.radius;
        // DistanzQuadrat < (RadiusSumme)²
        return (dx * dx + dy * dy) < (radii * radii);
    }

    /**
     * Kreis gegen AABB: Finde den nächstgelegenen Punkt auf dem Rechteck
     * und prüfe Distanz zum Kreis-Zentrum.
     */
    static circleVsAABB(c: Circle, b: AABB): boolean {
        // Clamp: Zwinge den Punkt auf die Box-Grenzen
        const closestX = Math.max(b.minX, Math.min(c.position.x, b.maxX));
        const closestY = Math.max(b.minY, Math.min(c.position.y, b.maxY));

        // Distanz von diesem Punkt zum Kreis-Zentrum
        const dx = c.position.x - closestX;
        const dy = c.position.y - closestY;

        return (dx * dx + dy * dy) < (c.radius * c.radius);
    }

    /**
     * Kreis gegen Polygon: Komplexer.
     * 1. Ist Zentrum im Polygon?
     * 2. Wenn nein: Schneidet der Kreis eine der Kanten?
     */
    static circleVsPolygon(c: Circle, poly: Polygon): boolean {
        // 1. Grobtest: Ist Mitte drin?
        if (this.pointInPolygon(c.position, poly)) return true;

        // 2. Kanten prüfen: Abstand Kreis-Zentrum zu jeder Linie
        const vs = poly.vertices;
        for (let i = 0; i < vs.length; i++) {
            const current = vs[i];
            const next = vs[(i + 1) % vs.length];

            if (this.distCircleToSegmentSquared(c.position, current, next) < c.radius * c.radius) {
                return true;
            }
        }
        return false;
    }

    // ==========================================
    // 3. POLYGON / SAT CHECKS (Teuer)
    // ==========================================

    /**
     * AABB gegen AABB: Sehr schnell.
     */
    static aabbVsAABB(a: AABB, b: AABB): boolean {
        return (a.minX < b.maxX && a.maxX > b.minX) &&
               (a.minY < b.maxY && a.maxY > b.minY);
    }

    /**
     * Polygon gegen Polygon (SAT - Separating Axis Theorem).
     * Das deckt ab:
     * - Rotiertes Rechteck vs. Rotiertes Rechteck
     * - Dreieck vs. Stern (konvex)
     * - AABB vs. Polygon (wenn man AABB als Poly übergibt)
     */
    static polygonVsPolygon(p1: Polygon, p2: Polygon): boolean {
        // Um eine Kollision zu haben, darf es auf KEINER Achse eine Lücke geben.
        // Wir prüfen die Normalen von Polygon 1...
        if (!this.satCheckAxis(p1.vertices, p1.vertices, p2.vertices)) return false;
        // ... und die Normalen von Polygon 2
        if (!this.satCheckAxis(p2.vertices, p1.vertices, p2.vertices)) return false;
        
        return true; // Keine Lücke gefunden -> Kollision!
    }

    // ==========================================
    // HELPER (Mathematik Unterbau)
    // ==========================================

    /**
     * Hilfsfunktion für SAT: Prüft alle Achsen eines Polygons auf Lücken
     */
    private static satCheckAxis(axisSource: Vector2[], shapeA: Vector2[], shapeB: Vector2[]): boolean {
        for (let i = 0; i < axisSource.length; i++) {
            // 1. Berechne Normale der Kante (Senkrechte)
            const p1 = axisSource[i];
            const p2 = axisSource[(i + 1) % axisSource.length];
            const normal = { x: -(p2.y - p1.y), y: p2.x - p1.x }; // 90 Grad gedreht

            // 2. Projiziere beide Formen auf diese Normale
            const minMaxA = this.projectPolygon(shapeA, normal);
            const minMaxB = this.projectPolygon(shapeB, normal);

            // 3. Prüfe auf Lücke (Overlap Test)
            if (minMaxA.max < minMaxB.min || minMaxB.max < minMaxA.min) {
                return false; // Lücke gefunden! Sofort raus.
            }
        }
        return true;
    }

    /**
     * Projiziert ein Polygon auf eine Achse (gibt min/max Werte auf dem Strahl zurück)
     */
    private static projectPolygon(vertices: Vector2[], axis: Vector2): { min: number, max: number } {
        let min = Infinity;
        let max = -Infinity;

        for (const v of vertices) {
            // Dot Product (Skalarprodukt) für Projektion
            const proj = (v.x * axis.x + v.y * axis.y);
            if (proj < min) min = proj;
            if (proj > max) max = proj;
        }
        return { min, max };
    }

    /**
     * Abstand Punkt zu Linie (Segment) im Quadrat
     * Wichtig für Circle vs Polygon Kanten
     */
    private static distCircleToSegmentSquared(p: Vector2, v: Vector2, w: Vector2): number {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
        
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t)); // Clamp t auf Segment [0, 1]
        
        // Projektionspunkt auf der Linie
        const projX = v.x + t * (w.x - v.x);
        const projY = v.y + t * (w.y - v.y);
        
        return (p.x - projX) ** 2 + (p.y - projY) ** 2;
    }
}

