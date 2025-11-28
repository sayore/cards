// Dialog.ts - Dialog entity for displaying text messages

import { Entity } from '../Entity';
import { Draw } from '../Draw';

export class Dialog extends Entity {
    text: string;
    fontSize: number;
    fontFamily: string;
    textColor: [number, number, number, number];
    backgroundColor: [number, number, number, number];
    borderColor: [number, number, number, number];
    borderWidth: number;
    width: number;
    height: number;
    padding: number;
    typingEffect: boolean;
    typingSpeed: number; // Characters per second
    currentText: string;
    fullText: string;
    typingTimer: number;
    visibleCharCount: number;
    isTyping: boolean;
    textArea: { x: number; y: number; width: number; height: number; };
    speakerName: string;
    showNameBox: boolean;

    constructor(id: string, x: number, y: number, width: number = 400, height: number = 120) {
        super(id, x, y);
        this.text = '';
        this.fullText = '';
        this.fontSize = 16;
        this.fontFamily = 'Arial';
        this.textColor = [1, 1, 1, 1]; // White
        this.backgroundColor = [0, 0, 0, 0.8]; // Semi-transparent black
        this.borderColor = [0.8, 0.8, 0.8, 1]; // Light gray
        this.borderWidth = 2;
        this.width = width;
        this.height = height;
        this.padding = 15;
        this.typingEffect = true;
        this.typingSpeed = 30; // 30 characters per second
        this.currentText = '';
        this.typingTimer = 0;
        this.visibleCharCount = 0;
        this.isTyping = false;
        this.textArea = {
            x: x - width / 2 + this.padding,
            y: y - height / 2 + this.padding,
            width: width - 2 * this.padding,
            height: height - 2 * this.padding
        };
        this.speakerName = '';
        this.showNameBox = false;
        this.debugConnectToParent = true;

        // Dialogs typically don't highlight on hover, but we can enable it
        this.highlightOnHover = false;  // Don't highlight by default but can be enabled
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        
        // Handle typing effect
        if (this.isTyping && this.typingEffect) {
            this.typingTimer += deltaTime;
            const charsToAdd = Math.floor(this.typingSpeed * this.typingTimer);
            
            if (charsToAdd > 0) {
                this.visibleCharCount = Math.min(
                    this.visibleCharCount + charsToAdd, 
                    this.fullText.length
                );
                this.currentText = this.fullText.substring(0, this.visibleCharCount);
                this.typingTimer = 0; // Reset timer
                
                // Check if typing is complete
                if (this.visibleCharCount >= this.fullText.length) {
                    this.isTyping = false;
                }
            }
        }
    }

    draw(draw: Draw): void {
        if (!this.visible) return;
        
        // Draw background
        draw.box({
            x: this.position.x - this.width / 2,
            y: this.position.y - this.height / 2,
            width: this.width,
            height: this.height,
            color: this.backgroundColor,
            fill: true
        });
        
        // Draw border
        draw.box({
            x: this.position.x - this.width / 2,
            y: this.position.y - this.height / 2,
            width: this.width,
            height: this.height,
            color: this.borderColor,
            fill: false,
            lineWidth: this.borderWidth
        });
        
        // Draw name box if needed
        if (this.showNameBox && this.speakerName) {
            const nameBoxHeight = 25;
            draw.box({
                x: this.position.x - this.width / 2,
                y: this.position.y - this.height / 2,
                width: this.width,
                height: nameBoxHeight,
                color: [0.2, 0.2, 0.2, 0.9], // Dark gray
                fill: true
            });
            
            // Draw speaker name
            draw.text({
                x: this.position.x - this.width / 2 + this.padding,
                y: this.position.y - this.height / 2 + nameBoxHeight - 5,
                text: this.speakerName,
                fontSize: 14,
                fontFamily: this.fontFamily,
                color: [1, 1, 1, 1]
            });
        }
        
        // Draw text
        const textY = this.showNameBox ? 
            this.position.y - this.height / 2 + (this.showNameBox ? 30 : 10) : 
            this.position.y - this.height / 4;
            
        draw.text({
            x: this.position.x - this.width / 2 + this.padding,
            y: textY,
            text: this.currentText || this.text,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            color: this.textColor
        });
        
        // Draw typing indicator if still typing
        if (this.isTyping && this.typingEffect) {
            const indicatorX = this.position.x - this.width / 2 + this.padding;
            const indicatorY = textY + this.fontSize;

            // Simple cursor blink effect
            if (Math.floor(this.visibleCharCount * 0.5) % 2 === 0) {
                draw.box({
                    x: indicatorX,
                    y: indicatorY - this.fontSize,
                    width: 2,
                    height: this.fontSize,
                    color: this.textColor,
                    fill: true
                });
            }
        }
    }
    
    // Set the dialog text
    setText(text: string, useTypingEffect: boolean = true): void {
        this.fullText = text;
        this.text = text;
        
        if (useTypingEffect && this.typingEffect) {
            this.currentText = '';
            this.visibleCharCount = 0;
            this.isTyping = true;
            this.typingTimer = 0;
        } else {
            this.currentText = text;
            this.visibleCharCount = text.length;
            this.isTyping = false;
        }
    }
    
    // Set speaker name
    setSpeaker(name: string): void {
        this.speakerName = name;
        this.showNameBox = !!name;
    }
    
    // Skip the typing effect
    skipTyping(): void {
        if (this.isTyping) {
            this.currentText = this.fullText;
            this.visibleCharCount = this.fullText.length;
            this.isTyping = false;
        }
    }
    
    // Check if dialog is finished displaying
    isFinished(): boolean {
        return !this.isTyping;
    }
    
    // Reset the dialog
    reset(): void {
        this.currentText = '';
        this.visibleCharCount = 0;
        this.isTyping = false;
        this.typingTimer = 0;
    }

    containsPoint(x: number, y: number): boolean {
        // Check if the point is within the dialog's bounding box
        const left = this.position.x - this.width / 2;
        const right = this.position.x + this.width / 2;
        const top = this.position.y - this.height / 2;
        const bottom = this.position.y + this.height / 2;

        return x >= left && x <= right && y >= top && y <= bottom;
    }
}