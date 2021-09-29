import { Engine, Entity } from 'oasis-engine';
import BaseLottieElement from './BaseLottieElement';

/**
 * @internal
 */
export default class CompLottieElement extends BaseLottieElement {
  layers: any;
  comps: [];

  constructor(layer, name?: string, engine?: Engine, entity?: Entity) {
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
}
