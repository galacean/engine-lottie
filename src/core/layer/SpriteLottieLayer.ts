import { Engine, Entity, Sprite, SpriteAtlas, SpriteRenderer } from 'oasis-engine';
import BaseLottieLayer from './BaseLottieLayer';

/**
 * @internal
 */
export default class SpriteLottieLayer extends BaseLottieLayer {
  sprite: Sprite;
  entity: Entity;
  spriteRenderer: SpriteRenderer;

  constructor(layer, atlas: SpriteAtlas, entity: Entity, index: number) {
    super(layer);

    if (layer.refId) {
      this.sprite = atlas.getSprite(layer.refId);
      const { atlasRegion, texture } = this.sprite;
      const name = `${this.sprite.name}_${index}`;
      const childEntity = entity.findByName(name);

      // If it has entity already(such as cloned entity), set the existed entity to the layer
      if (childEntity) {
        this.entity = childEntity;
        const spriteRenderer = childEntity.getComponent(SpriteRenderer);
        // @ts-ignore
        spriteRenderer._renderSortId = this.index;
        // @ts-ignore
        spriteRenderer._customRootEntity = entity;
        this.spriteRenderer = spriteRenderer;
      }
      else {
        const spriteEntity = new Entity(entity.engine, name);
        const spriteRenderer = spriteEntity.addComponent(SpriteRenderer);
        spriteRenderer.sprite = this.sprite;
        // @ts-ignore
        spriteRenderer._renderSortId = this.index;
        // @ts-ignore
        spriteRenderer._customRootEntity = entity;
        this.entity = spriteEntity;
        this.spriteRenderer = spriteRenderer;
      }

      this.width = atlasRegion.width * texture.width;
      this.height = atlasRegion.height * texture.height;
    }

    this.update(0, true);
  }
}
