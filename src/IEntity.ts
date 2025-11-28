// IEntity.ts - Interface for game entities

import { Draw } from './Draw';

// Position interface
export interface Position {
    x: number;
    y: number;
}

// Entity interface
export interface IEntity {
    id: string;
    position: Position;
    rotation: number; // in radians
    scale: Position;  // x and y scale factors
    visible: boolean;
    absolute: boolean; // if true, position is absolute, otherwise relative to parent
    children: IEntity[];
    parent: IEntity | null;

    // Entity methods
    update(deltaTime: number): void;
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

    // Debugging
    debugConnectToParent: boolean; // flag to enable debug line to parent
}