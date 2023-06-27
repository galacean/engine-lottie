import CompLottieElement from "./element/CompLottieElement";
import SpriteLottieElement from "./element/SpriteLottieElement";
import Tools from "./tools";
import { Script, Vector2, ignoreClone, Entity, Layer, Engine, SpriteRenderer } from "@galacean/engine";
import { LottieResource, TypeAnimationClip } from "./LottieResource";
import BaseLottieLayer from "./element/BaseLottieElement";

export class LottieAnimation extends Script {
  private static _pivotVector: Vector2 = new Vector2();
  private static _tempRenderers: Array<SpriteRenderer> = [];

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
  // @ts-ignore
  pixelsPerUnit: number = Engine._pixelsPerUnit;

  private _width: number;
  private _height: number;
  private _isPlaying: boolean = false;
  private _frame: number = 0;
  private _resource: LottieResource;
  private _priority: number = 0;
  private _priorityDirty: boolean = true;
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
      this._destroy();
    }

    this._resource = value;
    if (value) {
      this._width = value.width;
      this._height = value.height;
      this._clips = value.clips;

      this._createElements(value);
      this._priorityDirty = true;
    }

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

  set priority(value: number) {
    if (this._priority !== value) {
      this._priority = value;
      this._priorityDirty = true;
    }
  }

  get priority(): number {
    return this._priority;
  }

  set autoPlay(value: boolean) {
    this._autoPlay = value;

    if (value) {
      this.play();
    }
  }

  get autoPlay(): boolean {
    return this._autoPlay
  }

  get frame(): number {
    return this._frame;
  }

  /**
   * Play the lottie animation
   */
  play(name?: string): Promise<any> {
    if (name) {
      const clip = this._clips[name];
      this._clip = clip;
    } else {
      this._clip = null;
    }

    this._isPlaying = true;
    this._frame = 0;

    return new Promise((resolve) => {
      if (name) {
        this._clipEndCallbacks[name] = resolve;
      } else {
        this._clipEndCallbacks["ALL"] = resolve;
      }
    });
  }

  /**
   * Pause the lottie animation
   */
  pause(): void {
    this._isPlaying = false;
  }

  /**
   * Set layer of rendering
   * @param entity The entity lottie component belongs to
   * @param layer Layer of rendering
   */
  setLayer(layer: Layer, entity?: Entity) {
    if (!entity) {
      entity = this.entity;
    }

    entity.layer = layer;
    const children = entity.children;

    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      child.layer = layer;
      this.setLayer(layer, child);
    }
  }

  private _createLayerElements(layers, elements, parent, isCloned?: boolean) {
    for (let i = 0, l = layers.length; i < l; i++) {
      const layer = layers[i];
      let element = null;

      if (layer.td !== undefined) continue;

      const treeIndex = parent.treeIndex.concat(i);

      let childEntity: Entity = isCloned && this._findEntityInTree(treeIndex);

      switch (layer.ty) {
        case 0:
          element = new CompLottieElement(layer, this.engine, childEntity, layer.id);
          break;

        case 2:
          element = new SpriteLottieElement(layer, this._resource.atlas, this.entity, childEntity);

          break;

        case 3:
          if (layer?.ks?.o?.k === 0) {
            layer.ks.o.k = 100;
          }

          element = new CompLottieElement(layer, this.engine, childEntity, layer.id);

          break;
      }

      if (element) {
        element.treeIndex = treeIndex;

        elements.push(element);
        parent.addChild(element);
        if (layer.layers) {
          this._createLayerElements(layer.layers, elements, element, isCloned);
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
      } else {
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

    this._createLayerElements(layers, elements, root, isCloned);

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
    let o = transform.o.v;
    const { pixelsPerUnit } = this;

    let x: number = 0,
      y: number = 0,
      z: number = 0;

    if (transform.p) {
      const p = transform.p.v;
      x = p[0];
      y = p[1];
      z = p[2];
    } else {
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
      rz = transform.r.v;
    }
    // 3d rotation
    else if (transform.rx || transform.ry || transform.rz) {
      rx = transform.rx ? transform.rx.v : 0;
      ry = transform.ry ? transform.ry.v : 0;
      rz = transform.rz ? transform.rz.v : 0;
    } else if (transform.or) {
      const { v } = transform.or;
      rx = v[0];
      ry = v[1];
      rz = v[2];
    }

    // parent opacity
    if (parent?.transform?.o) {
      o *= parent?.transform.o.v;
    }

    if (sprite) {
      // update color of sprite
      const { r, g, b } = spriteRenderer.color;
      spriteRenderer.color.set(r, g, b, o);

      // update pixels per unit of sprite
      sprite.pixelsPerUnit = pixelsPerUnit;

      // update pivot of sprite
      sprite.pivot = LottieAnimation._pivotVector.set(a[0] / width, (height - a[1]) / height);
    }

    entity.isActive = layer.visible;

    // scale
    entityTransform.setScale(s[0], s[1], s[2]);
    entityTransform.setRotation(rx, ry, -rz);

    // anchor
    if (parent?.transform?.a) {
      entityTransform.setPosition(
        (x - parent.transform.a.v[0]) / pixelsPerUnit,
        (-y + parent.transform.a.v[1]) / pixelsPerUnit,
        z / pixelsPerUnit
      );
    } else {
      entityTransform.setPosition(
        (x - this._width / 2) / pixelsPerUnit,
        (-y + this._height / 2) / pixelsPerUnit,
        z / pixelsPerUnit
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

    if (this._priorityDirty) {
      this._priorityDirty = false;
      const renderers = LottieAnimation._tempRenderers;
      renderers.length = 0;
      this.entity.getComponentsIncludeChildren(SpriteRenderer, renderers);
      // global priority 的差值
      let priorityDiff = 0;
      for (let i = 0, l = renderers.length; i < l; ++i) {
        const renderer = renderers[i];
        if (i === 0) {
          // this._priority 表示 global priority，Math.floor(renderer.priority) 取出当前 global priority
          priorityDiff = this._priority - Math.floor(renderer.priority);
        }
        renderer.priority = renderer.priority + priorityDiff;
      }
    }

    const time = this.direction * this.speed * deltaTime * 1000;
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
          } else {
            this._frame = Tools.codomainBounce(this._frame, 0, duration);
          }
        } else {
          this.direction = 1;
          if (clip) {
            this._frame = Tools.euclideanModulo(this._frame, clip.end - clip.start);
          } else {
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
        } else {
          if (this._frame >= duration) {
            const endCallback = this._clipEndCallbacks["ALL"];
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
    } else {
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
    } else {
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

  private _destroy() {
    const elements = this._elements;
    if (elements) {
      for (let i = 0, l = elements.length; i < l; i++) {
        elements[i].destroy();
      }
    }
  }

  onDestroy(): void {
    this._destroy();
  }
}
