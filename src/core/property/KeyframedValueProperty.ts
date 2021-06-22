import { initialDefaultFrame as initFrame } from '../contant';
import Expression from '../Expression';
import BaseProperty from './BaseProperty';

/**
 * keyframed unidimensional value property
 */
export default class KeyframedValueProperty extends BaseProperty {
  constructor(data, mult) {
    super(data, mult);
    this.propType = 'unidimensional';
    this._caching = { lastFrame: initFrame, lastIndex: 0, value: 0, lastKeyframeIndex: -1 };
    this.kf = true;
    this.v = initFrame * this.mult;

    if (Expression.hasSupportExpression(data)) {
      this.expression = Expression.getExpression(data);
    }
  }
}
