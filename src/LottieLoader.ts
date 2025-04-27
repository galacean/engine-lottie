import {
  AssetPromise,
  AssetType,
  Engine,
  Entity,
  LoadItem,
  Loader,
  ResourceManager,
  Sprite,
  Texture2D,
  resourceLoader
} from "@galacean/engine";

import { LottieAnimation } from "./LottieAnimation";
import { LottieResource, TypeRes } from "./LottieResource";

class Base64Atlas {
  private sprites = {};
  private assetsPromises = [];

  constructor(assets, engine: Engine) {
    this.assetsPromises = assets.map((asset) => {
      return engine.resourceManager
        .load<Texture2D>({
          url: asset.p,
          type: AssetType.Texture2D
        })
        .then((texture) => {
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
@resourceLoader("lottie", ["json"])
export class LottieLoader extends Loader<Entity> {
  // @ts-ignore
  load(item: LoadItem, resourceManager: ResourceManager): Promise<Entity> {
    const { urls } = item;
    // @ts-ignore
    const jsonPromise = resourceManager._request(urls[0], { type: "json" });

    // atlas
    if (urls[1]) {
      const atlasPromise = resourceManager.load({
        url: urls[1],
        type: AssetType.SpriteAtlas
      });

      return AssetPromise.all([jsonPromise, atlasPromise]).then(([res, atlas]) => {
        const { engine } = resourceManager;
        const resource = new LottieResource(engine, res as TypeRes, atlas);

        const lottieEntity = new Entity(engine);
        const lottie = lottieEntity.addComponent(LottieAnimation);

        lottie.resource = resource;

        return lottieEntity;
      });
    }
    // base64
    else {
      return AssetPromise.all([jsonPromise]).then(([res]) => {
        const { engine } = resourceManager;
        const spriteAssets = (res as TypeRes).assets.filter((asset) => asset.p);
        (res as TypeRes).assets = (res as TypeRes).assets.filter((asset) => !asset.p);

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
