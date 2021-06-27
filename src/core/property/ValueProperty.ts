import BaseProperty from './BaseProperty';
import { TypeValueProperty } from './BaseProperty';

/**
 * unidimensional value property
 * @internal
 */
export default class ValueProperty extends BaseProperty {
  constructor(data: TypeValueProperty, mult: number = 1) {
    super(data, mult);
    this.v = mult ? data.k * mult : data.k;
  }

  update() {
    this.v = this.value * this.mult;
  }
}