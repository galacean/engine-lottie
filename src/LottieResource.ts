import { Engine, EngineObject } from "oasis-engine";

export type TypeLayer = {
  ddd: number;
  sr: number;
  st: number;
  nm: string;
  op: number;
  ks: any;
  ao: number;
  ip: any;
  ind: number;
  refId: string;
  tm: any;
  w: number;
  h: number;
  fr: number;
  layers: TypeLayer[];
};

export type TypeAnimationClip = {
  name: string;
  start: number;
  end: number;
  auto: boolean;
};

export type TypeRes = {
  v: string;
  nm: string;
  ddd: number;
  fr: number;
  w: number;
  h: number;
  ip: number;
  op: number;
  layers: TypeLayer[];
  assets: any[];
  lolitaAnimations?: TypeAnimationClip[];
};

/**
 * @internal
 */
export class LottieResource extends EngineObject {
  duration: number;
  timePerFrame: number;
  inPoint: number;
  outPoint: number;
  height: number;
  width: number;
  layers: TypeLayer[];
  animations: any[];
  comps: any[];
  atlas: any;
  name: string;
  clips: {};

  constructor(engine: Engine, res: TypeRes, atlas: any) {
    super(engine);

    this.timePerFrame = 1000 / res.fr;
    this.duration = Math.floor(res.op - res.ip);
    this.width = res.w;
    this.height = res.h;
    this.inPoint = res.ip;
    this.outPoint = res.op;
    this.atlas = atlas;
    this.layers = res.layers;
    this.comps = res.assets;
    this.name = res.nm;
    this.clips = {};

    const compsMap = {};
    const { comps } = this;

    if (comps) {
      for (let i = 0, l = comps.length; i < l; i++) {
        const comp = comps[i];
        if (comp.id) {
          compsMap[comp.id] = comp;
        }
      }

      for (let i = 0, l = this.layers.length; i < l; i++) {
        const layer = this.layers[i];

        const { refId } = layer;

        if (refId && compsMap[refId]) {
          // clone the layers in comp asset
          layer.layers = [...compsMap[refId].layers];
        }
      }
    }

    this._buildTree(this.layers, compsMap);

    if (res.lolitaAnimations) {
      this._parseAnimations(res.lolitaAnimations);
    }
  }

  private _parseAnimations(clips: TypeAnimationClip[]) {
    clips.forEach((clip) => {
      this.clips[clip.name] = { ...clip };
    });
  }

  private _buildTree(layers, compsMap, isCompLayer: boolean = false) {
    const layersMap = {};

    for (let i = 0, l = layers.length; i < l; i++) {
      const layer = layers[i];
      layersMap[layer.ind] = layer;
    }

    const children = [];

    for (let i = 0, l = layers.length; i < l; i++) {
      const layer = layers[i];
      const { refId, parent } = layer;

      layer.isCompLayer = isCompLayer;

      if (parent) {
        if (!layersMap[parent].layers) {
          layersMap[parent].layers = [];
        }

        layersMap[parent].layers.push(layer);
        children.push(layer);
      }

      if (refId && compsMap[refId]) {
        // clone the layers in comp asset
        const refLayers = [...compsMap[refId].layers];
        this._buildTree(refLayers, compsMap, true);
        if (layer.layers) {
          layer.layers.push(...refLayers);
        } else {
          layer.layers = [...refLayers];
        }
      }
    }

    // remove children belong to the parent in layersMap
    for (let i = 0, l = children.length; i < l; i++) {
      const index = layers.indexOf(children[i]);
      layers.splice(index, 1);
    }
  }
}
