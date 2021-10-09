import { Engine, Entity } from 'oasis-engine';
import BaseLottieElement from './BaseLottieElement';

/**
 * @internal
 */
export default class CompLottieElement extends BaseLottieElement {
  layers: any;
  comps: [];

  constructor(layer, engine?: Engine, entity?: Entity, name?: string) {
    super(layer);

    this.layers = layer.layers;
    this.comps = layer.comps;

    if (entity) {
      this.entity = entity;
      if (name) {
        this.entity.name = name;
      }
    }
    else {
      const compEntity = new Entity(engine, name);
      this.entity = compEntity;
    }
  }

  destroy() {
    super.destroy();
    this.layers = null;
    this.comps = null;
  }
}
