// Entity.ts - Base implementation of IEntity with parent-child relationships

import { IEntity, Position, MouseEvent } from './IEntity';
import { Draw } from './Draw';

export class Entity implements IEntity {
    id: string;
    position: Position;
    rotation: number;
    scale: Position;
    visible: boolean;
    absolute: boolean;
    children: IEntity[];
    parent: IEntity | null;
    debugConnectToParent: boolean;

    // Mouse interaction properties
    hasBorder: boolean = false;
    borderColor: [number, number, number, number] = [1, 1, 1, 1]; // White border by default
    borderWidth: number = 1;
    highlightOnHover: boolean = false;
    isHovered: boolean = false;

    constructor(id: string, x: number = 0, y: number = 0) {
        this.id = id;
        this.position = { x, y };
        this.rotation = 0;
        this.scale = { x: 1, y: 1 };
        this.visible = true;
        this.absolute = false; // By default, entities are positioned relative to their parent
        this.children = [];
        this.parent = null;
        this.debugConnectToParent = false; // Disabled by default
    }

    // IEntity methods
    update(deltaTime: number): void {
        // Base implementation - can be overridden by subclasses
    }

    draw(draw: Draw): void {
        // Base implementation - can be overridden by subclasses
    }

    // Entity management methods
    addChild(entity: IEntity): void {
        // Remove from current parent if it has one
        if (entity.parent) {
            entity.parent.removeChild(entity);
        }

        // Add to this entity's children
        this.children.push(entity);
        entity.parent = this;
    }

    removeChild(entity: IEntity): void {
        const index = this.children.indexOf(entity);
        if (index !== -1) {
            this.children.splice(index, 1);
            entity.parent = null;
        }
    }

    findChild(id: string): IEntity | null {
        for (const child of this.children) {
            if (child.id === id) {
                return child;
            }

            // Recursively search in grandchildren
            const found = child.findChild(id);
            if (found) {
                return found;
            }
        }
        return null;
    }

    // Position methods
    setPosition(x: number, y: number): void {
        this.position.x = x;
        this.position.y = y;
    }

    setRotation(rotation: number): void {
        this.rotation = rotation;
    }

    setScale(x: number, y: number): void {
        this.scale.x = x;
        this.scale.y = y;
    }

    // World position and rotation calculations
    getWorldPosition(): Position {
        if (this.absolute || !this.parent) {
            return { x: this.position.x, y: this.position.y };
        }

        // Calculate world position based on parent's world position
        const parentWorldPos = this.parent.getWorldPosition();
        const rotatedX = this.position.x * Math.cos(this.parent.getWorldRotation()) -
                        this.position.y * Math.sin(this.parent.getWorldRotation());
        const rotatedY = this.position.x * Math.sin(this.parent.getWorldRotation()) +
                        this.position.y * Math.cos(this.parent.getWorldRotation());

        return {
            x: parentWorldPos.x + rotatedX * this.parent.scale.x,
            y: parentWorldPos.y + rotatedY * this.parent.scale.y
        };
    }

    getWorldRotation(): number {
        if (this.absolute || !this.parent) {
            return this.rotation;
        }

        // Calculate world rotation based on parent's world rotation
        return this.parent.getWorldRotation() + this.rotation;
    }

    traverseEntities(callback: (entity: IEntity) => void): void {
        console.log("Traversing entity: " + this.id);
        callback(this);
        for (const child of this.children) {
            child.traverseEntities(callback);
        }
    }

    // Mouse interaction methods
    containsPoint(x: number, y: number): boolean {
        // Default implementation - implement specific bounds checking in subclasses
        // For now, return false since we don't know the exact bounds
        return false;
    }

    onMouseEnter?(): void {
        if (this.highlightOnHover) {
            this.isHovered = true;
        }
    }

    onMouseLeave?(): void {
        this.isHovered = false;
    }

    onMouseDown?(): void {
        // Default empty implementation that can be overridden
    }

    onMouseUp?(): void {
        // Default empty implementation that can be overridden
    }
}