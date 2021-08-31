# Oasis Lottie

<a href="https://www.npmjs.com/package/@oasis-engine/lottie"><img src="https://img.shields.io/npm/v/@oasis-engine/lottie"/></a>
![npm-size](https://img.shields.io/bundlephobia/minzip/@oasis-engine/lottie)
![npm-download](https://img.shields.io/npm/dm/@oasis-engine/lottie)

This is a [lottie](https://airbnb.design/lottie/) runtime created by [oasis engine](https://github.com/oasis-engine/engine). Currently, It can only render **sprite elements** in the lottie tree. It is high-performance owing to drawing all sprites in batch, which is different from svg or canvas renderer of [lottie-web](https://github.com/airbnb/lottie-web).

## Features
- [x] Sprite element: transform and opacity animation.
- [x] 3D rotation: rotate element in 3D space.

#### TODO
- [ ] Sprite mask
- [ ] Shape element

## Usage

Before using the code below, you should merge the **assets** (base64 encoding strings) in lottie json to one sprite atlas. It's convenient to complete the task with tools like [tool-atlas-lottie](https://www.npmjs.com/package/@oasis-engine/tool-atlas-lottie) which will generate a folder which contains three files: a processed lottie JSON file, an atlas file and an image.

```typescript
import { LottieAnimation } from "@oasis-engine/lottie";

// Load lottie json、atlas and image file with engine's `resourceManager`
engine.resourceManager.load({
  urls: [
    'https://gw.alipayobjects.com/os/bmw-prod/9ad65a42-9171-47ab-9218-54cf175f6201.json',
    'https://gw.alipayobjects.com/os/bmw-prod/58cde292-8675-4299-b400-d98029b48ac7.atlas',
  ],
  type: 'lottie'
}).then((lottieEntity) => {
  // Add lottie entity created to scene 
  root.addChild(lottieEntity);

  // Get `LottieAnimation` component and play the animation
  const lottie = lottieEntity.getComponent(LottieAnimation);
  lottie.isLooping = true;
  lottie.speed = 1;
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
