import { Draw } from "../Draw";
import { Entity } from "../Entity";

export class Blank extends Entity {
    readonly kind = 'Entity';
    constructor(id: string, x: number, y: number) {
        super(id, x, y);
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
    }

    draw(draw: Draw): void {
        // Blank entity does not draw anything
    }
}