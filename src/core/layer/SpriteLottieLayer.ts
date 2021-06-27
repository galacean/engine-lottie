import BaseLottieLayer from './BaseLottieLayer';

/**
 * @internal
 */
export default class SpriteLottieLayer extends BaseLottieLayer {
  x: number;
  y: number;

  constructor(layer, atlas) {
    super(layer);

    if (layer.refId) {
      const { w, h, x, y } = atlas.frames[layer.refId + '.png'].frame;
      this.width = w;
      this.height = h;
      this.x = x;
      this.y = y;
    }

    this.update(0, true);
  }
}
