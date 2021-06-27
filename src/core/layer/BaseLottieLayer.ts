import { TypeLayer } from '../../LottieResource';
import TransformFrames from '../TransformFrames';

/**
 * @internal
 */
export default class BaseLottieLayer {
  transform: TransformFrames;
  is3D: boolean;
  offsetTime: number;
  name: string;
  index: number;
  stretch: number;
  startTime: number;
  parent: any = null;
  inPoint: any;
  outPoint: any;
  timeRemapping: any;
  width: number;
  height: number;
  visible: boolean;

  private isOverlapLayer: boolean; 
  private isOverlapMode: boolean; 
  
  constructor(layer: TypeLayer) {
    this.is3D = !!layer.ddd;
    this.stretch = layer.sr || 1;
    this.inPoint = layer.ip;
    this.outPoint = layer.op;
    this.startTime = layer.st || 0;
    this.name = layer.nm || '';
    this.index = layer.ind;
    this.timeRemapping = layer.tm;
    this.width = layer.w;
    this.height = layer.h;

    this.isOverlapLayer = layer.op >= (this.outPoint - this.stretch);

    if (layer.ks) {
      this.transform = new TransformFrames(layer.ks);
    }
  }

  update(frameNum: number = 0, forceUpdate=false) {
    if (this.isOverlapMode && this.isOverlapLayer) {
      this.visible = frameNum >= this.inPoint;
    } else {
      this.visible = (this.inPoint <= frameNum && this.outPoint >= frameNum);
    }

    if (this.transform && (forceUpdate || this.visible)) {
      this.transform.update(frameNum);
    }
  }
}