import bez from "../bezier";
import Expression from "../Expression";

export type TypeValueProperty = {
  k: number;
  x?: Function;
  ix?: number;
  a: boolean;
};

type TypePoint = {
  partialLength: number;
  point: number[];
};

export type TypeKeyframe = {
  e: number[];
  s: number[];
  t: number;
  i?: { x: number; y: number };
  o?: { x: number; y: number };
  h?: number;
  ti?: number[];
  to?: number[];
  beziers?: BezierEasing.EasingFunction[];
  timeBezier?: BezierEasing.EasingFunction;
  bezierData?: { segmentLength: number; points: TypePoint[] };
  n?: string;
};

export type TypeValueKeyframedProperty = {
  k: TypeKeyframe[];
  x?: Function;
  ix?: number;
  a: boolean;
};

export type TypeMultiDimensionalProperty = {
  k: number[];
  x?: Function;
  ix?: number;
  a: boolean;
};

export type TypeMultiDimensionalKeyframedProperty = {
  k: TypeKeyframe[];
  x?: Function;
  ix?: number;
  a: boolean;
};
/**
 * basic property for animate property unit
 * @internal
 */
export default class BaseProperty {
  mult: number;
  v: any;

  value: any;
  newValue: any;
  expression: any;
  animated: boolean;

  constructor(
    data:
      | TypeValueProperty
      | TypeValueKeyframedProperty
      | TypeMultiDimensionalProperty
      | TypeMultiDimensionalKeyframedProperty,
    mult?: number
  ) {
    this.mult = mult || 1;
    this.value = data.k;
    this.animated = data.a;

    if (Expression.hasSupportExpression(data)) {
      this.expression = Expression.getExpression(data);
    }
  }

  getValue(frameNum: number, i: number, keyData: TypeKeyframe, nextKeyData: TypeKeyframe) {
    let perc: number;
    const keyTime = keyData.t;
    const nextKeyTime = nextKeyData.t;
    const startValue = keyData.s[i];
    const endValue = (nextKeyData.s || keyData.e)[i];

    if (keyData.h === 1) {
      return startValue;
    }

    if (frameNum >= nextKeyTime) {
      perc = 1;
    } else if (frameNum < keyTime) {
      perc = 0;
    } else {
      let bezier: BezierEasing.EasingFunction = keyData.beziers[i];

      if (!bezier) {
        bezier = bez.getBezierEasing(keyData.o.x[i], keyData.o.y[i], keyData.i.x[i], keyData.i.y[i]);
        keyData.beziers[i] = bezier;
      }

      perc = bezier((frameNum - keyTime) / (nextKeyTime - keyTime));
    }

    return startValue + (endValue - startValue) * perc;
  }

  protected reset() {}
}
