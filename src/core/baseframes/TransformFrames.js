import DynamicPropertyContainer from '../utils/helpers/dynamicProperties';
// import Matrix from './lib/transformation-matrix';
import PropertyFactory from '../utils/PropertyFactory';
import {
  degToRads,
  defaultVector,
  initialDefaultFrame,
} from '../constant/index';


/**
 * transform property origin from tr or ks
 * @private
 */
export default class TransformFrames extends DynamicPropertyContainer {
  /**
   * constructor about transform property
   * @param {*} elem element node
   * @param {*} data multidimensional value property data
   */
  constructor(elem, data) {
    super();
    this.elem = elem;
    this.frameId = -1;
    this.propType = 'transform';
    this.data = data;
    this.autoOriented = false;
    this.orientation = 0;
    // this.v = new Matrix();
    // // Precalculated matrix with non animated properties
    // this.pre = new Matrix();
    // this.appliedTransformations = 0;
    this.initDynamicPropertyContainer(elem);
    if (data.p && data.p.s) {
      this.px = PropertyFactory.getProp(elem, data.p.x, 0, 0, this);
      this.py = PropertyFactory.getProp(elem, data.p.y, 0, 0, this);
      if (data.p.z) {
        this.pz = PropertyFactory.getProp(elem, data.p.z, 0, 0, this);
      }
    } else {
      this.p = PropertyFactory.getProp(elem, data.p || { k: [0, 0, 0] }, 1, 0, this);
    }
    if (data.rx) {
      this.rx = PropertyFactory.getProp(elem, data.rx, 0, degToRads, this);
      this.ry = PropertyFactory.getProp(elem, data.ry, 0, degToRads, this);
      this.rz = PropertyFactory.getProp(elem, data.rz, 0, degToRads, this);
      if (data.or.k[0].ti) {
        let i; let len = data.or.k.length;
        for (i=0; i<len; i+=1) {
          data.or.k[i].to = data.or.k[i].ti = null;
        }
      }
      this.or = PropertyFactory.getProp(elem, data.or, 1, degToRads, this);
      // sh Indicates it needs to be capped between -180 and 180
      this.or.sh = true;
    } else {
      this.r = PropertyFactory.getProp(elem, data.r || { k: 0 }, 0, degToRads, this);
    }
    if (data.sk) {
      this.sk = PropertyFactory.getProp(elem, data.sk, 0, degToRads, this);
      this.sa = PropertyFactory.getProp(elem, data.sa, 0, degToRads, this);
    }
    this.a = PropertyFactory.getProp(elem, data.a || { k: [0, 0, 0] }, 1, 0, this);
    this.s = PropertyFactory.getProp(elem, data.s || { k: [100, 100, 100] }, 1, 0.01, this);

    if (data.o) {
      this.o = PropertyFactory.getProp(elem, data.o, 0, 0.01, this);
    } else {
      this.o = { _mdf: false, v: 1 };
    }

    if (!this.dynamicProperties.length) {
      this.getValue(initialDefaultFrame, true);
    }
  }

  /**
   * get transform
   * @param {number} frameNum frameNum
   */
  getValue(frameNum) {
    this._mdf = false;
    if (frameNum === this.frameId) {
      return;
    }

    this.iterateDynamicProperties(frameNum);

    if (this.autoOriented && this._mdf) {
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

    const frameRate = this.elem.session.global.frameRate;
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
