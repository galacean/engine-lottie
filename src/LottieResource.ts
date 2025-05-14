import { Engine, EngineObject } from "@galacean/engine";

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

  // todo: delete
  // 继承了时间条的时序与渲染关系
  offsetTime: number;
  stretch: number;
  index: number;

  t?: TypeText;
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

export type TypeText = {
  d: {
    k: TypeTextKeyframe[];
  };
};

// field explanation：https://lottiefiles.github.io/lottie-docs/text/#text-document
export type TypeTextKeyframe = {
  s: {
    t: string;
    f: string;
    s: number;
    fc: number[];
    lh: number;
  };
  t: number;
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
  comps: any[];
  atlas: any;
  name: string;
  clips: { [name: string]: TypeAnimationClip };
  refCount: number = 0;

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
    }

    this._buildTree(this.layers, compsMap);

    if (res.lolitaAnimations) {
      this._parseAnimations(res.lolitaAnimations);
    }
  }

  setClips(v: TypeAnimationClip[]) {
    this.clips = {};
    this._parseAnimations(v);
  }

  private _parseAnimations(clips: TypeAnimationClip[]) {
    clips.forEach((clip) => {
      this.clips[clip.name] = { ...clip };
    });
  }

  /**
   * 在构建树结构的同时，继承合成的时间条关系
   * @param layers
   * @param compsMap
   * @param startTime - 这条合成的 offsetTime
   * @param stretch - 这条合成的 stretch
   * @param indStart - 这条合成的基础 ind
   * @param indFactor - 这条合成的 ind 缩放因子
   */
  private _buildTree(
    layers,
    compsMap,
    startTime: number = 0,
    stretch: number = 1,
    indStart: number = 0,
    indFactor: number = 1
  ) {
    const layersMap = {};

    for (let i = 0, l = layers.length; i < l; i++) {
      const layer = layers[i];
      layersMap[layer.ind] = layer;
    }

    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const { refId, parent } = layer;
      layer.offsetTime = startTime;
      layer.stretch = stretch;
      layer.index = layer.ind * indFactor + indStart;
      if (parent) {
        if (!layersMap[parent].layers) {
          layersMap[parent].layers = [];
        }

        layersMap[parent].layers.push(layer);
        layers.splice(i, 1);
      }

      if (refId && compsMap[refId]) {
        const refLayers = [];
        // deep clone the layers in comp asset
        for (let j = 0; j < compsMap[refId].layers.length; j++) {
          refLayers.push(this._deepClone(compsMap[refId].layers[j]));
        }
        const offsetTime = (layer.offsetTime || 0) + (layer.st || 0);
        const stretch = (layer.stretch || 1) * (layer.sr || 1);
        const compIndFactor = (indFactor / (refLayers[refLayers.length - 1].ind + 1)) * indFactor;
        this._buildTree(refLayers, compsMap, offsetTime, stretch, layer.index, compIndFactor);
        if (layer.layers) {
          layer.layers.push(...refLayers);
        } else {
          layer.layers = [...refLayers];
        }
      }
    }
  }

  private _deepClone(from: Object): Object {
    let out = Array.isArray(from) ? [...from] : { ...from };
    Reflect.ownKeys(out).map((key) => {
      out[key] = this._isObject(from[key]) ? this._deepClone(from[key]) : from[key];
    });
    return out;
  }

  private _isObject(obj: Object) {
    return (typeof obj === "object" || typeof obj === "function") && typeof obj !== null;
  }

  destroy(): void {
    this.atlas.destroy();
    this.atlas = null;
    this.layers = null;
    this.clips = null;
    this.comps = null;

    super.destroy();
  }
}
