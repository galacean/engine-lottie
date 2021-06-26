
import bez from '../bezier';
import { initialDefaultFrame as initFrame } from '../contant';
import BaseProperty, { TypeKeyframe, TypeMultiDimensionalKeyframedProperty } from './BaseProperty';

/**
 * keyframed multidimensional value property
 */
export default class KeyframedMultidimensionalProperty extends BaseProperty {
  constructor(data: TypeMultiDimensionalKeyframedProperty, mult) {
    super(data, mult);
    let i; let len = data.k.length;
    let s; let e; let to; let ti;

    this.isMultidimensional = true;
    this.newValue = new Float32Array(len);

    for (i = 0; i < len - 1; i += 1) {
      if (data.k[i].to && data.k[i].s && data.k[i + 1] && data.k[i + 1].s) {
        s = data.k[i].s;
        e = data.k[i + 1].s;
        to = data.k[i].to;
        ti = data.k[i].ti;
        if ((s.length === 2 && !(s[0] === e[0] && s[1] === e[1]) && bez.pointOnLine2D(s[0], s[1], e[0], e[1], s[0] + to[0], s[1] + to[1]) && bez.pointOnLine2D(s[0], s[1], e[0], e[1], e[0] + ti[0], e[1] + ti[1])) || (s.length === 3 && !(s[0] === e[0] && s[1] === e[1] && s[2] === e[2]) && bez.pointOnLine3D(s[0], s[1], s[2], e[0], e[1], e[2], s[0] + to[0], s[1] + to[1], s[2] + to[2]) && bez.pointOnLine3D(s[0], s[1], s[2], e[0], e[1], e[2], e[0] + ti[0], e[1] + ti[1], e[2] + ti[2]))) {
          data.k[i].to = null;
          data.k[i].ti = null;
        }
        if (s[0] === e[0] && s[1] === e[1] && to[0] === 0 && to[1] === 0 && ti[0] === 0 && ti[1] === 0) {
          if (s.length === 2 || (s[2] === e[2] && to[2] === 0 && ti[2] === 0)) {
            data.k[i].to = null;
            data.k[i].ti = null;
          }
        }
      }
    }
    this.keyframed = true;
    let arrLen = data.k[0].s.length;
    this.v = new Float32Array(arrLen);
    for (i = 0; i < arrLen; i += 1) {
      this.v[i] = initFrame * this.mult;
    }
    this._caching = { lastFrame: initFrame, lastIndex: 0, value: new Float32Array(arrLen) };

  }

  /**
   * interpolate value
   * @interal
   */
  _interpolateValue(frameNum: number): number | number[] {
    const caching = this._caching;
    let { lastIndex } = caching;
    const { value } = this;
    let { newValue } = this;

    let i: number = lastIndex;
    let keyData: TypeKeyframe = value[lastIndex];
    let nextKeyData: TypeKeyframe = value[lastIndex + 1];

    // Find current frame
    for (let l = value.length - 1; i < l; i++) {
      keyData = value[i];
      nextKeyData = value[i + 1];

      if (i === l - 1 && frameNum >= nextKeyData.t) {
        if (keyData.h) {
          keyData = nextKeyData;
        }

        lastIndex = 0;
        break;
      }

      if (nextKeyData.t > frameNum) {
        lastIndex = i;
        break;
      }
    }

    caching.lastIndex = lastIndex;

    if (keyData.to) {
      let perc: number;
      let nextKeyTime: number = nextKeyData.t;
      let keyTime: number = keyData.t;

      if (!keyData.bezierData) {
        keyData.bezierData = bez.buildBezierData(keyData.s, nextKeyData.s || keyData.e, keyData.to, keyData.ti);
      }
      let bezierData = keyData.bezierData;
      if (frameNum >= nextKeyTime || frameNum < keyTime) {
        let ind = frameNum >= nextKeyTime ? bezierData.points.length - 1 : 0;
        const kLen = bezierData.points[ind].point.length;
        for (let k = 0; k < kLen; k += 1) {
          newValue[k] = bezierData.points[ind].point[k];
        }
        // caching.lastKeyframeIndex = -1;
      } else {
        const bezier = bez.getBezierEasing(keyData.o.x as number, keyData.o.y as number, keyData.i.x as number, keyData.i.y as number, keyData.n);
        perc = bezier((frameNum - keyTime) / (nextKeyTime - keyTime));
        let distanceInLine = bezierData.segmentLength * perc;

        let segmentPerc;
        let addedLength = (caching.lastFrame < frameNum && caching.lastKeyframeIndex === i) ? caching.lastAddedLength : 0;
        let j = (caching.lastFrame < frameNum && caching.lastKeyframeIndex === i) ? caching.lastPoint : 0;
        const jLen = bezierData.points.length;

        let flag: boolean = true;

        while (flag) {
          addedLength += bezierData.points[j].partialLength;
          if (distanceInLine === 0 || perc === 0 || j === bezierData.points.length - 1) {
            const kLen = bezierData.points[j].point.length;
            for (let k = 0; k < kLen; k += 1) {
              newValue[k] = bezierData.points[j].point[k];
            }
            break;
          } else if (distanceInLine >= addedLength && distanceInLine < addedLength + bezierData.points[j + 1].partialLength) {
            segmentPerc = (distanceInLine - addedLength) / bezierData.points[j + 1].partialLength;
            const kLen = bezierData.points[j].point.length;
            for (let k = 0; k < kLen; k += 1) {
              newValue[k] = bezierData.points[j].point[k] + (bezierData.points[j + 1].point[k] - bezierData.points[j].point[k]) * segmentPerc;
            }
            break;
          }
          if (j < jLen - 1) {
            j += 1;
          } else {
            flag = false;
          }
        }

        caching.lastPoint = j;
        caching.lastAddedLength = addedLength - bezierData.points[j].partialLength;
        caching.lastKeyframeIndex = i;
      }
    } else {
      keyData.beziers = [];

      for (let i = 0, len = keyData.s.length; i < len; i += 1) {
        newValue[i] = this.getValue(frameNum, i, keyData, nextKeyData);
      }
    }

    return newValue;
  }

  update(frameNum: number) {
    if (this.expression) {
      frameNum = this.expression.update(frameNum);
    }

    let finalValue: number[];

    this._caching.lastKeyframeIndex = -1;
    this._caching.lastIndex = 0;
    finalValue = this._interpolateValue(frameNum) as number[];
    this._caching.lastFrame = frameNum;

    for (let i = 0, len = this.v.length; i < len; i++) {
      this.v[i] = finalValue[i] * this.mult;
    }
  }
}
