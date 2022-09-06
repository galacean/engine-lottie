import { Entity, Sprite, SpriteAtlas, SpriteRenderer, TextureWrapMode } from 'oasis-engine';
import BaseLottieElement from './BaseLottieElement';

/**
 * @internal
 */
export default class SpriteLottieElement extends BaseLottieElement {
  sprite: Sprite;
  spriteRenderer: SpriteRenderer;

  constructor(layer, atlas: SpriteAtlas, entity: Entity, childEntity?: Entity) {
    super(layer);

    let spriteRenderer;

    if (layer.refId) {
      if (childEntity) {
        this.entity = childEntity;
        spriteRenderer = childEntity.getComponent(SpriteRenderer);
        this.sprite = spriteRenderer.sprite;
      }
      else {
        this.sprite = atlas.getSprite(layer.refId);
        const spriteEntity = new Entity(entity.engine, layer.nm);
        spriteRenderer = spriteEntity.addComponent(SpriteRenderer);
        spriteRenderer.sprite = this.sprite;
        this.entity = spriteEntity;
      }

      const { atlasRegion, texture } = this.sprite;
      texture.wrapModeU = texture.wrapModeV = TextureWrapMode.Clamp;
      this.spriteRenderer = spriteRenderer;

      spriteRenderer.priority = -this.index;

      this.width = atlasRegion.width * texture.width;
      this.height = atlasRegion.height * texture.height;
    }
  }

  destroy() {
    super.destroy();
    this.sprite?.texture?.destroy();
    this.sprite = null;
    this.spriteRenderer = null;
  }
}
