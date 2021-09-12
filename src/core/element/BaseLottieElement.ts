import { TypeLayer } from '../../LottieResource';
import TransformFrames from '../TransformFrames';
import { Entity } from 'oasis-engine';

/**
 * @internal
 */
export default class BaseLottieElement {
  transform: TransformFrames;
  is3D: boolean;
  offsetTime: number;
  name: string;
  index: number;
  stretch: number;
  parent: any = null;
  inPoint: any;
  outPoint: any;
  timeRemapping: any;
  width: number;
  height: number;
  visible: boolean = true;
  entity: Entity;

  private isOverlapLayer: boolean;
  private isOverlapMode: boolean;
  private childLayers = [];

  constructor(layer: TypeLayer) {
    this.is3D = !!layer.ddd;
    this.stretch = layer.sr || 1;
    this.inPoint = layer.ip;
    this.outPoint = layer.op;
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

  update(frameNum: number = 0) {
    frameNum = frameNum / this.stretch;

    if (this.isOverlapMode && this.isOverlapLayer) {
      this.visible = frameNum >= this.inPoint;
    } else {
      this.visible = (this.inPoint <= frameNum && this.outPoint >= frameNum);
    }

    if (this.transform && this.visible) {
      this.transform.update(frameNum);
    }

    for (let i = 0; i < this.childLayers.length; i++) {
      this.childLayers[i].update(frameNum);
    }
  }

  /**
   * add child layer
   */
  addChild(node) {
    node.parent = this;
    node.entity.parent = this.entity;
    this.childLayers.push(node);
  }
}