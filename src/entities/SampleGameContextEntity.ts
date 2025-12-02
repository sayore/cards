// SampleGameContextEntity.ts - Example entity that demonstrates GameContext usage

import { Entity } from '../Entity';
import { Draw } from '../Draw';
import { GameContext } from '../GameContext';

export class SampleGameContextEntity extends Entity {
    readonly kind = 'SampleGameContextEntity';
    private entityRotation: number = 0; // Renamed to avoid collision with inherited rotation property
    private speed: number = 1; // Rotation speed
    private movementSpeed: number = 100; // Movement speed in pixels per second

    constructor(id: string, x: number, y: number) {
        super(id, x, y);
    }

    update(context: GameContext): void {
        super.update(context);

        // Example 1: Use deltaTime for frame-independent updates
        this.entityRotation += this.speed * context.deltaTime;

        // Example 2: Use input system to move with arrow keys
        if (context.input.isKeyPressed('ArrowUp')) {
            this.position.y -= this.movementSpeed * context.deltaTime;
        }
        if (context.input.isKeyPressed('ArrowDown')) {
            this.position.y += this.movementSpeed * context.deltaTime;
        }
        if (context.input.isKeyPressed('ArrowLeft')) {
            this.position.x -= this.movementSpeed * context.deltaTime;
        }
        if (context.input.isKeyPressed('ArrowRight')) {
            this.position.x += this.movementSpeed * context.deltaTime;
        }

        // Example 3: Use physics system (add this entity to physics if needed)
        // context.physics.addCollider(this); // hypothetical usage

        // Example 4: Use camera system
        // const screenPos = context.camera.worldToScreen(this.position.x, this.position.y);

        // Example 5: Use totalTime for animations
        // const timeBasedAnimation = Math.sin(context.totalTime * 2); // oscillate at 2 Hz
    }

    draw(draw: Draw): void {
        if (!this.visible) return;

        // Draw a rotating shape using lines to form a triangle
        const size = 30;
        const centerX = this.position.x;
        const centerY = this.position.y;

        // Calculate triangle vertices
        const x1 = centerX + Math.cos(this.entityRotation) * size;
        const y1 = centerY + Math.sin(this.entityRotation) * size;
        const x2 = centerX + Math.cos(this.entityRotation + (2 * Math.PI / 3)) * size;
        const y2 = centerY + Math.sin(this.entityRotation + (2 * Math.PI / 3)) * size;
        const x3 = centerX + Math.cos(this.entityRotation + (4 * Math.PI / 3)) * size;
        const y3 = centerY + Math.sin(this.entityRotation + (4 * Math.PI / 3)) * size;

        // Draw the triangle using lines
        draw.line({
            x1: x1, y1: y1,
            x2: x2, y2: y2,
            color: [1, 0.5, 0, 1], // Orange
            lineWidth: 2
        });
        draw.line({
            x1: x2, y1: y2,
            x2: x3, y2: y3,
            color: [1, 0.5, 0, 1], // Orange
            lineWidth: 2
        });
        draw.line({
            x1: x3, y1: y3,
            x2: x1, y2: y1,
            color: [1, 0.5, 0, 1], // Orange
            lineWidth: 2
        });

        // Draw the entity's ID
        draw.text({
            x: this.position.x - 20,
            y: this.position.y - 40,
            text: this.id,
            fontSize: 12,
            fontFamily: 'Arial',
            color: [1, 1, 1, 1]
        });
    }

    containsPoint(x: number, y: number): boolean {
        // Simple circular bounding box check
        const dx = x - this.position.x;
        const dy = y - this.position.y;
        return Math.sqrt(dx * dx + dy * dy) < 30; // 30 pixel radius
    }
}