import {
	CompLottieLayer,
	SpriteLottieLayer,
	Tools
} from './core';
import { MeshBatcher } from './MeshBatcher';
import { Matrix, Quaternion, Texture2D, Vector3 } from "oasis-engine";
import { Script } from "oasis-engine";
import { LottieResource } from './LottieResource';

export { LottieLoader } from './LottieLoader';

export class LottieRenderer extends Script {
	private _lastFrame = -Infinity;
	private _repeatsCut = 0;
	private _delayCut = 0;
	private _waitCut = 0;
	static unitsPerPixel: number = 1 / 128;

	// ------
	private direction: number = 1;
	private timeScale: number = 1;
	private isPaused: boolean = false;
	private frameNum: number = 0;
	private infinite: boolean = false;
	private delay: number = 0;
	private alternate: boolean = false;
	private hadEnded: boolean = false;
	private layers;
	private width: number;
	private height: number;
	private batch: MeshBatcher;
	private resource: LottieResource;

	overlapMode: any;

	// Temp variables for better performance
	private tempPosition: Vector3 = new Vector3();
	private tempTranslation: Vector3 = new Vector3();
	private tempRotation: Quaternion = new Quaternion();
	private tempScale: Vector3 = new Vector3();
	private tempWorldMatrix: Matrix = new Matrix();
	private tempLocalMatrix: Matrix = new Matrix();
	private tempParentWorldMatrix: Matrix = new Matrix();

	root: any = null;

	set res(value) {
		this.resource = value;
		this.overlapMode = value.overlapMode;

		const { width, height } = value;

		this.width = width;
		this.height = height;

		this.root = new CompLottieLayer(value);
		const layers = this._buildLottieTree(this.root);

		this.layers = Object.values(layers);
		this.layers.sort((a, b) => {
			return b.index - a.index;
		})

		this.batch = this._createBatch(this.layers);
	}

	private _buildLottieTree(comp) {
		const { layers } = comp;
		const layersMap = {}
		let children = [];

		for (let i = layers.length - 1; i >= 0; i--) {
			const layer = layers[i];
			let element = null;

			if (layer.td !== undefined) continue;

			switch (layer.ty) {
				case 0:
					element = new CompLottieLayer(layer);
					children.push(element);
					break;
				case 2:
					element = new SpriteLottieLayer(layer, this.resource.atlas);
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
		const { vertices } = this.batch;

		for (let i = 0; i < layers.length; i++) {
			const layer = layers[i];

			this.updateBuffer(layer, i, vertices);
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

		batch.getMaterial().shaderData.setTexture('map', this.resource.texture);

		return batch;
	}

	private updateBuffer(layer, i, vertices) {
		const { unitsPerPixel } = LottieRenderer;
		const { transform, width, height } = layer;
		const a = transform.a.v;
		const offset = i * 36;

		const { tempPosition } = this;

		// TODO: if parent show
		if (layer.parent && layer.parent.transform) {
			layer.isInRange = layer.parent.isInRange;
		}

		const o = layer.isInRange ? transform.o.v : 0;

		const worldMatrix = this.transform(layer.transform, layer.parent);

		tempPosition.x = -a[0];
		tempPosition.y = -height + a[1];
		const lb = tempPosition.transformToVec3(worldMatrix).scale(unitsPerPixel);
		vertices[offset] = lb.x;
		vertices[offset + 1] = lb.y;
		vertices[offset + 6] = o;

		tempPosition.x = width - a[0];
		tempPosition.y = -height + a[1];
		const rb = tempPosition.transformToVec3(worldMatrix).scale(unitsPerPixel);
		vertices[offset + 9] = rb.x;
		vertices[offset + 10] = rb.y;
		vertices[offset + 15] = o;

		tempPosition.x = width - a[0];
		tempPosition.y = a[1];
		const rt = tempPosition.transformToVec3(worldMatrix).scale(unitsPerPixel);
		vertices[offset + 18] = rt.x;
		vertices[offset + 19] = rt.y;
		vertices[offset + 24] = o;

		tempPosition.x = -a[0];
		tempPosition.y = a[1];
		const lt = tempPosition.transformToVec3(worldMatrix).scale(unitsPerPixel);
		vertices[offset + 27] = lt.x;
		vertices[offset + 28] = lt.y;
		vertices[offset + 33] = o;

	}

	private createLayer(layer, i, vertices, voffset, indices, ioffset) {
		const { width, height } = this.resource.texture;
		const { x, y } = layer;
		const w = layer.width;
		const h = layer.height;
		const u = x / width;
		const v = y / height;
		const p = u + w / width;
		const q = v + h / height;

		this.updateBuffer(layer, i, vertices);

		// These buffers will not change

		// color
		vertices[voffset + 2] = 0;
		vertices[voffset + 3] = 1;
		vertices[voffset + 4] = 1;
		vertices[voffset + 5] = 1;

		// uv
		vertices[voffset + 7] = u;
		vertices[voffset + 8] = q;

		vertices[voffset + 11] = 0;
		vertices[voffset + 12] = 1;
		vertices[voffset + 13] = 1;
		vertices[voffset + 14] = 1;
		vertices[voffset + 16] = p;
		vertices[voffset + 17] = q;

		vertices[voffset + 20] = 0;
		vertices[voffset + 21] = 1;
		vertices[voffset + 22] = 1;
		vertices[voffset + 23] = 1;
		vertices[voffset + 25] = p;
		vertices[voffset + 26] = v;

		vertices[voffset + 29] = 0;
		vertices[voffset + 30] = 1;
		vertices[voffset + 31] = 1;
		vertices[voffset + 32] = 1;
		vertices[voffset + 34] = u;
		vertices[voffset + 35] = v;

		indices[ioffset] = 4 * i;
		indices[ioffset + 1] = 4 * i + 1;
		indices[ioffset + 2] = 4 * i + 2;
		indices[ioffset + 3] = 4 * i + 0;
		indices[ioffset + 4] = 4 * i + 2;
		indices[ioffset + 5] = 4 * i + 3;
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

		const correctedFrameNum = this.resource.inPoint + this.frameNum;
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
	private _spill() {
		const bottomSpill = this.frameNum <= 0 && this.direction === -1;
		const topSpill = this.frameNum >= this.resource.duration && this.direction === 1;
		return bottomSpill || topSpill;
	}

	private _updateTime(snippet) {
		const snippetCache = this.direction * this.timeScale * snippet;
		if (this._waitCut > 0) {
			this._waitCut -= Math.abs(snippetCache);
			return null;
		}
		if (this.isPaused || this._delayCut > 0) {
			if (this._delayCut > 0) this._delayCut -= Math.abs(snippetCache);
			return null;
		}

		this.frameNum += snippetCache / this.resource.timePerFrame;
		// console.log('frameNum ', this.frameNum )
		let isEnd = false;

		if (this._spill()) {
			if (this._repeatsCut > 0 || this.infinite) {
				if (this._repeatsCut > 0) --this._repeatsCut;
				this._delayCut = this.delay;
				if (this.alternate) {
					this.direction *= -1;
					this.frameNum = Tools.codomainBounce(this.frameNum, 0, this.resource.duration);
				} else {
					this.direction = 1;
					this.frameNum = Tools.euclideanModulo(this.frameNum, this.resource.duration);
				}
				// this.emit('loopComplete');
			} else {
				if (!this.overlapMode) {
					this.frameNum = Tools.clamp(this.frameNum, 0, this.resource.duration);
				}
				isEnd = true;
			}
		}

		return isEnd;
	}
}