import { WebGLRenderer } from './WebGL';
import { Draw } from './Draw';
import { GameLoop } from './GameLoop';
import { Entity } from './Entity';
import { CardEntity, ColorShiftEffect } from './CardEntity';

// Initialize the WebGL renderer
const renderer = new WebGLRenderer('game', 800, 600);
const draw = new Draw(renderer);
const gameLoop = new GameLoop(renderer, draw);

// Create a root entity
const rootEntity = new Entity('root', 400, 300); // Center of the screen
rootEntity.debugConnectToParent = false;

// Create a parent entity
const parentEntity = new Entity('parent', 0, -100); // Above the root
parentEntity.debugConnectToParent = true;

// Create a child entity
const childEntity = new Entity('child', 50, -50); // Relative to parent
childEntity.debugConnectToParent = true;

// Set up parent-child relationships
parentEntity.addChild(childEntity);
rootEntity.addChild(parentEntity);

// Create a rotating child entity
const rotatingChild = new Entity('rotating', -50, 50);
rotatingChild.debugConnectToParent = true;
parentEntity.addChild(rotatingChild);

// Add custom drawing logic to entities
(parentEntity as any).draw = function(draw: Draw) {
    // Draw parent as a red box
    draw.box({
        x: this.position.x - 25,
        y: this.position.y - 25,
        width: 50,
        height: 50,
        color: [1, 0, 0, 1], // Red
        fill: true
    });
};

(childEntity as any).draw = function(draw: Draw) {
    // Draw child as a blue circle
    draw.circle({
        x: this.position.x,
        y: this.position.y,
        radius: 20,
        color: [0, 0, 1, 1], // Blue
        fill: true
    });
};

(rotatingChild as any).draw = function(draw: Draw) {
    // Draw rotating child as a green triangle
    const centerX = this.position.x;
    const centerY = this.position.y;
    const size = 15;

    // Draw triangle
    draw.line({
        x1: centerX, y1: centerY - size,
        x2: centerX - size, y2: centerY + size,
        color: [0, 1, 0, 1], // Green
        lineWidth: 2
    });

    draw.line({
        x1: centerX - size, y1: centerY + size,
        x2: centerX + size, y2: centerY + size,
        color: [0, 1, 0, 1], // Green
        lineWidth: 2
    });

    draw.line({
        x1: centerX + size, y1: centerY + size,
        x2: centerX, y2: centerY - size,
        color: [0, 1, 0, 1], // Green
        lineWidth: 2
    });
};

// Add custom update logic to make entities rotate
let rotationTime = 0;
(parentEntity as any).update = function(deltaTime: number) {
    rotationTime += deltaTime;
    this.rotation = Math.sin(rotationTime) * 0.5; // Oscillating rotation
};

(rotatingChild as any).update = function(deltaTime: number) {
    this.rotation = rotationTime * 2; // Faster rotation
};

// Create a card entity to demonstrate the effect system
const cardEntity = new CardEntity('card', 100, 100, 80, 100);
cardEntity.debugConnectToParent = false;
gameLoop.addEntity(cardEntity);

// Add event to trigger effect when spacebar is pressed
document.addEventListener('keydown', (e) => {
    if (e.key === ' ') { // Spacebar
        cardEntity.addEffect(new ColorShiftEffect(1.0, [1, 0, 1, 1])); // Magenta for 1 second
    }
    if (e.key === 'd' || e.key === 'D') {
        gameLoop.setDebugMode(!gameLoop['debugMode']); // Toggle debug mode
    }
});

// Add the root entity to the game loop as well
gameLoop.addEntity(rootEntity);

// Start the game loop
gameLoop.start();

console.log('2D Game Engine initialized!');