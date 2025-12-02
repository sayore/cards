// IEntity.ts - Interface for game entities

import { AABB } from './collision/PrimitiveChecks';
import { Draw } from './Draw';
import { GameContext } from './GameContext';

// Position interface
export interface Position {
    x: number;
    y: number;
}

// Mouse event interface
export interface MouseEvent {
    x: number;
    y: number;
}

// Entity interface
export interface IEntity {
    traverseEntities(callback: (entity: IEntity) => void): unknown;
    kind : string;
    id: string;
    position: Position;
    rotation: number; // in radians
    scale: Position;  // x and y scale factors
    visible: boolean;
    absolute: boolean; // if true, position is absolute, otherwise relative to parent
    children: IEntity[];
    parent: IEntity | null;

    // Entity methods
    update(context: GameContext): void;
    draw(draw: Draw): void;

    // Entity management methods
    addChild(entity: IEntity): void;
    removeChild(entity: IEntity): void;
    findChild(id: string): IEntity | null;

    // Position methods
    setPosition(x: number, y: number): void;
    setRotation(rotation: number): void;
    setScale(x: number, y: number): void;

    // Relationship methods
    getWorldPosition(): Position;
    getWorldRotation(): number;

    // Mouse interaction methods
    containsPoint(x: number, y: number): boolean;
    onMouseEnter?(): void;
    onMouseLeave?(): void;
    onMouseDown?(): void;
    onMouseUp?(): void;

    // Visual properties
    hasBorder: boolean;
    borderColor: [number, number, number, number];
    borderWidth: number;
    highlightOnHover: boolean;
    isHovered: boolean;

    // Debugging
    debugConnectToParent: boolean; // flag to enable debug line to parent
}