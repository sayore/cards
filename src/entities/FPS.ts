import { Draw } from "../Draw";
import { Entity } from "../Entity";
import { GameContext } from "../GameContext";

export class FPS extends Entity {
  readonly kind = 'FPS';
  draws = 0;
  elapsed = 0;
  fps = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y);
    this.position.x = x;
    this.position.y = y;
  }

  update(context: GameContext): void {
    super.update(context);
    const { deltaTime } = context;
    // Prevent division by zero
    if (deltaTime > 0) {
      this.fps = Math.round(1 / context.deltaTime);
    }
  }

  draw(draw: Draw): void {
    this.draws++;

    draw.text({
      x: this.position.x,
      y: this.position.y,
      text: "FPS: " + this.fps.toString(),
      fontSize: 10,
      color: [1, 1, 1, 1],
      fontFamily: "Arial",
    });
  }
}
