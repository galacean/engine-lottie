import Expression from '../Expression';
import BaseProperty, { TypeKeyframe, TypeValueKeyframedProperty } from './BaseProperty';

type TypeCaching = {
  lastIndex: number;
  value: number;
}

/**
 * keyframed unidimensional value property
 */
export default class KeyframedValueProperty extends BaseProperty {
  private _caching: TypeCaching;

  constructor(data: TypeValueKeyframedProperty, mult: number = 1) {
    super(data, mult);
    this._caching = { lastIndex: 0, value: 0 };
    this.v = 0;

    if (Expression.hasSupportExpression(data)) {
      this.expression = Expression.getExpression(data);
    }
  }

  update(frameNum: number) {
    if (this.expression) {
      frameNum = this.expression.update(frameNum);
    }

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

    this.v = this.getValue(frameNum, 0, keyData, nextKeyData) * this.mult;
  }
}
