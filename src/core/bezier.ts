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

const storedData = {};

function buildBezierData(s: number[], e: number[], to: number[], ti: number[]) {
  const bezierName = (s[0] + '_' + s[1] + '_' + e[0] + '_' + e[1] + '_' + to[0] + '_' + to[1] + '_' + ti[0] + '_' + ti[1]).replace(/\./g, 'p');

  if (!storedData[bezierName]) {
    let curveSegments: number = defaultCurveSegments;
    let segmentLength: number = 0;
    let lastPoint: number[];
    let points = [];

    // console.log('s:', s, 'e:', e, 'to:', to, 'ti:', ti)

    for (let k = 0; k < curveSegments; k++) {
      const len = to.length;
      const point: number[] = new Array(len);
      const perc: number = k / (curveSegments - 1);
      let ptDistance: number = 0;

      for (let i = 0; i < len; i += 1) {
        const ptCoord = Math.pow(1 - perc, 3) * s[i] +
          3 * Math.pow(1 - perc, 2) * perc * (s[i] + to[i]) +
          3 * (1 - perc) * Math.pow(perc, 2) * (e[i] + ti[i]) +
          Math.pow(perc, 3) * e[i];

        point[i] = ptCoord;

        if (lastPoint) {
          ptDistance += Math.pow(point[i] - lastPoint[i], 2);
        }
      }

      ptDistance = Math.sqrt(ptDistance);
      segmentLength += ptDistance;

      points.push({
        partialLength: ptDistance,
        point
      });

      lastPoint = point;
    }

    // console.log('points:', points)
    storedData[bezierName] = {
      segmentLength,
      points
    };
  }

  return storedData[bezierName];
}

export default {
  buildBezierData,
  getBezierEasing
};