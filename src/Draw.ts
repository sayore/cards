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
attribute vec2 a_texCoord; // NEW: Input UVs
uniform vec2 u_resolution;
varying vec2 v_texCoord;   // NEW: Pass UVs to fragment

void main() {
   vec2 zeroToOne = a_position / u_resolution;
   vec2 zeroToTwo = zeroToOne * 2.0;
   vec2 clipSpace = zeroToTwo - 1.0;
   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
   
   v_texCoord = a_texCoord; // Pass to fragment
}
`;

const fragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
uniform sampler2D u_texture; // NEW: The texture
uniform float u_useTexture;  // NEW: 0.0 = solid color, 1.0 = texture
varying vec2 v_texCoord;     // NEW: Receive UVs

void main() {
   if (u_useTexture > 0.5) {
       // Multiply texture color by u_color (allows tinting, usually keep u_color white for text)
       gl_FragColor = texture2D(u_texture, v_texCoord) * u_color;
   } else {
       gl_FragColor = u_color;
   }
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
    const gl = this.gl;
    gl.useProgram(this.program);

    gl.uniform2f(gl.getUniformLocation(this.program, "u_resolution"), gl.canvas.width, gl.canvas.height);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_useTexture"), 0.0);

    const color = options.color || [1, 1, 1, 1];
    gl.uniform4f(gl.getUniformLocation(this.program, "u_color"), color[0], color[1], color[2], color[3]);

    const vertices = new Float32Array([
        options.x1, options.y1,
        options.x2, options.y2
    ]);

    const lineBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Position
    const positionLoc = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Dummy Texture Coords (Fix)
    const texCoordLoc = gl.getAttribLocation(this.program, "a_texCoord");
    if (texCoordLoc !== -1) {
        gl.enableVertexAttribArray(texCoordLoc);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    }

    gl.lineWidth(options.lineWidth || 1);
    gl.drawArrays(gl.LINES, 0, 2);

    gl.deleteBuffer(lineBuffer);
}

  // Draw a rectangle/box
  // Draw a rectangle/box
box(options: BoxOptions): void {
    const gl = this.gl;
    gl.useProgram(this.program);

    // 1. Uniforms
    gl.uniform2f(gl.getUniformLocation(this.program, "u_resolution"), gl.canvas.width, gl.canvas.height);
    gl.uniform1f(gl.getUniformLocation(this.program, "u_useTexture"), 0.0); // Solid color

    const color = options.color || [1, 1, 1, 1];
    gl.uniform4f(gl.getUniformLocation(this.program, "u_color"), color[0], color[1], color[2], color[3]);

    // 2. Create Vertices based on Fill mode
    const x1 = options.x;
    const y1 = options.y;
    const x2 = options.x + options.width;
    const y2 = options.y + options.height;

    let vertices: Float32Array;
    let mode: number;

    if (options.fill) {
        mode = gl.TRIANGLES;
        // 2 Triangles (6 vertices)
        vertices = new Float32Array([
            x1, y1,  x2, y1,  x1, y2,
            x1, y2,  x2, y1,  x2, y2,
        ]);
    } else {
        mode = gl.LINE_LOOP;
        // 4 Vertices for outline
        vertices = new Float32Array([
            x1, y1,  x2, y1,  x2, y2,  x1, y2
        ]);
    }

    // 3. Buffer Setup
    const rectBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rectBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // 4. Attributes
    // Position Attribute
    const positionLoc = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Texture Attribute (THE FIX)
    // Even though we aren't using textures, we MUST satisfy the attribute 
    // to prevent crashes/invisibility on some GPUs. 
    // We just point it to the same position buffer.
    const texCoordLoc = gl.getAttribLocation(this.program, "a_texCoord");
    if (texCoordLoc !== -1) {
        gl.enableVertexAttribArray(texCoordLoc);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    }

    // 5. Blending (Ensure transparency works for boxes too)
    const blendEnabled = gl.isEnabled(gl.BLEND);
    if (!blendEnabled) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    gl.drawArrays(mode, 0, vertices.length / 2);

    // Cleanup
    gl.deleteBuffer(rectBuffer);
    if (!blendEnabled) gl.disable(gl.BLEND);
}

  // Draw a circle
  // Draw a circle
circle(options: CircleOptions): void {
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
    const gl = this.gl;
    gl.useProgram(this.program);

    // 1. Uniforms
    const resolutionLoc = gl.getUniformLocation(this.program, "u_resolution");
    gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);

    // NEW: Tell shader to use texture mode
    const useTexLoc = gl.getUniformLocation(this.program, "u_useTexture");
    gl.uniform1f(useTexLoc, 1.0); // 1.0 = Use Texture

    // NEW: Reset color to White (so we don't tint the existing text color)
    const colorLoc = gl.getUniformLocation(this.program, "u_color");
    gl.uniform4f(colorLoc, 1, 1, 1, 1);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    const texLoc = gl.getUniformLocation(this.program, "u_texture");
    gl.uniform1i(texLoc, 0);

    // 2. Geometry (Positions + UVs)
    const x1 = x;
    const x2 = x + width;
    const y1 = y;
    const y2 = y + height;

    const vertices = new Float32Array([
      x1,
      y1,
      0.0,
      0.0,
      x2,
      y1,
      1.0,
      0.0,
      x1,
      y2,
      0.0,
      1.0,
      x1,
      y2,
      0.0,
      1.0,
      x2,
      y1,
      1.0,
      0.0,
      x2,
      y2,
      1.0,
      1.0,
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
      gl.vertexAttribPointer(
        texCoordLoc,
        2,
        gl.FLOAT,
        false,
        stride,
        2 * FSIZE
      );
    }

    // 3. Enable Blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.deleteBuffer(buffer);
    // Clean up attribute state to prevent other shapes from breaking
    if (texCoordLoc !== -1) gl.disableVertexAttribArray(texCoordLoc);
  }

  // Text rendering method
  // Text rendering method
text(options: TextOptions): void {
    const gl = this.gl;

    // 1. Create canvas & context
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 2. Setup Font & Measure
    // We use a multiplier for height to safely fit descenders (g, j, y) and accents
    const fontSize = options.fontSize || 16;
    const fontStr = `${fontSize}px ${options.fontFamily || "Arial"}`;
    
    // Set font to measure accurate width
    ctx.font = fontStr;
    const textMetrics = ctx.measureText(options.text);
    
    // Calculate dimensions
    const width = Math.ceil(textMetrics.width + 10); // +10 padding
    const height = Math.ceil(fontSize * 1.4);        // 1.4x factor ensures fit

    // 3. Resize canvas (THIS RESETS CONTEXT STATE!)
    canvas.width = width;
    canvas.height = height;

    // 4. Re-apply Settings & Draw
    ctx.font = fontStr;
    ctx.textAlign = options.textAlign || "left";
    // Using 'middle' is much safer for vertical alignment in textures
    ctx.textBaseline = "middle"; 

    // Clear (Transparency)
    ctx.clearRect(0, 0, width, height);

    // Color: Convert WebGL [0-1] to Canvas [0-255]
    const color = options.color || [1, 1, 1, 1];
    ctx.fillStyle = `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, ${color[3]})`;

    // Draw Text centered vertically
    // If textAlign is 'center', x should be width/2, but usually we just draw at 5px padding for left-aligned
    ctx.fillText(options.text, 5, height / 2);

    // 5. WebGL Texture Upload
    const texture = gl.createTexture();
    if (!texture) return;

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // IMPORTANT: Handle Alpha correctly for HTML Canvases
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // 6. Handle Blending & Depth
    const blendEnabled = gl.isEnabled(gl.BLEND);
    const depthMaskEnabled = gl.getParameter(gl.DEPTH_WRITEMASK);

    if (!blendEnabled) gl.enable(gl.BLEND);

    // FIX FOR BLACK BOX: 
    // 1. Use ONE, ONE_MINUS_SRC_ALPHA because we used PREMULTIPLY_ALPHA above
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    
    // 2. Disable Depth Mask. 
    // If we don't do this, transparent pixels write to the Z-buffer, 
    // blocking the background from drawing if it's drawn later, or creating artifacts.
    gl.depthMask(false);

    // 7. Draw
    this.drawImageQuad(options.x, options.y, width, height, texture);

    // 8. Restore State
    gl.depthMask(depthMaskEnabled); // Restore depth writing
    if (!blendEnabled) gl.disable(gl.BLEND);
    
    // Reset blend func to standard if needed (optional, depends on your engine)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); 

    // Cleanup
    gl.deleteTexture(texture);
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
}
