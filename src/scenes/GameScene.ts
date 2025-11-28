// GameScene.ts - Main game scene without the background to test other entities

import { Entity } from "../Entity";
import { Draw } from "../Draw";
import { Player } from "../entities/Player";
import { HealthBar } from "../entities/HealthBar";
import { CardHand } from "../entities/CardHand";
import { CardEntity } from "../entities/CardEntity";
import { Dialog } from "../entities/Dialog";
import { Menu } from "../entities/Menu";
import { Circle } from "../entities/Circle";
import { FPS } from "../entities/FPS";
import { Background } from "../entities/Background";

export class GameScene extends Entity {
  private player: Player;
  private healthBar: HealthBar;
  private background: Background;
  cardHand
  private dialog: Dialog;
  private menu: Menu;

  constructor() {
    super("gameScene", 0, 0);

    

    // Initialize player at center
    this.player = new Player("player", 400, 300);
    this.addChild(this.player);

    // Initialize health bar above player
    this.healthBar = new HealthBar("healthbar");
    this.healthBar.setTarget(this.player);
    // Add health bar as child of player so it follows the player
    this.player.addChild(this.healthBar);

    

    this.addChild(new FPS("FPS", 200, 10));

    
    this.cardHand = new CardHand("cardhand", 400, 860, 5);
    this.addChild(this.cardHand);

    // Add some cards to the hand
    for (let i = 0; i < 3; i++) {
      const card = new CardEntity(`card_${i}`, 0, 0, "Herold", "No description");
      card.color = [
        0.2 + Math.random() * 0.8,
        0.3 + Math.random() * 0.7,
        0.4 + Math.random() * 0.6,
        1,
      ];
      this.cardHand.addCard(card);
    }
    

    // Initialize dialog at top
    this.dialog = new Dialog("dialog", 400, 100, 500, 120);
    this.dialog.typingEffect = false; // Disable typing for immediate visibility
    this.dialog.setText(
      "Testing Game Scene - Press arrow keys to move player",
      false
    ); // No typing effect
    this.dialog.setSpeaker("System");
    this.addChild(this.dialog);

    // Initialize menu (hidden by default)
    this.menu = new Menu("menu", 400, 300, "Game Menu");
    this.menu.addItem("resume", "Resume Game", () =>
      console.log("Resuming game")
    );
    this.menu.addItem("restart", "Restart", () => console.log("Restarting"));
    this.menu.addItem("quit", "Quit to Main", () => console.log("Quitting"));
    this.menu.visible = false; // Hidden by default
    this.addChild(this.menu);

    let overlay = new Entity("overlay");

    let i=0;
    this.traverseEntities((entity: Entity) => {
      entity.debugConnectToParent = true;
      i++;
      console.log("Entity: " + entity.id, "Parent: " + (entity.parent ? entity.parent.id : "null"), "No"+i);
      
    });
    this.addChild(overlay);

    this.background = new Background('background', 400, 300, 800, 600);
    this.background.setSolidColor([0.1, 0.1, 0.3, 1]); // Slightly different blue
    this.addChild(this.background);

    // Set up event listeners for this scene
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Player movement
    document.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.player.startMoving("left");
          break;
        case "ArrowRight":
          this.player.startMoving("right");
          break;
        case "ArrowUp":
          this.player.startMoving("up");
          break;
        case "ArrowDown":
          this.player.startMoving("down");
          break;
        case " ":
          // Spacebar to damage player and show health bar effect
          this.player.takeDamage(10);
          this.healthBar.updateHealth(
            this.player.health,
            this.player.maxHealth
          );
          break;
        case "m":
        case "M":
          // Toggle menu visibility
          this.menu.visible = !this.menu.visible;
          this.dialog.visible = !this.menu.visible; // Hide dialog when menu is shown
          break;
        case "Enter":
          // Activate menu item if menu is visible
          if (this.menu.visible) {
            this.menu.activate();
          }
          break;
        case "ArrowUp":
        case "ArrowDown":
          // Navigate menu if visible (only if not moving player)
          if (
            this.menu.visible &&
            !["ArrowLeft", "ArrowRight"].includes(e.key)
          ) {
            if (e.key === "ArrowUp") {
              this.menu.selectPrevious();
            } else {
              this.menu.selectNext();
            }
          }
          break;
      }
    });

    document.addEventListener("keyup", (e) => {
      // Stop movement when arrow keys are released
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        this.player.stopMoving();
      }
    });
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
  }

  draw(draw: Draw): void {
    // Call super to draw child entities
    super.draw(draw);

    // Draw some guaranteed visible text directly to test text rendering
    draw.text({
      x: 20,
      y: 50,
      text: "HELLO - TEXT IS WORKING!",
      fontSize: 24,
      fontFamily: "Arial",
      color: [1, 1, 0, 1], // Bright yellow
      textAlign: "left",
      textBaseline: "middle",
    });

    // Draw another test text to make sure
    draw.text({
      x: 20,
      y: 80,
      text: "Press 1: Simple Scene | Press 2: Game Scene",
      fontSize: 18,
      fontFamily: "Arial",
      color: [0, 1, 1, 1], // Cyan
      textAlign: "left",
      textBaseline: "middle",
    });
  }
  
}
