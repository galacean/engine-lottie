import { initialDefaultFrame } from '../contant';
import BaseLottieLayer from './BaseLottieLayer';

export default class SpriteLottieLayer extends BaseLottieLayer {
  private x: number;
  private y: number;

  constructor(layer, atlas) {
    super(layer);


    if (layer.refId) {
      const { w, h, x, y } = atlas.frames[layer.refId + '.png'].frame;
      this.width = w;
      this.height = h;
      this.x = x;
      this.y = y;
    }

    this.update(initialDefaultFrame, true);
  }
}
