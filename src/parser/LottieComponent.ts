import { Script, Entity, Parser } from "oasis-engine";
import { LottieAnimation } from "../LottieAnimation";

export class LottieComponent extends Script {
  private _resource: any;
  private _isLooping = true;
  private _speed = 1;

  onStart() {
    const lottieEntity: Entity = this._resource;
    if (!lottieEntity) return;
    const lottieAnimation = lottieEntity.getComponent(LottieAnimation);
    this.entity.addChild(lottieEntity);
    lottieAnimation.play();
  }

  get resource() {
    return this._resource;
  }

  set resource(r) {
    if (this._resource) {
      this._resource.parent = null;
    }
    this._resource = r;
    if (r) {
      this.onStart();
    }
  }

  get isLooping() {
    return this._isLooping;
  }

  set isLooping(value) {
    this._isLooping = value;
    const lottieEntity: Entity = this._resource;
    if (!lottieEntity) return;
    const lottieAnimation = lottieEntity.getComponent(LottieAnimation);
    lottieAnimation.isLooping = value;
  }

  get speed() {
    return this._speed;
  }

  set speed(value) {
    this._speed = value;
    const lottieEntity: Entity = this._resource;
    if (!lottieEntity) return;
    const lottieAnimation = lottieEntity.getComponent(LottieAnimation);
    lottieAnimation.speed = value;
  }

  onDestroy() {
    this._resource.parent = null;
  }
}

Parser.registerComponents("o3", {
  LottieComponent
});
