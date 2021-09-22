import { CompLottieElement, SpriteLottieElement, Tools } from "./core";
import { Script, Vector2, SpriteRenderer, BoundingBox, ignoreClone } from "oasis-engine";
import { LottieResource } from "./LottieResource";
import BaseLottieLayer from "./core/element/BaseLottieElement";

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
	private _root: CompLottieElement = null;
	@ignoreClone
	private _elements: BaseLottieLayer[];

	set res(value: LottieResource) {
		this._resource = value;
		this._width = value.width;
		this._height = value.height;

		this._createElements(value);

		// update the first frame
		this.play();
		this.onUpdate(0);
		this.pause();
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

	private _createElements<T extends BaseLottieLayer>(value) {
		const root = new CompLottieElement(value, value.name, this.engine, this.entity);
		this._root = root;

		const { layers } = root;
		const elementsMap = {};
		const children = [];

		const mergeBounds = new BoundingBox();
		const minValue = Number.MIN_SAFE_INTEGER;
		const maxValue = Number.MAX_SAFE_INTEGER;
		mergeBounds.min.setValue(maxValue, maxValue, maxValue);
		mergeBounds.max.setValue(minValue, minValue, minValue);

		for (let i = layers.length - 1; i >= 0; i--) {
			const layer = layers[i];
			let element = null;

			if (layer.td !== undefined) continue;

			switch (layer.ty) {
				case 0:
					layer.id = layer.refId ? `layer_${layer.refId}` : `layer_${layer.nm}_${layer.ind}`;
					element = new CompLottieElement(layer, layer.id, this.engine);
					break;
				case 2:
					if (!layer.id) {
						layer.id = layer.ind;
					}

					element = new SpriteLottieElement(layer, this._resource.atlas, this.entity, i);

					const curBounds = element.sprite.bounds;
					BoundingBox.merge(curBounds, mergeBounds, mergeBounds);
					const spriteRenderer = element.entity.getComponent(SpriteRenderer);
					spriteRenderer._customLocalBounds = mergeBounds;

					break;
			}

			if (element) {
				elementsMap[layer.id] = element;

				if (layer.parent) {
					children.push(layer);
				}
				else {
					root.addChild(element);
				}

			}
		}

		for (let i = 0, l = children.length; i < l; i++) {
			const layer = children[i];
			const { parent } = layer;

			if (elementsMap[parent]) {
				elementsMap[parent].addChild(elementsMap[layer.id]);
			}
		}

		const elements: T[] = Object.values(elementsMap);
		this._elements = elements;
	}

	private _updateElements(correctedFrame: number): void {
		this._root.update(correctedFrame);

		const elements = this._elements;

		for (let i = 0, l = elements.length; i < l; i++) {
			const layer = elements[i];

			this._updateElement(layer);
		}
	}

	private _updateElement<T extends BaseLottieLayer>(layer: T) {
		// @ts-ignore
		const { transform, entity, sprite, spriteRenderer, parent, width, height } = layer;
		const entityTransform = entity.transform;
		const a = transform.a.v;
		const s = transform.s.v;
		const p = transform.p.v;
		const o = layer.visible ? transform.o.v : 0;
		const pixelsPerUnit = sprite ? sprite.pixelsPerUnit : 128;

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

		if (sprite) {
			spriteRenderer.color.setValue(1, 1, 1, o);
			sprite.pivot = new Vector2(a[0] / width, (height - a[1]) / height);
		}

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
		if (!this._isPlaying) {
			return null;
		}

		const time = this.direction * this.speed * deltaTime;
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

		this._updateElements(this._resource.inPoint + this._frame);
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
		target._createElements(this._resource);
	}
}
