import { Circle, ShapeType, AABB, Vector2, Polygon } from "./PrimitiveChecks";


export class ShapeFactory {

  static createCircle(x: number, y: number, radius: number): Circle {
    return {
      typeId: ShapeType.CIRCLE,
      position: { x, y },
      radius
    };
  }

  // Erstellt AABB aus x, y, width, height (bequemer für Menschen)
  static createAABB(x: number, y: number, width: number, height: number): AABB {
    return {
      typeId: ShapeType.AABB,
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height
    };
  }

  // Erstellt ein Polygon und berechnet automatisch die Normalen für SAT
  static createPolygon(vertices: Vector2[]): Polygon {
    return {
      typeId: ShapeType.POLYGON,
      vertices: vertices,
      normals: this.calculateNormals(vertices) // "Baking"
    };
  }

  // Helper: Berechnet die Normalen für ein Polygon
  // (Senkrechte Vektoren für jede Kante)
  private static calculateNormals(verts: Vector2[]): Vector2[] {
    const normals: Vector2[] = [];
    for (let i = 0; i < verts.length; i++) {
      const p1 = verts[i];
      const p2 = verts[(i + 1) % verts.length]; // Nächster Punkt (Wrap-around)


      // Kante Vektor
      const edge = { x: p2.x - p1.x, y: p2.y - p1.y };

      // Normale (90 Grad gedreht: -y, x)
      // Wir normalisieren sie hier noch nicht zwingend, 
      // aber für SAT Projektion ist Normalisierung oft besser (Länge 1).
      let normal = { x: -edge.y, y: edge.x };

      // Normalisieren (Länge auf 1 bringen)
      const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
      normal.x /= length;
      normal.y /= length;

      normals.push(normal);
    }
    return normals;
  }
}
