import { degToRads, initialDefaultFrame } from './contant';
import BaseLottieLayer from './layer/BaseLottieLayer';
import ValueProperty from './property/ValueProperty';
import MultiDimensionalProperty from './property/MultiDimensionalProperty';
import KeyframedValueProperty from './property/KeyframedValueProperty';
import KeyframedMultidimensionalProperty from './property/KeyframedMultidimensionalProperty';

type TypeMultiDimensionalProperty = {
  a: number;
  k: number[];
}

type TypeValueProperty = {
  a: number;
  k: number;
}

type KeyFrames = {
  a: TypeMultiDimensionalProperty;
  o: TypeValueProperty;
  p: TypeMultiDimensionalProperty;
  r: TypeValueProperty;
  s: TypeMultiDimensionalProperty;
}

/**
 * transform property origin from tr or ks
 */
export default class TransformFrames {
  p: KeyframedMultidimensionalProperty;
  r: KeyframedValueProperty;
  a: KeyframedMultidimensionalProperty;
  s: KeyframedMultidimensionalProperty;
  o: KeyframedValueProperty;
  private properties = [];
  private autoOrient: boolean = false;

  static create(data, type, mult?): ValueProperty | MultiDimensionalProperty | KeyframedValueProperty | KeyframedMultidimensionalProperty {
    if (!data.k.length) {
      return new ValueProperty(data, mult);
    }
    else if (typeof (data.k[0]) === 'number') {
      return new MultiDimensionalProperty(data, mult);
    }
    else {
      if (type) {
        return new KeyframedMultidimensionalProperty(data, mult);
      }
      else {
        return new KeyframedValueProperty(data, mult);
      }
    }
  }

  constructor(data: KeyFrames) {
    const { create } = TransformFrames;

    this.p = create(data.p || { k: [0, 0, 0] }, 1);
    this.properties.push(this.p);

    this.r = create(data.r || { k: 0 }, 0, degToRads);
    this.properties.push(this.r);

    this.a = create(data.a || { k: [0, 0, 0] }, 1);
    this.properties.push(this.a);

    this.s = create(data.s || { k: [100, 100, 100] }, 1, 0.01);
    this.properties.push(this.s);

    this.o = create(data.o, 0, 0.01);
    this.properties.push(this.o);

    if (!this.properties.length) {
      this.update(initialDefaultFrame);
    }
  }

  update(frameNum: number) {
    const len = this.properties.length;

    for (let i = 0; i < len; i += 1) {
      this.properties[i].update(frameNum);
    }

    if (this.autoOrient) {
      // TODO
    }
  }
}
