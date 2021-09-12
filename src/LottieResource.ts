import {
	Engine,
	EngineObject
} from "oasis-engine";

export type TypeLayer = {
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

export type TypeRes = {
	v: string;
	nm: string;
	ddd: number;
	fr: number;
	w: number;
	h: number;
	ip: number;
	op: number;
	layers: TypeLayer[];
}

/**
 * @internal
 */
export class LottieResource extends EngineObject {
	duration: number;
	timePerFrame: number;
	inPoint: number;
	outPoint: number;
	height: number;
	width: number; 
	layers: TypeLayer[];
	atlas: any;
	name: string;

	constructor(engine: Engine, res: TypeRes, atlas: any) {
		super(engine);

		this.timePerFrame = 1000 / res.fr;
		this.duration = Math.floor(res.op - res.ip);
		this.width = res.w;
		this.height = res.h;
		this.inPoint = res.ip;
		this.outPoint = res.op;
		this.atlas = atlas;
		this.layers = res.layers;
		this.name = res.nm;
	}

}