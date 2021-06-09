import { Layer } from '../LottieResource';
import TransformFrames from './TransformFrames';

interface KeyFrame {
  k: any;
  ix: number;
  a: number;
  x?: any;
  ti?: any;
  to?: any;
}

interface KeyFrames {
  a: KeyFrame;
  o: KeyFrame;
  p: KeyFrame;
  r: KeyFrame;
  s: KeyFrame;
}

export default class BaseLottieLayer {
  is3D: boolean;
  offsetTime: number;
  name: string;
  index: number;
  stretch: number;
  startTime: number;
  parent: any = null;
  inPoint: any;
  outPoint: any;
  private isOverlapLayer: boolean; 
  private isOverlapMode: boolean; 
  private properties = []; 
  private transform: TransformFrames;
  timeRemapping: any;
  width: number;
  height: number;
  visible: boolean;
  frameRate: number;
  
  constructor(layer: Layer) {
    this.is3D = !!layer.ddd;
    this.stretch = layer.sr || 1;
    this.inPoint = layer.ip;
    this.outPoint = layer.op;
    this.startTime = layer.st || 0;
    this.frameRate = layer.fr;
    this.name = layer.nm || '';
    this.index = layer.ind;
    this.timeRemapping = layer.tm;
    this.width = layer.w;
    this.height = layer.h;

    this.isOverlapLayer = layer.op >= (this.outPoint - this.stretch);
    this.isOverlapMode = layer.overlapMode;

    if (layer.ks) {
      this.transform = new TransformFrames(this, layer.ks);

      if (layer.ao) {
        this.transform.autoOriented = true;
      }
    }
  }

  /**
   *
   * @param {*} prop a
   */
  addProperty(prop) {
    if (this.properties.indexOf(prop) === -1) {
      this.properties.push(prop);
    }
  }

  /**
   * update this layer frame
   * @param {number} frameNum frameNum
   * @param {boolean} forceUpdate forceUpdate
   */
  updateLayerFrame(frameNum, forceUpdate=false) {
    if (this.isOverlapMode && this.isOverlapLayer) {
      this.visible = frameNum >= this.inPoint;
    } else {
      this.visible = (this.inPoint <= frameNum && this.outPoint >= frameNum);
    }

    for (let i = 0, len = this.properties.length; i < len; i += 1) {
      if ((forceUpdate || this.visible) || (this.properties[i].propType === 'transform')) {
        this.properties[i].update(frameNum);
      }
    }
  }

  /**
   * update frame
   * @param {number} frameNum frameNum
   */
  updateFrame(frameNum) {
    this.updateLayerFrame(frameNum);
  }
}