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
	static unitsPerPixel: number = 1 / 128;

	repeats = 0;
	infinite: boolean = false;
	alternate: boolean = false;
	direction: number = 1;
	timeScale: number = 1;

	private isPlaying: boolean = false;
	private frame: number = 0;
	private layers;
	private width: number;
	private height: number;
	private batch: MeshBatcher;
	private resource: LottieResource;

	// Temp variables for better performance
	private tempPosition: Vector3 = new Vector3();
	private tempTranslation: Vector3 = new Vector3();
	private tempRotation: Quaternion = new Quaternion();
	private tempScale: Vector3 = new Vector3();
	private tempWorldMatrix: Matrix = new Matrix();
	private tempLocalMatrix: Matrix = new Matrix();
	private tempParentWorldMatrix: Matrix = new Matrix();

	root: CompLottieLayer = null;

	set res(value) {
		this.resource = value;

		const { width, height } = value;

		this.width = width;
		this.height = height;

		this.root = new CompLottieLayer(value);
		const layers = this.buildLottieTree(this.root);

		this.layers = Object.values(layers);
		this.layers.sort((a, b) => {
			return b.index - a.index;
		})

		this.batch = this.createBatch(this.layers);
	}

	private buildLottieTree(comp) {
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

	private createBatch(layers) {
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
			layer.visible = layer.parent.visible;
		}

		const o = layer.visible ? transform.o.v : 0;

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

	private matrix(out, transform, parentPivot?) {
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

	private transform(transform, parent?) {
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

	play() {
		this.isPlaying = true;
	}

	pause () {
		this.isPlaying = false;
	}

	onUpdate(deltaTime) {
		const time = this.direction * this.timeScale * deltaTime;

		if (!this.isPlaying) {
			return null;
		}

		this.frame += time / this.resource.timePerFrame;
		let isEnd = false;

		if (this.spill()) {
			const { duration } = this.resource;
			if (this.repeats > 0 || this.infinite) {
				if (this.repeats > 0) --this.repeats;
				if (this.alternate) {
					this.direction *= -1;
					this.frame = Tools.codomainBounce(this.frame, 0, duration);
				} else {
					this.direction = 1;
					this.frame = Tools.euclideanModulo(this.frame, duration);
				}
			} else {
				this.frame = Tools.clamp(this.frame, 0, duration);
				isEnd = true;
			}
		}

		const correctedFrame = this.resource.inPoint + this.frame;
		this.root.update(correctedFrame);

		this.updateLayers(this.layers);
	}

	/**
	 * is this time frame spill the range
	 */
	private spill(): boolean {
		const bottomSpill = this.frame <= 0 && this.direction === -1;
		const topSpill = this.frame >= this.resource.duration && this.direction === 1;
		return bottomSpill || topSpill;
	}
}