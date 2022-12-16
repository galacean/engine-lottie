import ValueProperty from "./property/ValueProperty";
import MultiDimensionalProperty from "./property/MultiDimensionalProperty";
import KeyframedValueProperty from "./property/KeyframedValueProperty";
import KeyframedMultidimensionalProperty from "./property/KeyframedMultidimensionalProperty";
import { TypeMultiDimensionalKeyframedProperty, TypeValueKeyframedProperty } from "./property/BaseProperty";

type KeyFrames = {
  a: TypeMultiDimensionalKeyframedProperty;
  p: TypeMultiDimensionalKeyframedProperty;
  s: TypeMultiDimensionalKeyframedProperty;
  or?: TypeMultiDimensionalKeyframedProperty;
  o: TypeValueKeyframedProperty;
  r: TypeValueKeyframedProperty;
  rx?: TypeValueKeyframedProperty;
  ry?: TypeValueKeyframedProperty;
  rz?: TypeValueKeyframedProperty;
};

/**
 * transform property origin from tr or ks
 */
export default class TransformFrames {
  p: ValueProperty | MultiDimensionalProperty | KeyframedValueProperty | KeyframedMultidimensionalProperty;
  x: ValueProperty | MultiDimensionalProperty | KeyframedValueProperty | KeyframedMultidimensionalProperty;
  y: ValueProperty | MultiDimensionalProperty | KeyframedValueProperty | KeyframedMultidimensionalProperty;
  z: ValueProperty | MultiDimensionalProperty | KeyframedValueProperty | KeyframedMultidimensionalProperty;
  a: ValueProperty | MultiDimensionalProperty | KeyframedValueProperty | KeyframedMultidimensionalProperty;
  s: ValueProperty | MultiDimensionalProperty | KeyframedValueProperty | KeyframedMultidimensionalProperty;
  or: ValueProperty | MultiDimensionalProperty | KeyframedValueProperty | KeyframedMultidimensionalProperty;
  r: ValueProperty | MultiDimensionalProperty | KeyframedValueProperty | KeyframedMultidimensionalProperty;
  o: ValueProperty | MultiDimensionalProperty | KeyframedValueProperty | KeyframedMultidimensionalProperty;
  rx: ValueProperty | MultiDimensionalProperty | KeyframedValueProperty | KeyframedMultidimensionalProperty;
  ry: ValueProperty | MultiDimensionalProperty | KeyframedValueProperty | KeyframedMultidimensionalProperty;
  rz: ValueProperty | MultiDimensionalProperty | KeyframedValueProperty | KeyframedMultidimensionalProperty;
  private properties = [];
  private autoOrient: boolean = false;

  static create(
    data,
    type = 0,
    mult = 1
  ): ValueProperty | MultiDimensionalProperty | KeyframedValueProperty | KeyframedMultidimensionalProperty {
    if (!data.k.length) {
      return new ValueProperty(data, mult);
    } else if (typeof data.k[0] === "number") {
      return new MultiDimensionalProperty(data, mult);
    } else {
      if (type) {
        return new KeyframedMultidimensionalProperty(data, mult, data.k[data.k.length - 1].t - data.k[0].t);
      } else {
        return new KeyframedValueProperty(data, mult);
      }
    }
  }

  constructor(data: KeyFrames) {
    const { create } = TransformFrames;

    if (data.p.k) {
      this.p = create(data.p, 1);
      this.properties.push(this.p);
    } else {
      if (data.p.x) {
        this.x = create(data.p.x, 1);
        this.properties.push(this.x);
      }

      // @ts-ignore
      if (data.p.y) {
        // @ts-ignore
        this.y = create(data.p.y, 1);
        this.properties.push(this.y);
      }

      // @ts-ignore
      if (data.p.z) {
        // @ts-ignore
        this.z = create(data.p.z, 1);
        this.properties.push(this.z);
      }
    }

    this.a = create(data.a, 1);
    this.properties.push(this.a);

    this.s = create(data.s, 1, 0.01);
    this.properties.push(this.s);

    this.o = create(data.o, 0, 0.01);
    this.properties.push(this.o);

    // 2d rotation
    if (data.r) {
      this.r = create(data.r, 0);
      this.properties.push(this.r);
    }
    // 3d rotation
    else if (data.rx || data.ry || data.rz) {
      if (data.rx) {
        this.rx = create(data.rx, 0);
        this.properties.push(this.rx);
      }
      if (data.ry) {
        this.ry = create(data.ry, 0);
        this.properties.push(this.ry);
      }
      if (data.rz) {
        this.rz = create(data.rz, 0);
        this.properties.push(this.rz);
      }
    } else if (data.or) {
      this.or = create(data.or, 1);
      this.properties.push(this.or);
    }

    if (!this.properties.length) {
      this.update();
    }
  }

  reset() {
    for (let i = 0, len = this.properties.length; i < len; i++) {
      this.properties[i].reset();
    }
  }

  update(frameNum: number = 0) {
    const len = this.properties.length;

    for (let i = 0; i < len; i++) {
      this.properties[i].update(frameNum);
    }

    if (this.autoOrient) {
      // TODO
    }
  }
}
