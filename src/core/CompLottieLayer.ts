import { initialDefaultFrame } from './constant/index';
import BaseLottieLayer from './BaseLottieLayer';
import PropertyFactory from './PropertyFactory';

export default class CompLottieLayer extends BaseLottieLayer {
  private childLayers = [];
  private layers: any;
  private frameRate: number;
  constructor(layer) {
    super(layer);

    this.layers = layer.layers;
    const { fr } = layer;
    this.frameRate = fr;

    if (layer.timeRemapping) {
      this.timeRemapping = PropertyFactory.create(this, layer.timeRemapping, 0, fr, this);
    }

    this.updateLayerFrame(initialDefaultFrame, true);
  }

  /**
   * update frame
   * @param {*} frameNum current frame number
   */
  updateFrame(frameNum) {
    // console.log('lottie core frameNum', frameNum)
    this.updateLayerFrame(frameNum);

    // NOTICE: 需要确定减去 offsetTime 应该在sr计算之前还是之后
    frameNum -= this.startTime;

    if (this.timeRemapping) {
      let timeRemapped = this.timeRemapping.v;
      if (timeRemapped === this.outPoint) {
        timeRemapped = this.outPoint - 1;
      }
      frameNum = timeRemapped;
    } else {
      frameNum = frameNum / this.stretch;
    }
    this.updateChildsFrame(frameNum);
  }

  /**
   * update childs frame
   * @param {number} frameNum current frame number
   */
  updateChildsFrame(frameNum) {
    for (let i = 0; i < this.childLayers.length; i++) {
      this.childLayers[i].updateFrame(frameNum);
    }
  }

  /**
   * add child layer
   * @param {BaseLottieLayer} node child layer
   */
  addChild(node) {
    node.parent = this;
    this.childLayers.push(node);
  }
}
