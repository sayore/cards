// Player.ts - Player entity with animation effects

import { Entity } from '../Entity';
import { Draw } from '../Draw';

export class Player extends Entity {
    readonly kind = 'Player';
    speed: number;
    health: number;
    maxHealth: number;
    isMoving: boolean;
    direction: 'left' | 'right' | 'up' | 'down';
    animationFrame: number;
    animationTimer: number;
    private blinkEffect: boolean;
    private blinkTimer: number;

    constructor(id: string, x: number, y: number) {
        super(id, x, y);
        this.speed = 100; // pixels per second
        this.health = 100;
        this.maxHealth = 100;
        this.isMoving = false;
        this.direction = 'right';
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.blinkEffect = false;
        this.blinkTimer = 0;
        this.debugConnectToParent = true;

        // Enable border and hover effects for this player
        this.hasBorder = true;
        this.highlightOnHover = true;
        this.borderColor = [1, 1, 0, 1]; // Yellow border when hovered
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        
        // Handle animation
        this.animationTimer += deltaTime;
        if (this.animationTimer > 0.2) { // Change frame every 0.2 seconds
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
        
        // Update blink effect if active
        if (this.blinkEffect) {
            this.blinkTimer += deltaTime;
            if (this.blinkTimer > 1.0) { // Blink effect lasts 1 second
                this.blinkEffect = false;
                this.blinkTimer = 0;
            }
        }
        
        // Move player if moving
        if (this.isMoving) {
            switch (this.direction) {
                case 'left':
                    this.position.x -= this.speed * deltaTime;
                    break;
                case 'right':
                    this.position.x += this.speed * deltaTime;
                    break;
                case 'up':
                    this.position.y -= this.speed * deltaTime;
                    break;
                case 'down':
                    this.position.y += this.speed * deltaTime;
                    break;
            }
        }
    }

    draw(draw: Draw): void {
        // Only draw if not blinking (for blink effect when taking damage)
        if (this.blinkEffect && Math.floor(this.blinkTimer * 10) % 2 === 0) {
            return; // Skip drawing to create blink effect
        }

        // Determine base color based on hover state
        let playerColor: [number, number, number, number] = [0.2, 0.4, 1, 1]; // Blue
        if (this.isHovered) {
            // Brighten the color when hovered
            playerColor = [0.4, 0.7, 1, 1]; // Lighter blue when hovered
        }

        // Draw player as a blue rectangle with animation details
        draw.box({
            x: this.position.x - 20,
            y: this.position.y - 30,
            width: 40,
            height: 60,
            color: playerColor,
            fill: true
        });

        // Draw border if highlighted
        if (this.isHovered && this.hasBorder) {
            draw.box({
                x: this.position.x - 20,
                y: this.position.y - 30,
                width: 40,
                height: 60,
                color: this.borderColor,
                fill: false,
                lineWidth: 3
            });
        }

        // Draw player details based on animation frame
        const eyeOffset = Math.sin(this.animationFrame) * 2; // Slight eye movement

        // Draw eyes
        draw.circle({
            x: this.position.x - 8 + eyeOffset,
            y: this.position.y - 15,
            radius: 4,
            color: [1, 1, 1, 1], // White
            fill: true
        });

        draw.circle({
            x: this.position.x + 8 + eyeOffset,
            y: this.position.y - 15,
            radius: 4,
            color: [1, 1, 1, 1], // White
            fill: true
        });

        // Draw pupils
        draw.circle({
            x: this.position.x - 8 + eyeOffset,
            y: this.position.y - 15,
            radius: 2,
            color: [0, 0, 0, 1], // Black
            fill: true
        });

        draw.circle({
            x: this.position.x + 8 + eyeOffset,
            y: this.position.y - 15,
            radius: 2,
            color: [0, 0, 0, 1], // Black
            fill: true
        });

        // Draw smile that changes with animation
        const smileOffset = Math.sin(this.animationFrame * 0.5) * 2;
        draw.circle({
            x: this.position.x,
            y: this.position.y - 5 + smileOffset,
            radius: 8,
            color: [0, 0, 0, 1], // Black
            fill: false,
            stroke: true,
            lineWidth: 2
        });
    }
    
    // Method to apply damage with visual effect
    takeDamage(amount: number): void {
        this.health = Math.max(0, this.health - amount);
        
        // Trigger blink effect
        this.blinkEffect = true;
        this.blinkTimer = 0;
    }
    
    // Method to heal with visual effect
    heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    // Method to trigger a movement effect
    startMoving(direction: 'left' | 'right' | 'up' | 'down'): void {
        this.isMoving = true;
        this.direction = direction;
    }
    
    stopMoving(): void {
        this.isMoving = false;
    }

    containsPoint(x: number, y: number): boolean {
        // Check if the point is within the player's bounding box
        const left = this.position.x - 20;
        const right = this.position.x + 20;
        const top = this.position.y - 30;
        const bottom = this.position.y + 30;

        return x >= left && x <= right && y >= top && y <= bottom;
    }
}