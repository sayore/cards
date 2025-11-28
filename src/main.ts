import { Game } from './Game';

// Initialize the game
const game = new Game('game', 800, 600);

// Start the game
game.start();

console.log('2D Game Engine with scenes Initialized!');
console.log('Game objects created:', {
    renderer: game.getRenderer()
});