import { AssetConfig, Entity, ResourceManager, SchemaResource, registerResource } from "oasis-engine";

export class LottieResource extends SchemaResource {
  load(resourceManager: ResourceManager, assetConfig: AssetConfig): Promise<any> {
    const { json, atlas } = assetConfig.props;

    return resourceManager
      .load<any>({
        urls: [json, atlas],
        type: "lottie"
      })
      .then((entity: Entity) => {
        this._resource = entity;
      });
  }
}

registerResource("lottie", LottieResource);
