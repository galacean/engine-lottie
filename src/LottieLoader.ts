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

@resourceLoader('lottie', ['json'])
export class LottieLoader extends Loader<LottieResource> {
  load(item: LoadItem, resourceManager: ResourceManager): Promise<LottieResource> {
    const { urls } = item;
    const jsonPromise = this.request(urls[0], resourceManager);
    const atlasPromise = this.request(urls[1], resourceManager);
    const texturePromise: Promise<Texture2D> = resourceManager.load({
      url: urls[2],
      type: AssetType.Texture2D,
    });

    return AssetPromise.all([jsonPromise, atlasPromise, texturePromise]).then(async ([res, atlas, texture]) => {
      return new LottieResource(resourceManager.engine, res, atlas, texture);
    })
  }
}