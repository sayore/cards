import { Draw } from "../Draw";
import { Entity } from "../Entity";

export class EntityList extends Entity {
  readonly kind = 'EntityList';
  draws = 0;
  elapsed = 0;
  fps = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y);
    this.position.x = x;
    this.position.y = y;
  }

  update(deltaTime: number): void {
    
    
  }

  draw(draw: Draw): void {
    this.draws++;

    draw.text({
      x: this.position.x,
      y: this.position.y,
      text: "Entity List: " + this.parent?.children.map((ent)=>{return ent.kind}),
      fontSize: 10,
      color: [1, 1, 1, 1],
      fontFamily: "Arial",
    });
  }
}
