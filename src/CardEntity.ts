// CardEntity.ts - Example entity demonstrating the effect system

import { Entity } from './Entity';
import { Draw } from './Draw';

export interface IEffect {
    duration: number; // in seconds
    activeTime: number; // time effect has been active
    update(deltaTime: number): boolean; // returns true if effect is still active
    apply(entity: CardEntity): void;
}

export class ColorShiftEffect implements IEffect {
    duration: number;
    activeTime: number;
    originalColor: [number, number, number, number];
    targetColor: [number, number, number, number];

    constructor(duration: number, targetColor: [number, number, number, number]) {
        this.duration = duration;
        this.activeTime = 0;
        this.originalColor = [1, 1, 1, 1]; // Default white
        this.targetColor = targetColor;
    }

    update(deltaTime: number): boolean {
        this.activeTime += deltaTime;
        return this.activeTime < this.duration;
    }

    apply(entity: CardEntity): void {
        // This effect modifies the color over time
        const progress = Math.min(this.activeTime / this.duration, 1);
        entity.currentColor = [
            this.originalColor[0] + (this.targetColor[0] - this.originalColor[0]) * progress,
            this.originalColor[1] + (this.targetColor[1] - this.originalColor[1]) * progress,
            this.originalColor[2] + (this.targetColor[2] - this.originalColor[2]) * progress,
            this.originalColor[3] + (this.targetColor[3] - this.originalColor[3]) * progress
        ];
    }
}

export class CardEntity extends Entity {
    width: number;
    height: number;
    color: [number, number, number, number];
    currentColor: [number, number, number, number];
    effects: IEffect[];
    private effectStartTime: number;

    constructor(id: string, x: number, y: number, width: number = 80, height: number = 100) {
        super(id, x, y);
        this.width = width;
        this.height = height;
        this.color = [0.2, 0.6, 1, 1]; // Default blueish color
        this.currentColor = [...this.color]; // Copy of the color
        this.effects = [];
        this.effectStartTime = 0;

        // Enable border and hover effects for cards
        this.hasBorder = true;
        this.highlightOnHover = true;
        this.borderColor = [1, 1, 1, 1]; // White border by default
    }

    update(deltaTime: number): void {
        super.update(deltaTime);

        // Update all active effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            if (!effect.update(deltaTime)) {
                // Effect has expired
                this.effects.splice(i, 1);
                // Reset to original color when effect ends
                this.currentColor = [...this.color];
            } else {
                // Apply the effect
                effect.apply(this);
            }
        }
    }

    draw(draw: Draw): void {
        // Determine base color based on hover state
        let cardColor: [number, number, number, number] = this.currentColor;
        if (this.isHovered) {
            // Brighten the color when hovered
            cardColor = [
                Math.min(1, this.currentColor[0] * 1.5),
                Math.min(1, this.currentColor[1] * 1.5),
                Math.min(1, this.currentColor[2] * 1.5),
                this.currentColor[3]
            ] as [number, number, number, number];
        }

        // Draw the card as a rectangle
        draw.box({
            x: this.position.x - this.width / 2,
            y: this.position.y - this.height / 2,
            width: this.width,
            height: this.height,
            color: cardColor,
            fill: true
        });

        // Draw border - use specific border color when hovered, otherwise black
        const borderColor: [number, number, number, number] = this.isHovered ? this.borderColor : [0, 0, 0, 1];
        draw.box({
            x: this.position.x - this.width / 2,
            y: this.position.y - this.height / 2,
            width: this.width,
            height: this.height,
            color: borderColor,
            fill: false,
            lineWidth: this.isHovered ? 3 : 2
        });
    }

    addEffect(effect: IEffect): void {
        // If it's a ColorShiftEffect, set the original color
        if (effect instanceof ColorShiftEffect) {
            effect.originalColor = [...this.currentColor];
        }
        this.effects.push(effect);
    }

    // Example method to trigger an effect on an event
    onMouseOver(): void {
        // Add a color shift effect when mouse is over the card
        this.addEffect(new ColorShiftEffect(1.0, [1, 0.5, 0.2, 1])); // Orange color for 1 second
    }

    onMouseOut(): void {
        // Add a color shift effect when mouse leaves the card
        this.addEffect(new ColorShiftEffect(0.5, [0.2, 0.6, 1, 1])); // Back to original color in 0.5 seconds
    }

    containsPoint(x: number, y: number): boolean {
        // Check if the point is within the card's bounding box
        const left = this.position.x - this.width / 2;
        const right = this.position.x + this.width / 2;
        const top = this.position.y - this.height / 2;
        const bottom = this.position.y + this.height / 2;

        return x >= left && x <= right && y >= top && y <= bottom;
    }
}