// Draw.ts - Drawing functions for WebGL canvas with support for rendering to buffers

import { WebGLRenderer } from "./WebGL";

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

// Text options interface
export interface TextOptions extends DrawingOptions {
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
}

// Prerendered buffer options
export interface PrerenderOptions {
  width: number;
  height: number;
  id: string;
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
attribute vec2 a_texCoord;
attribute vec4 a_color;     // NEW: Color is now per-vertex

uniform vec2 u_resolution;

varying vec2 v_texCoord;
varying vec4 v_color;       // NEW: Pass color to fragment

void main() {
   vec2 zeroToOne = a_position / u_resolution;
   vec2 zeroToTwo = zeroToOne * 2.0;
   vec2 clipSpace = zeroToTwo - 1.0;
   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

   v_texCoord = a_texCoord;
   v_color = a_color;       // Pass to fragment shader
}
`;

const fragmentShaderSource = `
precision mediump float;

uniform sampler2D u_texture;
uniform float u_useTexture; // 0.0 = Solid, 1.0 = Texture

varying vec2 v_texCoord;
varying vec4 v_color;       // NEW: Receive color

void main() {
   if (u_useTexture > 0.5) {
       // Multiply texture with vertex color (allows tinting)
       gl_FragColor = texture2D(u_texture, v_texCoord) * v_color;
   } else {
       // Just use the vertex color
       gl_FragColor = v_color;
   }
}
`;

export class Draw {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private quadBuffer: WebGLBuffer;
  private texture: WebGLTexture | null = null;

  // Batch rendering infrastructure
  private readonly MAX_QUADS = 10000;
  private readonly VERTEX_SIZE = 8; // x, y, u, v, r, g, b, a
  private readonly VERTICES_PER_QUAD = 6;

  private batchData: Float32Array; // The CPU array
  private batchCounter = 0;        // How many quads are queued
  private vertexBuffer: WebGLBuffer; // The GPU buffer

  private textCache = new Map<string, WebGLTexture>();
  private scratchCanvas = document.createElement('canvas');
  private scratchCtx = this.scratchCanvas.getContext('2d', { willReadFrequently: true });

  constructor(renderer: WebGLRenderer) {
    this.gl = renderer.getContext();
    this.program = this.createShaderProgram();
    this.quadBuffer = this.createQuadBuffer();

    // Initialize batch buffers
    this.batchData = new Float32Array(this.MAX_QUADS * this.VERTICES_PER_QUAD * this.VERTEX_SIZE);

    // Create a Dynamic Buffer (intended for frequent updates)
    this.vertexBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.batchData.byteLength, this.gl.DYNAMIC_DRAW);
  }

  private createShaderProgram(): WebGLProgram {
    const gl = this.gl;

    // Create and compile vertex shader
    const vertexShader = this.createShader(
      gl.VERTEX_SHADER,
      vertexShaderSource
    );
    if (!vertexShader) throw new Error("Failed to create vertex shader");

    // Create and compile fragment shader
    const fragmentShader = this.createShader(
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );
    if (!fragmentShader) throw new Error("Failed to create fragment shader");

    // Create shader program
    const program = gl.createProgram();
    if (!program) throw new Error("Failed to create shader program");

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      throw new Error("Failed to link shader program");
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
    if (!buffer) throw new Error("Failed to create buffer");

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    const positions = new Float32Array([0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1]);

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    return buffer;
  }

  private setupAttributes() {
    const gl = this.gl;
    const positionAttributeLocation = gl.getAttribLocation(
      this.program,
      "a_position"
    );
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionUniformLocation = gl.getUniformLocation(
      this.program,
      "u_resolution"
    );
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
  }

  // Draw a line
  line(options: LineOptions): void {
    this.flush();

    const gl = this.gl;
    gl.useProgram(this.program);

    gl.uniform2f(gl.getUniformLocation(this.program, "u_resolution"), gl.canvas.width, gl.canvas.height);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_useTexture"), 0.0);

    // --- FIX START ---
    const color = options.color || [1, 1, 1, 1];
    const colorLoc = gl.getAttribLocation(this.program, "a_color");
    gl.disableVertexAttribArray(colorLoc);
    gl.vertexAttrib4f(colorLoc, color[0], color[1], color[2], color[3]);
    // --- FIX END ---

    const vertices = new Float32Array([
        options.x1, options.y1,
        options.x2, options.y2
    ]);

    const lineBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const texCoordLoc = gl.getAttribLocation(this.program, "a_texCoord");
    if (texCoordLoc !== -1) {
        gl.disableVertexAttribArray(texCoordLoc);
    }

    gl.lineWidth(options.lineWidth || 1);
    gl.drawArrays(gl.LINES, 0, 2);

    gl.deleteBuffer(lineBuffer);
  }

  // Draw a rectangle/box
  // Draw.ts

  // Draw a rectangle/box
  box(options: BoxOptions): void {
    // Fallback for outlines (cannot batch efficiently with filled quads)
    if (options.fill === false) {
      this.flush(); 
      this.drawImmediateOutline(options);
      return;
    }

    // Check if batch is full
    if (this.batchCounter >= this.MAX_QUADS) {
      this.flush();
    }

    const c = options.color || [1, 1, 1, 1];

    // 1. Calculate the 4 corners (unrotated)
    // We assume options.x/y is Top-Left
    const x = options.x;
    const y = options.y;
    const w = options.width;
    const h = options.height;

    let tlX = x;
    let tlY = y;
    let trX = x + w;
    let trY = y;
    let blX = x;
    let blY = y + h;
    let brX = x + w;
    let brY = y + h;

    // 2. Apply Rotation (if exists)
    if (options.rotation) {
        // Rotate around the center of the box
        const cx = x + w / 2;
        const cy = y + h / 2;
        const cos = Math.cos(options.rotation);
        const sin = Math.sin(options.rotation);

        // Helper to rotate a point (px, py) around (cx, cy)
        const rotateX = (px: number, py: number) => cx + (px - cx) * cos - (py - cy) * sin;
        const rotateY = (px: number, py: number) => cy + (px - cx) * sin + (py - cy) * cos;

        // Rotate all 4 corners
        const n_tlX = rotateX(tlX, tlY);
        const n_tlY = rotateY(tlX, tlY);
        const n_trX = rotateX(trX, trY);
        const n_trY = rotateY(trX, trY);
        const n_blX = rotateX(blX, blY);
        const n_blY = rotateY(blX, blY);
        const n_brX = rotateX(brX, brY);
        const n_brY = rotateY(brX, brY);

        // Reassign
        tlX = n_tlX; tlY = n_tlY;
        trX = n_trX; trY = n_trY;
        blX = n_blX; blY = n_blY;
        brX = n_brX; brY = n_brY;
    }

    let index = this.batchCounter * this.VERTICES_PER_QUAD * this.VERTEX_SIZE;
    const d = this.batchData;

    // 3. Push Vertices to Batch
    // Format: x, y, u, v, r, g, b, a

    // Top-Left
    d[index++] = tlX;   d[index++] = tlY;   d[index++] = 0; d[index++] = 0;
    d[index++] = c[0];  d[index++] = c[1];  d[index++] = c[2]; d[index++] = c[3];

    // Top-Right
    d[index++] = trX;   d[index++] = trY;   d[index++] = 1; d[index++] = 0;
    d[index++] = c[0];  d[index++] = c[1];  d[index++] = c[2]; d[index++] = c[3];

    // Bottom-Left
    d[index++] = blX;   d[index++] = blY;   d[index++] = 0; d[index++] = 1;
    d[index++] = c[0];  d[index++] = c[1];  d[index++] = c[2]; d[index++] = c[3];

    // Bottom-Left (Repeated)
    d[index++] = blX;   d[index++] = blY;   d[index++] = 0; d[index++] = 1;
    d[index++] = c[0];  d[index++] = c[1];  d[index++] = c[2]; d[index++] = c[3];

    // Top-Right (Repeated)
    d[index++] = trX;   d[index++] = trY;   d[index++] = 1; d[index++] = 0;
    d[index++] = c[0];  d[index++] = c[1];  d[index++] = c[2]; d[index++] = c[3];

    // Bottom-Right
    d[index++] = brX;   d[index++] = brY;   d[index++] = 1; d[index++] = 1;
    d[index++] = c[0];  d[index++] = c[1];  d[index++] = c[2]; d[index++] = c[3];

    this.batchCounter++;
  }

  private drawImmediateOutline(options: BoxOptions): void {
    const gl = this.gl;
    gl.useProgram(this.program);

    // 1. Uniforms
    gl.uniform2f(gl.getUniformLocation(this.program, "u_resolution"), gl.canvas.width, gl.canvas.height);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_useTexture"), 0.0); // Solid color

    // Set Color (Attribute Fix)
    const color = options.color || [1, 1, 1, 1];
    const colorLoc = gl.getAttribLocation(this.program, "a_color");
    gl.disableVertexAttribArray(colorLoc);
    gl.vertexAttrib4f(colorLoc, color[0], color[1], color[2], color[3]);

    // 2. Calculate Geometry
    const x = options.x;
    const y = options.y;
    const w = options.width;
    const h = options.height;

    // Define the 4 corners relative to the screen (unrotated)
    // Order: Top-Left -> Top-Right -> Bottom-Right -> Bottom-Left
    let p1x = x,     p1y = y;
    let p2x = x + w, p2y = y;
    let p3x = x + w, p3y = y + h;
    let p4x = x,     p4y = y + h;

    // 3. Apply Rotation
    if (options.rotation) {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const cos = Math.cos(options.rotation);
        const sin = Math.sin(options.rotation);

        // Rotation helper
        const rotateX = (px: number, py: number) => cx + (px - cx) * cos - (py - cy) * sin;
        const rotateY = (px: number, py: number) => cy + (px - cx) * sin + (py - cy) * cos;

        // Rotate all 4 points
        const r1x = rotateX(p1x, p1y); const r1y = rotateY(p1x, p1y);
        const r2x = rotateX(p2x, p2y); const r2y = rotateY(p2x, p2y);
        const r3x = rotateX(p3x, p3y); const r3y = rotateY(p3x, p3y);
        const r4x = rotateX(p4x, p4y); const r4y = rotateY(p4x, p4y);

        p1x = r1x; p1y = r1y;
        p2x = r2x; p2y = r2y;
        p3x = r3x; p3y = r3y;
        p4x = r4x; p4y = r4y;
    }

    const vertices = new Float32Array([
        p1x, p1y,
        p2x, p2y,
        p3x, p3y,
        p4x, p4y
    ]);

    // 4. Buffer & Attributes
    const rectBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rectBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Disable TexCoord (outline has no UVs)
    const texCoordLoc = gl.getAttribLocation(this.program, "a_texCoord");
    if (texCoordLoc !== -1) {
        gl.disableVertexAttribArray(texCoordLoc);
    }

    // 5. Draw
    const blendEnabled = gl.isEnabled(gl.BLEND);
    if (!blendEnabled) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    gl.lineWidth(options.lineWidth || 1);
    gl.drawArrays(gl.LINE_LOOP, 0, 4); // 4 vertices connected in a loop

    // Cleanup
    gl.deleteBuffer(rectBuffer);
    if (!blendEnabled) gl.disable(gl.BLEND);
  }

  // Draw a circle
  circle(options: CircleOptions): void {
    // Circles cannot be batched with quads, flush the current batch first
    this.flush();

    const gl = this.gl;
    gl.useProgram(this.program);

    // 1. Uniforms
    gl.uniform2f(gl.getUniformLocation(this.program, "u_resolution"), gl.canvas.width, gl.canvas.height);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_useTexture"), 0.0); // Solid color

    const color = options.color || [1, 1, 1, 1];
    gl.uniform4f(gl.getUniformLocation(this.program, "u_color"), color[0], color[1], color[2], color[3]);

    // 2. Geometry Calculation
    const segments = options.segments || 32;
    let vertices: Float32Array;
    let mode: number;
    let vertexCount: number;

    if (options.fill) {
        mode = gl.TRIANGLES;
        // 3 vertices per triangle * number of segments
        vertexCount = segments * 3;
        vertices = new Float32Array(vertexCount * 2); // 2 floats (x,y) per vertex

        for (let i = 0; i < segments; i++) {
            const angle1 = (i * 2 * Math.PI) / segments;
            const angle2 = ((i + 1) * 2 * Math.PI) / segments;

            // Vertex 1: Center
            vertices[i * 6] = options.x;
            vertices[i * 6 + 1] = options.y;

            // Vertex 2: Edge Point 1
            vertices[i * 6 + 2] = options.x + Math.cos(angle1) * options.radius;
            vertices[i * 6 + 3] = options.y + Math.sin(angle1) * options.radius;

            // Vertex 3: Edge Point 2
            vertices[i * 6 + 4] = options.x + Math.cos(angle2) * options.radius;
            vertices[i * 6 + 5] = options.y + Math.sin(angle2) * options.radius;
        }
    } else {
        mode = gl.LINE_STRIP;
        // FIX: We need segments + 1 points to close the loop
        vertexCount = segments + 1;
        vertices = new Float32Array(vertexCount * 2); 

        for (let i = 0; i <= segments; i++) {
            const angle = (i * 2 * Math.PI) / segments;
            vertices[i * 2] = options.x + Math.cos(angle) * options.radius;
            vertices[i * 2 + 1] = options.y + Math.sin(angle) * options.radius;
        }
    }

    // 3. Buffer Setup
    const circleBuffer = gl.createBuffer();
    if (!circleBuffer) return;

    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // 4. Attributes
    // Position
    const positionLoc = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Texture (THE FIX: Bind it to position data to keep shader happy)
    const texCoordLoc = gl.getAttribLocation(this.program, "a_texCoord");
    if (texCoordLoc !== -1) {
        gl.enableVertexAttribArray(texCoordLoc);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    }

    // 5. Blending
    const blendEnabled = gl.isEnabled(gl.BLEND);
    if (!blendEnabled) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    // 6. Draw
    gl.lineWidth(options.lineWidth || 1);
    gl.drawArrays(mode, 0, vertexCount);

    // Cleanup
    gl.deleteBuffer(circleBuffer);
    if (!blendEnabled) gl.disable(gl.BLEND);
}

  // Draw an image
  image(options: ImageOptions): void {
    // Images cannot be reliably batched due to async loading, flush the current batch first
    this.flush();

    if (!options.src && !options.imageData) {
      console.warn("Image drawing requires either src or imageData");
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
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255, 255])
    ); // White pixel

    if (options.src) {
      const image = new Image();
      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image
        );

        // Set the parameters so we can render any size image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        // Draw the image
        this.drawImageQuad(
          options.x,
          options.y,
          options.width,
          options.height,
          texture
        );
      };
      image.src = options.src;
    } else if (options.imageData) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        options.imageData
      );

      // Set the parameters so we can render any size image.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

      // Draw the image
      this.drawImageQuad(
        options.x,
        options.y,
        options.width,
        options.height,
        texture
      );
    }
  }

  private drawImageQuad(
    x: number,
    y: number,
    width: number,
    height: number,
    texture: WebGLTexture
  ): void {
    // Textured quads can't be easily batched with other textures, so flush first
    this.flush();

    const gl = this.gl;
    gl.useProgram(this.program);

    // 1. Uniforms
    const resolutionLoc = gl.getUniformLocation(this.program, "u_resolution");
    gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);

    const useTexLoc = gl.getUniformLocation(this.program, "u_useTexture");
    gl.uniform1f(useTexLoc, 1.0); // 1.0 = Use Texture

    // --- FIX START ---
    // The shader expects a_color attribute. We aren't providing a buffer for it here.
    // So we disable the array and set a constant value (White) for all vertices.
    const colorLoc = gl.getAttribLocation(this.program, "a_color");
    gl.disableVertexAttribArray(colorLoc); // Stop reading from buffer
    gl.vertexAttrib4f(colorLoc, 1, 1, 1, 1); // Constant White
    // --- FIX END ---

    gl.bindTexture(gl.TEXTURE_2D, texture);
    const texLoc = gl.getUniformLocation(this.program, "u_texture");
    gl.uniform1i(texLoc, 0);

    // 2. Geometry (Positions + UVs)
    const x1 = x;
    const x2 = x + width;
    const y1 = y;
    const y2 = y + height;

    const vertices = new Float32Array([
      x1, y1, 0.0, 0.0,
      x2, y1, 1.0, 0.0,
      x1, y2, 0.0, 1.0,
      x1, y2, 0.0, 1.0,
      x2, y1, 1.0, 0.0,
      x2, y2, 1.0, 1.0,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const FSIZE = vertices.BYTES_PER_ELEMENT;
    const stride = 4 * FSIZE;

    const positionLoc = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, stride, 0);

    const texCoordLoc = gl.getAttribLocation(this.program, "a_texCoord");
    if (texCoordLoc !== -1) {
      gl.enableVertexAttribArray(texCoordLoc);
      gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, stride, 2 * FSIZE);
    }

    // 3. Enable Blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.deleteBuffer(buffer);
    
    // Cleanup: Disable texture coord to avoid leaks
    if (texCoordLoc !== -1) gl.disableVertexAttribArray(texCoordLoc);
  }

  private getCachedTextTexture(options: TextOptions): WebGLTexture | null {
    const gl = this.gl;
    if (!this.scratchCtx) return null;

    // 1. Generate a unique key for this specific text configuration
    // (Include text, font, size, and color so different styles are cached separately)
    const colorStr = options.color ? options.color.join(',') : 'default';
    const key = `${options.text}-${options.fontFamily}-${options.fontSize}-${colorStr}`;

    // 2. Check Cache
    if (this.textCache.has(key)) {
      return this.textCache.get(key)!;
    }

    // 3. Cache Miss - Draw to Scratch Canvas
    const ctx = this.scratchCtx;
    const fontSize = options.fontSize || 16;
    const fontStr = `${fontSize}px ${options.fontFamily || "Arial"}`;

    ctx.font = fontStr;
    const textMetrics = ctx.measureText(options.text);
    const width = Math.ceil(textMetrics.width + 10);
    const height = Math.ceil(fontSize * 1.4);

    // Resize scratch canvas (only if needed to grow, optimization)
    if (this.scratchCanvas.width < width) this.scratchCanvas.width = width;
    if (this.scratchCanvas.height < height) this.scratchCanvas.height = height;
    
    // Clear area we will use
    ctx.clearRect(0, 0, width, height);

    // Draw Text
    ctx.font = fontStr;
    ctx.textAlign = "left"; // Always draw left-aligned in texture
    ctx.textBaseline = "middle";
    
    // Parse color
    const c = options.color || [1, 1, 1, 1];
    ctx.fillStyle = `rgba(${Math.floor(c[0]*255)}, ${Math.floor(c[1]*255)}, ${Math.floor(c[2]*255)}, ${c[3]})`;
    
    ctx.fillText(options.text, 5, height / 2);

    // 4. Create WebGL Texture
    const texture = gl.createTexture();
    if (!texture) return null;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    
    // Upload ONLY the part of the canvas we used
    // (Optimization: getting ImageData is expensive, but safer than uploading huge canvas)
    const imageData = ctx.getImageData(0, 0, width, height);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 5. Store in Cache
    this.textCache.set(key, texture);
    
    // Optional: Add a cleanup mechanism if cache grows too big
    if (this.textCache.size > 1000) {
        // Simple eviction: clear everything if too big
        // A real game would use an LRU cache
        this.clearTextCache();
    }

    return texture;
  }

  // Call this when changing levels
  public clearTextCache() {
      const gl = this.gl;
      this.textCache.forEach(texture => gl.deleteTexture(texture));
      this.textCache.clear();
  }

  // Text rendering method
  text(options: TextOptions): void {
    // 1. Get Texture (Cached or New)
    const texture = this.getCachedTextTexture(options);
    if (!texture) return;

    // 2. Calculate dimensions for the Quad (must match what we drew in cache)
    // We need to re-measure briefly to know how big the quad should be on screen
    if (!this.scratchCtx) return;
    this.scratchCtx.font = `${options.fontSize || 16}px ${options.fontFamily || "Arial"}`;
    const metrics = this.scratchCtx.measureText(options.text);
    
    const width = Math.ceil(metrics.width + 10);
    const height = Math.ceil((options.fontSize || 16) * 1.4);

    // 3. Draw
    // Note: This still breaks the batch because it switches texture.
    // But we avoided the massive cost of creating a texture.
    this.drawImageQuad(options.x, options.y, width, height, texture);
    
    // DO NOT delete texture here! It lives in the cache now.
  }

  // Method to create a prerendered buffer that can be drawn later
  createBuffer(width: number, height: number): WebGLFramebuffer {
    const gl = this.gl;

    // Create framebuffer
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) throw new Error("Failed to create framebuffer");

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // Create texture to render to
    const texture = gl.createTexture();
    if (!texture) throw new Error("Failed to create texture");

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Attach texture to framebuffer
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    // Check if framebuffer is complete
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Framebuffer is not complete");
    }

    // Unbind framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return framebuffer;
  }

  // Method to prerender a complex element to a texture for later use
  prerenderToTexture(
    renderFunction: (draw: Draw) => void,
    options: PrerenderOptions
  ): WebGLTexture {
    const gl = this.gl;

    // Create framebuffer for offscreen rendering
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // Create texture to render to
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      options.width,
      options.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Attach texture to framebuffer
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    // Check if framebuffer is complete
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("Framebuffer is not complete");
    }

    // Save the current viewport
    const viewport = gl.getParameter(gl.VIEWPORT) as Int32Array;
    const [x, y, width, height] = viewport
      ? Array.from(viewport)
      : [0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight];
    gl.viewport(0, 0, options.width, options.height);

    // Clear the framebuffer
    gl.clearColor(0, 0, 0, 0); // Transparent background
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Create a temporary WebGLRenderer instance for the offscreen rendering
    const tempRenderer = {
      getContext: () => gl,
      width: options.width,
      height: options.height,
      canvas: gl.canvas,
      gl: gl,
    } as unknown as WebGLRenderer;

    const tempDraw = new Draw(tempRenderer);

    // Execute the render function
    renderFunction(tempDraw);

    // Restore original viewport
    gl.viewport(x, y, width, height);

    // Unbind framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return texture;
  }

  // Call this at the start of the render loop
  begin(): void {
      this.batchCounter = 0;
  }

  // Call this at the end of the render loop
  end(): void {
      this.flush();
  }

  private flush(): void {
      if (this.batchCounter === 0) return;

      const gl = this.gl;
      gl.useProgram(this.program);

      // 1. Uniforms
      gl.uniform2f(gl.getUniformLocation(this.program, "u_resolution"), gl.canvas.width, gl.canvas.height);
      // For now, flush handles solid shapes.
      // (If mixing textures, you'd need to flush before changing textures)
      gl.uniform1f(gl.getUniformLocation(this.program, "u_useTexture"), 0.0);

      // 2. Upload Data
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      const view = this.batchData.subarray(0, this.batchCounter * this.VERTICES_PER_QUAD * this.VERTEX_SIZE);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);

      // 3. Attributes
      const FSIZE = 4;
      const stride = this.VERTEX_SIZE * FSIZE;

      // Position (Offset 0)
      const posLoc = gl.getAttribLocation(this.program, "a_position");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);

      // TexCoord (Offset 2)
      const texLoc = gl.getAttribLocation(this.program, "a_texCoord");
      if (texLoc !== -1) {
          gl.enableVertexAttribArray(texLoc);
          gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, stride, 2 * FSIZE);
      }

      // Color (Offset 4)
      const colLoc = gl.getAttribLocation(this.program, "a_color");
      gl.enableVertexAttribArray(colLoc);
      gl.vertexAttribPointer(colLoc, 4, gl.FLOAT, false, stride, 4 * FSIZE);

      // 4. Draw
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.drawArrays(gl.TRIANGLES, 0, this.batchCounter * this.VERTICES_PER_QUAD);

      this.batchCounter = 0;
  }
}
