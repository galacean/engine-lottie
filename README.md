# Oasis Lottie

<a href="https://www.npmjs.com/package/@oasis-engine/lottie"><img src="https://img.shields.io/npm/v/@oasis-engine/lottie"/></a>
![npm-size](https://img.shields.io/bundlephobia/minzip/@oasis-engine/lottie)
![npm-download](https://img.shields.io/npm/dm/@oasis-engine/lottie)

This is a [lottie](https://airbnb.design/lottie/) runtime created by [oasis engine](https://github.com/oasis-engine/engine). Currently, It can only render **sprite elements** in the lottie tree. It is high-performance owing to drawing all sprites in batch, which is different from svg or canvas renderer of [lottie-web](https://github.com/airbnb/lottie-web).

## Features
- [x] Sprite element: transform and opacity animation.

#### TODO
- [ ] Sprite mask
- [ ] Shape element

## Usage

Before using the code below, you should merge the **assets** (base64 encoding strings) in lottie json to one sprite sheet. It's convenient to complete the task with tools like [TexturePacker](https://www.codeandweb.com/texturepacker) which will generate a atlas file and a sprite image.

```typescript
import { LottieRenderer } from "@oasis-engine/lottie";

// Load lottie json、atlas and image file with engine's `resourceManager`
engine.resourceManager.load({
  urls: [
    'https://gw.alipayobjects.com/os/bmw-prod/bf9346a5-8c25-48e2-b2c6-8a504707c8c7.json',
    'https://gw.alipayobjects.com/os/bmw-prod/083ff1ac-15d9-42cb-8d7a-5b7c39b81f5f.json',
    'https://gw.alipayobjects.com/mdn/rms_e54b79/afts/img/A*Ax4DSrekVhEAAAAAAAAAAAAAARQnAQ'
  ],
  type: 'lottie'
}).then((lottieEntity) => {
  // Add lottie entity created to scene 
  root.addChild(lottieEntity);

  // Get `LottieRenderer` component and play the animation
  const lottie = lottieEntity.getComponent(LottieRenderer);
  lottie.infinite = true;
  lottie.timeScale = 1;
  lottie.play();
});
```
## Install

```bash
npm i @oasis-engine/lottie --save
```

## Contributing
This project is [work-in-progress](https://github.com/orgs/oasis-engine/projects/1). Everyone is welcome to create issues or submit pull requests. Make sure to read the [Contributing Guide](https://github.com/oasis-engine/engine/blob/main/.github/HOW_TO_CONTRIBUTE.md) before submitting changes.

## Dev

1.Clone this repository and install the dependencies:

```bash
npm i
```

2.Run the example:

```bash
npm run example
```
## Links
- [Documentation](https://oasisengine.cn/0.4/docs/lottie-cn)
- [Examples](https://oasisengine.cn/0.4/examples#lottie)
## License

MIT
