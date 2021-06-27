import Expression from '../Expression';
import BaseProperty, { TypeKeyframe, TypeValueKeyframedProperty } from './BaseProperty';

type TypeCaching = {
  lastIndex: number;
  lastFrame: number;
  value: number;
  lastKeyframeIndex: number;
}

/**
 * keyframed unidimensional value property
 */
export default class KeyframedValueProperty extends BaseProperty {
  private _caching: TypeCaching;

  constructor(data: TypeValueKeyframedProperty, mult: number = 1) {
    super(data, mult);
    this._caching = { lastFrame: 0, lastIndex: 0, value: 0, lastKeyframeIndex: -1 };
    this.v = 0;

    if (Expression.hasSupportExpression(data)) {
      this.expression = Expression.getExpression(data);
    }
  }

  /**
   * interpolate value
   */
  private _interpolateValue(frameNum: number): number {
    const caching = this._caching;
    let { lastIndex } = caching;
    const { value } = this;

    let keyData: TypeKeyframe = value[lastIndex];
    let nextKeyData: TypeKeyframe = value[lastIndex + 1];

    // Find current frame
    for (let i = lastIndex, l = value.length - 1; i < l; i++) {
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
    keyData.beziers = [];

    return this.getValue(frameNum, 0, keyData, nextKeyData);
  }

  update(frameNum: number) {
    if (this.expression) {
      frameNum = this.expression.update(frameNum);
    }

    this._caching.lastKeyframeIndex = -1;
    this._caching.lastIndex = 0;
    this._caching.lastFrame = frameNum;

    this.v = this._interpolateValue(frameNum) * this.mult;
  }
}
