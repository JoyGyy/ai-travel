/**
 * AI 咨询意图识别器
 * 区分用户输入是「行程规划 / 路线定制」还是「日常旅行问答 / 单点咨询」
 */

export type UserIntentType = 'itinerary' | 'consultation' | 'clarification';

export interface UserIntentResult {
  /** 识别出的意图类型 */
  intent: UserIntentType;
  /** 置信度 0 ~ 1 */
  confidence: number;
  /** 匹配到的意图特征原因 */
  reason: string;
  /** 识别到的目标城市（若有） */
  detectedCity?: string;
}

/** 常见城市列表，用于意图上下文提取 */
const CITIES = [
  '北京',
  '上海',
  '成都',
  '西安',
  '杭州',
  '三亚',
  '大理',
  '丽江',
  '厦门',
  '南京',
  '武汉',
  '重庆',
  '广州',
  '青岛',
  '苏州',
  '长沙',
  '昆明',
  '桂林',
  '洛阳',
  '敦煌',
  '九寨沟',
  '黄山',
  '张家界',
];

/** 强行程规划特征词汇与模式 */
const ITINERARY_PATTERNS: RegExp[] = [
  // 天数 / 日游模式：如 "3日游", "玩两天", "4天3晚", "三天两夜"
  /\d+\s*[天日步期周]/,
  /[一二两三四五六七八九十]\s*[天日步期周]/,
  /日游/,
  /天游/,
  /天.*[晚夜]/,
  /周末.*游/,

  // 行程 / 路线规划动作词
  /规划.*[行程路线攻略]/,
  /安排.*[行程路线]/,
  /制定.*[行程路线]/,
  /定制.*[行程路线]/,
  /路线推荐/,
  /路线规划/,
  /游览路线/,
  /旅游路线/,
  /行程规划/,
  /行程安排/,
  /路书/,

  // 游玩编排意图：如 "怎么玩", "怎么逛", "顺路怎么走", "游玩顺序", "先去哪再去哪"
  /怎么[逛玩安排]/,
  /如何[逛玩安排]/,
  /游览顺序/,
  /打卡顺序/,
  /怎么走.*顺路/,
  /顺路.*怎么/,
  /先去.*再去/,
  /串联.*景点/,
  /带[老人小孩娃父母].*[怎么玩|行程|玩几天]/,
];

/** 典型单点日常咨询特征（优先排除强行规划行程） */
const CONSULTATION_PATTERNS: RegExp[] = [
  // 开放与营业时间：如 "几点关门", "周一开不开", "开放时间", "营业时间"
  /开放时间/,
  /营业时间/,
  /几点.*[开闭关开门放]/,
  /周[一二三四五六日天].*[开闭关放]/,
  /星期[一二三四五六日天].*[开闭关放]/,
  /什么时候.*[开闭关门]/,

  // 门票与预约：如 "多少钱", "需要门票吗", "预约规则", "怎么买票"
  /门票.*[多少钱|价格|费用|免费|买|预[订约]|提前]/,
  /多少钱/,
  /要不要.*门票/,
  /要门票吗/,
  /免门票吗/,
  /需要.*预[订约]/,
  /怎么.*预[订约]/,
  /提前.*天.*预[订约]/,

  // 天气与穿衣装备：如 "天气怎么样", "穿什么衣服", "带什么防晒"
  /天气.*[怎么样|预报|冷不冷|热不热|下雨|穿什么]/,
  /穿什么/,
  /带什么.*[衣服|防晒|物品|装备|证件]/,
  /防晒.*[推荐|建议|注意]/,

  // 美食小吃与特定推荐：如 "有什么好吃的", "特色小吃", "哪家好吃"
  /好吃的/,
  /特色.*[美食|小吃|菜|特产|餐厅]/,
  /必吃.*[美食|小吃|榜]/,
  /哪家.*好吃/,
  /推荐.*[美食|小吃|餐厅|饭店]/,

  // 交通与行李规则：如 "怎么坐地铁", "高铁能带喷雾吗", "机场大巴"
  /能[带不]带/,
  /可不可以带/,
  /怎么坐.*[地铁|公交|大巴|轮渡|缆车]/,
  /机场到.*怎么走/,
  /怎么去/,

  // 身体与地理安全：如 "高反", "海拔多少", "适合孕妇吗", "危险吗"
  /高反/,
  /高原反应/,
  /海拔.*多少/,
  /注意.*什么/,
  /有什么.*[忌口|禁忌|避坑]/,
];

/**
 * 分析用户输入，判断其核心意图
 */
export function classifyUserIntent(prompt: string): UserIntentResult {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return {
      confidence: 0.5,
      intent: 'consultation',
      reason: '空输入默认归类为日常问答',
    };
  }

  // 1. 提取城市（若有）
  let detectedCity: string | undefined;
  for (const city of CITIES) {
    if (trimmed.includes(city)) {
      detectedCity = city;
      break;
    }
  }

  // 2. 检查强规划模式
  let itineraryScore = 0;
  for (const pattern of ITINERARY_PATTERNS) {
    if (pattern.test(trimmed)) {
      itineraryScore += 2;
    }
  }

  // 3. 检查单点咨询模式
  let consultationScore = 0;
  for (const pattern of CONSULTATION_PATTERNS) {
    if (pattern.test(trimmed)) {
      consultationScore += 2;
    }
  }

  // 4. 短文本且不包含行程编排动作的判定（如纯问题："三亚有椰子鸡吗？"、"西湖断桥要门票吗"）
  if (
    itineraryScore === 0 &&
    (trimmed.endsWith('？') ||
      trimmed.endsWith('?') ||
      trimmed.includes('吗') ||
      trimmed.includes('多少') ||
      trimmed.includes('怎么'))
  ) {
    consultationScore += 1;
  }

  // 5. 冲突权衡：如果既包含天数又属于问答，结合动词倾向判定
  // 例："去杭州3天，天气怎么样？" -> 用户主要问天气
  if (itineraryScore > 0 && consultationScore > 0) {
    if (/天气|穿什么|门票多少|几点关门/.test(trimmed)) {
      // 倾向于咨询
      return {
        confidence: 0.85,
        detectedCity,
        intent: 'consultation',
        reason:
          '虽含时间/天数词，但核心关注点为具体问答（天气/门票/开放时间等）',
      };
    }
    // 否则若有明显行程规划词，归为 itinerary
    return {
      confidence: 0.85,
      detectedCity,
      intent: 'itinerary',
      reason: '同时包含规划与细节诉求，判定为包含路线的综合行程规划',
    };
  }

  if (itineraryScore > consultationScore) {
    return {
      confidence: Math.min(0.95, 0.7 + itineraryScore * 0.1),
      detectedCity,
      intent: 'itinerary',
      reason: '命中行程天数、路线串联或游玩编排特征',
    };
  }

  // 6. 若包含目标城市，但既无明确行程天数/路线动作，又无具体单点问答特征（例如纯城市名“杭州”或“想去成都”）：
  // 判定为向导式澄清意图 (clarification)
  if (detectedCity && itineraryScore === 0 && consultationScore === 0) {
    return {
      confidence: 0.9,
      detectedCity,
      intent: 'clarification',
      reason: `用户输入了目的地【${detectedCity}】，缺少天数、同行人员或游玩风格等关键要素，需触发向导式澄清引导`,
    };
  }

  return {
    confidence: Math.min(0.95, 0.7 + consultationScore * 0.1),
    detectedCity,
    intent: 'consultation',
    reason: '命中单点问答、开放门票、美食或旅行贴士特征',
  };
}
