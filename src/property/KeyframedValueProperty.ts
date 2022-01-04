import Expression from '../Expression';
import BaseProperty, { TypeKeyframe, TypeValueKeyframedProperty } from './BaseProperty';

/**
 * keyframed unidimensional value property
 */
export default class KeyframedValueProperty extends BaseProperty {
  private _lastIndex: number = 0;
  private _value: number = 0;

  constructor(data: TypeValueKeyframedProperty, mult: number = 1) {
    super(data, mult);
    this.v = 0;

    if (Expression.hasSupportExpression(data)) {
      this.expression = Expression.getExpression(data);
    }
  }

  reset () {
    this._lastIndex = 0;
    this._value = 0;
  }

  update(frameNum: number) {
    if (this.expression) {
      frameNum = this.expression.update(frameNum);
    }

    let lastIndex = this._lastIndex;
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

    this._lastIndex = lastIndex;

    if (!keyData.beziers) {
      keyData.beziers = [];
    }

    this.v = this.getValue(frameNum, 0, keyData, nextKeyData) * this.mult;
  }
}
