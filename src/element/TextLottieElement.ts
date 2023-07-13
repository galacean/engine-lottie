import { Entity, Font, Engine, TextRenderer, Logger } from "@galacean/engine";
import BaseLottieElement from "./BaseLottieElement";
import { TypeTextKeyframe } from "../LottieResource";

/**
 * @internal
 */
export default class TextLottieElement extends BaseLottieElement {
  constructor(layer, engine?: Engine, entity?: Entity, name?: string) {
    super(layer);

    if (entity) {
      this.entity = entity;
      if (name) {
        this.entity.name = name;
      }
    } else {
      this.entity = new Entity(engine, layer.nm);
    }
    const textRenderer = this.entity.addComponent(TextRenderer);
    const keyframes: TypeTextKeyframe[] = layer?.t?.d?.k;
    if (keyframes.length === 1) {
      // only one frame
      const firstKeyframeStart = keyframes?.[0]?.s;
      if (firstKeyframeStart) {
        const { t: text, f: font, s: fontSize, fc: fontColor, lh: lineHeight } = firstKeyframeStart;
        // set the Font object by font
        textRenderer.font = Font.createFromOS(engine, font);
        // set the text to be displayed by text
        textRenderer.text = text;
        // set the font size by fontSize
        textRenderer.fontSize = fontSize;
        // set the text color by color
        textRenderer.color.set(fontColor[0], fontColor[1], fontColor[2], 1);
        // set line spacing via lineSpacing
        textRenderer.lineSpacing = lineHeight;
      } else {
        Logger.warn(`TextLottieElement: ${name}, No corresponding text data found`);
      }
    } else {
      // TODO: multi keyframes
    }

    textRenderer.priority = (Number.MAX_SAFE_INTEGER - this.index * 1000000) / Number.MAX_SAFE_INTEGER;
  }
}
