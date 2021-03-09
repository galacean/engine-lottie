import {
  resourceLoader,
  Loader,
  AssetPromise,
  AssetType,
  LoadItem,
  ResourceManager,
  Texture2D
} from "oasis-engine";

import {
	DataManager,
} from '@ali/lottie-core';

import { LottieResource } from './LottieResource';

@resourceLoader(100, ["json"])
export class LottieLoader extends Loader<LottieResource> {
  load(item: LoadItem, resourceManager: ResourceManager): AssetPromise<LottieResource> {
    return new AssetPromise((resolve, reject) => {
      this.request(item.url, resourceManager).then(async (res) => {
        DataManager.completeData(res);

        // @ts-ignore
        const { w, h, st, fr, ip, op, assets } = res;

        console.log('res:', res);

        const lottieResource = new LottieResource(resourceManager.engine);

        lottieResource.defaultSegment = [ip, op];
        const segment = (lottieResource.segmentName && lottieResource.segments[lottieResource.segmentName]) || lottieResource.defaultSegment;

        lottieResource.beginFrame = segment[0];
        lottieResource.endFrame = segment[1];
        lottieResource.timePerFrame = 1000 / fr;
        lottieResource.duration = Math.floor(lottieResource.endFrame - lottieResource.beginFrame);
        lottieResource.assets = assets;
        lottieResource.w = w;
        lottieResource.h = h;
        lottieResource.ip = ip;
        lottieResource.op = op;
        lottieResource.st = st;
        lottieResource.res = res;

        this._loadTextures(assets, resourceManager, lottieResource).then(() => {
          resolve(lottieResource);
        });

      })
    });
  }

	private async _loadTextures(assets, resourceManager: ResourceManager, lottieResource: LottieResource){
		const images = [];
		const ids: string[] = [];

		for (let i = 0; i < assets.length; i++) {
			const asset = assets[i];

			if (asset.u || asset.p) {
				images.push({
					url: asset.u || asset.p,
					type: AssetType.Texture2D,
				});

				ids.push(asset.id);
			}
		}

		const textures = await resourceManager.load(images);

		for (let i = 0; i < images.length; i++) {
			lottieResource.textures[ids[i]] = textures[i];
		}

	}
}