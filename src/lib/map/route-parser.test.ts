import { describe, expect, it } from 'vitest';
import { parseItineraryFromMarkdown } from './route-parser';

describe('route-parser', () => {
  it('应该能正确从包含箭头链的文本提取景点和路线', () => {
    const text = `
# 大理洱海环湖攻略
🌟 【行程亮点与核心建议】：建议逆时针自驾环湖。
🗺️ 【详细游览路线】：大理古城 → 喜洲古镇 → 双廊古镇 → 挖色镇 → 海东镇。
🍜 【地道美食打卡】：
- 喜洲粑粑
- 白族酸辣鱼
💡 【交通与避坑指南】：
> 💡 上午海西顺光拍照，下午海东临水观日落。
`;
    const parsed = parseItineraryFromMarkdown(text);
    expect(parsed.city).toBe('大理');
    expect(parsed.transportMode).toBe('driving');
    expect(parsed.spots.map((s) => s.name)).toEqual([
      '大理古城',
      '喜洲古镇',
      '双廊古镇',
      '挖色镇',
      '海东镇',
    ]);
    expect(parsed.food).toContain('喜洲粑粑');
    expect(parsed.tips.length).toBeGreaterThan(0);
  });

  it('应该能正确处理列表项格式并识别成都', () => {
    const text = `
成都大熊猫与美食漫游：
- 大熊猫繁育研究基地
- 杜甫草堂
- 宽窄巷子
- 奎星楼街
推荐乘坐地铁或公交前往。
`;
    const parsed = parseItineraryFromMarkdown(text);
    expect(parsed.city).toBe('成都');
    expect(parsed.transportMode).toBe('transit');
    expect(parsed.spots.length).toBeGreaterThanOrEqual(3);
  });

  it('应该能准确过滤「预算分配、核心体验、最佳季节」等非景点元数据，仅提取真实武汉景点', () => {
    const text = `
【武汉】打卡路线规划
1. 预算分配：人均约 500-800 元
2. 核心体验：登黄鹤楼远眺长江大桥，漫步昙华林文艺街区
3. 最佳季节：3-5月赏樱或9-11月秋高气爽
4. 户部巷：清晨过早热干面与三鲜豆皮
5. 黄鹤楼：上午登楼俯瞰江城胜景
6. 辛亥革命博物馆：午后瞻仰红楼历史
7. 粮道街：傍晚寻味赵师傅油饼包烧麦
8. 昙华林：夜间漫步文艺咖啡小店
`;
    const parsed = parseItineraryFromMarkdown(text);
    expect(parsed.city).toBe('武汉');
    expect(parsed.spots.map((s) => s.name)).toEqual([
      '户部巷',
      '黄鹤楼',
      '辛亥革命博物馆',
      '粮道街',
      '昙华林',
    ]);
    expect(parsed.spots.map((s) => s.name)).not.toContain('预算分配');
    expect(parsed.spots.map((s) => s.name)).not.toContain('核心体验');
    expect(parsed.spots.map((s) => s.name)).not.toContain('最佳季节');
  });

  it('应该能从时间段前缀（如 早晨：户部巷）中正确提取冒号后的真实景点名称', () => {
    const text = `
武汉经典一日慢游：
* **早晨**：户部巷（汉味早点）
* **上午**：黄鹤楼（登楼望江）
* **下午**：辛亥革命博物馆（首义红楼）
* **傍晚**：粮道街（特色小吃）
* **夜间**：昙华林（老建筑漫步）
`;
    const parsed = parseItineraryFromMarkdown(text, '武汉');
    expect(parsed.spots.map((s) => s.name)).toEqual([
      '户部巷',
      '黄鹤楼',
      '辛亥革命博物馆',
      '粮道街',
      '昙华林',
    ]);
  });

  it('应该能正确解析多日行程分片 (Day 1, Day 2, Day 3)', () => {
    const text = `
# 杭州3天2晚慢游手账

## Day 1: 西湖环湖经典，从断桥到雷峰塔
* 上午：断桥残雪
* 中午：白堤
* 下午：平湖秋月
* 傍晚：雷峰塔

## Day 2: 灵隐禅意与茶乡漫游
* 上午：灵隐寺
* 下午：龙井村

## Day 3: 运河历史文化寻踪
* 上午：拱宸桥
* 下午：西溪湿地
`;
    const parsed = parseItineraryFromMarkdown(text, '杭州');
    expect(parsed.city).toBe('杭州');
    expect(parsed.days.length).toBe(3);
    expect(parsed.days[0].day).toBe(1);
    expect(parsed.days[0].spots.map((s) => s.name)).toEqual([
      '断桥残雪',
      '白堤',
      '平湖秋月',
      '雷峰塔',
    ]);
    expect(parsed.days[1].day).toBe(2);
    expect(parsed.days[1].spots.map((s) => s.name)).toEqual([
      '灵隐寺',
      '龙井村',
    ]);
    expect(parsed.days[2].day).toBe(3);
    expect(parsed.days[2].spots.map((s) => s.name)).toEqual([
      '拱宸桥',
      '西溪湿地',
    ]);
    // 验证全量扁平列表兼容性
    expect(parsed.spots.length).toBe(8);
  });

  it('应该能彻底清洗景点名称中的脚注引用[^9]、时间戳及孤立残留数字', () => {
    const text = `
杭州西湖精选游：
1. **白堤**
2. **平湖秋月**
3. **孤山**[^9]
4. **花港观鱼**
5. **雷峰塔** [16]
6. **深潭口** (16:00)
`;
    const parsed = parseItineraryFromMarkdown(text, '杭州');
    expect(parsed.spots.map((s) => s.name)).toEqual([
      '白堤',
      '平湖秋月',
      '孤山',
      '花港观鱼',
      '雷峰塔',
      '深潭口',
    ]);
    expect(parsed.spots.map((s) => s.name)).not.toContain('孤山9');
    expect(parsed.spots.map((s) => s.name)).not.toContain('雷峰塔16');
  });

  it('对于常规日常问答（如开放时间/门票政策），不应误判为游览路线，不应生成连线与虚假站点', () => {
    const text = `
# 故宫开放时间与门票预约指南
📌 【核心答案 / 重点速览】：故宫博物院每周一全天闭馆（法定节假日除外）。旺季（4月1日-10月31日）门票 60 元/人，淡季 40 元/人。

💡 【实用细节与避坑贴士】：
- 故宫需提前 7 天通过官方小程序预约购票，现场不设人工售票窗口。
- 如果周一在京，建议前往天坛公园、颐和园或景山公园，这些市属公园周一均正常开放。
- 建议从午门进入参观，神武门离开。
`;
    const parsed = parseItineraryFromMarkdown(text, '北京');
    expect(parsed.city).toBe('北京');
    expect(parsed.isItinerary).toBe(false);
    expect(parsed.spots).toEqual([]);
    expect(parsed.days).toEqual([]);
    expect(parsed.routeString).toBe('');
    expect(parsed.summary).toContain('故宫博物院每周一全天闭馆');
    expect(parsed.tips.length).toBeGreaterThan(0);
  });

  it('对于纯美食小吃推荐，不应误判为游览路线，但应正确保留美食推荐列表', () => {
    const text = `
# 三亚特色美食打卡清单
🍜 【地道美食打卡】：
- 椰子鸡
- 清补凉
- 抱罗粉
- 糟粕醋火锅

💡 【避坑贴士】：
- 尽量选择明码标价的连锁店，第一市场吃海鲜建议自带小秤。
`;
    const parsed = parseItineraryFromMarkdown(text, '三亚');
    expect(parsed.city).toBe('三亚');
    expect(parsed.isItinerary).toBe(false);
    expect(parsed.spots).toEqual([]);
    expect(parsed.days).toEqual([]);
    expect(parsed.routeString).toBe('');
    expect(parsed.food).toContain('椰子鸡');
    expect(parsed.food).toContain('清补凉');
  });
});
