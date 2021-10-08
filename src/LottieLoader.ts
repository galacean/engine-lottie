import {
  resourceLoader,
  Loader,
  AssetPromise,
  AssetType,
  LoadItem,
  ResourceManager,
  Texture2D,
  Entity
} from "oasis-engine";

import { LottieResource, TypeRes } from './LottieResource';
import { LottieAnimation } from './LottieAnimation';

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
    const atlasPromise : Promise<Texture2D> = resourceManager.load({
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
}