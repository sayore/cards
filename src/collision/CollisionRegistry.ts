// --------------------------------------------------------
// 1. Definitionen
// --------------------------------------------------------

// Wir limitieren auf 16 Shapes (0-15), damit wir 4 Bits nutzen können.
// Das Array ist nur 256 Einträge groß -> Passt komplett in den L1 Cache.
const MAX_SHAPE_TYPES = 16;
const SHIFT_AMOUNT = 4; 

// Interface für Kollisionsfunktionen
type CollisionFunc = (a: any, b: any) => boolean;

// Default Funktion (falls nichts registriert ist), um Abstürze zu vermeiden
const NO_COLLISION: CollisionFunc = () => false;

// --------------------------------------------------------
// 2. Die Registry Klasse
// --------------------------------------------------------
export class CollisionRegistry {
    // Das flache 1D Array (256 Einträge)
    private dispatchTable: CollisionFunc[] = new Array(MAX_SHAPE_TYPES * MAX_SHAPE_TYPES).fill(NO_COLLISION);

    /**
     * Registriert eine Kollisionsfunktion für zwei Typen.
     * Füllt automatisch BEIDE Slots in der Tabelle aus (A vs B und B vs A).
     */
    register(typeA: number, typeB: number, handler: CollisionFunc): void {
        // Validierung (nur zur Sicherheit beim Setup)
        if (typeA >= MAX_SHAPE_TYPES || typeB >= MAX_SHAPE_TYPES) {
            throw new Error(`Shape Type ID too high! Max is ${MAX_SHAPE_TYPES - 1}`);
        }

        // 1. Der direkte Weg: A trifft auf B
        // Index: (A << 4) | B
        const keyDirect = (typeA << SHIFT_AMOUNT) | typeB;
        this.dispatchTable[keyDirect] = handler;

        // 2. Der gespiegelte Weg: B trifft auf A
        // Index: (B << 4) | A
        // WICHTIG: Wir erstellen einen kleinen Wrapper, der die Argumente umdreht!
        const keyReverse = (typeB << SHIFT_AMOUNT) | typeA;
        
        // Wir wrappen die Funktion: Wenn (B, A) reinkommt, rufen wir handler(A, B) auf.
        this.dispatchTable[keyReverse] = (b: any, a: any) => handler(a, b);
        
        console.log(`Registered collision: ${typeA} <-> ${typeB}`);
    }

    /**
     * Die "Hot Path" Funktion - EXTREM SCHNELL.
     * Keine If-Abfragen, kein Sortieren.
     */
    resolve(typeA: number, typeB: number, shapeA: any, shapeB: any): boolean {
        // Bitwise Magic (Branchless)
        const key = (typeA << SHIFT_AMOUNT) | typeB;
        
        // Direkter Aufruf
        return this.dispatchTable[key](shapeA, shapeB);
    }
}