import { AssetPromise, AssetType, LoadItem, Loader, ResourceManager, Utils, resourceLoader } from "@galacean/engine";
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
      const { url } = item;
      // @ts-ignore
      resourceManager._request<any>(url, { type: "json" }).then((data) => {
        const { jsonUrl, atlasUrl } = data;
        // @ts-ignore
        const jsonPromise = resourceManager._request(Utils.resolveAbsoluteUrl(url, jsonUrl), resourceManager);
        const atlasPromise = resourceManager.load({
          url: Utils.resolveAbsoluteUrl(url, atlasUrl),
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
