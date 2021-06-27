import BaseLottieLayer from './BaseLottieLayer';

/**
 * @internal
 */
export default class CompLottieLayer extends BaseLottieLayer {
  private childLayers = [];
  layer: any;

  constructor(layer) {
    super(layer);

    this.layer = layer.layers;
    this.update();
  }

  /**
   * update frame
   */
  update(frameNum: number = 0) {
    frameNum -= this.startTime;
    frameNum = frameNum / this.stretch;

    for (let i = 0; i < this.childLayers.length; i++) {
      this.childLayers[i].update(frameNum);
    }
  }

  /**
   * add child layer
   */
  addChild(node) {
    node.parent = this;
    this.childLayers.push(node);
  }
}
