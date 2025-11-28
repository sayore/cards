import { Draw } from "../Draw";
import { Entity } from "../Entity";


export class Circle extends Entity {
    radius: number;
    
    constructor(id: string, x: number, y: number, radius: number = 30) {
        super(id, x, y);
        
        this.radius = radius;
    }

    update(deltaTime: number): void {
        super.update(deltaTime);

    }

    draw(draw: Draw): void {
        if (!this.visible) return;

        draw.circle({
            x: this.position.x,
            y: this.position.y,
            radius: this.radius,
            color: [0, 0.5, 1, 1],
            fill: true
        });
    }

    containsPoint(x: number, y: number): boolean {
        // Check if the point is within the dialog's bounding box
        const dx = x - this.position.x;
        const dy = y - this.position.y;
        return (dx * dx + dy * dy) <= (this.radius * this.radius);
    }
  
}