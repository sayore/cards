const { performance } = globalThis; // Node 25 Style

const MAX_SHAPES = 16;
const ITERATIONS = 10_000_000;
const SHIFT_AMOUNT = 4;

const dummyCollision = function(a, b) { return true; };

// ==========================================
// SETUP
// ==========================================

// 1. 2D Array
const table2D = [];
for (let i = 0; i < MAX_SHAPES; i++) {
    table2D[i] = new Array(MAX_SHAPES).fill(dummyCollision);
}

// 2. 1D Array (mit Runtime Sortierung - deine alte Version)
const table1D_Sorted = new Array(MAX_SHAPES * MAX_SHAPES).fill(dummyCollision);

// 3. 1D Array (Symmetrisch - NEU)
// Wir simulieren hier, dass wir A vs B UND B vs A registrieren.
const table1D_Symmetric = new Array(MAX_SHAPES * MAX_SHAPES).fill(dummyCollision);


// ==========================================
// DATEN GENERIEREN
// ==========================================
const typesA = new Uint8Array(ITERATIONS);
const typesB = new Uint8Array(ITERATIONS);

for (let i = 0; i < ITERATIONS; i++) {
    typesA[i] = (Math.random() * MAX_SHAPES) | 0;
    typesB[i] = (Math.random() * MAX_SHAPES) | 0;
}

let counter = 0;

// ==========================================
// RUN 1: 2D Array (Standard)
// ==========================================
const start2D = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    const t1 = typesA[i];
    const t2 = typesB[i];
    // Sortieren MUSS sein für 2D Lookup Logik (obere Dreiecksmatrix)
    const row = t1 < t2 ? t1 : t2;
    const col = t1 < t2 ? t2 : t1;
    if (table2D[row][col](i, i)) counter++;
}
const time2D = performance.now() - start2D;

// ==========================================
// RUN 2: 1D Sorted (Deine Version)
// ==========================================
counter = 0;
const start1D_Sorted = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    const t1 = typesA[i];
    const t2 = typesB[i];
    // Sortieren kostet Zeit!
    const min = t1 < t2 ? t1 : t2;
    const max = t1 < t2 ? t2 : t1;
    const key = (min << SHIFT_AMOUNT) | max;
    if (table1D_Sorted[key](i, i)) counter++;
}
const time1D_Sorted = performance.now() - start1D_Sorted;

// ==========================================
// RUN 3: 1D Symmetric (Die Optimierung)
// ==========================================
counter = 0;
const start1D_Sym = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
    const t1 = typesA[i];
    const t2 = typesB[i];
    
    // KEIN SORTIEREN! Einfach bitwise verbinden.
    // Wir nehmen an, dass table[(t1 << 4) | t2] UND table[(t2 << 4) | t1] befüllt sind.
    const key = (t1 << SHIFT_AMOUNT) | t2;
    
    if (table1D_Symmetric[key](i, i)) counter++;
}
const time1D_Sym = performance.now() - start1D_Sym;


// ==========================================
// ERGEBNISSE
// ==========================================
console.log(`2D Array:       ${time2D.toFixed(2)} ms`);
console.log(`1D Sorted:      ${time1D_Sorted.toFixed(2)} ms`);
console.log(`1D Symmetric:   ${time1D_Sym.toFixed(2)} ms`);

console.log(`\nGewinn Symmetrisch vs 2D: ${(time2D / time1D_Sym).toFixed(2)}x schneller`);