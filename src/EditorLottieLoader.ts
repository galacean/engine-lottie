import { resourceLoader, AssetPromise, Loader, LoadItem, ResourceManager, AssetType } from "oasis-engine";
import { LottieResource, TypeRes } from "./LottieResource";

/**
 * @internal
 */
// @ts-ignore
@resourceLoader("EditorLottie", ["json"])
export class EditorLottieLoader extends Loader<LottieResource> {
  // @ts-ignore
  load(item: LoadItem, resourceManager: ResourceManager): AssetPromise<LottieResource> {
    return new AssetPromise((resolve) => {
      this.request<any>(item.url, { type: "json" }).then((data) => {
        const { jsonUrl, atlasUrl } = data;
        const jsonPromise = this.request(jsonUrl, resourceManager);
        const atlasPromise = resourceManager.load({
          url: atlasUrl,
          type: AssetType.SpriteAtlas
        });

        AssetPromise.all([jsonPromise, atlasPromise]).then(([res, atlas]) => {
          const { engine } = resourceManager;
          const resource = new LottieResource(engine, res as TypeRes, atlas);
          resolve(resource);
        });
      });
    });
  }
}
