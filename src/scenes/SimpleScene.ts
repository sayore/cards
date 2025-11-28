// SimpleScene.ts - A simple scene with just one entity to test visibility

import { IEntity } from '../IEntity';
import { Draw } from '../Draw';
import { Entity } from '../Entity';
import { Circle } from '../entities/Circle';
import { FPS } from '../entities/FPS';

export class SimpleScene extends Entity {
    private testBox: Entity;
    private testCircle: Circle;
    rotation: number = 0;

    constructor() {
        super('simpleScene', 0, 0);
        
        // Create a large, clearly visible test box at center of screen
        this.testBox = new Entity('testBox', 400, 300); // Center of 800x600 canvas
        this.addChild(this.testBox);

        this.testCircle = new Circle('testCircle', 400, 300); // Center of 800x600 canvas
        this.addChild(this.testCircle);

        this.addChild(new FPS("FPS", 200, 10));
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        
        // Slowly rotate the test box
        this.rotation += deltaTime * 0.5; // Rotate at 0.5 radians per second
        
        // Make the test box move in a circle to make it more visible
        const radius = 50;
        this.testBox.position.x = 400 + Math.cos(this.rotation) * radius;
        this.testBox.position.y = 300 + Math.sin(this.rotation) * radius;
    }

    draw(draw: Draw): void {
        // Draw a large, clearly visible box
        draw.box({
            x: this.testBox.position.x - 50,  // 100x100 box
            y: this.testBox.position.y - 50,
            width: 100,
            height: 100,
            color: [1, 0, 0, 1], // Bright red
            fill: true
        });
        
        // Draw a border to make it more visible
        draw.box({
            x: this.testBox.position.x - 50,
            y: this.testBox.position.y - 50,
            width: 100,
            height: 100,
            color: [1, 1, 1, 1], // White border
            fill: false,
            lineWidth: 3
        });
        
        // Draw a small circle in the center of the box
        draw.circle({
            x: this.testBox.position.x,
            y: this.testBox.position.y,
            radius: 10,
            color: [0, 1, 0, 1], // Green center
            fill: true
        });
        
        // Draw entity position marker (for debugging)
        draw.line({
            x1: this.testBox.position.x - 15,
            y1: this.testBox.position.y,
            x2: this.testBox.position.x + 15,
            y2: this.testBox.position.y,
            color: [0, 1, 1, 1], // Cyan horizontal line
            lineWidth: 2
        });
        
        draw.line({
            x1: this.testBox.position.x,
            y1: this.testBox.position.y - 15,
            x2: this.testBox.position.x,
            y2: this.testBox.position.y + 15,
            color: [0, 1, 1, 1], // Cyan vertical line
            lineWidth: 2
        });
    }
}