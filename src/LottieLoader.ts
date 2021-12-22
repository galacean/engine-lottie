import {
  resourceLoader,
  Loader,
  AssetPromise,
  AssetType,
  LoadItem,
  ResourceManager,
  Texture2D,
  Entity,
  Sprite,
  Engine
} from "oasis-engine";

import { LottieResource, TypeRes } from './LottieResource';
import { LottieAnimation } from './LottieAnimation';

class Base64Atlas {
  private sprites = {};
  private assetsPromises = [];

  constructor(assets, engine: Engine) {
    this.assetsPromises = assets.map(asset => {
      return engine.resourceManager.load<Texture2D>({
        url: asset.p,
        type: AssetType.Texture2D
      }).then((texture) => {
        const sprite = new Sprite(engine);
        sprite.texture = texture;
        this.sprites[asset.id] = sprite;
      });
    });
  }

  request() {
    return Promise.all(this.assetsPromises);
  }

  getSprite(id) {
    return this.sprites[id];
  }
}

/**
 * @internal
 */
// @ts-ignore
@resourceLoader('lottie', ['json'])
export class LottieLoader extends Loader<Entity> {
  // @ts-ignore
  load(item: LoadItem, resourceManager: ResourceManager): Promise<Entity> {
    const { urls } = item;
    const jsonPromise = this.request(urls[0], resourceManager);

    // atlas
    if (urls[1]) {
      const atlasPromise: Promise<Texture2D> = resourceManager.load({
        url: urls[1],
        type: AssetType.SpriteAtlas,
      });

      return AssetPromise.all([jsonPromise, atlasPromise]).then(([res, atlas]) => {
        const { engine } = resourceManager;
        const resource = new LottieResource(engine, res as TypeRes, atlas);

        const lottieEntity = new Entity(engine);
        const lottie = lottieEntity.addComponent(LottieAnimation);

        lottie.resource = resource;

        return lottieEntity;
      })
    }
    // base64
    else {
      return AssetPromise.all([jsonPromise]).then(([res]) => {
        const { engine } = resourceManager;
        const spriteAssets = res.assets.filter((asset) => asset.p);
        res.assets = res.assets.filter((asset) => !asset.p);

        const atlas = new Base64Atlas(spriteAssets, engine);

        return atlas.request().then(() => {
          const resource = new LottieResource(engine, res as TypeRes, atlas);

          const lottieEntity = new Entity(engine);
          const lottie = lottieEntity.addComponent(LottieAnimation);

          lottie.resource = resource;

          return lottieEntity;
        });
      });
    }
  }
}