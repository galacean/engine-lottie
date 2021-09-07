import { CompLottieLayer, SpriteLottieLayer, Tools } from "./core";
import { Script, Vector2, SpriteRenderer, BoundingBox, ignoreClone, deepClone, Entity } from "oasis-engine";
import { LottieResource } from "./LottieResource";
import BaseLottieLayer from "./core/layer/BaseLottieLayer";

export { LottieLoader } from "./LottieLoader";

export class LottieAnimation extends Script {
	/** The number of units in world space that correspond to one pixel in the sprite. */
	/** Repeat times of the animation. */
	repeats: number = 0;
	/** whether the animation loop or not. */
	isLooping: boolean = false;
	/** whether the animation play back and forth */
	isAlternate: boolean = false;
	/** The direction of animation, 1 means play for */
	direction: 1 | -1 = 1;
	speed: number = 1;

	private _width: number;
	private _height: number;
	private _isPlaying: boolean = false;
	private _frame: number = 0;

	private _resource: LottieResource;

	@ignoreClone
	private _root: CompLottieLayer = null;
	@ignoreClone
	private _layers: (SpriteLottieLayer | CompLottieLayer)[];

	set res(value: LottieResource) {
		this._resource = value;
		this._width = value.width;
		this._height = value.height;

		this._root = new CompLottieLayer(value);
		this._layers = this._buildLottieTree(this._root);

		this._createLayers(this._layers);
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
		const lottieLayers = comp.layer;
		const layersMap = {};
		let children = [];

		for (let i = lottieLayers.length - 1; i >= 0; i--) {
			const layer = lottieLayers[i];
			let element = null;

			if (layer.td !== undefined) continue;

			switch (layer.ty) {
				case 0:
					element = new CompLottieLayer(layer);
					children.push(element);
					break;
				case 2:
					element = new SpriteLottieLayer(layer, this._resource.atlas, this.entity, i);
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

		for (let i = 0, l = children.length; i < l; i++) {
			const layer = children[i];
			const { parent } = layer;

			if (layersMap[parent]) {
				layersMap[layer.ind].parent = layersMap[parent];
			}
		}

		const layers: T[] = Object.values(layersMap);

		return layers;
	}

	private _updateLayers<T extends BaseLottieLayer>(layers: T[]): void {
		for (let i = 0, l = layers.length; i < l; i++) {
			const layer = layers[i];

			this._updateLayer(layer);
		}
	}

	private _createLayers(layers) {
		const mergeBounds = new BoundingBox();
		const minValue = Number.MIN_SAFE_INTEGER;
		const maxValue = Number.MAX_SAFE_INTEGER;
		mergeBounds.min.setValue(maxValue, maxValue, maxValue);
		mergeBounds.max.setValue(minValue, minValue, minValue);

		const len = layers.length;

		for (let i = 0; i < len; i++) {
			const layer = layers[i];

			const { sprite } = layer;
			this.entity.addChild(layer.entity);
			const curBounds = sprite.bounds;
			BoundingBox.merge(curBounds, mergeBounds, mergeBounds);
		}

		for (let i = 0; i < len; i++) {
			const layer = layers[i];

			if (layer.parent?.entity) {
				layer.entity.parent = layer.parent?.entity;
			}

			layer.entity.getComponent(SpriteRenderer)._customLocalBounds = mergeBounds;
		}
	}

	private _updateLayer<T extends BaseLottieLayer>(layer: T) {
		// @ts-ignore
		const { transform, entity, sprite, spriteRenderer, parent, width, height } = layer;
		const entityTransform = entity.transform;
		const a = transform.a.v;
		const s = transform.s.v;
		const p = transform.p.v;

		// TODO: if parent show
		if (layer.parent && layer.parent.transform) {
			layer.visible = layer.parent.visible;
		}

		const o = layer.visible ? transform.o.v : 0;
		const { pixelsPerUnit } = sprite;

		let rx = 0;
		let ry = 0;
		let rz = 0;

		// 2d rotation
		if (transform.r) {
			rz = -transform.r.v;
		}
		// 3d rotation
		else if (transform.rx || transform.ry) {
			rx = transform.rx ? transform.rx.v : 0;
			ry = transform.ry ? transform.ry.v : 0;
			rz = transform.rz ? transform.rz.v : 0;
		} else if (transform.or) {
			const { v } = transform.or;
			rx = v[0];
			ry = v[1];
			rz = v[2];
		}

		spriteRenderer.color.setValue(1, 1, 1, o);

		sprite.pivot = new Vector2(a[0] / width, (height - a[1]) / height);

		entityTransform.setScale(s[0], s[1], 1);

		entityTransform.setRotation(rx, ry, rz);

		if (parent?.transform?.a) {
			entityTransform.setPosition(
				(p[0] - parent.transform.a.v[0]) / pixelsPerUnit,
				(-p[1] + parent.transform.a.v[1]) / pixelsPerUnit,
				p[2] / pixelsPerUnit,
			);
		} else {
			entityTransform.setPosition(
				(p[0] - this._width / 2) / pixelsPerUnit,
				(-p[1] + this._height / 2) / pixelsPerUnit,
				p[2] / pixelsPerUnit,
			);
		}
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

	/**
	 * @override
	 * @param target 
	 */
	_cloneTo(target) {
		target._root = new CompLottieLayer(this.res);
		target._layers = target._buildLottieTree(target._root);
		target._createLayers(target._layers);
	}
}
