import {
	CompLottieLayer,
	NullLottieLayer,
	ShapeLottieLayer,
	SolidLottieLayer,
	SpriteLottieLayer,
	Tools
} from '@ali/lottie-core';
import { MeshBatcher } from './MeshBatcher';
import { Matrix, Quaternion, Texture2D, Vector3 } from "oasis-engine";
import { Script } from "oasis-engine";

export { LottieLoader } from './LottieLoader';

export class LottieRenderer extends Script {
	private _lastFrame = -Infinity;
	private _repeatsCut = 0;
	private _delayCut = 0;
	private _waitCut = 0;
	private _autoLoad: boolean = true;
	private _autoStart: boolean = true;
	private _justDisplayOnImagesLoaded: boolean = true;
	private _maskComp: boolean = false;
	private _texture: Texture2D;
	private _assets;
	private _atlas;
	static unitsPerPixel: number = 1 / 128;

	// ------
	private beginFrame: number = 0;
	private endFrame: number = 0;
	private duration: number = 0;
	private direction: number = 1;
	private timeScale: number = 1;
	private isPaused: boolean = false;
	private frameNum: number = 0;
	private _defaultSegment: number[];
	private _timePerFrame: number;
	private infinite: boolean = false;
	private delay: number = 0;
	private alternate: boolean = false;
	private living: boolean = true;
	private repeats: number = 0;
	private wait: number = 0;
	private overlapMode: boolean = true;
	private hadEnded: boolean = false;
	private layers;
	private width: number;
	private height: number;
	private batch: MeshBatcher;

	private tempPosition: Vector3 = new Vector3();
	private tempTranslation: Vector3 = new Vector3();
	private tempRotation: Quaternion = new Quaternion();
	private tempScale: Vector3 = new Vector3();
	private tempWorldMatrix: Matrix = new Matrix();
	private tempLocalMatrix: Matrix = new Matrix();
	private tempParentWorldMatrix: Matrix = new Matrix();

	root: any = null;
	frameRate: number;
	frameMult: number;

	set res(value) {
		const { w, h, res, ip, op, st } = value;

		const session: any = {
			global: {
				w, h,
				frameRate: res.fr,
				maskComp: this._maskComp,
				overlapMode: value.overlapMode,
				globalCamera: null,
			},
			local: {
				w, h, ip, op, st,
			},
		};

		this.overlapMode = value.overlapMode;
		this.frameRate = value.res.fr;
		this.frameMult = this.frameRate / 1000;
		this._texture = value.texture;
		this._assets = value.assets;
		this._atlas = value.atlas;
		this.beginFrame = value.beginFrame;
		this.endFrame = value.endFrame;
		this.duration = this.endFrame - this.beginFrame;
		this.frameRate = this.frameRate;
		this.frameMult = this.frameRate / 1000
		this._defaultSegment = [ip, op];
		this._timePerFrame = 1000 / this.frameRate;

		this.root = new CompLottieLayer(value.res, session);
		this.width = w;
		this.height = h;
		const layers = this._buildLottieTree(this.root, session);

		this.layers = Object.values(layers);
		this.layers.sort((a, b) => {
			return b.data.ind - a.data.ind;
		})

		this.batch = this._createBatch(this.layers);
	}

	private _buildLottieTree(comp, lastSession) {
		const { layers, w, h, ip, op, st = 0 } = comp.data;
		const layersMap = {}

		const session = {
			global: lastSession.global,
			local: { w, h, ip, op, st },
		};

		let children = [];

		for (let i = layers.length - 1; i >= 0; i--) {
			const layer = layers[i];
			let element = null;

			if (layer.td !== undefined) continue;

			switch (layer.ty) {
				case 0:
					element = new CompLottieLayer(layer, session);
					children.push(element);
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
				default:
					continue;
			}

			if (element) {
				// 有些动画层没有ind，比如序列帧
				if (layer.ind === undefined) layer.ind = i;
				layersMap[layer.ind] = element;

				if (layer.parent) {
					children.push(layer);
				} else {
					comp.addChild(element);
				}
			}
		}

		for (let i = 0; i < children.length; i++) {
			const layer = children[i];
			const { parent } = layer;

			if (layersMap[parent]) {
				layersMap[layer.ind].parent = layersMap[parent];
			}
		}

		return layersMap;
	}

	private updateLayers(layers) {
		for (let i = 0; i < layers.length; i++) {
			const layer = layers[i];

			this.updateLayer(layer, i);
		}

		this.batch.vertexBuffer.setData(this.batch.vertices);
	}

	private _createBatch(layers) {

		const batchEntity = this.entity.createChild('batch');
		const batch = batchEntity.addComponent(MeshBatcher);
		const l = layers.length;

		batch.init(l);
		const { vertices, indices } = batch;

		for (let i = 0; i < l; i++) {
			const layer = layers[i];

			this.createLayer(layer, i, vertices, i * 36, indices, i * 6);
		}

		batch.setBufferData();

		batch.getMaterial().shaderData.setTexture('map', this._texture);

		return batch;
	}

	private createLayer(layer, i, vertices, voffset, indices, ioffset) {
		const width = this._texture.width;
		const height = this._texture.height;
		const { data } = layer;
		let { x, y, w, h } = this._atlas.frames[data.refId + '.png'].frame;
		const u = x / width;
		const v = y / height;
		const p = u + w / width;
		const q = v + h / height;
		const { unitsPerPixel } = LottieRenderer;

		// console.log('layer', layer)
		const { transform } = layer;
		const a = transform.a.v;

		// TODO: if parent show
		if (layer.parent && layer.parent.transform) {
			layer.isInRange = layer.parent.isInRange;
		}

		const o = layer.isInRange ? transform.o.v : 0;
		const worldMatrix = this.transform(layer.transform, layer.parent);

		// left bottom
		const lb = new Vector3(0 - a[0], -h + a[1], 0).transformToVec3(worldMatrix);
		vertices[voffset] = lb.x * unitsPerPixel;
		vertices[voffset + 1] = lb.y * unitsPerPixel;
		vertices[voffset + 2] = 0;

		vertices[voffset + 3] = 1;
		vertices[voffset + 4] = 1;
		vertices[voffset + 5] = 1;
		vertices[voffset + 6] = o;

		vertices[voffset + 7] = u;
		vertices[voffset + 8] = q;

		// right bottom
		const rb = new Vector3(w - a[0], -h + a[1], 0).transformToVec3(worldMatrix);
		vertices[voffset + 9] = rb.x * unitsPerPixel;
		vertices[voffset + 10] = rb.y * unitsPerPixel;
		vertices[voffset + 11] = 0;

		vertices[voffset + 12] = 1;
		vertices[voffset + 13] = 1;
		vertices[voffset + 14] = 1;
		vertices[voffset + 15] = o;

		vertices[voffset + 16] = p;
		vertices[voffset + 17] = q;

		// right top
		const rt = new Vector3(w - a[0], 0 + a[1], 0).transformToVec3(worldMatrix);
		vertices[voffset + 18] = rt.x * unitsPerPixel;
		vertices[voffset + 19] = rt.y * unitsPerPixel;
		vertices[voffset + 20] = 0;

		vertices[voffset + 21] = 1;
		vertices[voffset + 22] = 1;
		vertices[voffset + 23] = 1;
		vertices[voffset + 24] = o;

		vertices[voffset + 25] = p;
		vertices[voffset + 26] = v;

		// left top
		const lt = new Vector3(0 - a[0], 0 + a[1], 0).transformToVec3(worldMatrix);
		vertices[voffset + 27] = lt.x * unitsPerPixel;
		vertices[voffset + 28] = lt.y * unitsPerPixel;
		vertices[voffset + 29] = 0;

		vertices[voffset + 30] = 1;
		vertices[voffset + 31] = 1;
		vertices[voffset + 32] = 1;
		vertices[voffset + 33] = o;

		vertices[voffset + 34] = u;
		vertices[voffset + 35] = v;

		indices[ioffset] = 4 * i;
		indices[ioffset + 1] = 4 * i + 1;
		indices[ioffset + 2] = 4 * i + 2;
		indices[ioffset + 3] = 4 * i + 0;
		indices[ioffset + 4] = 4 * i + 2;
		indices[ioffset + 5] = 4 * i + 3;
	}

	private updateLayer(layer, i) {
		const { unitsPerPixel } = LottieRenderer;
		const { data } = layer;
		const { transform } = layer;
		const a = transform.a.v;
		const { vertices } = this.batch;
		const { tempPosition } = this;
		let { w, h } = this._atlas.frames[data.refId + '.png'].frame;

		// TODO: if parent show
		if (layer.parent && layer.parent.transform) {
			layer.isInRange = layer.parent.isInRange;
		}

		const o = layer.isInRange ? transform.o.v : 0;
		const offset = i * 36;

		const worldMatrix = this.transform(layer.transform, layer.parent);

		tempPosition.x = -a[0];
		tempPosition.y = -h + a[1];
		const lb = tempPosition.transformToVec3(worldMatrix);
		vertices[offset] = lb.x * unitsPerPixel;
		vertices[offset + 1] = lb.y * unitsPerPixel;
		vertices[offset + 6] = o;

		tempPosition.x = w - a[0];
		tempPosition.y = -h + a[1];
		const rb = tempPosition.transformToVec3(worldMatrix);
		vertices[offset + 9] = rb.x * unitsPerPixel;
		vertices[offset + 10] = rb.y * unitsPerPixel;
		vertices[offset + 15] = o;

		tempPosition.x = w - a[0];
		tempPosition.y = a[1];
		const rt = tempPosition.transformToVec3(worldMatrix);
		vertices[offset + 18] = rt.x * unitsPerPixel;
		vertices[offset + 19] = rt.y * unitsPerPixel;
		vertices[offset + 24] = o;

		tempPosition.x = -a[0];
		tempPosition.y = a[1];
		const lt = tempPosition.transformToVec3(worldMatrix);
		vertices[offset + 27] = lt.x * unitsPerPixel;
		vertices[offset + 28] = lt.y * unitsPerPixel;
		vertices[offset + 33] = o;
	}

	matrix(out, transform, parentPivot?) {
		const p = transform.p.v;
		const r = transform.r.v;
		const s = transform.s.v;;

		const translation = this.tempTranslation;

		if (parentPivot) {
			translation.setValue(p[0] - parentPivot[0], -p[1] + parentPivot[1], p[2]);
		}
		else {
			// root layer
			translation.setValue(p[0] - this.width / 2, -p[1] + this.height / 2, p[2]);
		}

		const rotation = this.tempRotation;
		Quaternion.rotationEuler(0, 0, -r, rotation);

		const scale = this.tempScale;
		scale.setValue(s[0], s[1], 1);

		Matrix.affineTransformation(scale, rotation, translation, out);
	}

	transform(transform, parent?) {
		if (parent && parent.transform) {
			this.matrix(this.tempParentWorldMatrix, parent.transform);
			this.matrix(this.tempLocalMatrix, transform, parent.transform.a.v);
			Matrix.multiply(this.tempParentWorldMatrix, this.tempLocalMatrix, this.tempWorldMatrix);
		}
		else {
			this.matrix(this.tempWorldMatrix, transform);
		}

		return this.tempWorldMatrix;
	}

	onStart() {
	}

	onUpdate(snippetCache, firstFrame = false) {
		// console.log('snippetCache', snippetCache)
		const isEnd = this._updateTime(snippetCache);

		const correctedFrameNum = this.beginFrame + this.frameNum;
		// console.log('correctedFrameNum ', this.beginFrame, this.frameNum, correctedFrameNum )
		this.root.updateFrame(correctedFrameNum);

		const np = correctedFrameNum >> 0;
		if (this._lastFrame !== np) {
			// this._emitFrame(this.direction > 0 ? np : this._lastFrame);
			this._lastFrame = np;
		}
		if (isEnd === false) {
			// this.emit('enterFrame', correctedFrameNum);
			// this.emit('update', this.frameNum / this.duration);
		} else if (this.hadEnded !== isEnd && isEnd === true) {
			// this.emit('complete');
		}

		this.root.updateFrame(np);
		this.hadEnded = isEnd;

		this.updateLayers(this.layers);
	}

	/**
	 * is this time frameNum spill the range
	 * @private
	 * @return {boolean}
	 */
	_spill() {
		const bottomSpill = this.frameNum <= 0 && this.direction === -1;
		const topSpill = this.frameNum >= this.duration && this.direction === 1;
		return bottomSpill || topSpill;
	}

	_updateTime(snippet) {
		const snippetCache = this.direction * this.timeScale * snippet;
		if (this._waitCut > 0) {
			this._waitCut -= Math.abs(snippetCache);
			return null;
		}
		if (this.isPaused || this._delayCut > 0) {
			if (this._delayCut > 0) this._delayCut -= Math.abs(snippetCache);
			return null;
		}

		this.frameNum += snippetCache / this._timePerFrame;
		// console.log('frameNum ', this.frameNum )
		let isEnd = false;

		if (this._spill()) {
			if (this._repeatsCut > 0 || this.infinite) {
				if (this._repeatsCut > 0) --this._repeatsCut;
				this._delayCut = this.delay;
				if (this.alternate) {
					this.direction *= -1;
					this.frameNum = Tools.codomainBounce(this.frameNum, 0, this.duration);
				} else {
					this.direction = 1;
					this.frameNum = Tools.euclideanModulo(this.frameNum, this.duration);
				}
				// this.emit('loopComplete');
			} else {
				if (!this.overlapMode) {
					this.frameNum = Tools.clamp(this.frameNum, 0, this.duration);
					this.living = false;
				}
				isEnd = true;
			}
		}

		return isEnd;
	}
}