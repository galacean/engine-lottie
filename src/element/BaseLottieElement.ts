import { TypeLayer } from "../LottieResource";
import TransformFrames from "../TransformFrames";
import { Entity } from "@galacean/engine";

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
  treeIndex: number[] = [];

  private childLayers = [];

  constructor(layer: TypeLayer) {
    this.is3D = !!layer.ddd;
    this.name = layer.nm || "";
    this.index = layer.index;
    this.timeRemapping = layer.tm;
    this.width = layer.w;
    this.height = layer.h;

    this.inPoint = layer.ip;
    this.outPoint = layer.op;

    if (layer.st) {
      this.startTime = layer.st;
    }

    this.stretch = layer.stretch || 1;
    this.offsetTime = layer.offsetTime || 0;
    if (layer.ks) {
      this.transform = new TransformFrames(layer.ks);
    }
  }

  reset() {
    if (this.transform) {
      this.transform.reset();
    }

    for (let i = 0; i < this.childLayers.length; i++) {
      this.childLayers[i].reset();
    }
  }

  update(frameNum: number = 0, isParentVisible?: boolean) {
    const frame = (frameNum - this.offsetTime) / this.stretch;

    if (isParentVisible === true) {
      this.visible = this.inPoint <= frame && this.outPoint >= frame;
    } else if (isParentVisible === false) {
      this.visible = false;
    }

    if (this.transform && this.visible) {
      this.transform.update(frame);
    }

    for (let i = 0; i < this.childLayers.length; i++) {
      this.childLayers[i].update(frameNum, this.visible);
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

  destroy() {
    this.entity.parent = null;
    this.entity.destroy();
    this.entity = null;
    this.transform = null;
    this.parent = null;
  }
}
