/**
 * some useful toolkit
 * @namespace
 */
const Tools = {
  /**
   * euclidean modulo
   * @method
   * @param {Number} n input value
   * @param {Number} m modulo
   * @return {Number} re-map to modulo area
   */
  euclideanModulo: function (n, m) {
    return ((n % m) + m) % m;
  },

  /**
   * bounce value when value spill codomain
   * @method
   * @param {Number} n input value
   * @param {Number} min lower boundary
   * @param {Number} max upper boundary
   * @return {Number} bounce back to boundary area
   */
  codomainBounce: function (n, min, max) {
    if (n < min) return 2 * min - n;
    if (n > max) return 2 * max - n;
    return n;
  },

  /**
   * clamp a value in range
   * @method
   * @param {Number} x input value
   * @param {Number} a lower boundary
   * @param {Number} b upper boundary
   * @return {Number} clamp in range
   */
  clamp: function (x, a, b) {
    return x < a ? a : x > b ? b : x;
  }
};

export default Tools;
