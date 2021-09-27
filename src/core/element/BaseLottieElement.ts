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
  stretch: number = 1;
  parent: any = null;
  inPoint: any;
  outPoint: any;
  timeRemapping: any;
  width: number;
  height: number;
  visible: boolean = true;
  entity: Entity;
  startTime: number = 0;

  private childLayers = [];

  constructor(layer: TypeLayer) {
    this.is3D = !!layer.ddd;
    this.stretch = layer.sr || 1;
    this.name = layer.nm || '';
    this.index = layer.ind;
    this.timeRemapping = layer.tm;
    this.width = layer.w;
    this.height = layer.h;

    this.inPoint = layer.ip;
    this.outPoint = layer.op;

    if (layer.st) {
      this.startTime = layer.st;
    }

    if (layer.ks) {
      this.transform = new TransformFrames(layer.ks);
    }
  }

  update(frameNum: number = 0) {
    const { startTime } = this;
    const frame = frameNum / this.stretch;

    this.visible = this.inPoint <= frame && this.outPoint >= frame;

    if (this.transform && this.visible) {
      this.transform.update(frame);
    }

    for (let i = 0; i < this.childLayers.length; i++) {
      this.childLayers[i].update(frame - startTime);
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