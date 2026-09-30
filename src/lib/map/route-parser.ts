/**
 * AI 旅行攻略路线与景点提取解析器
 */
import { lookupAttractionInfo } from './attraction-lookup';

export interface ParsedRouteSpot {
  address?: string;
  coverImage?: string;
  description?: string;
  durationText?: string;
  id?: string;
  name: string;
  openHours?: string;
  period?: '早晨' | '上午' | '中午' | '下午' | '傍晚' | '夜间' | '全天';
  priceText?: string;
  rating?: number;
  reviewCount?: number;
  ticketType?: 'free' | 'paid';
}

export interface ParsedDayRoute {
  day: number;
  spots: ParsedRouteSpot[];
  theme?: string;
  title: string;
}

export interface ParsedRouteData {
  city: string;
  days: ParsedDayRoute[];
  food: string[];
  isItinerary: boolean;
  routeString: string;
  spots: ParsedRouteSpot[];
  summary: string;
  tips: string[];
  transportMode: 'driving' | 'transit' | 'walking';
}

const COMMON_CITIES = [
  '成都',
  '大理',
  '杭州',
  '西安',
  '北京',
  '上海',
  '重庆',
  '厦门',
  '广州',
  '武汉',
  '青岛',
  '南京',
  '三亚',
  '苏州',
  '长沙',
  '昆明',
  '丽江',
  '桂林',
  '洛阳',
  '敦煌',
  '襄阳',
  '张家界',
  '黄山',
  '九寨沟',
];

/** 时间段或路线引导词前缀（真实景点位于冒号后） */
const TIME_OR_HEADER_PREFIXES = [
  /详细游览路线/,
  /游览路线/,
  /详细路线/,
  /路线推荐/,
  /打卡路线/,
  /游玩路线/,
  /景点打卡/,
  /游览行程/,
  /行程路线/,
  /^早晨$/,
  /^清晨$/,
  /^上午$/,
  /^中午$/,
  /^下午$/,
  /^傍晚$/,
  /^夜间$/,
  /^晚上$/,
  /^全天$/,
  /^首日$/,
  /^次日$/,
  /^第[一二三四五六七八九十\d]+天$/,
  /^Day\s*\d+$/i,
];

/** 意向询问、澄清引导及非景点问答句模式（绝对不能提取为景点） */
const INQUIRY_OR_QUESTION_PATTERNS: RegExp[] = [
  /[？?]/,
  /几天|几日|多长时间|何时|几号/,
  /和谁|同行|几人|人数|伴侣|情侣|亲子|带娃|长辈|独自/,
  /偏好|意向|需求|要求|节奏|风格|方向/,
  /预算|开销|花费|花销|价格|人均/,
  /打算|计划.*[去玩出]|选择|考虑|希望/,
  /怎么|如何|什么|哪些|哪种|去哪|怎样/,
  /点击下方|回复|补充.*信息|为你定制|为你规划|定制.*行程|生成.*行程/,
  /手账贴士|避坑指南|友好提醒|温馨提示|注意事项/,
];

/** 元数据/非景点版块及体验维度标签（如：预算、季节、体验、贴士、穿搭、分类维度等，整行不作为景点提取） */
const META_SECTION_PATTERNS: RegExp[] = [
  // 预算与费用
  /预算/,
  /费用/,
  /花费/,
  /花销/,
  /人均/,
  /门票/,
  /价格/,
  /开销/,
  /收费/,
  // 规划与概览
  /核心体验/,
  /核心建议/,
  /行程亮点/,
  /行程概览/,
  /行程规划/,
  /总体规划/,
  /亮点建议/,
  /玩法推荐/,
  /路线特色/,
  /体验/,
  /主题/,
  /概述/,
  /简介/,
  /背景/,
  /总结/,
  /结语/,
  /前言/,
  /说明/,
  /参考/,
  // 季节与时间
  /最佳季节/,
  /最佳时间/,
  /游玩时间/,
  /出行时间/,
  /适合季节/,
  /出游时间/,
  /建议季节/,
  /旅游季节/,
  /推荐季节/,
  /最佳月份/,
  /游玩天数/,
  /行程天数/,
  // 分类维度与体验主题（非实体景点）
  /经典地标/,
  /地标打卡/,
  /市井寻味/,
  /老街市井/,
  /老街寻味/,
  /自然风光/,
  /人文历史/,
  /历史人文/,
  /文化古迹/,
  /休闲度假/,
  /亲子游乐/,
  /特色体验/,
  /打卡胜地/,
  /网红打卡/,
  /夜游风光/,
  /夜生活/,
  /购物天地/,
  /漫步路线/,
  /游玩方向/,
  /出行规划/,
  /游玩节奏/,
  /同行人员/,
  /出行伙伴/,
  // 准备与穿搭
  /穿搭建议/,
  /装备清单/,
  /行前准备/,
  /行李准备/,
  /天气情况/,
  /穿衣指南/,
  /防晒/,
  /装备/,
  /打包/,
  /携带/,
  // 交通与出行
  /交通指南/,
  /交通方式/,
  /交通出行/,
  /如何到达/,
  /自驾路线/,
  /乘车路线/,
  /交通建议/,
  /大交通/,
  /市内交通/,
  /接驳/,
  /往返/,
  /租车/,
  /包车/,
  /换乘/,
  // 住宿
  /住宿推荐/,
  /住宿区域/,
  /酒店住宿/,
  /住宿建议/,
  /入住建议/,
  /推荐住宿/,
  /酒店推荐/,
  /民宿推荐/,
  // 贴士与避坑
  /避坑指南/,
  /注意事项/,
  /游玩贴士/,
  /温馨提示/,
  /防坑指南/,
  /特别提醒/,
  /行前须知/,
  /开放时间/,
  /预约方式/,
  /预约建议/,
  /安全提示/,
  // 美食非景点总称
  /地道美食/,
  /美食推荐/,
  /特色美食/,
  /特色小吃/,
  /美食品尝/,
  /美食打卡/,
  /必吃美食/,
  /餐饮推荐/,
  /餐厅推荐/,
];

function isTimeOrHeaderPrefix(name: string): boolean {
  if (!name) return false;
  return TIME_OR_HEADER_PREFIXES.some((p) => p.test(name));
}

function isMetaSection(name: string): boolean {
  if (!name) return false;
  return META_SECTION_PATTERNS.some((p) => p.test(name));
}

function isInquiryOrQuestion(text: string): boolean {
  if (!text) return false;
  return INQUIRY_OR_QUESTION_PATTERNS.some((p) => p.test(text));
}

/** 提取单个可能包含时间前缀的文本中的真实景点名称 */
function extractSpotCandidate(raw: string): string {
  if (!raw) return '';

  // 0. 若整句包含问询/引导/疑问特征，直接跳过
  if (isInquiryOrQuestion(raw)) {
    return '';
  }

  const cleaned = raw
    .replace(/\*\*/g, '')
    .replace(/\[\^?\d+\]/g, '')
    .replace(/（\s*\d{1,2}:\d{2}[^）]*）|\(\s*\d{1,2}:\d{2}[^)]*\)/g, '')
    .replace(/\b\d{1,2}:\d{2}\b/g, '')
    .trim();

  // 如果包含冒号（如 "早晨：户部巷" 或 "黄鹤楼：登楼远眺" 或 "1. 预算分配：100元"）
  if (cleaned.includes('：') || cleaned.includes(':')) {
    const parts = cleaned.split(/[：:]/);
    const titlePart = cleanSpotName(parts[0]);
    const contentPart = parts.slice(1).join('：').trim();

    // 1. 如果冒号前是元数据/非景点版块/分类维度或问句，整行废弃
    if (isMetaSection(titlePart) || isInquiryOrQuestion(titlePart)) {
      return '';
    }

    // 2. 如果冒号前是时间段或路线标题前缀（早晨、上午、详细游览路线等），真实景点在冒号后
    if (isTimeOrHeaderPrefix(titlePart)) {
      const candidateAfterColon = cleanSpotName(
        contentPart.split(/[（(，,。]/)[0],
      );
      return isValidSpotName(candidateAfterColon) ? candidateAfterColon : '';
    }

    // 3. 否则冒号前即为景点名称（如 "黄鹤楼：上午登楼远眺"）
    return isValidSpotName(titlePart) ? titlePart : '';
  }

  // 没有冒号的直接按括号/标点截取
  const candidate = cleanSpotName(cleaned.split(/[（(，,。]/)[0]);
  return isValidSpotName(candidate) ? candidate : '';
}

/** 为纯景点名称补全富媒体与产品元信息 */
function enrichSpot(
  name: string,
  city: string,
  period?: ParsedRouteSpot['period'],
): ParsedRouteSpot {
  const info = lookupAttractionInfo(name, city);
  return {
    address: info.address,
    coverImage: info.coverImage,
    description: info.summary,
    durationText: info.recommendedDuration,
    id: info.id,
    name,
    openHours: info.openingHours,
    period,
    priceText: info.priceText,
    rating: info.rating,
    reviewCount: info.reviewCount,
    ticketType: info.ticketType,
  };
}

/** 从文本块中提取景点列表 */
function extractSpotsFromLines(
  lines: string[],
  city: string,
): ParsedRouteSpot[] {
  const spotNameSet = new Set<string>();
  const spots: ParsedRouteSpot[] = [];

  // 1. 优先提取路线箭头链 (例如: 断桥残雪 → 白堤 → 平湖秋月)
  for (const line of lines) {
    if (
      line.includes('→') ||
      line.includes('➔') ||
      line.includes('->') ||
      line.includes('-->') ||
      line.includes('=>')
    ) {
      const parts = line.split(/→|➔|->|-->|=>/);
      for (const part of parts) {
        const candidate = extractSpotCandidate(part);
        if (isValidSpotName(candidate) && !spotNameSet.has(candidate)) {
          spotNameSet.add(candidate);
          spots.push(enrichSpot(candidate, city));
        }
      }
    }
  }

  // 2. 如果箭头链不足 2 个景点，从列表项（* 或 - 或 1.）中提取
  if (spots.length < 2) {
    for (const line of lines) {
      const trimmed = line.trim();
      let rawContent = '';
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        rawContent = trimmed.slice(2).trim();
      } else if (/^\d+[.、]\s*/.test(trimmed)) {
        rawContent = trimmed.replace(/^\d+[.、]\s*/, '').trim();
      }

      if (rawContent) {
        // 关键防护：如果行内容包含问句或澄清意向，严禁提取为景点
        if (isInquiryOrQuestion(rawContent)) {
          continue;
        }

        let period: ParsedRouteSpot['period'];
        if (trimmed.includes('早晨') || trimmed.includes('清晨'))
          period = '早晨';
        else if (trimmed.includes('上午')) period = '上午';
        else if (trimmed.includes('中午')) period = '中午';
        else if (trimmed.includes('下午')) period = '下午';
        else if (trimmed.includes('傍晚')) period = '傍晚';
        else if (trimmed.includes('夜间') || trimmed.includes('晚上'))
          period = '夜间';

        const candidate = extractSpotCandidate(rawContent);
        if (
          isValidSpotName(candidate) &&
          !spotNameSet.has(candidate) &&
          spots.length < 12
        ) {
          spotNameSet.add(candidate);
          spots.push(enrichSpot(candidate, city, period));
        }
      }
    }
  }

  return spots;
}

/** 中文数字转阿拉伯数字 */
function parseChineseNum(str: string): number {
  const map: Record<string, number> = {
    一: 1,
    七: 7,
    三: 3,
    九: 9,
    二: 2,
    五: 5,
    八: 8,
    六: 6,
    十: 10,
    四: 4,
  };
  return map[str] || Number.parseInt(str, 10) || 1;
}

/**
 * 检验文本是否具备明确的旅行行程规划与路线时序特征
 */
export function hasItineraryFeatures(
  text: string,
  dayBlocksCount = 0,
): boolean {
  if (!text) return false;

  const hasArrowChain = /[➔➜→]|(?:->)|(?:-->)/.test(text);

  // 1. 负向拦截：若无明确路线连线且无分日块，且通篇属于向导澄清问答（如询问天数、出行伴侣、偏好节奏），绝不作为行程规划
  if (!hasArrowChain && dayBlocksCount === 0) {
    const isClarificationQuestionnaire =
      text.includes('计划游玩几天') ||
      text.includes('和谁一起出行') ||
      text.includes('偏好哪种游玩节奏') ||
      text.includes('友好提醒：点击下方推荐胶囊') ||
      /(?:请告诉我|为你定制.*行程|补充.*信息|澄清引导)/.test(text) ||
      (text.match(/[？?]/g) || []).length >= 2;

    if (isClarificationQuestionnaire) {
      return false;
    }
  }

  // 2. 包含日程分日块 (Day 1, 第1天, D1)
  if (dayBlocksCount > 0) return true;

  // 3. 包含显式路线连线箭头 (A ➔ B 或 A → B 或 A -> B)
  if (hasArrowChain) return true;

  // 4. 包含明确的路线或行程标题/栏目（支持 【城市】路线规划、标题行冒号漫游、精选游等）
  const itineraryKeywords =
    /(?:详细游览路线|游览路线|行程规划|路线规划|游玩路线|路线推荐|路线设计|行程安排|路线安排|精选路线|打卡路线|漫游路线|旅游路线|旅行路书|游览行程|玩转路线|精选游|[一二两三四五六七八九十\d]+[日天步]游|[一二两三四五六七八九十\d]+天.*[晚夜]游?|周末.*游|漫游[：:])/i;

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const hasItineraryTitleLine = lines.some((line) => {
    const cleanLine = line
      .replace(/^[#*`\s\u{1F300}-\u{1FAFF}]+/u, '')
      .replace(/【[^】]*】/g, '')
      .trim();
    return (
      itineraryKeywords.test(cleanLine) &&
      (line.startsWith('#') ||
        line.startsWith('【') ||
        line.endsWith('：') ||
        line.endsWith(':') ||
        line.length <= 35)
    );
  });

  if (hasItineraryTitleLine) return true;

  // 5. 包含按时间段游览多个景点的结构（至少2个时段标记，如 早晨/上午/下午/傍晚/夜间）
  const timeSlotCount = (
    text.match(
      /(?:^|\n)\s*[*#-]?\s*\*{0,2}(?:早晨|清晨|上午|中午|下午|傍晚|夜间|晚上)\*{0,2}[:：]/g,
    ) || []
  ).length;
  if (timeSlotCount >= 2) return true;

  return false;
}

/**
 * 从 Markdown 文本中提取城市、多日行程、美食与建议
 */
export function parseItineraryFromMarkdown(
  text: string,
  defaultCity?: string,
): ParsedRouteData {
  if (!text) {
    return {
      city: defaultCity || '未知目的地',
      days: [],
      food: [],
      isItinerary: false,
      routeString: '',
      spots: [],
      summary: '',
      tips: [],
      transportMode: 'driving',
    };
  }

  // 1. 识别城市
  let detectedCity = defaultCity || '';
  if (!detectedCity) {
    for (const c of COMMON_CITIES) {
      if (text.includes(c)) {
        detectedCity = c;
        break;
      }
    }
  }
  if (!detectedCity) detectedCity = '旅行目的地';

  // 2. 识别交通方式偏好
  let transportMode: 'driving' | 'transit' | 'walking' = 'driving';
  if (
    text.includes('自驾') ||
    text.includes('租车') ||
    text.includes('环湖') ||
    text.includes('公路')
  ) {
    transportMode = 'driving';
  } else if (
    text.includes('地铁') ||
    text.includes('公交') ||
    text.includes('高铁') ||
    text.includes('大巴')
  ) {
    transportMode = 'transit';
  } else if (
    text.includes('徒步') ||
    text.includes('漫步') ||
    text.includes('步行') ||
    text.includes('骑行')
  ) {
    transportMode = 'walking';
  }

  const lines = text.split('\n');

  // 3. 识别分日段落 (Day 1 / 第1天 / D1)
  const dayHeaderRegex =
    /^(?:#+\s*)?(?:第([一二三四五六七八九十\d]+)天|Day\s*(\d+)|D(\d+))[:：·\s-]*(.*)$/i;
  interface DayBlock {
    dayNum: number;
    lines: string[];
    title: string;
  }

  const dayBlocks: DayBlock[] = [];
  let currentBlock: DayBlock | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = dayHeaderRegex.exec(trimmed);
    if (match) {
      if (currentBlock) {
        dayBlocks.push(currentBlock);
      }
      const numStr = match[1] || match[2] || match[3];
      const dayNum = parseChineseNum(numStr);
      const rawTitle = (match[4] || '').replace(/[*#`]/g, '').trim();
      currentBlock = {
        dayNum,
        lines: [],
        title: rawTitle || `第 ${dayNum} 天行程`,
      };
    } else if (currentBlock) {
      currentBlock.lines.push(line);
    }
  }
  if (currentBlock) {
    dayBlocks.push(currentBlock);
  }

  // 4. 构建结构化多日数组
  const parsedDays: ParsedDayRoute[] = [];
  const allSpots: ParsedRouteSpot[] = [];
  const globalSeenSpots = new Set<string>();

  if (dayBlocks.length > 0) {
    for (const block of dayBlocks) {
      const daySpots = extractSpotsFromLines(block.lines, detectedCity);
      parsedDays.push({
        day: block.dayNum,
        spots: daySpots,
        title: block.title,
      });
      for (const sp of daySpots) {
        if (!globalSeenSpots.has(sp.name)) {
          globalSeenSpots.add(sp.name);
          allSpots.push(sp);
        }
      }
    }
  }

  // 检验文本是否符合真实行程特征
  const hasItinerary = hasItineraryFeatures(text, dayBlocks.length);

  // 兜底：如果明确有行程特征，但未明确分天或分天未提取出景点，全篇提取归入第 1 天
  if (hasItinerary && allSpots.length === 0) {
    const fallbackSpots = extractSpotsFromLines(lines, detectedCity);
    // 关键约束：单点问答不构成路线，至少要有 2 个合法景点打卡点才算一条游玩路线
    if (fallbackSpots.length >= 2) {
      allSpots.push(...fallbackSpots);
      parsedDays.push({
        day: 1,
        spots: fallbackSpots,
        title: `${detectedCity}精选游玩路线`,
      });
    }
  }

  // 若不是真实行程或有效打卡点少于 2 处，清空可能误提取的假点位和假路线
  const isItinerary = hasItinerary && allSpots.length >= 2;
  if (!isItinerary) {
    allSpots.length = 0;
    parsedDays.length = 0;
  }

  // 5. 提取核心建议/摘要
  let summary = '';
  const summarySectionRegex =
    /[^\n]*【(?:核心建议|行程亮点|亮点建议|总体规划|行程规划|核心亮点|核心答案|重点速览|答案速览)[^】]*】[:：]?\s*([^\n]*)(?:\n([\s\S]*?))?(?=\n[#*【]|$)/;
  const summaryMatch = summarySectionRegex.exec(text);
  if (summaryMatch) {
    const inlineContent = (summaryMatch[1] || '').trim();
    const multilineContent = (summaryMatch[2] || '').trim();
    const rawSummary = inlineContent
      ? `${inlineContent}${multilineContent ? `\n${multilineContent}` : ''}`
      : multilineContent;
    if (rawSummary) {
      summary = cleanDecorativeText(rawSummary).slice(0, 160);
    }
  } else {
    const cleanLines = text
      .split('\n')
      .map((l) => cleanDecorativeText(l))
      .filter(
        (l) =>
          l.length > 15 && !l.startsWith('你是') && !l.startsWith('回答规范'),
      );
    summary = cleanLines[0]
      ? cleanLines[0].slice(0, 160)
      : '根据您的偏好精心定制的专属行程方案。';
  }

  // 6. 提取美食推荐
  const food: string[] = [];
  const foodMatch =
    /[^\n]*【(?:地道美食|美食推荐|特色美食|美食品尝|美食打卡|特色小吃)[^】]*】[^\n]*\n([\s\S]*?)(?=\n[#*【]|$)/.exec(
      text,
    );
  if (foodMatch && foodMatch[1]) {
    const foodItems = foodMatch[1].match(/[*-]\s*([^：:\n]+)/g);
    if (foodItems) {
      for (const item of foodItems) {
        const cleaned = item
          .replace(/^[*-]\s*/, '')
          .replace(/[*`]/g, '')
          .trim();
        if (cleaned && cleaned.length <= 25 && !food.includes(cleaned)) {
          food.push(cleaned);
        }
      }
    }
  }

  // 7. 提取避坑贴士
  const tips: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith('>') ||
      trimmed.includes('💡') ||
      trimmed.includes('贴士') ||
      trimmed.includes('避坑')
    ) {
      const cleanTip = cleanDecorativeText(trimmed)
        .replace(/^[贴士避坑：:\s]+/, '')
        .trim();
      if (
        cleanTip.length >= 8 &&
        cleanTip.length <= 80 &&
        !tips.includes(cleanTip) &&
        tips.length < 4
      ) {
        tips.push(cleanTip);
      }
    }
  }

  const routeString = isItinerary
    ? allSpots.map((s) => s.name).join(' ➔ ')
    : '';

  return {
    city: detectedCity,
    days: parsedDays,
    food: food.slice(0, 4),
    isItinerary,
    routeString,
    spots: allSpots,
    summary,
    tips: tips.slice(0, 3),
    transportMode,
  };
}

function cleanDecorativeText(str: string): string {
  return str
    .replace(/[*#>]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .trim();
}

function cleanSpotName(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.includes('：') || cleaned.includes(':')) {
    const segments = cleaned.split(/[：:]/);
    cleaned = segments[segments.length - 1];
  }
  return cleaned
    .replace(/\[\^?\d+\]/g, '')
    .replace(/（\s*\d{1,2}:\d{2}[^）]*）|\(\s*\d{1,2}:\d{2}[^)]*\)/g, '')
    .replace(/\b\d{1,2}:\d{2}\b/g, '')
    .replace(/^[\u{1F300}-\u{1FAFF}#*`\s\d.、-]+/u, '')
    .replace(/[。，,;:!！?？*`()（）【】[\]]/g, '')
    .replace(/(?<=[\u4e00-\u9fa5])\d+$/u, '')
    .replace(/\s*\d+$/, '')
    .replace(/(?:推荐|游览|打卡|出发|到达|前往|建议|游玩)$/, '')
    .trim();
}

function isValidSpotName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 20) return false;

  // 必须不含各类问号、感叹号、冒号、逗号、分号等标点
  if (/[？?！!。，,;；:：]/g.test(name)) return false;

  // 必须不属于问询意向模式
  if (isInquiryOrQuestion(name)) return false;

  // 必须不属于非景点元数据或时段标题
  if (isMetaSection(name) || isTimeOrHeaderPrefix(name)) return false;

  // 排除指示性动宾短语或客套祈使短语
  if (
    /^(?:感受|体验|享受|探索|品尝|游览|前往|出发|打卡|建议|推荐|定制|提供|选择|按照|根据|如果|欢迎)/.test(
      name,
    )
  ) {
    return false;
  }

  return true;
}
