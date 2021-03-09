import * as o3 from "oasis-engine";
import {
	CameraLottieLayer,
	CameraNullLottieLayer,
	CompLottieLayer,
	NullLottieLayer,
	ShapeLottieLayer,
	SolidLottieLayer,
	SpriteLottieLayer,
	Tools
} from '@ali/lottie-core';

export { LottieLoader } from './LottieLoader';
export class LottieRenderer extends o3.Script {
	private _lastFrame = -Infinity;
	private _repeatsCut = 0;
	private _delayCut = 0;
	private _waitCut = 0;
	private _autoLoad: boolean = true;
	private _autoStart: boolean = true;
	private _justDisplayOnImagesLoaded: boolean = true;
	private _maskComp: boolean = false;
	private _copyJSON: boolean = false;

	root: any = null;
	frameRate: number;
	frameMult: number;

	set res (value) {
		const { w, h, frameRate, ip, op, st } = value;

		const session: any = {
			global: {
				w, h,
				frameRate,
				maskComp: this._maskComp,
				overlapMode: value.overlapMode,
				globalCamera: null,
			},
			local: {
				w, h, ip, op, st,
			},
		};

		this.frameRate = value.res.fr;
		this.frameMult = this.frameRate / 1000;

		this.root = new CompLottieLayer(value.res, session);
		this._buildLottieTree(this.root, session);

		console.log('layers:', this.root)
		console.log('textures:', value.textures)
	}

	private _buildLottieTree(comp, lastSession) {
		const { layers, w, h, ip, op, st = 0 } = comp.data;

		const session = {
			global: lastSession.global,
			local: {
				w, h, ip, op, st,
				childCompsArray: [],
				currentCamera: null,
			},
		};

		const layersMap = {};
		const { global, local } = session;

		for (let i = layers.length - 1; i >= 0; i--) {
			const layer = layers[i];
			let element = null;

			if (layer.td !== undefined) continue;

			switch (layer.ty) {
				case 0:
					element = new CompLottieLayer(layer, session);
					local.childCompsArray.push(element);
					break;
				case 1:
					element = new SolidLottieLayer(layer, session);
					break;
				case 2:
					element = new SpriteLottieLayer(layer, session);
					break;
				case 3:
					element = new NullLottieLayer(layer, session);
					break;
				case 4:
					element = new ShapeLottieLayer(layer, session);
					break;
				case 13:
					if (!session.global.globalCamera) {
						element = new CameraLottieLayer(layer, session);
						local.currentCamera = element;
					}
					break;
				default:
					continue;
			}

			if (element) {
				// 有些动画层没有ind，比如序列帧
				if (layer.ind === undefined) layer.ind = i;
				layersMap[layer.ind] = element;

				if (!Tools.isUndefined(layer.parent)) {
					const parent = layersMap[layer.parent];

					if (parent) {
						// 矩阵暂时不能混合使用，3D和2D的图层不能有父子节点关系
						if (element.is3D === parent.is3D) {
							element.setTransformHierarchy(parent);
						}
					}
				}

				comp.addChild(element);

				if (local.currentCamera && element.is3D) {
					local.currentCamera.hadShipped = true;
				}
			}
		}

		if (local.has3D && !global.globalCamera) {
			if (!local.currentCamera && !session.global.globalCamera) {
				local.currentCamera = new CameraNullLottieLayer(null, session);
			}

			global.globalCamera = local.currentCamera;
		}

		const childCompsArray = session.local.childCompsArray;

		for (let i = 0; i < childCompsArray.length; i++) {
			const comp = childCompsArray[i];
			this._buildLottieTree(comp, session);
		}

		return layersMap;
	}


	onStart() {
	}
}