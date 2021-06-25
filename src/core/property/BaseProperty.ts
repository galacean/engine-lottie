import bez from '../bezier';
import { Quaternion, Vector3 } from 'oasis-engine';
import Expression from '../Expression';

type TypeCaching = {
  lastIndex: number;
  lastFrame: number;
  value: Float32Array | number;
  lastKeyframeIndex?: number;
  lastPoint?: number;
  lastAddedLength?: number;
}

type TypePropery = {
  k: number | Float32Array;
  x: string;
  a: boolean;
}

/**
 * basic property for animate property unit
 */
export default class BaseProperty {
  propType: String;
  _caching: TypeCaching;

  mult: number;
  v: any;
  kf: boolean = false;

  value: any;
  expression: any;
  animated: boolean;

  constructor(data: TypePropery, mult?: number) {
    this.mult = mult || 1;
    this.value = data.k;
    this.animated = data.a

    if (Expression.hasSupportExpression(data)) {
      this.expression = Expression.getExpression(data);
    }

  }

  /**
   * interpolate value
   */
  interpolateValue(frameNum: number) {
    const caching = this._caching;
    // const offsetTime = this.offsetTime;
    let newValue;

    if (this.propType === 'multidimensional') {
      newValue = new Float32Array(this.value.length);
    }

    let iterationIndex = caching.lastIndex;
    let i = iterationIndex;
    let len = this.value.length - 1;
    let flag = true;
    let keyData;
    let nextKeyData;

    // Find current frame
    while (flag) {
      keyData = this.value[i];
      nextKeyData = this.value[i + 1];
      if (i === len - 1 && frameNum >= nextKeyData.t) {
        if (keyData.h) {
          keyData = nextKeyData;
        }
        iterationIndex = 0;
        break;
      }
      if (nextKeyData.t > frameNum) {
        iterationIndex = i;
        break;
      }
      if (i < len - 1) {
        i += 1;
      } else {
        iterationIndex = 0;
        flag = false;
      }
    }

    let perc;
    let fnc;
    let nextKeyTime = nextKeyData.t;
    let keyTime = keyData.t;
    let endValue;

    if (keyData.to) {
      let k;
      let kLen;

      if (!keyData.bezierData) {
        keyData.bezierData = bez.buildBezierData(keyData.s, nextKeyData.s || keyData.e, keyData.to, keyData.ti);
      }
      let bezierData = keyData.bezierData;
      if (frameNum >= nextKeyTime || frameNum < keyTime) {
        let ind = frameNum >= nextKeyTime ? bezierData.points.length - 1 : 0;
        kLen = bezierData.points[ind].point.length;
        for (k = 0; k < kLen; k += 1) {
          newValue[k] = bezierData.points[ind].point[k];
        }
        // caching.lastKeyframeIndex = -1;
      } else {
        if (keyData.__fnct) {
          fnc = keyData.__fnct;
        } else {
          fnc = bez.getBezierEasing(keyData.o.x, keyData.o.y, keyData.i.x, keyData.i.y, keyData.n);
          keyData.__fnct = fnc;
        }
        perc = fnc((frameNum - keyTime) / (nextKeyTime - keyTime));
        let distanceInLine = bezierData.segmentLength * perc;

        let segmentPerc;
        let addedLength = (caching.lastFrame < frameNum && caching.lastKeyframeIndex === i) ? caching.lastAddedLength : 0;
        let j = (caching.lastFrame < frameNum && caching.lastKeyframeIndex === i) ? caching.lastPoint : 0;
        flag = true;
        const jLen = bezierData.points.length;
        while (flag) {
          addedLength += bezierData.points[j].partialLength;
          if (distanceInLine === 0 || perc === 0 || j === bezierData.points.length - 1) {
            kLen = bezierData.points[j].point.length;
            for (k = 0; k < kLen; k += 1) {
              newValue[k] = bezierData.points[j].point[k];
            }
            break;
          } else if (distanceInLine >= addedLength && distanceInLine < addedLength + bezierData.points[j + 1].partialLength) {
            segmentPerc = (distanceInLine - addedLength) / bezierData.points[j + 1].partialLength;
            kLen = bezierData.points[j].point.length;
            for (k = 0; k < kLen; k += 1) {
              newValue[k] = bezierData.points[j].point[k] + (bezierData.points[j + 1].point[k] - bezierData.points[j].point[k]) * segmentPerc;
            }
            break;
          }
          if (j < jLen - 1) {
            j += 1;
          } else {
            flag = false;
          }
        }
        caching.lastPoint = j;
        caching.lastAddedLength = addedLength - bezierData.points[j].partialLength;
        caching.lastKeyframeIndex = i;
      }
    } else {
      endValue = nextKeyData.s || keyData.e;
      if (keyData.sh && keyData.h !== 1) {
        if (frameNum >= nextKeyTime) {
          newValue[0] = endValue[0];
          newValue[1] = endValue[1];
          newValue[2] = endValue[2];
        } else if (frameNum <= keyTime) {
          newValue[0] = keyData.s[0];
          newValue[1] = keyData.s[1];
          newValue[2] = keyData.s[2];
        } else {
          const { s } = keyData;
          let quatStart = new Quaternion(s[0], s[1], s[2], 1);
          let quatEnd = new Quaternion(endValue[0], endValue[1], endValue[2], 1);
          let out = new Quaternion();
          let time = (frameNum - keyTime) / (nextKeyTime - keyTime);
          Quaternion.slerp(quatStart, quatEnd, time, out);
          const euler = new Vector3();
          out.toEuler(euler);
          newValue[0] = euler.x;
          newValue[1] = euler.y;
          newValue[2] = euler.z;
        }
      } else {

        for (let i = 0, len = keyData.s.length; i < len; i += 1) {
          if (keyData.h !== 1) {
            if (frameNum >= nextKeyTime) {
              perc = 1;
            } else if (frameNum < keyTime) {
              perc = 0;
            } else {
              let outX;
              let outY;
              let inX;
              let inY;
              if (keyData.o.x.constructor === Array) {
                if (!keyData.__fnct) {
                  keyData.__fnct = [];
                }
                if (!keyData.__fnct[i]) {
                  outX = (typeof keyData.o.x[i] === 'undefined') ? keyData.o.x[0] : keyData.o.x[i];
                  outY = (typeof keyData.o.y[i] === 'undefined') ? keyData.o.y[0] : keyData.o.y[i];
                  inX = (typeof keyData.i.x[i] === 'undefined') ? keyData.i.x[0] : keyData.i.x[i];
                  inY = (typeof keyData.i.y[i] === 'undefined') ? keyData.i.y[0] : keyData.i.y[i];
                  fnc = bez.getBezierEasing(outX, outY, inX, inY);
                  keyData.__fnct[i] = fnc;
                } else {
                  fnc = keyData.__fnct[i];
                }
              } else {
                if (!keyData.__fnct) {
                  outX = keyData.o.x;
                  outY = keyData.o.y;
                  inX = keyData.i.x;
                  inY = keyData.i.y;
                  fnc = bez.getBezierEasing(outX, outY, inX, inY);
                  keyData.__fnct = fnc;
                } else {
                  fnc = keyData.__fnct;
                }
              }
              perc = fnc((frameNum - keyTime) / (nextKeyTime - keyTime));
            }
          }

          endValue = nextKeyData.s || keyData.e;
          const keyValue = keyData.h === 1 ? keyData.s[i] : keyData.s[i] + (endValue[i] - keyData.s[i]) * perc;

          if (this.propType === 'multidimensional') {
            newValue[i] = keyValue;
          } else {
            newValue = keyValue;
          }
        }
      }
    }
    caching.lastIndex = iterationIndex;
    return newValue;
  }

  update(frameNum: number) {
    if (this.expression) {
      frameNum = this.expression.update(frameNum);
    }

    let finalValue;

    if (this.kf) {
      this._caching.lastKeyframeIndex = -1;
      this._caching.lastIndex = 0;
      finalValue = this.interpolateValue(frameNum);
      this._caching.lastFrame = frameNum;
    }
    else {
      finalValue = this.value;
    }

    if (this.propType === 'unidimensional') {
      this.v = finalValue * this.mult;
    } else {
      for (let i = 0, len = this.v.length; i < len; i++) {
        this.v[i] = finalValue[i] * this.mult;
      }
    }
  }
}