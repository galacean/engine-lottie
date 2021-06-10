import {
	EngineObject,
	Texture2D
} from "oasis-engine";

export type Layer = {
	ddd: number;
	sr: number;
  st: number;
  nm: string;
  op: number;
  ks: any;
  ao: number;
  ip: any;
  ind: number;
  refId: string;
  tm: any;
  w: number;
  h: number;
	fr: number;
}

export type Res = {
	v: string;
	nm: string;
	ddd: number;
	fr: number;
	w: number;
	h: number;
	ip: number;
	op: number;
	layers: Layer[];
}
export class LottieResource extends EngineObject {
	duration: number;
	timePerFrame: number;
	texture: Texture2D;
	inPoint: number;
	outPoint: number;
	height: number;
	width: number; 
	version: string;
	layers: Layer[];
	atlas: any;

	constructor(engine, res: Res, atlas, texture) {
		super(engine);

		console.log('res:', res)
		console.log('atlas', atlas)

  	const { w, h, fr, ip, op, layers } = res;

		this.timePerFrame = 1000 / fr;
		this.duration = Math.floor(op - ip);
		this.width = w;
		this.height = h;
		this.inPoint = ip;
		this.outPoint = op;
		this.atlas = atlas;
		this.layers = layers;

		this.texture = texture;
	}

}