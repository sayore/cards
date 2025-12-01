// HealthBar.ts - HealthBar entity drawn above another entity

import { Entity } from '../Entity';
import { Draw } from '../Draw';
import { Player } from './Player';

export class HealthBar extends Entity {
    readonly kind = 'HealthBar';
    targetEntity: Entity | null;
    width: number;
    height: number;
    barColor: [number, number, number, number];
    backgroundColor: [number, number, number, number];
    borderColor: [number, number, number, number];
    currentHealth: number;
    maxHealth: number;
    offset: { x: number; y: number; }; // Offset from target entity
    healthChangeEffect: boolean;
    healthChangeTimer: number;

    constructor(id: string, width: number = 100, height: number = 10) {
        super(id, 0, 0); // Position will be set relative to target
        this.width = width;
        this.height = height;
        this.barColor = [0, 1, 0, 1]; // Green
        this.backgroundColor = [0.2, 0, 0, 0.5]; // Dark red
        this.borderColor = [0, 0, 0, 1]; // Black
        this.currentHealth = 100;
        this.maxHealth = 100;
        this.targetEntity = null;
        this.offset = { x: 0, y: -40 }; // Above the target by default
        this.healthChangeEffect = false;
        this.healthChangeTimer = 0;
        this.debugConnectToParent = true;
    }

    update(deltaTime: number): void {
        super.update(deltaTime);

        // Update position to follow target entity (only if not a child of the target)
        if (this.targetEntity && this.parent !== this.targetEntity) {
            const targetPos = this.targetEntity.getWorldPosition();
            this.position.x = targetPos.x + this.offset.x;
            this.position.y = targetPos.y + this.offset.y;
        }

        // Update health change effect
        if (this.healthChangeEffect) {
            this.healthChangeTimer += deltaTime;
            if (this.healthChangeTimer > 0.5) { // Effect lasts 0.5 seconds
                this.healthChangeEffect = false;
                this.healthChangeTimer = 0;
            }
        }
    }

    draw(draw: Draw): void {
        if (!this.visible) return;
        
        // Draw background
        draw.box({
            x: this.position.x - this.width / 2,
            y: this.position.y - this.height / 2,
            width: this.width,
            height: this.height,
            color: this.backgroundColor,
            fill: true
        });
        
        // Draw health bar with color changing based on health percentage
        const healthPercent = this.maxHealth > 0 ? this.currentHealth / this.maxHealth : 0;
        const barWidth = this.width * healthPercent;
        
        // Change color based on health percentage
        let color: [number, number, number, number];
        if (healthPercent > 0.6) {
            color = [0, 1, 0, 1]; // Green
        } else if (healthPercent > 0.3) {
            color = [1, 1, 0, 1]; // Yellow
        } else {
            color = [1, 0, 0, 1]; // Red
        }
        
        // Add health change effect color pulse
        if (this.healthChangeEffect) {
            const pulse = Math.sin(this.healthChangeTimer * 20) * 0.5 + 0.5;
            color = [1, pulse, pulse, 1]; // Pulse to red/white
        }
        
        draw.box({
            x: this.position.x - this.width / 2,
            y: 100,
            width: 100,
            height: 100,
            color: color,
            fill: true
        });
        
        // Draw border
        draw.box({
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            color: [1, 0, 0, 1],
            fill: false,
            lineWidth: 1
        });
    }
    
    // Set the target entity to follow
    setTarget(target: Entity): void {
        this.targetEntity = target;
        this.maxHealth = (target as any).maxHealth || 100;
        this.currentHealth = (target as any).health || this.maxHealth;
    }
    
    // Update health and trigger visual effect
    updateHealth(current: number, max: number): void {
        const oldHealth = this.currentHealth;
        this.currentHealth = current;
        this.maxHealth = max;
        
        // Trigger visual effect if health changed significantly
        if (Math.abs(oldHealth - current) > this.maxHealth * 0.1) { // 10% change
            this.healthChangeEffect = true;
            this.healthChangeTimer = 0;
        }
    }
}