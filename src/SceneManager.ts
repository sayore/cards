// SceneManager.ts - Manages different scenes in the game

import { IEntity } from './IEntity';
import { GameLoop } from './GameLoop';
import { SimpleScene } from './scenes/SimpleScene';
import { GameScene } from './scenes/GameScene';
import { BackgroundScene } from './scenes/BackgroundScene';

export type SceneType = 'simple' | 'game' | 'background' | 'menu';

export class SceneManager {
    private gameLoop: GameLoop;
    private currentScene: IEntity | null = null;
    private scenes: Map<SceneType, () => IEntity> = new Map();

    constructor(gameLoop: GameLoop) {
        this.gameLoop = gameLoop;

        // Register available scenes
        this.scenes.set('simple', () => new SimpleScene());
        this.scenes.set('game', () => new GameScene());
        this.scenes.set('background', () => new BackgroundScene());
    }

    loadScene(sceneType: SceneType): void {
        // Remove current scene if exists
        if (this.currentScene) {
            this.gameLoop.removeEntity(this.currentScene);
        }

        // Create and add new scene
        const sceneFactory = this.scenes.get(sceneType);
        if (sceneFactory) {
            this.currentScene = sceneFactory();
            this.gameLoop.addEntity(this.currentScene);
            this.gameLoop.setMode(sceneType);
        } else {
            console.error(`Scene type '${sceneType}' not found`);
        }
    }

    getCurrentScene(): IEntity | null {
        return this.currentScene;
    }

    getGameLoop(): GameLoop {
        return this.gameLoop;
    }
}