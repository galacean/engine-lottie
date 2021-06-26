import { degToRads, initialDefaultFrame } from './contant';
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
  rx?: TypeValueProperty;
  ry?: TypeValueProperty;
  rz?: TypeValueProperty;
  or?: TypeMultiDimensionalProperty
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
  or: KeyframedMultidimensionalProperty;
  rx: KeyframedValueProperty;
  ry: KeyframedValueProperty;
  rz: KeyframedValueProperty;
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
    console.log(data)
    const { create } = TransformFrames;

    this.p = create(data.p, 1);
    this.properties.push(this.p);

    this.a = create(data.a, 1);
    this.properties.push(this.a);

    this.s = create(data.s, 1, 0.01);
    this.properties.push(this.s);

    this.o = create(data.o, 0, 0.01);
    this.properties.push(this.o);

    // 2d rotation
    if (data.r) {
      this.r = create(data.r, 1, degToRads);
      this.properties.push(this.r);
    }
    // 3d rotation
    else if(data.rx || data.ry || data.rz) {
      if (data.rx) {
        this.rx = create(data.rx, 0, degToRads);
        this.properties.push(this.rx);
      }
      if (data.ry) {
        this.ry = create(data.ry, 0, degToRads);
        this.properties.push(this.ry);
      }
      if (data.rz) {
        this.rz = create(data.rz, 0, degToRads);
        this.properties.push(this.rz);
      }
    } else if (data.or){
      this.or = create(data.or, 1, degToRads);
      this.properties.push(this.or);
    }

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
