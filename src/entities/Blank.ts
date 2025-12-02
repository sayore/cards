import { Draw } from "../Draw";
import { Entity } from "../Entity";
import { GameContext } from "../GameContext";

export class Blank extends Entity {
    readonly kind = 'Entity';
    constructor(id: string, x: number, y: number) {
        super(id, x, y);
    }

    update(context: GameContext): void {
        super.update(context);
    }

    draw(draw: Draw): void {
        // Blank entity does not draw anything
    }
}