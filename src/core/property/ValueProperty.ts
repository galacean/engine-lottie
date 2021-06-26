import BaseProperty from './BaseProperty';
import { TypeValueProperty } from './BaseProperty';

/**
 * unidimensional value property
 * @internal
 */
export default class ValueProperty extends BaseProperty {
  constructor(data: TypeValueProperty, mult: number) {
    super(data, mult);
    this.isMultidimensional = false;
    this.v = mult ? data.k * mult : data.k;
  }

  update () {
    this.v = this.value * this.mult;
  }
}