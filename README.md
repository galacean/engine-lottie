# Galacean Lottie

<a href="https://www.npmjs.com/package/@galacean/engine-lottie"><img src="https://img.shields.io/npm/v/@galacean/engine"/></a>
![npm-size](https://img.shields.io/bundlephobia/minzip/@galacean/engine-lottie)
![npm-download](https://img.shields.io/npm/dm/@galacean/engine-lottie)

This is a [lottie](https://airbnb.design/lottie/) runtime created by [Galacean Engine](https://github.com/galacean/engine). Currently, It can only render **sprite elements** in the lottie tree. It is high-performance owing to drawing all sprites in batch, which is different from svg or canvas renderer of [lottie-web](https://github.com/airbnb/lottie-web). See more info: [documentation](hhttps://galacean.antgroup.com/#/docs/latest/cn/lottie).

## Features
- [x] Sprite element: transform and opacity animation.
- [x] Text element
- [x] 3D rotation: rotate element in 3D space.
- [x] Animation clip: play animation clip.

#### TODO
- [ ] Sprite mask
- [ ] Shape element
- [ ] Expression

## Usage

Before using the code below, you should transform original lottie JSON file ( images must be base64-encoding strings) to Galacean standard lottie files. It's convenient to complete the task with [tool-atlas-lottie](https://www.npmjs.com/package/@galacean/tool-atlas-lottie) which will generate a folder which contains three files: a processed lottie JSON file, an atlas file and an image.

```typescript
import { LottieAnimation } from "@galacean/engine-lottie";

// Load lottie json、atlas file with engine's `resourceManager`
engine.resourceManager.load({
  urls: [
    "https://gw.alipayobjects.com/os/bmw-prod/b46be138-e48b-4957-8071-7229661aba53.json",
    "https://gw.alipayobjects.com/os/bmw-prod/6447fc36-db32-4834-9579-24fe33534f55.atlas"
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
npm i @galacean/engine-lottie --save
```

## Contributing
This project is [work-in-progress](https://github.com/orgs/galacean/projects/1). Everyone is welcome to create issues or submit pull requests. Make sure to read the [Contributing Guide](https://github.com/galacean/engine/blob/main/.github/HOW_TO_CONTRIBUTE.md) before submitting changes.

## Dev

1.Clone this repository and install the dependencies:

```bash
npm i
```

2.Run the example:

```bash
npm run example
```
## License

MIT
