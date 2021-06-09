import PropertyContainer from './PropertyContainer';
import PropertyFactory from './PropertyFactory';
import {
  degToRads,
  defaultVector,
  initialDefaultFrame,
} from './constant/index';
import BaseLottieLayer from './BaseLottieLayer';

type Anchor = {
  a: number;
  ix: number;
  k: number[];
}

type Opacity = {
  a: number;
  ix: number;
  k: number;
}

type Rotation = {
  a: number;
  ix: number;
  k: number;
}

type Scale = {
  a: number;
  ix: number;
  k: number[];
}

/**
 * transform property origin from tr or ks
 * @private
 */
export default class TransformFrames extends PropertyContainer {
  p;
  px;
  py;
  pz;
  rx;
  ry;
  rz;
  or;
  r;
  sk;
  sa;
  a;
  s;
  o;
  frameId: number = -1;
  propType: string = 'transform';
  private autoOriented: boolean = false; 
  private orientation: number = 0; 

  /**
   * constructor about transform property
   * @param {*} elem element node
   * @param {*} data multidimensional value property data
   */
  constructor(elem, data) {
    super(elem);
    console.log('TransformFrames', elem, data)

    this.p = PropertyFactory.create(data.p || { k: [0, 0, 0] }, 1, 0, this);
    this.r = PropertyFactory.create(data.r || { k: 0 }, 0, degToRads, this);
    this.a = PropertyFactory.create(data.a || { k: [0, 0, 0] }, 1, 0, this);
    this.s = PropertyFactory.create(data.s || { k: [100, 100, 100] }, 1, 0.01, this);
    this.o = PropertyFactory.create(data.o, 0, 0.01, this);

    if (!this.properties.length) {
      this.update(initialDefaultFrame, true);
    }
  }

  /**
   * get transform
   * @param {number} frameNum frameNum
   */
  update(frameNum) {
    if (frameNum === this.frameId) {
      return;
    }

    this.updateProperties(frameNum);

    if (this.autoOriented) {
      this.updateOrientation();
    }

    this.frameId = frameNum;
  }

  /**
   *
   */
  updateOrientation() {
    let v1 = defaultVector;
    let v2 = defaultVector;

    const frameRate = this.elem.frameRate;
    if (this.p && this.p.keyframes && this.p.getValueAtTime) {
      if (this.p._caching.lastFrame <= this.p.keyframes[0].t) {
        v1 = this.p.getValueAtTime((this.p.keyframes[0].t + 0.01) / frameRate, 0);
        v2 = this.p.getValueAtTime(this.p.keyframes[0].t / frameRate, 0);
      } else if (this.p._caching.lastFrame >= this.p.keyframes[this.p.keyframes.length - 1].t) {
        v1 = this.p.getValueAtTime((this.p.keyframes[this.p.keyframes.length - 1].t / frameRate), 0);
        v2 = this.p.getValueAtTime((this.p.keyframes[this.p.keyframes.length - 1].t - 0.05) / frameRate, 0);
      } else {
        v1 = this.p.pv;
        v2 = this.p.getValueAtTime((this.p._caching.lastFrame - 0.01) / frameRate, this.p.offsetTime);
      }
    } else if (this.px && this.px.keyframes && this.py.keyframes && this.px.getValueAtTime && this.py.getValueAtTime) {
      v1 = [];
      v2 = [];
      let px = this.px; let py = this.py;
      if (px._caching.lastFrame+px.offsetTime <= px.keyframes[0].t) {
        v1[0] = px.getValueAtTime((px.keyframes[0].t + 0.01) / frameRate, 0);
        v1[1] = py.getValueAtTime((py.keyframes[0].t + 0.01) / frameRate, 0);
        v2[0] = px.getValueAtTime((px.keyframes[0].t) / frameRate, 0);
        v2[1] = py.getValueAtTime((py.keyframes[0].t) / frameRate, 0);
      } else if (px._caching.lastFrame+px.offsetTime >= px.keyframes[px.keyframes.length - 1].t) {
        v1[0] = px.getValueAtTime((px.keyframes[px.keyframes.length - 1].t / frameRate), 0);
        v1[1] = py.getValueAtTime((py.keyframes[py.keyframes.length - 1].t / frameRate), 0);
        v2[0] = px.getValueAtTime((px.keyframes[px.keyframes.length - 1].t - 0.01) / frameRate, 0);
        v2[1] = py.getValueAtTime((py.keyframes[py.keyframes.length - 1].t - 0.01) / frameRate, 0);
      } else {
        v1 = [px.pv, py.pv];
        v2[0] = px.getValueAtTime((px._caching.lastFrame+px.offsetTime - 0.01) / frameRate, px.offsetTime);
        v2[1] = py.getValueAtTime((py._caching.lastFrame+py.offsetTime - 0.01) / frameRate, py.offsetTime);
      }
    }
    this.orientation = -Math.atan2(v1[1] - v2[1], v1[0] - v2[0]);
  }
}
