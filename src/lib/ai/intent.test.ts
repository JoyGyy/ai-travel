import { describe, expect, it } from 'vitest';

import { classifyUserIntent } from './intent';

describe('classifyUserIntent 意图识别', () => {
  describe('日常咨询与旅行问答 (consultation)', () => {
    const consultationSamples = [
      '故宫周一开馆吗？门票怎么买？',
      '布达拉宫门票多少钱？需要提前几天预约？',
      '明天去西湖穿什么衣服合适？',
      '三亚有什么特色的海鲜和椰子鸡推荐？',
      '坐高铁能不能带防晒喷雾？',
      '去玉龙雪山会不会有高原反应？需要带氧气瓶吗？',
      '成都建设路小吃街营业时间到几点？',
      '东方明珠门票免费吗？',
      '你好，你是谁？你能帮我做什么？',
    ];

    it.each(consultationSamples)('能够正确识别咨询样本: %s', (sample) => {
      const result = classifyUserIntent(sample);
      expect(result.intent).toBe('consultation');
    });

    it('在同时包含天数但核心问天气时优先判定为咨询', () => {
      const result = classifyUserIntent('我打算去杭州3天，最近天气怎么样？');
      expect(result.intent).toBe('consultation');
      expect(result.detectedCity).toBe('杭州');
    });
  });

  describe('行程规划与路线定制 (itinerary)', () => {
    const itinerarySamples = [
      '帮我规划一个杭州三日游路线',
      '我们一家三口周末想去西安玩两天，带老人孩子',
      '我想去西湖、灵隐寺和宋城，顺路怎么规划游玩顺序？',
      '三亚四天三晚海岛度假行程安排',
      '成都大熊猫繁育研究基地和都江堰两天怎么玩？',
      '制定一份大理洱海自驾环湖一日游路书',
      '第一次去北京，5天4晚怎么安排游览路线？',
    ];

    it.each(itinerarySamples)('能够正确识别行程规划样本: %s', (sample) => {
      const result = classifyUserIntent(sample);
      expect(result.intent).toBe('itinerary');
    });

    it('正确提取目标城市', () => {
      expect(classifyUserIntent('三亚4日游路线安排').detectedCity).toBe('三亚');
      expect(classifyUserIntent('西安兵马俑两天行程').detectedCity).toBe(
        '西安',
      );
    });
  });

  describe('向导式澄清引导 (clarification)', () => {
    const clarificationSamples = [
      '杭州',
      '我想去成都',
      '三亚',
      '大理旅游',
      '去西安',
      '北京玩',
    ];

    it.each(clarificationSamples)('能够正确识别高模糊目的地并引导澄清: %s', (sample) => {
      const result = classifyUserIntent(sample);
      expect(result.intent).toBe('clarification');
      expect(result.detectedCity).toBeTruthy();
    });
  });
});
