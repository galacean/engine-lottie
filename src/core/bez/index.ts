import BezierEasing from './BezierEasing';

const defaultCurveSegments = 200;
const beziers = {};

/**
 * get a bezierEasing from real time or cache
 * @private
 * @param {*} a in control point x component
 * @param {*} b in control point y component
 * @param {*} c out control point x component
 * @param {*} d out control point y component
 * @param {*} [nm] curver name
 * @return {BezierEasing}
 */
function getBezierEasing(a, b, c, d, nm) {
  const str = nm || ('bez_' + a+'_'+b+'_'+c+'_'+d).replace(/\./g, 'p');
  if (beziers[str]) {
    return beziers[str];
  }
  const bezEasing = new BezierEasing(a, b, c, d);
  beziers[str] = bezEasing;
  return bezEasing;
}

/**
 * a
 * @private
 * @param {*} x1 a
 * @param {*} y1 a
 * @param {*} x2 a
 * @param {*} y2 a
 * @param {*} x3 a
 * @param {*} y3 a
 * @return {*}
 */
function pointOnLine2D(x1, y1, x2, y2, x3, y3) {
  const det1 = (x1 * y2) + (y1 * x3) + (x2 * y3) - (x3 * y2) - (y3 * x1) - (x2 * y1);
  return det1 > -0.001 && det1 < 0.001;
}

/**
 * a
 * @private
 * @param {*} x1 a
 * @param {*} y1 a
 * @param {*} z1 a
 * @param {*} x2 a
 * @param {*} y2 a
 * @param {*} z2 a
 * @param {*} x3 a
 * @param {*} y3 a
 * @param {*} z3 a
 * @return {*}
 */
function pointOnLine3D(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
  if (z1 === 0 && z2 === 0 && z3 === 0) {
    return pointOnLine2D(x1, y1, x2, y2, x3, y3);
  }
  const dist1 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
  const dist2 = Math.sqrt(Math.pow(x3 - x1, 2) + Math.pow(y3 - y1, 2) + Math.pow(z3 - z1, 2));
  const dist3 = Math.sqrt(Math.pow(x3 - x2, 2) + Math.pow(y3 - y2, 2) + Math.pow(z3 - z2, 2));
  let diffDist;
  if (dist1 > dist2) {
    if (dist1 > dist3) {
      diffDist = dist1 - dist2 - dist3;
    } else {
      diffDist = dist3 - dist2 - dist1;
    }
  } else if (dist3 > dist2) {
    diffDist = dist3 - dist2 - dist1;
  } else {
    diffDist = dist2 - dist1 - dist3;
  }
  return diffDist > -0.0001 && diffDist < 0.0001;
}

/**
 * a
 * @private
 * @param {*} length a
 */
function BezierData(length) {
  this.segmentLength = 0;
  this.points = new Array(length);
}

/**
 * a
 * @private
 * @param {*} partial a
 * @param {*} point a
 */
function PointData(partial, point) {
  this.partialLength = partial;
  this.point = point;
}

const storedData = {};
/**
 * a
 * @private
 * @param {*} pt1 a
 * @param {*} pt2 a
 * @param {*} pt3 a
 * @param {*} pt4 a
 * @return {*}
 */
function buildBezierData(pt1, pt2, pt3, pt4) {
  const bezierName = (pt1[0] + '_' + pt1[1] + '_' + pt2[0] + '_' + pt2[1] + '_' + pt3[0] + '_' + pt3[1] + '_' + pt4[0] + '_' + pt4[1]).replace(/\./g, 'p');
  if (!storedData[bezierName]) {
    let curveSegments = defaultCurveSegments;
    // var k, i, len;
    let addedLength = 0;
    let ptDistance;
    let point;
    let lastPoint = null;
    if (pt1.length === 2 && (pt1[0] != pt2[0] || pt1[1] != pt2[1]) && pointOnLine2D(pt1[0], pt1[1], pt2[0], pt2[1], pt1[0] + pt3[0], pt1[1] + pt3[1]) && pointOnLine2D(pt1[0], pt1[1], pt2[0], pt2[1], pt2[0] + pt4[0], pt2[1] + pt4[1])) {
      curveSegments = 2;
    }
    const bezierData = new BezierData(curveSegments);
    const len = pt3.length;
    for (let k = 0; k < curveSegments; k += 1) {
      point = new Array(len);
      const perc = k / (curveSegments - 1);
      ptDistance = 0;
      for (let i = 0; i < len; i += 1) {
        const ptCoord = Math.pow(1 - perc, 3) * pt1[i] + 3 * Math.pow(1 - perc, 2) * perc * (pt1[i] + pt3[i]) + 3 * (1 - perc) * Math.pow(perc, 2) * (pt2[i] + pt4[i]) + Math.pow(perc, 3) * pt2[i];
        point[i] = ptCoord;
        if (lastPoint !== null) {
          ptDistance += Math.pow(point[i] - lastPoint[i], 2);
        }
      }
      ptDistance = Math.sqrt(ptDistance);
      addedLength += ptDistance;
      bezierData.points[k] = new PointData(ptDistance, point);
      lastPoint = point;
    }
    bezierData.segmentLength = addedLength;
    storedData[bezierName] = bezierData;
  }
  return storedData[bezierName];
}

export default {
  buildBezierData,
  pointOnLine2D,
  pointOnLine3D,
  getBezierEasing 
};
