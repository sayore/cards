// Background.ts - Background entity for rendering backgrounds

import { Entity } from '../Entity';
import { Draw } from '../Draw';
import { PrerenderOptions } from '../Draw';

export class Background extends Entity {
    width: number;
    height: number;
    backgroundColor: [number, number, number, number];
    texture: WebGLTexture | null;
    isTiled: boolean;
    tileWidth: number;
    tileHeight: number;
    private drawInstance: Draw | null;

    constructor(id: string, x: number = 0, y: number = 0, width: number = 800, height: number = 600) {
        super(id, x, y);
        this.width = width;
        this.height = height;
        this.backgroundColor = [0.1, 0.1, 0.2, 1]; // Dark blue
        this.texture = null;
        this.isTiled = false;
        this.tileWidth = 64;
        this.tileHeight = 64;
        this.drawInstance = null;
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        // Background typically doesn't need per-frame updates
    }

    draw(draw: Draw): void {
        if (!this.visible) return;
        
        this.drawInstance = draw;
        
        if (this.texture) {
            // Draw using the prerendered texture
            draw.image({
                x: this.position.x - this.width / 2,
                y: this.position.y - this.height / 2,
                width: this.width,
                height: this.height,
                texture: this.texture
            });
        } else {
            // Draw solid color background
            draw.box({
                x: this.position.x - this.width / 2,
                y: this.position.y - this.height / 2,
                width: this.width,
                height: this.height,
                color: this.backgroundColor,
                fill: true
            });
            
            // Draw grid pattern if needed
            this.drawGrid(draw);
        }
    }
    
    // Draw a grid pattern on the background
    private drawGrid(draw: Draw): void {
        // Draw grid lines every 50 pixels
        const gridSize = 50;
        const startX = this.position.x - this.width / 2;
        const endX = this.position.x + this.width / 2;
        const startY = this.position.y - this.height / 2;
        const endY = this.position.y + this.height / 2;
        
        // Vertical lines
        for (let x = startX; x <= endX; x += gridSize) {
            draw.line({
                x1: x,
                y1: startY,
                x2: x,
                y2: endY,
                color: [0.2, 0.2, 0.3, 0.3],
                lineWidth: 1
            });
        }
        
        // Horizontal lines
        for (let y = startY; y <= endY; y += gridSize) {
            draw.line({
                x1: startX,
                y1: y,
                x2: endX,
                y2: y,
                color: [0.2, 0.2, 0.3, 0.3],
                lineWidth: 1
            });
        }
    }
    
    // Set a solid background color
    setSolidColor(color: [number, number, number, number]): void {
        this.backgroundColor = color;
        this.texture = null; // Clear any existing texture
    }
    
    // Create a patterned background using the prerender functionality
    prerenderPattern(draw: Draw, patternType: 'grid' | 'noise' | 'gradient'): void {
        const prerenderOptions: PrerenderOptions = {
            width: this.width,
            height: this.height,
            id: `${this.id}_texture`
        };
        
        this.texture = draw.prerenderToTexture((tempDraw: Draw) => {
            // Draw background based on pattern type
            switch (patternType) {
                case 'grid':
                    this.drawPatternedGrid(tempDraw);
                    break;
                case 'noise':
                    this.drawNoisePattern(tempDraw);
                    break;
                case 'gradient':
                    this.drawGradient(tempDraw);
                    break;
            }
        }, prerenderOptions);
    }
    
    // Helper method to draw a grid pattern
    private drawPatternedGrid(draw: Draw): void {
        // Draw checkered pattern
        const tileSize = 20;
        for (let x = 0; x < this.width; x += tileSize) {
            for (let y = 0; y < this.height; y += tileSize) {
                if (((x / tileSize) + (y / tileSize)) % 2 === 0) {
                    draw.box({
                        x: x,
                        y: y,
                        width: tileSize,
                        height: tileSize,
                        color: [0.15, 0.15, 0.25, 1],
                        fill: true
                    });
                } else {
                    draw.box({
                        x: x,
                        y: y,
                        width: tileSize,
                        height: tileSize,
                        color: [0.1, 0.1, 0.2, 1],
                        fill: true
                    });
                }
            }
        }
    }
    
    // Helper method to draw a noise pattern
    private drawNoisePattern(draw: Draw): void {
        // Draw a simple noise pattern
        for (let x = 0; x < this.width; x += 2) {
            for (let y = 0; y < this.height; y += 2) {
                // Generate pseudo-random color based on position
                const r = Math.abs(Math.sin(x * 0.01) * 0.2);
                const g = Math.abs(Math.cos(y * 0.01) * 0.2);
                const b = Math.abs(Math.sin((x + y) * 0.01) * 0.2);
                
                draw.box({
                    x: x,
                    y: y,
                    width: 2,
                    height: 2,
                    color: [r, g, b, 0.8],
                    fill: true
                });
            }
        }
    }
    
    // Helper method to draw a gradient
    private drawGradient(draw: Draw): void {
        // Draw a simple gradient from top to bottom
        for (let y = 0; y < this.height; y++) {
            const t = y / this.height; // Normalized value from 0 to 1
            const r = 0.1 + 0.2 * t;
            const g = 0.1 + 0.1 * t;
            const b = 0.2 + 0.3 * t;
            
            draw.box({
                x: 0,
                y: y,
                width: this.width,
                height: 1,
                color: [r, g, b, 1],
                fill: true
            });
        }
    }
    
    // Set tiling properties
    setTiling(enabled: boolean, tileWidth: number = 64, tileHeight: number = 64): void {
        this.isTiled = enabled;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
    }
}