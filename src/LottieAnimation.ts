import {
	CompLottieLayer,
	SpriteLottieLayer,
	Tools
} from './core';
import { MeshBatcher } from './MeshBatcher';
import { Matrix, Quaternion, Vector3, Script } from "oasis-engine";
import { LottieResource } from './LottieResource';
import BaseLottieLayer from './core/layer/BaseLottieLayer';
import TransformFrames from './core/TransformFrames';

export { LottieLoader } from './LottieLoader';

export class LottieAnimation extends Script {
	/** The number of units in world space that correspond to one pixel in the sprite. */
	static unitsPerPixel: number = 1 / 128;

	/** Repeat times of the animation. */
	repeats: number = 0;
	/** whether the animation loop or not. */
	isLooping: boolean = false;
	/** whether the animation play back and forth */
	isAlternate: boolean = false;
	/** The direction of animation, 1 means play for */
	direction: 1 | -1 = 1;
	speed: number = 1;

	private _root: CompLottieLayer = null;
	private _isPlaying: boolean = false;
	private _frame: number = 0;
	private _layers: (SpriteLottieLayer | CompLottieLayer)[];
	private _width: number;
	private _height: number;
	private _batch: MeshBatcher;
	private _resource: LottieResource;

	// Temp variables for better performance
	private _tempPosition: Vector3 = new Vector3();
	private _tempTranslation: Vector3 = new Vector3();
	private _tempRotation: Quaternion = new Quaternion();
	private _tempScale: Vector3 = new Vector3();
	private _tempWorldMatrix: Matrix = new Matrix();
	private _tempLocalMatrix: Matrix = new Matrix();
	private _tempParentWorldMatrix: Matrix = new Matrix();


	set res(value: LottieResource) {
		this._resource = value;
		this._width = value.width;
		this._height = value.height;

		this._root = new CompLottieLayer(value);
		this._layers = this._buildLottieTree(this._root);
		this._batch = this._createBatch(this._layers);
	}

	get res(): LottieResource {
		return this._resource;
	}

	/**
	 * Play the lottie animation
	 */
	play(): void {
		this._isPlaying = true;
	}

	/**
	 * Pause the lottie animation
	 */
	pause(): void {
		this._isPlaying = false;
	}

	private _buildLottieTree<T extends BaseLottieLayer>(comp: CompLottieLayer): T[] {
		const layers = comp.layer;
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
					element = new SpriteLottieLayer(layer, this._resource.atlas);
					break;
			}

			if (element) {
				// Some layer may has no ind
				if (layer.ind === undefined) {
					layer.ind = i;
				}

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

		const layer: T[] = Object.values(layersMap);

		return layer.sort((a: T, b: T) => {
			return b.index - a.index;
		})
	}

	private _updateLayers<T extends BaseLottieLayer>(layers: T[]): void {
		const { vertices } = this._batch;

		for (let i = 0, l = layers.length; i < l; i++) {
			const layer = layers[i];

			this._updateBuffer(layer, i, vertices);
		}

		this._batch.vertexBuffer.setData(vertices);
	}

	private _createBatch<T extends BaseLottieLayer>(layers: T[]): MeshBatcher {
		const batchEntity = this.entity.createChild('batch');
		const batch = batchEntity.addComponent(MeshBatcher);
		const l = layers.length;

		batch.init(l);
		const { vertices, indices } = batch;

		for (let i = 0; i < l; i++) {
			const layer = layers[i];

			if(layer instanceof SpriteLottieLayer) {
				this._createSpriteLayer(layer, i, vertices, i * 36, indices, i * 6);
			}
		}

		batch.setBufferData();

		batch.getMaterial().shaderData.setTexture('map', this._resource.texture);

		return batch;
	}

	private _updateBuffer<T extends BaseLottieLayer>(layer: T, i: number, vertices: Float32Array) {
		const { unitsPerPixel } = LottieAnimation;
		const { transform, width, height } = layer;
		const a = transform.a.v;
		const offset = i * 36;

		const tempPosition = this._tempPosition;

		// TODO: if parent show
		if (layer.parent && layer.parent.transform) {
			layer.visible = layer.parent.visible;
		}

		const o = layer.visible ? transform.o.v : 0;

		const worldMatrix = this._transform(layer.transform, layer.parent);

		tempPosition.x = -a[0];
		tempPosition.y = -height + a[1];
		tempPosition.z = 0;
		const lb = tempPosition.transformToVec3(worldMatrix).scale(unitsPerPixel);
		vertices[offset] = lb.x;
		vertices[offset + 1] = lb.y;
		vertices[offset + 2] = lb.z;
		vertices[offset + 6] = o;

		tempPosition.x = width - a[0];
		tempPosition.y = -height + a[1];
		tempPosition.z = 0;
		const rb = tempPosition.transformToVec3(worldMatrix).scale(unitsPerPixel);
		vertices[offset + 9] = rb.x;
		vertices[offset + 10] = rb.y;
		vertices[offset + 11] = rb.z;
		vertices[offset + 15] = o;

		tempPosition.x = width - a[0];
		tempPosition.y = a[1];
		tempPosition.z = 0;
		const rt = tempPosition.transformToVec3(worldMatrix).scale(unitsPerPixel);
		vertices[offset + 18] = rt.x;
		vertices[offset + 19] = rt.y;
		vertices[offset + 20] = rt.z;
		vertices[offset + 24] = o;

		tempPosition.x = -a[0];
		tempPosition.y = a[1];
		tempPosition.z = 0;
		const lt = tempPosition.transformToVec3(worldMatrix).scale(unitsPerPixel);
		vertices[offset + 27] = lt.x;
		vertices[offset + 28] = lt.y;
		vertices[offset + 29] = lt.z;
		vertices[offset + 33] = o;

	}

	private _createSpriteLayer(layer: SpriteLottieLayer, i: number, vertices: Float32Array, voffset: number, indices: Uint16Array, ioffset: number) {
		const { width, height } = this._resource.texture;
		const { x, y } = layer;
		const w = layer.width;
		const h = layer.height;
		const u = x / width;
		const v = y / height;
		const p = u + w / width;
		const q = v + h / height;

		this._updateBuffer(layer, i, vertices);

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

	private _matrix(out: Matrix, transform: TransformFrames, parentPivot?: Float32Array) {
		const p = transform.p.v;
		const s = transform.s.v;;

		const translation = this._tempTranslation;

		if (parentPivot) {
			translation.setValue(p[0] - parentPivot[0], -p[1] + parentPivot[1], p[2]);
		}
		else {
			// root layer
			translation.setValue(p[0] - this._width / 2, -p[1] + this._height / 2, p[2]);
		}

		const rotation = this._tempRotation;

		let rx = 0;
		let ry = 0;
		let rz = 0;

		// 2d rotation
		if (transform.r) {
			rz = -transform.r.v;
		}
		// 3d rotation
		else if (transform.rx || transform.ry){
			rx = transform.rx ? transform.rx.v : 0;
			ry = transform.ry ? transform.ry.v : 0;
			rz = transform.rz ? transform.rz.v : 0;
		}
		else if (transform.or){
			const { v } = transform.or;
			rx = v[0];
			ry = v[1];
			rz = v[2];
		}

		Quaternion.rotationEuler(rx, ry, rz, rotation);

		const scale = this._tempScale;
		scale.setValue(s[0], s[1], 1);

		Matrix.affineTransformation(scale, rotation, translation, out);
	}

	private _transform(transform: TransformFrames, parent?: CompLottieLayer) {
		if (parent && parent.transform) {
			this._matrix(this._tempParentWorldMatrix, parent.transform);
			this._matrix(this._tempLocalMatrix, transform, parent.transform.a.v);
			Matrix.multiply(this._tempParentWorldMatrix, this._tempLocalMatrix, this._tempWorldMatrix);
		}
		else {
			this._matrix(this._tempWorldMatrix, transform);
		}

		return this._tempWorldMatrix;
	}

	/**
	 * @override 
	 */
	onUpdate(deltaTime: number): void {
		const time = this.direction * this.speed * deltaTime;

		if (!this._isPlaying) {
			return null;
		}

		this._frame += time / this._resource.timePerFrame;

		if (this._spill()) {
			const { duration } = this._resource;
			if (this.repeats > 0 || this.isLooping) {
				if (this.repeats > 0) --this.repeats;
				if (this.isAlternate) {
					this.direction *= -1;
					this._frame = Tools.codomainBounce(this._frame, 0, duration);
				} else {
					this.direction = 1;
					this._frame = Tools.euclideanModulo(this._frame, duration);
				}
			} else {
				this._frame = Tools.clamp(this._frame, 0, duration);
			}
		}

		const correctedFrame = this._resource.inPoint + this._frame;
		this._root.update(correctedFrame);

		this._updateLayers(this._layers);
	}

	/**
	 * is this time frame spill the range
	 */
	private _spill(): boolean {
		const bottomSpill = this._frame <= 0 && this.direction === -1;
		const topSpill = this._frame >= this._resource.duration && this.direction === 1;
		return bottomSpill || topSpill;
	}
}