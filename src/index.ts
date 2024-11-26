import { Loader } from "@galacean/engine";
import { LottieAnimation } from "./LottieAnimation";

export { EditorLottieLoader } from "./EditorLottieLoader";
export { LottieLoader } from "./LottieLoader";
export { LottieResource } from "./LottieResource";
export { LottieAnimation };

Loader.registerClass("LottieAnimation", LottieAnimation);
