// InputManager.ts - Manages input from keyboard and mouse

export class InputManager {
    private keyStates: Map<string, boolean> = new Map();
    private mousePosition: { x: number; y: number; } = { x: 0, y: 0 };
    private mouseButtons: Map<number, boolean> = new Map();
    private canvas: HTMLCanvasElement | null = null;

    constructor() {
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keyStates.set(e.key, true);
        });

        document.addEventListener('keyup', (e) => {
            this.keyStates.set(e.key, false);
        });

        // Mouse events - will be set up once canvas is provided
    }

    setCanvas(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;

        // Mouse move event
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.canvas) {
                const rect = this.canvas.getBoundingClientRect();
                this.mousePosition.x = e.clientX - rect.left;
                this.mousePosition.y = e.clientY - rect.top;
            }
        });

        // Mouse down event
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouseButtons.set(e.button, true);
        });

        // Mouse up event
        this.canvas.addEventListener('mouseup', (e) => {
            this.mouseButtons.set(e.button, false);
        });
    }

    // Keyboard methods
    isKeyPressed(key: string): boolean {
        return this.keyStates.get(key) === true;
    }

    isKeyReleased(key: string): boolean {
        return this.keyStates.get(key) === false || !this.keyStates.has(key);
    }

    // Mouse methods
    getMousePosition(): { x: number; y: number; } {
        return { ...this.mousePosition }; // Return a copy to prevent external modification
    }

    isMouseButtonDown(button: number = 0): boolean {
        return this.mouseButtons.get(button) === true;
    }

    isMouseButtonUp(button: number = 0): boolean {
        return this.mouseButtons.get(button) === false || !this.mouseButtons.has(button);
    }

    // Get all currently pressed keys
    getPressedKeys(): string[] {
        const pressedKeys: string[] = [];
        for (const [key, isPressed] of this.keyStates.entries()) {
            if (isPressed) {
                pressedKeys.push(key);
            }
        }
        return pressedKeys;
    }

    // Clear method to reset all inputs (typically called each frame)
    clear(): void {
        // We don't clear keyboard states as they represent the current state
        // Mouse button states are handled by mouse events
    }
}