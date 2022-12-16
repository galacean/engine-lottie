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
    ty: number;
    td?: any;
    parent: number;
    inMain: boolean;
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

        const refMap = {};
        const { comps } = this;
        if (comps) {
            // 先建立 ref 映射
            for (let i = 0; i < comps.length; i++) {
                refMap[comps[i].id] = comps[i];
            }
            // buildTree 依赖上方的映射
            for (let i = 0; i < comps.length; i++) {
                this._buildTree(comps[i], refMap);
            }
        }
        // 主合成
        this._buildTree(res, refMap, true);

        if (res.lolitaAnimations) {
            this._parseAnimations(res.lolitaAnimations);
        }
    }

    private _parseAnimations(clips: TypeAnimationClip[]) {
        clips.forEach((clip) => {
            this.clips[clip.name] = { ...clip };
        });
    }

    /**
     * 根据合成数据建立树状结构
     * @param layer - 合成
     * @param refMap - 资产的 ref 映射
     * @param inMainComp - 是否是主合成
     */
    private _buildTree(layer, refMap, inMainComp: boolean = false) {
        const layerMap = {};
        const layers = layer.layers as TypeLayer[];
        if (layers) {
            const layersLength = layers.length;
            for (let i = 0; i < layersLength; i++) {
                layerMap[layers[i].ind] = layers[i];
            }
            for (let i = 0; i < layersLength; i++) {
                const layer = layers[i];
                layer.inMain = inMainComp;
                if (layer.parent) {
                    const parentNode = layerMap[layer.parent];
                    parentNode.layers ||= [];
                    if (!parentNode.layers) {
                        parentNode.layers = [layer];
                    } else {
                        parentNode.layers.push(layer);
                    }
                }
                const refLayers = refMap[layer.refId];
                if (refLayers) {
                    if (!layer.layers) {
                        layer.layers = [...refLayers.layers];
                    } else {
                        layer.layers.push(...refLayers.layers);
                    }
                }
            }
            for (let i = layersLength - 1; i >= 0; i--) {
                layers[i].parent && layers.splice(i, 1);
            }
        }
    }
}
