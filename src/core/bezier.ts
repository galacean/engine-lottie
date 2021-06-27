import BezierEasing from 'bezier-easing';

const defaultCurveSegments = 200;
const beziers = {};

/**
 * get a bezierEasing from real time or cache
 */
function getBezierEasing(a: number, b: number, c: number, d: number, nm?: string): BezierEasing.EasingFunction {
  const str = nm || ('bez_' + a + '_' + b + '_' + c + '_' + d).replace(/\./g, 'p');
  let bezier = beziers[str];

  if (bezier) {
    return bezier;
  }

  bezier = BezierEasing(a, b, c, d);
  beziers[str] = bezier;

  return bezier;
}

function BezierData(length) {
  this.segmentLength = 0;
  this.points = new Array(length);
}

function PointData(partial, point) {
  this.partialLength = partial;
  this.point = point;
}

const storedData = {};

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
  getBezierEasing
};