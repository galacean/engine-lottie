import {
  resourceLoader,
  Loader,
  AssetPromise,
  AssetType,
  LoadItem,
  ResourceManager,
  Texture2D
} from "oasis-engine";

import { LottieResource } from './LottieResource';
import { LottieRenderer } from './LottieRenderer';
import { Entity } from "oasis-engine";

@resourceLoader('lottie', ['json'])
export class LottieLoader extends Loader<Entity> {
  load(item: LoadItem, resourceManager: ResourceManager): Promise<Entity> {
    const { urls } = item;
    const jsonPromise = this.request(urls[0], resourceManager);
    const atlasPromise = this.request(urls[1], resourceManager);
    const texturePromise: Promise<Texture2D> = resourceManager.load({
      url: urls[2],
      type: AssetType.Texture2D,
    });

    return AssetPromise.all([jsonPromise, atlasPromise, texturePromise]).then(([res, atlas, texture]) => {
      const { engine } = resourceManager;
      const resource = new LottieResource(engine, res, atlas, texture);

      const lottieEntity = new Entity(engine);
      const lottie = lottieEntity.addComponent(LottieRenderer);

      lottie.res = resource;

      return lottieEntity;
    })
  }
}