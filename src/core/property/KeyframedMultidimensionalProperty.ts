
import bez from '../bezier';
import BaseProperty, { TypeKeyframe, TypeMultiDimensionalKeyframedProperty } from './BaseProperty';

type TypeCaching = {
  lastIndex: number;
  lastFrame: number;
  value: Float32Array;
  lastKeyframeIndex?: number;
  lastPoint?: number;
  lastAddedLength?: number;
}

/**
 * keyframed multidimensional value property
 */
export default class KeyframedMultidimensionalProperty extends BaseProperty {
  private _caching: TypeCaching;

  constructor(data: TypeMultiDimensionalKeyframedProperty, mult: number = 1) {
    super(data, mult);
    const len = data.k.length;

    this.newValue = new Float32Array(len);
    let arrLen = data.k[0].s.length;
    this.v = new Float32Array(arrLen);

    for (let i = 0; i < arrLen; i += 1) {
      this.v[i] = 0;
    }

    this._caching = { lastFrame: 0, lastIndex: 0, value: new Float32Array(arrLen) };
  }

  /**
   * interpolate value
   */
  private _interpolateValue(frameNum: number): number | number[] {
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
        const perc = bezier((frameNum - keyTime) / (nextKeyTime - keyTime));
        let distanceInLine = bezierData.segmentLength * perc;

        let segmentPerc: number;
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

    this._caching.lastKeyframeIndex = -1;
    this._caching.lastIndex = 0;
    this._caching.lastFrame = frameNum;

    const finalValue = this._interpolateValue(frameNum);

    for (let i = 0, len = this.v.length; i < len; i++) {
      this.v[i] = finalValue[i] * this.mult;
    }
  }
}
