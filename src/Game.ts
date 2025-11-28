// Game.ts - Main game class that manages initialization and state

import { WebGLRenderer } from './WebGL';
import { Draw } from './Draw';
import { GameLoop } from './GameLoop';
import { SceneManager, SceneType } from './SceneManager';

export class Game {
    private renderer: WebGLRenderer;
    private draw: Draw;
    private gameLoop: GameLoop;
    private sceneManager: SceneManager;

    constructor(containerId: string = 'game', width: number = 800, height: number = 600) {
        // Initialize renderer and drawing system
        this.renderer = new WebGLRenderer(containerId, width, height);
        this.draw = new Draw(this.renderer);
        this.gameLoop = new GameLoop(this.renderer, this.draw);

        // Initialize scene manager
        this.sceneManager = new SceneManager(this.gameLoop);

        // Load the simple test scene first
        this.sceneManager.loadScene('simple');

        // Set up event listeners
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Scene switching
        document.addEventListener('keydown', (e) => {
            if (e.key === '1') {
                this.sceneManager.loadScene('simple');
            } else if (e.key === '2') {
                this.sceneManager.loadScene('game');
            } else if (e.key === '3') {
                this.sceneManager.loadScene('background');
            }
        });
    }

    start(): void {
        this.gameLoop.start();
        console.log('Game started!');
    }

    stop(): void {
        this.gameLoop.stop();
        console.log('Game stopped!');
    }

    // Public accessors for game systems if needed
    getRenderer(): WebGLRenderer {
        return this.renderer;
    }

    getGameLoop(): GameLoop {
        return this.gameLoop;
    }

    getSceneManager(): SceneManager {
        return this.sceneManager;
    }
}