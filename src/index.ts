import { Loader } from 'oasis-engine';
import { LottieAnimation } from './LottieAnimation';

export { LottieAnimation } ;
export { LottieLoader } from "./LottieLoader";
export { EditorLottieLoader } from "./EditorLottieLoader";
export { LottieResource } from "./LottieResource";

Loader.registerClass("LottieAnimation", LottieAnimation);
