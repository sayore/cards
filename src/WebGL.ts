// WebGL.ts - Creates and manages a WebGL rendering context

export class WebGLRenderer {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    width: number;
    height: number;

    constructor(containerId: string = 'game', width: number = 800, height: number = 600) {
        // Find the game container
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with id '${containerId}' not found`);
        }

        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;

        // Add canvas to container
        container.appendChild(this.canvas);

        // Initialize WebGL context
        const gl = this.canvas.getContext('webgl');
        if (!gl) {
            throw new Error('WebGL not supported by this browser');
        }
        this.gl = gl;

        // Set clear color to black and enable depth testing
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        
        // Set the viewport to match the canvas size
        this.resize(width, height);
    }

    resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }

    clear(): void {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    // Get the WebGL context
    getContext(): WebGLRenderingContext {
        return this.gl;
    }

    // Method to get canvas data as image (for rendering to PNG)
    getCanvasData(): string {
        // Ensure the canvas is an HTMLCanvasElement to access toDataURL
        if (this.gl.canvas instanceof HTMLCanvasElement) {
            return this.gl.canvas.toDataURL('image/png');
        } else {
            console.warn('Canvas is not an HTMLCanvasElement, cannot get data URL');
            return '';
        }
    }
}