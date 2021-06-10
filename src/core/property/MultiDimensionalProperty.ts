import BaseProperty from './BaseProperty';

/**
 * multidimensional value property
 */
export default class MultiDimensionalProperty extends BaseProperty {
  constructor(data, mult) {
    super(data, mult);
    this.propType = 'multidimensional';
    const len = data.k.length;
    this.v = new Float32Array(len);
    for (let i = 0; i < len; i += 1) {
      this.v[i] = data.k[i] * this.mult;
    }
  }
}