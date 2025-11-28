// GameLoop.ts - Manages the game loop and entity rendering

import { IEntity } from './IEntity';
import { Draw } from './Draw';
import { WebGLRenderer } from './WebGL';

export class GameLoop {
    private entities: IEntity[] = [];
    private renderer: WebGLRenderer;
    private draw: Draw;
    private lastTime: number = 0;
    private isRunning: boolean = false;
    private debugMode: boolean = true; // Enable debug visualization by default

    constructor(renderer: WebGLRenderer, draw: Draw) {
        this.renderer = renderer;
        this.draw = draw;
    }

    addEntity(entity: IEntity): void {
        this.entities.push(entity);
    }

    removeEntity(entity: IEntity): void {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }

    // Update all entities in the game world
    private updateEntities(deltaTime: number): void {
        for (const entity of this.entities) {
            this.updateEntity(entity, deltaTime);
        }
    }

    // Recursively update an entity and its children
    private updateEntity(entity: IEntity, deltaTime: number): void {
        if (!entity.visible) return;

        // Update the entity itself
        entity.update(deltaTime);

        // Update all children
        for (const child of entity.children) {
            this.updateEntity(child, deltaTime);
        }
    }

    // Draw all entities in the game world
    private drawEntities(): void {
        for (const entity of this.entities) {
            this.drawEntity(entity);
        }
    }

    // Recursively draw an entity and its children
    private drawEntity(entity: IEntity): void {
        if (!entity.visible) return;

        // Draw the entity itself
        entity.draw(this.draw);

        // Draw debug connection to parent if enabled
        if (this.debugMode && entity.debugConnectToParent && entity.parent) {
            const parentPos = entity.parent.getWorldPosition();
            const currentPos = entity.getWorldPosition();

            this.draw.line({
                x1: parentPos.x,
                y1: parentPos.y,
                x2: currentPos.x,
                y2: currentPos.y,
                color: [1, 0, 0, 1], // Red line for debug
                lineWidth: 1
            });
        }

        // Visualize entity's position if in debug mode
        if (this.debugMode) {
            const worldPos = entity.getWorldPosition();

            // Draw a small cross at the entity's position
            const crossSize = 5;
            this.draw.line({
                x1: worldPos.x - crossSize,
                y1: worldPos.y,
                x2: worldPos.x + crossSize,
                y2: worldPos.y,
                color: [0, 1, 0, 1], // Green line for position
                lineWidth: 1
            });

            this.draw.line({
                x1: worldPos.x,
                y1: worldPos.y - crossSize,
                x2: worldPos.x,
                y2: worldPos.y + crossSize,
                color: [0, 1, 0, 1], // Green line for position
                lineWidth: 1
            });

            // Draw rotation indicator if entity is rotated
            if (entity.rotation !== 0) {
                const endX = worldPos.x + 10 * Math.cos(entity.rotation);
                const endY = worldPos.y + 10 * Math.sin(entity.rotation);

                this.draw.line({
                    x1: worldPos.x,
                    y1: worldPos.y,
                    x2: endX,
                    y2: endY,
                    color: [0, 0, 1, 1], // Blue line for rotation
                    lineWidth: 1
                });
            }
        }

        // Draw all children
        for (const child of entity.children) {
            this.drawEntity(child);
        }
    }

    // The main game loop function
    private gameLoop = (currentTime: number): void => {
        if (!this.isRunning) return;

        // Calculate delta time in seconds
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Clear the renderer
        this.renderer.clear();

        // Update all entities
        this.updateEntities(deltaTime / 1000);

        // Draw all entities
        this.drawEntities();

        // Request next frame
        requestAnimationFrame(this.gameLoop);
    };

    start(): void {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
    }

    stop(): void {
        this.isRunning = false;
    }

    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }

    getEntities(): IEntity[] {
        return [...this.entities]; // Return a copy of the entities array
    }
}