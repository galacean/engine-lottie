import {
  EngineObject,
  Texture2D
} from "oasis-engine";

export class LottieResource extends EngineObject {
	segments: any = {};
	beginFrame: number;
	endFrame: number;
	duration: number;
	assets: any;
	living: boolean = true;
	infinite: boolean = false;
	repeats: number = 0;
	alternate: boolean = false;
	wait: number = 0;
	delay: number = 0;
	overlapMode: boolean = false;
	timeScale: number = 1;
	frameNum: number = 0;
	isPaused: boolean = true;
	direction: number = 1;
	isDisplayLoaded: boolean = false;

	defaultSegment: any;
	segmentName: string;
	timePerFrame: number;

  w: number;
  h: number;
  textures: any = {};
  ip: number;
  op: number;
  st: number;
  res: any;

}