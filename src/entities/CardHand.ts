// CardHand.ts - Entity that holds and displays cards in an arc formation

import { Entity } from '../Entity';
import { Draw } from '../Draw';
import { CardEntity } from './CardEntity';
import { GameContext } from '../GameContext';

export class CardHand extends Entity {
    readonly kind = 'CardHand';
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
        this.cardSpacing = 0.15; // Radians between cards
        this.arcAngle = Math.PI * 0.8; // 144 degrees arc
        this.rotation = 0;
        this.handRadius = 400; // Radius of the arc
        this.cardWidth = 120;
        this.cardHeight = 160;
    }

    update(context: GameContext): void {
        super.update(context);

        // Update all cards
        for (const card of this.cards) {
            card.update(context);
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
    
    private updateCardPositions(): void {
        const cardCount = this.cards.length;
        if (cardCount === 0) return;
        
        // Calculate starting angle (centered)
        const totalArc = (cardCount - 1) * this.cardSpacing;
        
        // FIX 1: Do NOT add this.rotation here. 
        // The Scene Graph will rotate the whole group based on the parent's rotation.
        // We just define the shape of the arc locally.
        // Assuming -PI/2 makes the arc point "Up" relative to the hand's local space.
        const startAngle = -totalArc / 2 - Math.PI / 2; 
        
        for (let i = 0; i < cardCount; i++) {
            const angle = startAngle + i * this.cardSpacing;
            
            // FIX 2: Do NOT add this.position.x/y. Use Local Coordinates (relative to 0,0).
            const cardX = Math.cos(angle) * this.handRadius;
            const cardY = Math.sin(angle) * this.handRadius;
            
            // Set card position (Local)
            this.cards[i].position.x = cardX;
            this.cards[i].position.y = cardY;
            
            // Rotate card to face outward
            // We set local rotation. Parent rotation will be added on top automatically.
            this.cards[i].rotation = angle + Math.PI / 2; 
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