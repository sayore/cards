// Draw.ts - Drawing functions for WebGL canvas with support for rendering to buffers

import { WebGLRenderer } from './WebGL';

// Common drawing options interface
interface DrawingOptions {
    color?: [number, number, number, number]; // RGBA values 0-1
    lineWidth?: number;
    fill?: boolean;
    stroke?: boolean;
    rotation?: number; // in radians
    opacity?: number;
    texture?: WebGLTexture | null;
}

// Options for line drawing
interface LineOptions extends DrawingOptions {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

// Options for circle drawing
interface CircleOptions extends DrawingOptions {
    x: number;
    y: number;
    radius: number;
    segments?: number; // Number of segments to draw the circle
}

// Options for box drawing
interface BoxOptions extends DrawingOptions {
    x: number;
    y: number;
    width: number;
    height: number;
}

// Options for image drawing
interface ImageOptions extends DrawingOptions {
    x: number;
    y: number;
    width: number;
    height: number;
    src?: string;
    imageData?: ImageData;
}

// Shader sources
const vertexShaderSource = `
attribute vec2 a_position;
uniform vec2 u_resolution;
void main() {
   vec2 zeroToOne = a_position / u_resolution;
   vec2 zeroToTwo = zeroToOne * 2.0;
   vec2 clipSpace = zeroToTwo - 1.0;
   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

const fragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
void main() {
   gl_FragColor = u_color;
}
`;

export class Draw {
    private gl: WebGLRenderingContext;
    private program: WebGLProgram;
    private quadBuffer: WebGLBuffer;
    private texture: WebGLTexture | null = null;

    constructor(renderer: WebGLRenderer) {
        this.gl = renderer.getContext();
        this.program = this.createShaderProgram();
        this.quadBuffer = this.createQuadBuffer();
    }

    private createShaderProgram(): WebGLProgram {
        const gl = this.gl;

        // Create and compile vertex shader
        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
        if (!vertexShader) throw new Error('Failed to create vertex shader');

        // Create and compile fragment shader
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!fragmentShader) throw new Error('Failed to create fragment shader');

        // Create shader program
        const program = gl.createProgram();
        if (!program) throw new Error('Failed to create shader program');

        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            throw new Error('Failed to link shader program');
        }

        return program;
    }

    private createShader(type: number, source: string): WebGLShader | null {
        const gl = this.gl;
        const shader = gl.createShader(type);
        if (!shader) return null;

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    private createQuadBuffer(): WebGLBuffer {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        if (!buffer) throw new Error('Failed to create buffer');

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        const positions = new Float32Array([
            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1,
        ]);

        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        return buffer;
    }

    private setupAttributes() {
        const gl = this.gl;
        const positionAttributeLocation = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        const resolutionUniformLocation = gl.getUniformLocation(this.program, 'u_resolution');
        gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    }

    // Draw a line
    line(options: LineOptions): void {
        const gl = this.gl;
        gl.useProgram(this.program);

        this.setupAttributes();

        // Set color
        const colorUniformLocation = gl.getUniformLocation(this.program, 'u_color');
        const color = options.color || [1, 1, 1, 1];
        gl.uniform4f(colorUniformLocation, color[0], color[1], color[2], color[3]);

        // For line drawing, we'll use a simple approach with points
        // Create line vertices
        const vertices = new Float32Array([
            options.x1, options.y1,
            options.x2, options.y2
        ]);

        // Create a temporary buffer for the line
        const lineBuffer = gl.createBuffer();
        if (!lineBuffer) return;

        gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionAttributeLocation = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        gl.lineWidth(options.lineWidth || 1);
        gl.drawArrays(gl.LINES, 0, 2);

        // Clean up
        gl.deleteBuffer(lineBuffer);
    }

    // Draw a rectangle/box
    box(options: BoxOptions): void {
        const gl = this.gl;
        gl.useProgram(this.program);

        this.setupAttributes();

        // Set color
        const colorUniformLocation = gl.getUniformLocation(this.program, 'u_color');
        const color = options.color || [1, 1, 1, 1];
        gl.uniform4f(colorUniformLocation, color[0], color[1], color[2], color[3]);

        // Create rectangle vertices (in screen coordinates)
        const x1 = options.x;
        const y1 = options.y;
        const x2 = options.x + options.width;
        const y2 = options.y + options.height;

        const vertices = new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2
        ]);

        // Create a temporary buffer for the rectangle
        const rectBuffer = gl.createBuffer();
        if (!rectBuffer) return;

        gl.bindBuffer(gl.ARRAY_BUFFER, rectBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionAttributeLocation = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        const mode = options.fill ? gl.TRIANGLES : gl.LINE_LOOP;
        gl.drawArrays(mode, 0, 6);

        // Clean up
        gl.deleteBuffer(rectBuffer);
    }

    // Draw a circle
    circle(options: CircleOptions): void {
        const gl = this.gl;
        gl.useProgram(this.program);

        this.setupAttributes();

        // Set color
        const colorUniformLocation = gl.getUniformLocation(this.program, 'u_color');
        const color = options.color || [1, 1, 1, 1];
        gl.uniform4f(colorUniformLocation, color[0], color[1], color[2], color[3]);

        // Create circle vertices
        const segments = options.segments || 32;
        const vertices = new Float32Array(segments * 2 * 3); // 3 points per triangle for fill

        if (options.fill) {
            // Create triangles for filled circle
            for (let i = 0; i < segments; i++) {
                const angle1 = (i * 2 * Math.PI) / segments;
                const angle2 = ((i + 1) * 2 * Math.PI) / segments;

                // Center vertex
                vertices[i * 6] = options.x;
                vertices[i * 6 + 1] = options.y;

                // Outer vertex 1
                vertices[i * 6 + 2] = options.x + Math.cos(angle1) * options.radius;
                vertices[i * 6 + 3] = options.y + Math.sin(angle1) * options.radius;

                // Outer vertex 2
                vertices[i * 6 + 4] = options.x + Math.cos(angle2) * options.radius;
                vertices[i * 6 + 5] = options.y + Math.sin(angle2) * options.radius;
            }

            // Create a temporary buffer for the circle
            const circleBuffer = gl.createBuffer();
            if (!circleBuffer) return;

            gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            const positionAttributeLocation = gl.getAttribLocation(this.program, 'a_position');
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.TRIANGLES, 0, segments * 3);

            // Clean up
            gl.deleteBuffer(circleBuffer);
        } else {
            // Draw circle outline
            const vertices = new Float32Array(segments * 2);
            for (let i = 0; i <= segments; i++) {
                const angle = (i * 2 * Math.PI) / segments;
                vertices[i * 2] = options.x + Math.cos(angle) * options.radius;
                vertices[i * 2 + 1] = options.y + Math.sin(angle) * options.radius;
            }

            // Create a temporary buffer for the circle outline
            const circleBuffer = gl.createBuffer();
            if (!circleBuffer) return;

            gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            const positionAttributeLocation = gl.getAttribLocation(this.program, 'a_position');
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

            gl.lineWidth(options.lineWidth || 1);
            gl.drawArrays(gl.LINE_STRIP, 0, segments + 1);

            // Clean up
            gl.deleteBuffer(circleBuffer);
        }
    }

    // Draw an image
    image(options: ImageOptions): void {
        if (!options.src && !options.imageData) {
            console.warn('Image drawing requires either src or imageData');
            return;
        }

        const gl = this.gl;
        
        // Create a texture for the image
        const texture = gl.createTexture();
        if (!texture) return;
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Because images have to be download over the internet
        // they might take a moment until they are ready.
        // Until then we'll draw a temporary rectangle
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                      new Uint8Array([255, 255, 255, 255])); // White pixel
        
        if (options.src) {
            const image = new Image();
            image.onload = () => {
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                
                // Set the parameters so we can render any size image.
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                
                // Draw the image
                this.drawImageQuad(options.x, options.y, options.width, options.height, texture);
            };
            image.src = options.src;
        } else if (options.imageData) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, options.imageData);
            
            // Set the parameters so we can render any size image.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            
            // Draw the image
            this.drawImageQuad(options.x, options.y, options.width, options.height, texture);
        }
    }

    private drawImageQuad(x: number, y: number, width: number, height: number, texture: WebGLTexture): void {
        const gl = this.gl;
        
        // Use a simple textured quad shader or fallback to colored quad
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Create quad vertices for the image
        const vertices = new Float32Array([
            x, y,
            x + width, y,
            x, y + height,
            x, y + height,
            x + width, y,
            x + width, y + height,
        ]);

        const quadBuffer = gl.createBuffer();
        if (!quadBuffer) return;

        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionAttributeLocation = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.deleteBuffer(quadBuffer);
    }

    // Method to prepare buffer for later use
    createBuffer(width: number, height: number): WebGLFramebuffer {
        const gl = this.gl;
        
        // Create framebuffer
        const framebuffer = gl.createFramebuffer();
        if (!framebuffer) throw new Error('Failed to create framebuffer');

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // Create texture to render to
        const texture = gl.createTexture();
        if (!texture) throw new Error('Failed to create texture');
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Attach texture to framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        // Check if framebuffer is complete
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error('Framebuffer is not complete');
        }

        // Unbind framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        return framebuffer;
    }
}