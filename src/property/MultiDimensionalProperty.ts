import BaseProperty, { TypeMultiDimensionalProperty } from './BaseProperty';

/**
 * multidimensional value property
 */
export default class MultiDimensionalProperty extends BaseProperty {
  constructor(data: TypeMultiDimensionalProperty, mult = 1) {
    super(data, mult);
    const len = this.value.length;
    this.v = new Float32Array(len);
    this.newValue = new Float32Array(len);

    for (let i = 0; i < len; i += 1) {
      this.v[i] = this.value[i] * this.mult;
    }
  }

  update() {
    let finalValue: number[];

    finalValue = this.value;

    for (let i = 0, len = this.v.length; i < len; i++) {
      this.v[i] = finalValue[i] * this.mult;
    }
  }
}