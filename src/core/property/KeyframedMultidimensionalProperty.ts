
import bez from '../bezier';
import BaseProperty, { TypeKeyframe, TypeMultiDimensionalKeyframedProperty } from './BaseProperty';

type TypeCaching = {
  lastIndex: number;
  value: Float32Array;
  lastPoint?: number;
  addedLength?: number;
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

    this._caching = { value: new Float32Array(arrLen), lastPoint: 0, addedLength: 0, lastIndex: 0 };
  }

  update(frameNum: number) {
    if (this.expression) {
      frameNum = this.expression.update(frameNum);
    }

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

      // Time bezier easing
      const bezier = bez.getBezierEasing(keyData.o.x, keyData.o.y, keyData.i.x, keyData.i.y, keyData.n);
      const percent: number = bezier((frameNum - keyTime) / (nextKeyTime - keyTime));

      let distanceInLine: number = segmentLength * percent;

      let { addedLength, lastPoint } = caching;

      if (percent === 0 || lastPoint === points.length - 1) {
        newValue = points[lastPoint].point;
      }
      else {
        for (let i = lastPoint, l = points.length; i < l; i++) {
          if (distanceInLine >= addedLength && distanceInLine < addedLength + points[i + 1].partialLength) {
            const point = points[lastPoint];
            const nextPoint = points[lastPoint+ 1];

            const segmentPerc: number = (distanceInLine - addedLength) / nextPoint.partialLength;

            for (let k = 0, l = point.point.length; k < l; k += 1) {
              newValue[k] = point.point[k] + (nextPoint.point[k] - point.point[k]) * segmentPerc;
            }

            lastPoint = i;

            break;
          }

          // Add partial length util the distanceInLine is between two points.
          addedLength += points[i].partialLength;
        }
      }

      caching.lastPoint = lastPoint;
      caching.addedLength = addedLength;
    } else {
      keyData.beziers = [];

      for (let i = 0, len = keyData.s.length; i < len; i += 1) {
        newValue[i] = this.getValue(frameNum, i, keyData, nextKeyData);
      }
    }

    for (let i = 0, len = this.v.length; i < len; i++) {
      this.v[i] = newValue[i] * this.mult;
    }
  }
}
