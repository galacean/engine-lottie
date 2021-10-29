import { CompLottieElement, SpriteLottieElement, Tools } from "./core";
import { Script, Vector2, BoundingBox, ignoreClone, Entity } from "oasis-engine";
import { LottieResource, TypeAnimationClip } from "./LottieResource";
import BaseLottieLayer from "./core/element/BaseLottieElement";

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
	private _clips: {};
	private _clip: TypeAnimationClip;
	private _clipEndCallbacks: Object = {};
	private _autoPlay: boolean = false;

	@ignoreClone
	private _root: CompLottieElement = null;
	@ignoreClone
	private _elements: BaseLottieLayer[];

	set resource(value: LottieResource) {
		if (this._resource) {
			this.pause();
			this._destroyElements();
		}

		this._resource = value;
		this._width = value.width;
		this._height = value.height;
		this._clips = value.clips;

		this._createElements(value);

		// update the first frame
		this.play();
		this.onUpdate(0);

		if (!this.autoPlay) {
			this.pause();
		}
	}

	get resource(): LottieResource {
		return this._resource;
	}

	set autoPlay(value: boolean) {
		this._autoPlay = value;

		if (value) {
			this.play();
		}
	}

	get autoPlay(): boolean {
		return this._autoPlay;
	}

	/**
	 * Play the lottie animation
	 */
	play(name?: string): Promise<any> {
		if (name) {
			const clip = this._clips[name];
			this._clip = clip;
		}
		else {
			this._clip = null;
		}

		this._isPlaying = true;
		this._frame = 0;

		return new Promise((resolve) => {
			if (name) {
				this._clipEndCallbacks[name] = resolve;
			}
			else {
				this._clipEndCallbacks['ALL'] = resolve;
			}
		})
	}

	/**
	 * Pause the lottie animation
	 */
	pause(): void {
		this._isPlaying = false;
	}

	private _createLayerElements(layers, mergeBounds, elements, parent, indexUnit: number = 1, isCloned?: boolean) {
		for (let i = 0, l = layers.length; i < l; i++) {
			const layer = layers[i];
			let element = null;

			if (layer.td !== undefined) continue;

			const treeIndex = parent.treeIndex.concat(i);

			let childIndexUnit = indexUnit;

			// Calculate the index of layer in composition
			if (layers.isComp) {
				layer.ind = parent.index - (l - 1 - i) * indexUnit / l;
				childIndexUnit = indexUnit / l;
			}

			let childEntity: Entity = isCloned && this._findEntityInTree(treeIndex);

			switch (layer.ty) {
				case 0:
					element = new CompLottieElement(layer, this.engine, childEntity, layer.id);
					break;

				case 2:
					element = new SpriteLottieElement(layer, this._resource.atlas, this.entity, childEntity);

					const curBounds = element.sprite.bounds;
					BoundingBox.merge(curBounds, mergeBounds, mergeBounds);
					element.spriteRenderer._customLocalBounds = mergeBounds;

					break;

				case 3:
					if (layer?.ks?.o?.k === 0) {
						layer.ks.o.k = 100;
					}

					element = new CompLottieElement(layer, this.engine, undefined, layer.id);

					break;
			}

			if (element) {
				element.treeIndex = treeIndex;

				elements.push(element);
				parent.addChild(element);
				if (layer.layers) {
					this._createLayerElements(layer.layers, mergeBounds, elements, element, childIndexUnit, isCloned);
				}
			}
		}
	}

	private _findEntityInTree(treeIndex) {
		let childEntity: Entity;

		for (let i = 0, l = treeIndex.length; i < l; i++) {
			const index = treeIndex[i];

			if (childEntity) {
				childEntity = childEntity.children[index];
			}
			else {
				childEntity = this.entity.children[index];
			}
		}

		return childEntity;
	}

	private _createElements(value, isCloned?: boolean) {
		const root = new CompLottieElement(value, this.engine, this.entity);
		this._root = root;

		const { layers } = root;

		const elements = [];

		const mergeBounds = new BoundingBox();
		const minValue = Number.MIN_SAFE_INTEGER;
		const maxValue = Number.MAX_SAFE_INTEGER;
		mergeBounds.min.setValue(maxValue, maxValue, maxValue);
		mergeBounds.max.setValue(minValue, minValue, minValue);

		this._createLayerElements(layers, mergeBounds, elements, root, 1, isCloned);

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
		const o = transform.o.v;
		const pixelsPerUnit = sprite ? sprite.pixelsPerUnit : 128;

		let x: number = 0, y: number = 0, z: number = 0;

		if (transform.p) {
			const p = transform.p.v;
			x = p[0];
			y = p[1];
			z = p[2];
		}
		else {
			if (transform.x) {
				x = transform.x.v;
			}

			if (transform.y) {
				y = transform.y.v;
			}

			if (transform.z) {
				z = transform.z.v;
			}
		}

		let rx = 0;
		let ry = 0;
		let rz = 0;

		if (!layer.visible) {
			entity.isActive = layer.visible;
			return;
		}

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

		entity.isActive = layer.visible;

		entityTransform.setScale(s[0], s[1], s[2]);
		entityTransform.setRotation(rx, ry, rz);

		if (parent?.transform?.a) {
			entityTransform.setPosition(
				(x - parent.transform.a.v[0]) / pixelsPerUnit,
				(-y + parent.transform.a.v[1]) / pixelsPerUnit,
				z / pixelsPerUnit,
			);
		} else {
			entityTransform.setPosition(
				(x - this._width / 2) / pixelsPerUnit,
				(-y + this._height / 2) / pixelsPerUnit,
				z / pixelsPerUnit,
			);
		}
	}

	private _resetElements() {
		const elements = this._elements;

		for (let i = 0, l = elements.length; i < l; i++) {
			elements[i].reset();
		}
	}

	/**
	 * @override
	 */
	onUpdate(deltaTime: number): void {
		if (!this._isPlaying || !this._resource) {
			return null;
		}

		const time = this.direction * this.speed * deltaTime;
		this._frame += time / this._resource.timePerFrame;
		const clip = this._clip;

		if (this._spill()) {
			const { duration } = this._resource;
			this._resetElements();

			if (this.repeats > 0 || this.isLooping) {
				if (this.repeats > 0) {
					--this.repeats;
				}

				if (this.isAlternate) {
					this.direction *= -1;
					if (clip) {
						this._frame = Tools.codomainBounce(this._frame, 0, clip.end - clip.start);
					}
					else {
						this._frame = Tools.codomainBounce(this._frame, 0, duration);
					}
				} else {
					this.direction = 1;
					if (clip) {
						this._frame = Tools.euclideanModulo(this._frame, clip.end - clip.start);
					}
					else {
						this._frame = Tools.euclideanModulo(this._frame, duration);
					}
				}
			} else {
				if (clip) {
					if (this._frame >= clip.end - clip.start) {
						const endCallback = this._clipEndCallbacks[clip.name];
						if (endCallback) {
							endCallback(clip);
						}
					}

					this._frame = Tools.clamp(this._frame, 0, clip.end - clip.start);
				}
				else {
					if (this._frame >= duration) {
						const endCallback = this._clipEndCallbacks['ALL'];
						if (endCallback) {
							endCallback();
						}
					}

					this._frame = Tools.clamp(this._frame, 0, duration);
				}
			}
		}

		if (clip) {
			this._updateElements(this._resource.inPoint + this._frame + clip.start);
		}
		else {
			this._updateElements(this._resource.inPoint + this._frame);
		}
	}

	/**
	 * is this time frame spill the range
	 */
	private _spill(): boolean {
		let duration: number;

		if (this._clip) {
			const clip = this._clip;
			duration = clip.end - clip.start;
		}
		else {
			duration = this._resource.duration;
		}

		const bottomSpill = this._frame <= 0 && this.direction === -1;
		const topSpill = this._frame >= duration && this.direction === 1;
		return bottomSpill || topSpill;
	}

	/**
	 * @override
	 * @param target 
	 */
	_cloneTo(target) {
		target._createElements(this._resource, true);
	}

	private _destroyElements() {
		const elements = this._elements;

		for (let i = 0, l = elements.length; i < l; i++) {
			elements[i].destroy();
		}
	}
}
