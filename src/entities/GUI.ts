// GUI.ts - GUI entity for user interface elements

import { Entity } from '../Entity';
import { Draw } from '../Draw';

export class GUI extends Entity {
    elements: Entity[];
    backgroundColor: [number, number, number, number];
    borderColor: [number, number, number, number];
    borderWidth: number;

    constructor(id: string, x: number, y: number) {
        super(id, x, y);
        this.elements = [];
        this.backgroundColor = [0, 0, 0, 0.7]; // Semi-transparent black
        this.borderColor = [1, 1, 1, 1]; // White
        this.borderWidth = 1;
        this.absolute = true; // GUI elements are usually absolute positioned
        this.debugConnectToParent = true;
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        
        // Update all GUI elements
        for (const element of this.elements) {
            element.update(deltaTime);
        }
    }

    draw(draw: Draw): void {
        // Draw GUI background if visible
        if (this.visible) {
            // Calculate bounds to draw background
            let minX = 0, minY = 0, maxX = 300, maxY = 200; // Default size
            
            // We could calculate actual bounds from child elements
            draw.box({
                x: this.position.x,
                y: this.position.y,
                width: maxX,
                height: maxY,
                color: this.backgroundColor,
                fill: true
            });
            
            // Draw border
            draw.box({
                x: this.position.x,
                y: this.position.y,
                width: maxX,
                height: maxY,
                color: this.borderColor,
                fill: false,
                lineWidth: this.borderWidth
            });
        }
        
        // Draw all GUI elements
        for (const element of this.elements) {
            if (element.visible) {
                element.draw(draw);
            }
        }
    }
    
    addElement(element: Entity): void {
        this.elements.push(element);
        this.addChild(element);
    }
    
    removeElement(element: Entity): void {
        const index = this.elements.indexOf(element);
        if (index !== -1) {
            this.elements.splice(index, 1);
            this.removeChild(element);
        }
    }
}