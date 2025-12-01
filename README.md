# Cards - a 2D WebGL Game Engine

A work-in-progress 2D game engine built with TypeScript and WebGL. This project provides a foundation for creating 2D games with entity-component architecture and efficient rendering. Currently under heavy development.

## Technologies

- **TypeScript**: Strongly-typed JavaScript for better development experience
- **WebGL**: Low-level graphics API for hardware-accelerated rendering
- **Vite**: Fast build tool and development server
- **npm**: Package management

## Architecture

The engine follows an entity-component system with the following core components:

- **Game**: Main game class that initializes the engine and manages state
- **WebGLRenderer**: Handles WebGL context creation and management
- **Draw**: Provides drawing primitives (boxes, circles, text, images) with batching optimization
- **GameLoop**: Manages the game loop, entity updates, and rendering
- **SceneManager**: Handles scene switching and management
- **Entity**: Base entity class with parent-child relationships and transformation support
- **IEntity**: Interface defining the contract for game entities

## Features

### Current Implementation
- **WebGL Rendering**: Efficient rendering with custom shaders
- **Batched Drawing**: Optimized rendering through vertex batching
- **Entity System**: Parent-child relationships with world position calculations
- **Scene Management**: Switch between different game scenes
- **Input Handling**: Keyboard and mouse event support with entity interaction
- **Transform System**: Position, rotation, and scale with hierarchical calculations
- **Text Rendering**: Cached text rendering with WebGL textures
- **Prerendered Buffers**: Offscreen rendering capabilities
- **Debug Visualization**: Entity position markers, parent connections, and debug overlays

### Entity Types
- **Player**: Controllable character with movement
- **CardEntity & CardHand**: Card-based game components
- **UI Elements**: Dialog boxes, menus, health bars
- **Visual Elements**: Backgrounds, circles, and basic primitives
- **Utility Entities**: FPS counter, generic entity containers

## Scenes

Current scenes demonstrate various engine capabilities:
- **Simple Scene**: Basic entity rendering and movement
- **Game Scene**: More complex scene with player, UI elements, and cards
- **Background Scene**: Scene focused on background rendering (if implemented)

## Planned Features

### Core Engine
- [ ] Physics system with collision detection
- [ ] Animation system
- [ ] Sound and audio management
- [ ] Asset loading and management system
- [ ] Particle effects system
- [ ] Advanced UI framework
- [ ] Serialization and save system
- [ ] Tilemap rendering and collision

### Gameplay Features (as Previews)
- [ ] Advanced card game mechanics
- [ ] Multiplayer networking
- [ ] AI entity behaviors
- [ ] Level editor tools
- [ ] Game state management
- [ ] Achievement and progression systems

### Performance & Tools
- [ ] Texture atlas system for better batching
- [ ] Profiling and performance tools
- [ ] Automated testing framework

## Development

### Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run TypeScript compiler in watch mode
npm run dev-ts
```

### Project Structure
```
src/
├── Game.ts          # Main game initialization
├── WebGL.ts         # WebGL renderer
├── Draw.ts          # Drawing primitives and batching
├── GameLoop.ts      # Game loop management
├── SceneManager.ts  # Scene management
├── Entity.ts        # Base entity implementation
├── IEntity.ts       # Entity interface
├── scenes/          # Scene implementations
└── entities/        # Specific game entities
```

## Status

This project is currently a **work-in-progress**. The core rendering engine and entity system are functional, but many planned features remain to be implemented. The API may change significantly as development continues.

## Contributing

Contributions are welcome! The project is actively being developed with a focus on building a robust 2D game engine suitable for card games and other 2D experiences.

## License

ISC License