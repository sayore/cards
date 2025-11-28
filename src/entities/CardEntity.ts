// CardEntity.ts

import { Entity } from '../Entity';
import { Draw } from '../Draw';

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
        this.originalColor = [1, 1, 1, 1];
        this.targetColor = targetColor;
    }

    update(deltaTime: number): boolean {
        this.activeTime += deltaTime;
        return this.activeTime < this.duration;
    }

    apply(entity: CardEntity): void {
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
    
    // Identity
    title: string;
    description: string;

    // Rendering State
    color: [number, number, number, number];
    currentColor: [number, number, number, number];
    effects: IEffect[];
    
    // Texture Caching
    private cachedTexture: WebGLTexture | null = null;
    private isDirty: boolean = true;
    private readonly SCALE_FACTOR = 2; // 2x resolution for crisp text

    constructor(id: string, x: number, y: number, title: string = "Card", desc: string = "No description") {
        super(id, x, y);
        this.width = 120;
        this.height = 160;
        
        this.title = title;
        this.description = desc;

        this.color = [0.2, 0.6, 1, 1]; // Default base tint
        this.currentColor = [...this.color];
        this.effects = [];

        this.hasBorder = true;
        this.highlightOnHover = true;
        this.borderColor = [1, 1, 1, 1];
    }

    update(deltaTime: number): void {
        super.update(deltaTime);

        // Update all active effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            if (!effect.update(deltaTime)) {
                this.effects.splice(i, 1);
                // When effects end, snap back to base color (or logic to revert)
                if (this.effects.length === 0) {
                     this.currentColor = [...this.color];
                }
            } else {
                effect.apply(this);
            }
        }
    }

    /**
     * Helper to wrap text within a specific width on the Canvas
     */
    private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
        const words = text.split(' ');
        let line = '';

        for(let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    /**
     * Bakes the card layout to a texture.
     * We bake the background as WHITE so we can tint it later using currentColor.
     */
    private bakeTexture(gl: WebGLRenderingContext): void {
        const canvas = document.createElement('canvas');
        const sf = this.SCALE_FACTOR;
        
        const w = this.width * sf;
        const h = this.height * sf;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Draw Background (White, to allow Tinting via shader)
        ctx.fillStyle = "#FFFFFF"; 
        ctx.fillRect(0, 0, w, h);

        // 2. Draw Placeholder Image Box (Dark Gray)
        ctx.fillStyle = "#333333";
        ctx.fillRect(5 * sf, 20 * sf, w - (10 * sf), h * 0.35);

        // 3. Draw Title
        ctx.fillStyle = "#000000";
        ctx.font = `bold ${16 * sf}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(this.title, w / 2, 5 * sf);

        // 4. Draw Description
        ctx.fillStyle = "#222222";
        ctx.font = `${10 * sf}px Arial`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        
        const padding = 4 * sf;
        const descY = (h * 0.5) + padding;
        const maxWidth = w - (padding * 2);
        
        this.wrapText(ctx, this.description, padding, descY-10, maxWidth, 6 * sf);

        // 5. Create WebGL Texture
        if (this.cachedTexture) gl.deleteTexture(this.cachedTexture);
        this.cachedTexture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, this.cachedTexture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        
        // Linear filtering for smooth downscaling
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.isDirty = false;
    }

    draw(draw: Draw): void {
        // Baking check
        if (this.isDirty || !this.cachedTexture) {
            // NOTE: We access the raw GL context. 
            // Ensure your Draw class has 'gl' public or cast it to any.
            this.bakeTexture((draw as any).gl); 
        }

        // Determine Tint Color
        let tintColor: [number, number, number, number] = this.currentColor;
        
        // If hovered, we brighten the tint
        if (this.isHovered) {
            tintColor = [
                Math.min(1.0, this.currentColor[0] * 1.3),
                Math.min(1.0, this.currentColor[1] * 1.3),
                Math.min(1.0, this.currentColor[2] * 1.3),
                this.currentColor[3]
            ];
        }

        const worldPos = this.getWorldPosition();
        const worldRot = this.getWorldRotation();

        // 1. Draw the Baked Texture
        if (this.cachedTexture) {
            draw.texturedBox({
                x: worldPos.x - this.width / 2,
                y: worldPos.y - this.height / 2,
                width: this.width,
                height: this.height,
                texture: this.cachedTexture,
                rotation: worldRot,
                color: tintColor // This tints the white background of the texture
            });
        }

        // 2. Draw the Dynamic Border (Immediate mode is fine for simple outlines)
        const borderColor: [number, number, number, number] = this.isHovered ? this.borderColor : [0, 0, 0, 1];
        
        // Note: Make sure Draw.box (filled=false) supports rotation now (from previous fix)
        // If not, this border will not align.
        draw.box({
            x: worldPos.x - this.width / 2,
            y: worldPos.y - this.height / 2,
            width: this.width,
            height: this.height,
            color: borderColor,
            fill: false,
            lineWidth: this.isHovered ? 3 : 1,
            rotation: worldRot 
        });

        // Debug Line
        if (this.parent) {
             const parentPos = this.parent.getWorldPosition();
             draw.line({
                 x1: worldPos.x,
                 y1: worldPos.y,
                 x2: parentPos.x,
                 y2: parentPos.y,
                 color: [1,1,1,0.2]
             });
        }
    }

    addEffect(effect: IEffect): void {
        if (effect instanceof ColorShiftEffect) {
            effect.originalColor = [...this.currentColor];
        }
        this.effects.push(effect);
    }

    onMouseOver(): void {
        // Example: Turn slightly Orange on hover via effect, or just rely on the brightness logic in draw()
        // this.addEffect(new ColorShiftEffect(1.0, [1, 0.8, 0.5, 1])); 
    }

    onMouseOut(): void {
        // this.addEffect(new ColorShiftEffect(0.5, this.color));
    }

    containsPoint(x: number, y: number): boolean {
        // Simple AABB check - Note: This is NOT accurate for rotated cards.
        // For accurate rotated collision, you need to transform the mouse point into local space.
        // But for this stage, AABB is usually "good enough" for card games unless rotation is extreme.
        const worldPos = this.getWorldPosition();
        const left = worldPos.x - this.width / 2;
        const right = worldPos.x + this.width / 2;
        const top = worldPos.y - this.height / 2;
        const bottom = worldPos.y + this.height / 2;

        return x >= left && x <= right && y >= top && y <= bottom;
    }
}