import { Sprite, SpriteAtlas } from 'oasis-engine';
import BaseLottieLayer from './BaseLottieLayer';

/**
 * @internal
 */
export default class SpriteLottieLayer extends BaseLottieLayer {
  sprite: Sprite;

  constructor(layer, atlas: SpriteAtlas) {
    super(layer);

    if (layer.refId) {
      this.sprite = atlas.getSprite(layer.refId);
      const { atlasRegion, texture } = this.sprite;

      this.width = atlasRegion.width * texture.width;
      this.height = atlasRegion.height * texture.height;
    }

    this.update(0, true);
  }
}
