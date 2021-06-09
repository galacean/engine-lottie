import BaseLottieLayer from "./BaseLottieLayer";

export default class PropertyContainer {
  private properties = [];
  private elem: BaseLottieLayer;

  constructor (elem) {
    this.elem = elem;
    this.properties = [];
  }

  addProperty(prop) {
    if (this.properties.indexOf(prop) === -1) {
      this.properties.push(prop);
      this.elem.addProperty(this);
    }
  }

  updateProperties(frameNum) {
    const len = this.properties.length;
    for (let i = 0; i < len; i += 1) {
      this.properties[i].getValue(frameNum);
    }
  }
}
