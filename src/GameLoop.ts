// GameLoop.ts - Manages the game loop and entity rendering

import { IEntity } from './IEntity';
import { Draw, TextOptions } from './Draw';
import { WebGLRenderer } from './WebGL';

export class GameLoop {
    private entities: IEntity[] = [];
    private renderer: WebGLRenderer;
    private draw: Draw;
    private lastTime: number = 0;
    private isRunning: boolean = false;
    private debugMode: boolean = true; // Enable debug visualization by default
    private debugInfo: { [key: string]: any } = {};
    private keyStates: { [key: string]: boolean } = {};
    private currentMode: string = 'game';
    
    // Mouse interaction properties
    private mousePosition: { x: number; y: number; } = { x: 0, y: 0 };
    private lastHovered: IEntity | null = null;
    private isMouseDown: boolean = false;

    constructor(renderer: WebGLRenderer, draw: Draw) {
        this.renderer = renderer;
        this.draw = draw;
        
        // Set up event listeners
        this.setupKeyListeners();
        this.setupMouseListeners();
    }

    private setupKeyListeners(): void {
        document.addEventListener('keydown', (e) => {
            this.keyStates[e.key] = true;
            this.debugInfo['lastKeyPressed'] = e.key;
            this.debugInfo['lastKeyTime'] = new Date().toLocaleTimeString();
        });

        document.addEventListener('keyup', (e) => {
            this.keyStates[e.key] = false;
        });
    }

    private setupMouseListeners(): void {
        const canvas = this.renderer.canvas;
        
        canvas.addEventListener('mousemove', (e) => {
            // Convert client coordinates to canvas coordinates
            const rect = canvas.getBoundingClientRect();
            this.mousePosition.x = e.clientX - rect.left;
            this.mousePosition.y = e.clientY - rect.top;
            
            // Check for hover events
            this.checkHover();
        });
        
        canvas.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            
            // Check for mouse down events on entities
            this.checkMouseDown();
        });
        
        canvas.addEventListener('mouseup', (e) => {
            this.isMouseDown = false;
            
            // Check for mouse up events on entities
            this.checkMouseUp();
        });
        
        canvas.addEventListener('mouseleave', (e) => {
            // Reset hover state when mouse leaves canvas
            if (this.lastHovered) {
                if (this.lastHovered.onMouseLeave) {
                    this.lastHovered.onMouseLeave();
                }
                this.lastHovered = null;
            }
        });
    }
    
    private checkHover(): void {
        let hoveredEntity: IEntity | null = null;
        
        // Check from top to bottom (reverse order to check top entities first)
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (this.checkEntityHoverRecursive(entity)) {
                hoveredEntity = entity;
                break; // Stop at the first hovered entity
            }
        }
        
        // Handle hover enter/leave events
        if (hoveredEntity !== this.lastHovered) {
            // Leave old hovered entity
            if (this.lastHovered && this.lastHovered.onMouseLeave) {
                this.lastHovered.onMouseLeave();
            }
            
            // Enter new hovered entity
            if (hoveredEntity && hoveredEntity.onMouseEnter) {
                hoveredEntity.onMouseEnter();
            }
            
            this.lastHovered = hoveredEntity;
        }
    }
    
    private checkEntityHoverRecursive(entity: IEntity): boolean {
        if (!entity.visible) return false;
        
        // Check if the current entity contains the mouse position
        if (entity.containsPoint(this.mousePosition.x, this.mousePosition.y)) {
            // If this entity has mouse events, return true
            return true;
        }
        
        // Check children recursively
        for (const child of entity.children) {
            if (this.checkEntityHoverRecursive(child)) {
                return true;
            }
        }
        
        return false;
    }
    
    private checkMouseDown(): void {
        // Find entity that was clicked on
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (entity.containsPoint(this.mousePosition.x, this.mousePosition.y) && entity.onMouseDown) {
                entity.onMouseDown();
                break; // Only trigger for one entity (topmost)
            }
        }
    }
    
    private checkMouseUp(): void {
        // Find entity that mouse was released over
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (entity.containsPoint(this.mousePosition.x, this.mousePosition.y) && entity.onMouseUp) {
                entity.onMouseUp();
                break; // Only trigger for one entity (topmost)
            }
        }
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

    setMode(mode: string): void {
        this.currentMode = mode;
        this.debugInfo['currentMode'] = mode;
    }

    updateDebugInfo(): void {
        // Update debug info about entities
        this.debugInfo['entityCount'] = this.entities.length;
        this.debugInfo['activeKeys'] = Object.keys(this.keyStates).filter(key => this.keyStates[key]);
        this.debugInfo['currentMode'] = this.currentMode;
        this.debugInfo['mouseX'] = this.mousePosition.x;
        this.debugInfo['mouseY'] = this.mousePosition.y;
        
        // Get positions of visible entities
        const visibleEntityPositions: { [id: string]: { x: number; y: number } } = {};
        for (const entity of this.entities) {
            if (entity.visible) {
                const worldPos = entity.getWorldPosition();
                visibleEntityPositions[entity.id] = { x: Math.round(worldPos.x), y: Math.round(worldPos.y) };
            }
        }
        this.debugInfo['entityPositions'] = visibleEntityPositions;
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
        
        // Draw border if enabled
        if (entity.hasBorder) {
            // This assumes the entity knows its bounds - for now, we'll have to implement this in specific entities
            // For now, we'll just draw a basic border for entities that know their bounds
        }

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
            
            // Draw entity ID near the position
            this.draw.text({
                x: worldPos.x + 10,
                y: worldPos.y - 10,
                text: entity.id,
                fontSize: 12,
                fontFamily: 'Arial',
                color: [1, 1, 0, 1], // Yellow for visibility
                textAlign: 'left',
                textBaseline: 'middle'
            });
        }

        // Draw all children
        for (const child of entity.children) {
            this.drawEntity(child);
        }
    }

    // Draw debug overlay with information about the game state
    private drawDebugOverlay(): void {
        if (!this.debugMode) return;

        // Position debug info in top-left corner
        const startX = 10;
        let currentY = 30;

        // Draw background for debug info
        this.draw.box({
            x: 5,
            y: 5,
            width: 300,
            height: 250,
            color: [0, 0, 0, 0.6], // Semi-transparent black background
            fill: true
        });

        // Draw debug info text
        const infoLines = [
            `Entities: ${this.debugInfo['entityCount'] || 0}`,
            `Mode: ${this.debugInfo['currentMode'] || 'unknown'}`,
            `Active Keys: ${(this.debugInfo['activeKeys'] || []).join(', ') || 'none'}`,
            `Last Key: ${this.debugInfo['lastKeyPressed'] || 'none'} at ${this.debugInfo['lastKeyTime'] || ''}`,
            `Mouse: (${Math.round(this.mousePosition.x)}, ${Math.round(this.mousePosition.y)})`,
            `Hovered: ${this.lastHovered?.id || 'none'}`
        ];

        for (const line of infoLines) {
            this.draw.text({
                x: startX,
                y: currentY,
                text: line,
                fontSize: 14,
                fontFamily: 'Arial',
                color: [1, 1, 1, 1], // White text
                textAlign: 'left',
                textBaseline: 'middle'
            });
            currentY += 20;
        }

        // If we have entity positions, show them
        const entityPositions = this.debugInfo['entityPositions'];
        if (entityPositions) {
            this.draw.text({
                x: startX,
                y: currentY,
                text: 'Entity Positions:',
                fontSize: 14,
                fontFamily: 'Arial',
                color: [0.8, 0.8, 1, 1], // Light blue text
                textAlign: 'left',
                textBaseline: 'middle'
            });
            currentY += 20;

            let count = 0;
            for (const [id, pos] of Object.entries(entityPositions) as [string, { x: number; y: number }][]) {
                if (count < 5) { // Limit the number of positions shown
                    this.draw.text({
                        x: startX + 10,
                        y: currentY,
                        text: `${id}: (${pos.x}, ${pos.y})`,
                        fontSize: 12,
                        fontFamily: 'Arial',
                        color: [0.9, 0.9, 0.9, 1], // Light gray text
                        textAlign: 'left',
                        textBaseline: 'middle'
                    });
                    currentY += 16;
                    count++;
                }
            }
        }
    }

    // The main game loop function
    private gameLoop = (currentTime: number): void => {
        if (!this.isRunning) return;

        // Calculate delta time in seconds
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Update debug info
        this.updateDebugInfo();

        // Clear the renderer
        this.renderer.clear();

        // Update all entities
        this.updateEntities(deltaTime / 1000);

        // Draw all entities
        this.drawEntities();

        // Draw debug overlay
        this.drawDebugOverlay();

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
    
    getDebugInfo(): { [key: string]: any } {
        return { ...this.debugInfo };
    }
}