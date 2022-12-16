import Expression from '../Expression';
import BaseProperty, { TypeKeyframe, TypeValueKeyframedProperty } from './BaseProperty';

/**
 * keyframed unidimensional value property
 */
export default class KeyframedValueProperty extends BaseProperty {
  private _value: number = 0;

  constructor(data: TypeValueKeyframedProperty, mult: number = 1) {
    super(data, mult);
    this.v = 0;

    if (Expression.hasSupportExpression(data)) {
      this.expression = Expression.getExpression(data);
    }
  }

  reset () {
    this._value = 0;
  }

  update(frameNum: number) {
    if (this.expression) {
      frameNum = this.expression.update(frameNum);
    }

    const { value } = this;

    let keyData: TypeKeyframe;
    let nextKeyData: TypeKeyframe;

    // Find current frame
    for (let i = 0, l = value.length - 1; i < l; i++) {
      keyData = value[i];
      nextKeyData = value[i + 1];
      if (nextKeyData.t > frameNum) {
        break;
      }
    }

    if (!keyData.beziers) {
      keyData.beziers = [];
    }

    this.v = this.getValue(frameNum, 0, keyData, nextKeyData) * this.mult;
  }
}
