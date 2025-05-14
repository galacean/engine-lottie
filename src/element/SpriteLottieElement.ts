import { Entity, Sprite, SpriteAtlas, SpriteRenderer, TextureWrapMode } from "@galacean/engine";
import BaseLottieElement from "./BaseLottieElement";

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
      } else {
        this.sprite = atlas.getSprite(layer.refId);
        const spriteEntity = new Entity(entity.engine, layer.nm);
        spriteRenderer = spriteEntity.addComponent(SpriteRenderer);
        spriteRenderer.sprite = this.sprite;
        this.entity = spriteEntity;
      }

      const { atlasRegion, texture } = this.sprite;
      texture.wrapModeU = texture.wrapModeV = TextureWrapMode.Clamp;
      this.spriteRenderer = spriteRenderer;

      // local priority 范围控制在 （0, 1），同时为了尽可能避免精度问题，this.index * 1000000
      spriteRenderer.priority =  (Number.MAX_SAFE_INTEGER - this.index * 1000000) / Number.MAX_SAFE_INTEGER;

      this.width = atlasRegion.width * texture.width;
      this.height = atlasRegion.height * texture.height;
    }
  }

  destroy() {
    super.destroy();
    this.sprite = null;
    this.spriteRenderer = null;
  }
}
