
import bez from '../bezier';
import BaseProperty, { TypeKeyframe, TypeMultiDimensionalKeyframedProperty } from './BaseProperty';

type TypeCaching = {
  lastIndex: number;
  value: Float32Array;
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

    let arrLen = this.value[0].s.length;
    this.newValue = new Float32Array(arrLen);
    this.v = new Float32Array(arrLen);

    for (let i = 0; i < arrLen; i += 1) {
      this.v[i] = 0;
    }

    this._caching = { value: new Float32Array(arrLen), lastPoint: 0, lastAddedLength: 0, lastIndex: 0 };
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

      const { points, segmentLength } = keyData.bezierData;

      const bezier = bez.getBezierEasing(keyData.o.x, keyData.o.y, keyData.i.x, keyData.i.y, keyData.n);
      const perc: number = bezier((frameNum - keyTime) / (nextKeyTime - keyTime));
      let distanceInLine: number = segmentLength * perc;

      let addedLength: number = caching.lastAddedLength;
      let j: number = caching.lastPoint;

      if (distanceInLine === 0 || perc === 0 || j === points.length - 1) {
        newValue = points[j].point;
      }
      else {
        const point = points[j];
        const nextPoint = points[j + 1];

        const segmentPerc: number = (distanceInLine - addedLength) / nextPoint.partialLength;

        for (let k = 0, l = point.point.length; k < l; k += 1) {
          newValue[k] = point.point[k] + (nextPoint.point[k] - point.point[k]) * segmentPerc;
        }

      }

      caching.lastPoint = j;
      caching.lastAddedLength = addedLength - points[j].partialLength;
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

    const finalValue = this._interpolateValue(frameNum);

    for (let i = 0, len = this.v.length; i < len; i++) {
      this.v[i] = finalValue[i] * this.mult;
    }
  }
}
