import { describe, expect, it } from 'vitest';

import {
  calculateThinkingDuration,
  extractModelReasoning,
  generateDynamicThinking,
} from './thinking-engine';

describe('thinking-engine 深度思考引擎', () => {
  describe('extractModelReasoning', () => {
    it('应该能正确从 <think> 标签中提取原生思考内容并净化正文', () => {
      const raw = `<think>
经过分析，用户想去杭州西湖游玩一天。
应推荐断桥、白堤、雷峰塔。
</think>
这里是为您制定的杭州一日游行程...`;

      const result = extractModelReasoning(raw);
      expect(result.reasoning).toContain('经过分析，用户想去杭州西湖游玩一天');
      expect(result.cleanText).toBe('这里是为您制定的杭州一日游行程...');
      expect(result.cleanText).not.toContain('<think>');
    });

    it('应该能正确从 AI SDK parts 中的 reasoning 提取思考内容', () => {
      const parts = [
        { reasoning: 'AI 正在推演三亚海棠湾与亚龙湾的路线...', type: 'reasoning' },
        { text: '三亚 3 日休闲游方案如下：', type: 'text' },
      ];
      const result = extractModelReasoning('三亚 3 日休闲游方案如下：', parts);
      expect(result.reasoning).toBe('AI 正在推演三亚海棠湾与亚龙湾的路线...');
      expect(result.cleanText).toBe('三亚 3 日休闲游方案如下：');
    });

    it('当既无 reasoning part 也无 think 标签时返回 null 并保持正文原样', () => {
      const raw = '这是普通的回答内容。';
      const result = extractModelReasoning(raw);
      expect(result.reasoning).toBeNull();
      expect(result.cleanText).toBe('这是普通的回答内容。');
    });
  });

  describe('generateDynamicThinking', () => {
    it('对于行程规划类问题，生成针对该城市与天数的拓扑与时序思考链', () => {
      const thinking = generateDynamicThinking({
        city: '上海',
        detectedSpots: ['外滩', '豫园', '东方明珠'],
        userPrompt: '安排一个上海3日游行程',
      });

      expect(thinking).toContain('上海');
      expect(thinking).toMatch(/3[天日]/);
      expect(thinking).toContain('行程画像建模');
      expect(thinking).toContain('地理空间聚类与拓扑验算');
      expect(thinking).toContain('时序平衡推演');
      expect(thinking).toContain('外滩');
    });

    it('对于向导式澄清引导（如 用户输入 你好 上海），生成向导澄清与决策链思考', () => {
      const thinking = generateDynamicThinking({
        city: '上海',
        userPrompt: '你好 上海',
      });

      expect(thinking).toContain('上海');
      expect(thinking).toContain('高模糊诉求');
      expect(thinking).toContain('严禁在要素缺失时胡乱拼接路线');
      expect(thinking).toContain('三维问询链');
    });

    it('对于日常单点问答（如 故宫开放时间），生成规则校验与风险预判思考', () => {
      const thinking = generateDynamicThinking({
        city: '北京',
        userPrompt: '故宫周一开门吗？门票需要提前几天预约？',
      });

      expect(thinking).toContain('北京');
      expect(thinking).toContain('景区开放时间与运营时效');
      expect(thinking).toContain('规则与知识库校验');
      expect(thinking).toContain('风险预判推演');
    });

    it('对于技术/编程等跨界话题（如 用户输入 我会写代码），生成业务重聚焦与友好承接思考', () => {
      const thinking = generateDynamicThinking({
        userPrompt: '我会写代码，对编程很感兴趣',
      });

      expect(thinking).toContain('意图探测与边界校验');
      expect(thinking).toContain('编程开发');
      expect(thinking).toContain('业务专长重聚焦');
    });
  });

  describe('calculateThinkingDuration', () => {
    it('传入明确耗时时优先使用显式毫秒数', () => {
      const duration = calculateThinkingDuration('提问', '回答', 3200);
      expect(duration).toBe(3200);
    });

    it('未传显式毫秒数时根据内容动态计算，不同提问计算出不同数值', () => {
      const d1 = calculateThinkingDuration('你好 上海', '这是简短问候');
      const d2 = calculateThinkingDuration('北京西安成都10日深度定制大攻略', '长篇大论的行程路线与详细安排内容'.repeat(10));

      expect(d1).toBeGreaterThanOrEqual(1200);
      expect(d2).toBeGreaterThanOrEqual(1200);
      // 两者计算出的毫秒数应当动态不同，不再死板固定 2400
      expect(d1).not.toBe(d2);
    });
  });
});
