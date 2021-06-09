import { Layer } from '../LottieResource';
import TransformFrames from './baseframes/TransformFrames';

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
  id: string;
  inPoint: any;
  outPoint: any;
  private isOverlapLayer: boolean; 
  private isOverlapMode: boolean; 
  private dynamicProperties = []; 
  private transform: any = null;
  timeRemapping: any;
  width: number;
  height: number;
  layers: any;
  isInRange: boolean;
  
  constructor(layer: Layer) {
    this.is3D = !!layer.ddd;
    this.stretch = layer.sr || 1;
    this.inPoint = layer.ip;
    this.outPoint = layer.op;
    this.startTime = layer.st || 0;
    this.name = layer.nm || '';
    this.index = layer.ind;
    this.id = layer.refId;
    this.timeRemapping = layer.tm;
    this.width = layer.w;
    this.height = layer.h;
    this.layers = layer.layers;

    this.isOverlapLayer = layer.op >= (layer.outPoint - layer.stretch);
    this.isOverlapMode = layer.overlapMode;

    this.transform = null;
    if (layer.ks) {
      this.transform = new TransformFrames(this, layer.ks);

      if (layer.ao) {
        this.transform.autoOriented = true;
      }
    }
  }


  /**
   * Calculates all dynamic values
   * @param {number} frameNum current frame number in Layer's time
   * @param {boolean} isVisible if layers is currently in range
   */
  prepareProperties(frameNum, isVisible) {
    // console.log('this.dynamicProperties', this.dynamicProperties)
    let i; let len = this.dynamicProperties.length;
    for (i = 0; i < len; i += 1) {
      if (isVisible || (this.dynamicProperties[i].propType === 'transform')) {
        this.dynamicProperties[i].getValue(frameNum);
      }
    }
  }

  /**
   *
   * @param {*} prop a
   */
  addDynamicProperty(prop) {
    if (this.dynamicProperties.indexOf(prop) === -1) {
      this.dynamicProperties.push(prop);
    }
  }

  /**
   * update this layer frame
   * @param {number} frameNum frameNum
   * @param {boolean} forceUpdate forceUpdate
   */
  updateLayerFrame(frameNum, forceUpdate=false) {
    if (this.isOverlapMode && this.isOverlapLayer) {
      this.isInRange = frameNum >= this.inPoint;
    } else {
      this.isInRange = (this.inPoint <= frameNum && this.outPoint >= frameNum);
    }

    this.prepareProperties(frameNum, forceUpdate || this.isInRange);
  }

  /**
   * update frame
   * @param {number} frameNum frameNum
   */
  updateFrame(frameNum) {
    this.updateLayerFrame(frameNum);
  }
}