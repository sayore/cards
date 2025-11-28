// CardHand.ts - Entity that holds and displays cards in an arc formation

import { Entity } from '../Entity';
import { Draw } from '../Draw';
import { CardEntity } from './CardEntity';

export class CardHand extends Entity {
    cards: CardEntity[];
    maxCards: number;
    cardSpacing: number;
    arcAngle: number; // in radians
    handRadius: number;
    cardWidth: number;
    cardHeight: number;

    constructor(id: string, x: number, y: number, maxCards: number = 7) {
        super(id, x, y);
        this.cards = [];
        this.maxCards = maxCards;
        this.cardSpacing = 0.3; // Radians between cards
        this.arcAngle = Math.PI * 0.8; // 144 degrees arc
        this.rotation = -Math.PI/2;
        this.handRadius = 150; // Radius of the arc
        this.cardWidth = 60;
        this.cardHeight = 80;
    }

    update(deltaTime: number): void {
        super.update(deltaTime);
        
        // Update all cards
        for (const card of this.cards) {
            card.update(deltaTime);
        }
        
        // Update card positions to form an arc
        this.updateCardPositions();
    }

    draw(draw: Draw): void {
        // Draw cards in the arc formation
        for (const card of this.cards) {
            if (card.visible) {
                card.draw(draw);
            }
        }
    }
    
    // Update positions of all cards to form an arc
    private updateCardPositions(): void {
        const cardCount = this.cards.length;
        if (cardCount === 0) return;
        
        // Calculate starting angle (centered)
        const totalArc = (cardCount - 1) * this.cardSpacing;
        const startAngle = -totalArc / 2 + this.rotation; // Start angle relative to hand rotation
        
        for (let i = 0; i < cardCount; i++) {
            const angle = startAngle + i * this.cardSpacing;
            
            // Calculate position in arc
            const cardX = this.position.x + Math.cos(angle) * this.handRadius;
            const cardY = this.position.y + Math.sin(angle) * this.handRadius;
            
            // Set card position
            this.cards[i].position.x = cardX;
            this.cards[i].position.y = cardY;
            
            // Optionally rotate card to face outward from center
            this.cards[i].rotation = angle + Math.PI / 2; // Rotate to be perpendicular to radius
        }
    }
    
    // Add a card to the hand
    addCard(card: CardEntity): void {
        if (this.cards.length < this.maxCards) {
            this.cards.push(card);
            this.addChild(card);
            this.updateCardPositions(); // Update positions to accommodate new card
        }
    }
    
    // Remove a card from the hand
    removeCard(card: CardEntity): boolean {
        const index = this.cards.indexOf(card);
        if (index !== -1) {
            this.cards.splice(index, 1);
            this.removeChild(card);
            this.updateCardPositions(); // Update positions after removal
            return true;
        }
        return false;
    }
    
    // Get card at specific index
    getCard(index: number): CardEntity | undefined {
        return this.cards[index];
    }
    
    // Get the number of cards in hand
    getCardCount(): number {
        return this.cards.length;
    }
    
    // Clear all cards
    clear(): void {
        // Remove all cards from parent-child relationship
        for (const card of this.cards) {
            this.removeChild(card);
        }
        this.cards = [];
    }
    
    // Set the arc properties
    setArcProperties(arcAngle: number, radius: number, spacing: number): void {
        this.arcAngle = arcAngle;
        this.handRadius = radius;
        this.cardSpacing = spacing;
        this.updateCardPositions();
    }
}