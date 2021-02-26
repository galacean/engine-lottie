import * as o3 from "oasis-engine";
import {
	CameraLottieLayer,
	CameraNullLottieLayer,
	CompLottieLayer,
	NullLottieLayer,
	ShapeLottieLayer,
	SolidLottieLayer,
	SpriteLottieLayer,
	DataManager,
	Tools
} from '@ali/lottie-core';
import data from './json/test.json';

export class LottieRenderer extends o3.Script {
	private _defaultSegment: any;
	private _segmentName: string;
	private _timePerFrame: number;
	private _lastFrame = -Infinity;
	private _repeatsCut = 0;
	private _delayCut = 0;
	private _waitCut = 0;
	private _autoLoad: boolean = true;
	private _autoStart: boolean = true;
	private _justDisplayOnImagesLoaded: boolean = true;
	private _maskComp: boolean = false;
	private _copyJSON: boolean = false;
	private _textures: any = {};

	keyframes: any;
	frameRate: number;
	frameMult: number;
	segments: any = {};
	beginFrame: number;
	endFrame: number;
	duration: number;
	assets: any;
	living: boolean = true;
	infinite: boolean = false;
	repeats: number = 0;
	alternate: boolean = false;
	wait: number = 0;
	delay: number = 0;
	overlapMode: boolean = false;
	timeScale: number = 1;
	frameNum: number = 0;
	isPaused: boolean = true;
	direction: number = 1;
	isDisplayLoaded: boolean = false;
	isImagesLoaded: boolean = false;
	root: any = null;

	async onAwake() {
		DataManager.completeData(data);

		this.keyframes = data;

		const { w, h, st, fr, ip, op, assets } = data;

		console.log(data);

		this.frameRate = fr;
		this.frameMult = fr / 1000;
		this._defaultSegment = [ip, op];
		const segment = (this._segmentName && this.segments[this._segmentName]) || this._defaultSegment;

		this.beginFrame = segment[0];
		this.endFrame = segment[1];
		this._timePerFrame = 1000 / fr;
		this.duration = Math.floor(this.endFrame - this.beginFrame);
		this.assets = assets;

		this._loadTextures(assets);

		const session: any = {
			global: {
				w, h,
				frameRate: fr,
				maskComp: this._maskComp,
				overlapMode: this.overlapMode,
				globalCamera: null,
			},
			local: {
				w, h, ip, op, st,
			},
		};

		this._buildElements(session);
	}

	private _buildElements(session: any) {
		this.root = this._extraComp(this.keyframes, session, true);
		const layersMap = this._prepareChildComp(this.root, session);
		console.log(layersMap)
	}

	private _prepareChildComp(comp: any, session: any) {
		const { layers, w, h, ip, op, st = 0 } = comp.data;
		const newSession = {
			global: session.global,
			local: {
				w, h, ip, op, st,
				childCompsArray: [],
				currentCamera: null,
			},
		};

		return this._buildLottieTree(comp, layers, newSession);
	}

	_buildLottieTree(comp, layers, session) {
		const layersMap = {};
		const { global, local } = session;

		for (let i = layers.length - 1; i >= 0; i--) {
			const layer = layers[i];
			let element = null;

			if (layer.td !== undefined) continue;

			switch (layer.ty) {
				case 0:
					element = this._extraComp(layer, session);
					break;
				case 1:
					element = this._extraSolid(layer, session);
					break;
				case 2:
					element = this._extraSprite(layer, session);
					break;
				case 3:
					element = this._extraNull(layer, session);
					break;
				case 4:
					element = this._extraShape(layer, session);
					break;
				case 13:
					element = this._extraCamera(layer, session);
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
			if (!local.currentCamera){
				local.currentCamera = this._extraCamera(null, session);
			} 

			global.globalCamera = local.currentCamera;
		}

		const childCompsArray = session.local.childCompsArray;

		for (let i = 0; i < childCompsArray.length; i++) {
			const comp = childCompsArray[i];
			this._prepareChildComp(comp, session);
		}

		return layersMap;
	}

	private _extraComp(layer: any, session: any, isRoot: boolean = false) {
		const lottieLayer = new CompLottieLayer(layer, session);

		if (!isRoot) {
			session.local.childCompsArray.push(lottieLayer);
		}

		return lottieLayer;
	}

	private _extraSolid(layer, session) {
		const lottieLayer = new SolidLottieLayer(layer, session);
		return lottieLayer;
	}

	private _extraSprite(layer, session) {
		const asset = Tools.getAssets(layer.refId, this.assets);
		const texture = this._textures[asset.id];
		return new SpriteLottieLayer(layer, session);
	}

	private _extraNull(layer, session) {
		return new NullLottieLayer(layer, session);
	}

	private _extraShape(layer, session) {
		return new ShapeLottieLayer(layer, session);
	}

	private _extraCamera(layer, session) {
		if (session.global.globalCamera) return;

		let lottieLayer = null;

		if (layer) {
			lottieLayer = new CameraLottieLayer(layer, session);
		} else {
			lottieLayer = new CameraNullLottieLayer(layer, session);
		}

		session.local.currentCamera = lottieLayer;

		return lottieLayer;
	}

	private async _loadTextures(assets) {
		const images = [];
		const ids: string[] = [];

		for (let i = 0; i < assets.length; i++) {
			const asset = assets[i];

			if (asset.u || asset.p) {
				images.push({
					url: asset.u || asset.p,
					type: o3.AssetType.Texture2D,
				});

				ids.push(asset.id);
			}
		}

		const textures = await this.engine.resourceManager.load(images);

		for (let i = 0; i < images.length; i++) {
			this._textures[ids[i]] = textures[i];
		}

		this.isImagesLoaded = true;
		console.log(this._textures)
	}

	onStart() {
		console.log("script on start");
	}
}
