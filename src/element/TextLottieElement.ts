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
    const firstKeyframe: TypeTextKeyframe = layer?.t?.d?.k?.[0];
    const firstKeyframeStart = firstKeyframe.s;
    if (firstKeyframeStart) {
      const { t: text, f: font, s: fontSize, fc: fontColor, lh: lineHeight } = firstKeyframeStart;
      // 通过 font 设置 Font 对象
      textRenderer.font = Font.createFromOS(engine, font);
      // 通过 text 设置需要显示的文本
      textRenderer.text = text;
      // 通过 fontSize 设置字体大小
      textRenderer.fontSize = fontSize;
      // 通过 color 设置文本颜色
      textRenderer.color.set(fontColor[0], fontColor[1], fontColor[2], 1);
      // 通过 lineSpacing 设置行间距
      textRenderer.lineSpacing = lineHeight;
    } else {
      Logger.warn(`TextLottieElement: ${name} 未找到对应文字数据`);
    }

    textRenderer.priority = (Number.MAX_SAFE_INTEGER - this.index * 1000000) / Number.MAX_SAFE_INTEGER;
  }

  destroy() {
    super.destroy();
  }
}
