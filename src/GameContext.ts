// GameContext.ts - Global context passed to entities containing system references

import { InputManager } from "./InputManager";
import { PhysicsSystem } from "./collision/CollisionSystem";
import { Camera } from "./Camera";

export interface GameContext {
    // 1. Zeit-Daten (Verändern sich jeden Frame)
    deltaTime: number; // Zeit in Sekunden seit dem letzten Frame (für Bewegung)
    totalTime: number; // Gesamtlaufzeit (für Animationen/Shader)

    // 2. System-Referenzen (Bleiben meist gleich)
    // readonly schützt davor, dass ein Entity versehentlich das System löscht/überschreibt
    readonly input: InputManager;
    readonly physics: PhysicsSystem;
    readonly camera: Camera;
    
    // Optional: Globale Game-States
    // readonly score: number; 
}