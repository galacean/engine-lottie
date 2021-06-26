import { initialDefaultFrame as initFrame } from '../contant';
import Expression from '../Expression';
import BaseProperty, { TypeKeyframe, TypeValueKeyframedProperty } from './BaseProperty';

/**
 * keyframed unidimensional value property
 */
export default class KeyframedValueProperty extends BaseProperty {
  constructor(data: TypeValueKeyframedProperty, mult) {
    super(data, mult);
    this._caching = { lastFrame: initFrame, lastIndex: 0, value: 0, lastKeyframeIndex: -1 };
    this.keyframed = true;
    this.v = initFrame * this.mult;

    if (Expression.hasSupportExpression(data)) {
      this.expression = Expression.getExpression(data);
    }
  }

  /**
   * interpolate value
   * @interal
   */
  _interpolateValue(frameNum: number): number {
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
    let finalValue: number;

    if (this.expression) {
      frameNum = this.expression.update(frameNum);
    }

    this._caching.lastKeyframeIndex = -1;
    this._caching.lastIndex = 0;
    finalValue = this._interpolateValue(frameNum) as number;
    this._caching.lastFrame = frameNum;

    this.v = finalValue * this.mult;
  }
}
