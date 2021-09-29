import { Entity, Sprite, SpriteAtlas, SpriteRenderer } from 'oasis-engine';
import BaseLottieElement from './BaseLottieElement';

/**
 * @internal
 */
export default class SpriteLottieLayer extends BaseLottieElement {
  sprite: Sprite;
  spriteRenderer: SpriteRenderer;

  constructor(layer, atlas: SpriteAtlas, entity: Entity, childEntity?: Entity) {
    super(layer);

    if (layer.refId) {
      if (childEntity) {
        this.entity = childEntity;
        const spriteRenderer = childEntity.getComponent(SpriteRenderer);
        // @ts-ignore
        spriteRenderer._renderSortId = this.index;
        // @ts-ignore
        spriteRenderer._customRootEntity = entity;
        this.spriteRenderer = spriteRenderer;
        this.sprite = spriteRenderer.sprite;
      }
      else {
        this.sprite = atlas.getSprite(layer.refId);
        const { atlasRegion, texture } = this.sprite;

        const spriteEntity = new Entity(entity.engine, layer.nm);
        const spriteRenderer = spriteEntity.addComponent(SpriteRenderer);
        spriteRenderer.sprite = this.sprite;
        // @ts-ignore
        spriteRenderer._renderSortId = this.index;
        // @ts-ignore
        spriteRenderer._customRootEntity = entity;
        this.entity = spriteEntity;
        this.spriteRenderer = spriteRenderer;

        this.width = atlasRegion.width * texture.width;
        this.height = atlasRegion.height * texture.height;
      }
    }
  }
}
