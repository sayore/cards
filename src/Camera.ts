// Camera.ts - Manages camera transformations for rendering

export interface Position {
    x: number;
    y: number;
}

export class Camera {
    position: Position;
    zoom: number;
    rotation: number; // in radians

    constructor(x: number = 0, y: number = 0) {
        this.position = { x, y };
        this.zoom = 1.0;
        this.rotation = 0;
    }

    setPosition(x: number, y: number): void {
        this.position.x = x;
        this.position.y = y;
    }

    setZoom(zoom: number): void {
        this.zoom = Math.max(0.01, zoom); // Prevent zoom from becoming 0 or negative
    }

    setRotation(rotation: number): void {
        this.rotation = rotation;
    }

    move(dx: number, dy: number): void {
        this.position.x += dx;
        this.position.y += dy;
    }

    // Transform screen coordinates to world coordinates
    screenToWorld(screenX: number, screenY: number, canvasWidth: number, canvasHeight: number): Position {
        // Apply inverse transformations
        const halfWidth = canvasWidth / 2;
        const halfHeight = canvasHeight / 2;

        // Adjust for zoom
        let worldX = (screenX - halfWidth) / this.zoom;
        let worldY = (screenY - halfHeight) / this.zoom;

        // Adjust for camera position
        worldX += this.position.x;
        worldY += this.position.y;

        // Apply inverse rotation if needed
        if (this.rotation !== 0) {
            const cos = Math.cos(-this.rotation);
            const sin = Math.sin(-this.rotation);
            const rotatedX = worldX * cos - worldY * sin;
            const rotatedY = worldX * sin + worldY * cos;
            worldX = rotatedX;
            worldY = rotatedY;
        }

        return { x: worldX, y: worldY };
    }

    // Transform world coordinates to screen coordinates
    worldToScreen(worldX: number, worldY: number, canvasWidth: number, canvasHeight: number): Position {
        // Apply transformations
        let screenX = worldX;
        let screenY = worldY;

        // Apply camera offset
        screenX -= this.position.x;
        screenY -= this.position.y;

        // Apply rotation if needed
        if (this.rotation !== 0) {
            const cos = Math.cos(this.rotation);
            const sin = Math.sin(this.rotation);
            const rotatedX = screenX * cos - screenY * sin;
            const rotatedY = screenX * sin + screenY * cos;
            screenX = rotatedX;
            screenY = rotatedY;
        }

        // Apply zoom
        screenX *= this.zoom;
        screenY *= this.zoom;

        // Adjust for canvas center
        screenX += canvasWidth / 2;
        screenY += canvasHeight / 2;

        return { x: screenX, y: screenY };
    }

    // Get view matrix for WebGL rendering (simplified)
    getViewMatrix(): Float32Array {
        // Create a transformation matrix
        // This is a simple 2D transformation matrix
        const rad = this.rotation;
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const z = this.zoom;

        return new Float32Array([
            z * c, -z * s, 0, 0,
            z * s, z * c, 0, 0,
            0, 0, 1, 0,
            -this.position.x * z * c + this.position.y * z * s, 
            this.position.x * z * s + this.position.y * z * c, 0, 1
        ]);
    }
}