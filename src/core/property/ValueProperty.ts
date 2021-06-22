import BaseProperty from './BaseProperty';

/**
 * unidimensional value property
 * @private
 */
export default class ValueProperty extends BaseProperty {
  constructor(data, mult) {
    super(data, mult);
    this.propType = 'unidimensional';
    this.v = mult ? data.k * mult : data.k;
  }
}