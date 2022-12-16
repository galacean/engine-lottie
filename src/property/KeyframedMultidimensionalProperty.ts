
import bez from '../bezier';
import BaseProperty, { TypeKeyframe, TypeMultiDimensionalKeyframedProperty } from './BaseProperty';

/**
 * keyframed multidimensional value property
 */
export default class KeyframedMultidimensionalProperty extends BaseProperty {
  private _lastPoint: number = 0;
  private _addedLength: number = 0;
  private _frames: number;

  constructor(data: TypeMultiDimensionalKeyframedProperty, mult: number = 1, frames?: number) {
    super(data, mult);

    let arrLen = this.value[0].s.length;

    // Set bezier segments according to frames, which is better for performance.
    if (frames) {
      this._frames = frames >> 0;
    }

    this.newValue = new Float32Array(arrLen);
    this.v = new Float32Array(arrLen);
  }

  update(frameNum: number) {
    if (this.expression) {
      frameNum = this.expression.update(frameNum);
    }

    const { value } = this;
    let { newValue } = this;

    let keyData: TypeKeyframe;
    let nextKeyData: TypeKeyframe;

    // Find current frame
    for (let i = 0, l = value.length - 1; i < l; i++) {
      keyData = value[i];
      nextKeyData = value[i + 1];

      if (nextKeyData.t > frameNum) {
        this._lastPoint = 0;
        this._addedLength = 0;
        break;
      }
    }

    if (keyData.to) {
      let nextKeyTime: number = nextKeyData.t;
      let keyTime: number = keyData.t;

      if (!keyData.bezierData) {
        keyData.bezierData = bez.buildBezierData(keyData.s, nextKeyData.s || keyData.e, keyData.to, keyData.ti, this._frames);
      }

      const { points, segmentLength } = keyData.bezierData;

      let bezier = keyData.timeBezier;

      // Cache time bezier easing
      if (!bezier) {
        bezier = bez.getBezierEasing(keyData.o.x, keyData.o.y, keyData.i.x, keyData.i.y, keyData.n);
        keyData.timeBezier = bezier;
      }

      let t = 0;

      if (nextKeyTime >= 0) {
        t = (frameNum - keyTime) / (nextKeyTime - keyTime);
        t = Math.min(Math.max(0, t), 1);
      }

      const percent: number = bezier(t);

      let distanceInLine: number = segmentLength * percent;

      let addedLength = this._addedLength;
      let lastPoint = this._lastPoint;

      for (let i = lastPoint, l = points.length; i < l; i++) {
        if (i === l - 1) {
          lastPoint = 0;
          addedLength = 0;

          break;
        }

        lastPoint = i;

        const point = points[i];
        const nextPoint = points[i + 1];
        const { partialLength } = nextPoint;

        if (distanceInLine >= addedLength && distanceInLine < addedLength + partialLength) {
          const segmentPercent: number = (distanceInLine - addedLength) / partialLength;

          for (let k = 0, l = point.point.length; k < l; k += 1) {
            newValue[k] = point.point[k] + (nextPoint.point[k] - point.point[k]) * segmentPercent;
          }

          break;
        }

        // Add partial length util the distanceInLine is between two points.
        addedLength += partialLength;
      }

      this._lastPoint = lastPoint;
      this._addedLength = addedLength;
    } else {
      if (!keyData.beziers) {
        keyData.beziers = [];
      }

      for (let i = 0, len = keyData.s.length; i < len; i++) {
        newValue[i] = this.getValue(frameNum, i, keyData, nextKeyData);
      }
    }

    for (let i = 0, len = this.v.length; i < len; i++) {
      this.v[i] = newValue[i] * this.mult;
    }
  }
}
