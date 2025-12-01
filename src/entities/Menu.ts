// Menu.ts - Menu entity for selecting different scenes

import { Entity } from '../Entity';
import { Draw } from '../Draw';

export interface MenuItem {
    id: string;
    text: string;
    action: () => void;
    enabled: boolean;
    position: { x: number; y: number; };
    selected: boolean;
}

export class Menu extends Entity {
    readonly kind = 'Menu';
    title: string;
    items: MenuItem[];
    selectedIdx: number;
    itemSpacing: number;
    menuWidth: number;
    menuHeight: number;
    backgroundColor: [number, number, number, number];
    borderColor: [number, number, number, number];
    titleColor: [number, number, number, number];
    itemColor: [number, number, number, number];
    selectedItemColor: [number, number, number, number];
    disabledItemColor: [number, number, number, number];
    fontSize: number;
    titleFontSize: number;
    borderWidth: number;
    padding: number;
    private lastSelectionTime: number;

    constructor(id: string, x: number, y: number, title: string = '') {
        super(id, x, y);
        this.title = title;
        this.items = [];
        this.selectedIdx = 0;
        this.itemSpacing = 40;
        this.menuWidth = 300;
        this.menuHeight = 200;
        this.backgroundColor = [0.1, 0.1, 0.1, 0.85]; // Dark semi-transparent
        this.borderColor = [0.5, 0.5, 0.5, 1]; // Gray
        this.titleColor = [1, 1, 1, 1]; // White
        this.itemColor = [0.9, 0.9, 0.9, 1]; // Light gray
        this.selectedItemColor = [1, 1, 0.5, 1]; // Light yellow
        this.disabledItemColor = [0.4, 0.4, 0.4, 1]; // Dark gray
        this.fontSize = 20;
        this.titleFontSize = 24;
        this.borderWidth = 2;
        this.padding = 20;
        this.lastSelectionTime = 0;
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        
        // Update positions of menu items based on current selection
        this.updateItemPositions();
    }

    draw(draw: Draw): void {
        if (!this.visible) return;
        
        // Draw menu background
        draw.box({
            x: this.position.x - this.menuWidth / 2,
            y: this.position.y - this.menuHeight / 2,
            width: this.menuWidth,
            height: this.menuHeight,
            color: this.backgroundColor,
            fill: true
        });
        
        // Draw border
        draw.box({
            x: this.position.x - this.menuWidth / 2,
            y: this.position.y - this.menuHeight / 2,
            width: this.menuWidth,
            height: this.menuHeight,
            color: this.borderColor,
            fill: false,
            lineWidth: this.borderWidth
        });
        
        // Draw title if exists
        if (this.title) {
            draw.text({
                x: this.position.x - this.menuWidth / 2 + this.padding,
                y: this.position.y - this.menuHeight / 2 + this.titleFontSize + 10,
                text: this.title,
                fontSize: this.titleFontSize,
                fontFamily: 'Arial',
                color: this.titleColor
            });
        }
        
        // Draw menu items
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const isSelected = i === this.selectedIdx;
            
            // Determine color based on selection and enabled state
            let color = this.itemColor;
            if (!item.enabled) {
                color = this.disabledItemColor;
            } else if (isSelected) {
                color = this.selectedItemColor;
            }
            
            // Draw item text
            draw.text({
                x: item.position.x,
                y: item.position.y,
                text: item.text,
                fontSize: this.fontSize,
                fontFamily: 'Arial',
                color: color
            });
            
            // Draw selection indicator for selected item
            if (isSelected) {
                draw.text({
                    x: item.position.x - 20, // Left of the text
                    y: item.position.y,
                    text: '> ',
                    fontSize: this.fontSize,
                    fontFamily: 'Arial',
                    color: this.selectedItemColor
                });
            }
        }
    }
    
    // Update positions of menu items
    private updateItemPositions(): void {
        const titleOffset = this.title ? this.titleFontSize + 20 : 0;
        const startY = this.position.y - this.menuHeight / 2 + titleOffset + this.padding;
        
        for (let i = 0; i < this.items.length; i++) {
            this.items[i].position = {
                x: this.position.x - this.menuWidth / 2 + this.padding,
                y: startY + i * this.itemSpacing
            };
        }
        
        // Update menu height based on number of items
        this.menuHeight = titleOffset + this.padding * 2 + this.items.length * this.itemSpacing + this.padding;
    }
    
    // Add a menu item
    addItem(id: string, text: string, action: () => void, enabled: boolean = true): void {
        const item: MenuItem = {
            id,
            text,
            action,
            enabled,
            position: { x: 0, y: 0 },
            selected: this.items.length === 0 // First item is selected by default
        };
        
        this.items.push(item);
        
        // If this is the first item, select it
        if (this.items.length === 1) {
            this.selectedIdx = 0;
        }
        
        this.updateItemPositions();
    }
    
    // Remove a menu item
    removeItem(id: string): boolean {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items.splice(index, 1);
            
            // Adjust selected index if needed
            if (this.selectedIdx >= this.items.length && this.items.length > 0) {
                this.selectedIdx = this.items.length - 1;
            } else if (this.items.length === 0) {
                this.selectedIdx = 0;
            }
            
            this.updateItemPositions();
            return true;
        }
        return false;
    }
    
    // Select next menu item
    selectNext(): void {
        if (this.items.length === 0) return;
        
        // Find next enabled item
        let nextIdx = (this.selectedIdx + 1) % this.items.length;
        while (nextIdx !== this.selectedIdx && !this.items[nextIdx].enabled) {
            nextIdx = (nextIdx + 1) % this.items.length;
        }
        
        this.selectedIdx = nextIdx;
    }
    
    // Select previous menu item
    selectPrevious(): void {
        if (this.items.length === 0) return;
        
        // Find previous enabled item
        let prevIdx = (this.selectedIdx - 1 + this.items.length) % this.items.length;
        while (prevIdx !== this.selectedIdx && !this.items[prevIdx].enabled) {
            prevIdx = (prevIdx - 1 + this.items.length) % this.items.length;
        }
        
        this.selectedIdx = prevIdx;
    }
    
    // Activate the selected menu item
    activate(): void {
        if (this.items.length === 0 || this.selectedIdx >= this.items.length) return;
        
        const selectedItem = this.items[this.selectedIdx];
        if (selectedItem.enabled) {
            selectedItem.action();
        }
    }
    
    // Get the selected item
    getSelectedItem(): MenuItem | null {
        if (this.items.length === 0 || this.selectedIdx >= this.items.length) {
            return null;
        }
        return this.items[this.selectedIdx];
    }
    
    // Set the menu items
    setItems(items: Array<{id: string, text: string, action: () => void, enabled?: boolean}>): void {
        this.items = items.map((item, idx) => ({
            id: item.id,
            text: item.text,
            action: item.action,
            enabled: item.enabled !== undefined ? item.enabled : true,
            position: { x: 0, y: 0 },
            selected: idx === 0
        }));
        
        this.selectedIdx = 0;
        this.updateItemPositions();
    }
    
    // Enable/disable a specific menu item
    setItemEnabled(id: string, enabled: boolean): void {
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.enabled = enabled;
        }
    }
}