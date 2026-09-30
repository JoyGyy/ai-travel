/**
 * 全国国家 5A 级核心景区扩展数据与同步脚本
 *
 * 覆盖全国各主要旅游省市核心名胜（黄山、九寨沟、张家界、泰山、华山、布达拉宫、莫高窟、拙政园、乌镇等）
 * 1. 输出结构化数据至 src/knowledge/national-5a-attractions.json
 * 2. 自动装配携程开放联盟 Tangram 官方自适应门票预订链接 (allianceid: 4897000)
 * 3. 安全事务 UPSERT 入库 PostgreSQL (支持 --dry-run)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

import { buildCtripTicketLink } from '../src/lib/ctrip/alliance'
import { type AttractionRow, seedAttractions } from './seed-attractions'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface National5ASpotDef {
  address: string
  aliases?: string[]
  city: string
  coverImage: string
  description: string
  highlights: string[]
  id: string
  name: string
  openingHours: string
  priceText: string
  province: string
  recommendedDuration: string
  suitableFor?: string[]
  summary: string
  tags: string[]
  ticketType: 'free' | 'paid'
  tips: string[]
}

export const NATIONAL_5A_SPOTS: National5ASpotDef[] = [
  // --- 江苏 / 苏州 ---
  {
    id: 'suzhou-zhuozhengyuan',
    name: '拙政园',
    city: '苏州',
    province: '江苏省',
    ticketType: 'paid',
    priceText: '约¥80起',
    coverImage: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&w=1080&q=80',
    summary: '中国四大名园之首，江南古典园林艺术的旷世典范，联合国世界文化遗产。',
    description: '拙政园始建于明正德年间，全园以水为中心，山水萦绕，厅榭精巧，茂树修竹，兼具水乡自然之趣与文人诗画意境。',
    address: '苏州市姑苏区东北街178号',
    openingHours: '07:30-17:30（17:00停止入园）',
    recommendedDuration: '2-3小时',
    aliases: ['苏州拙政园', '拙政园景区'],
    highlights: ['中国四大名园之首', '世界文化遗产', '江南私家园林巅峰'],
    tips: ['需提前线上实名预约购票', '清晨入园光影更佳且游客较少', '园内杜鹃花展与荷花季风景绝佳'],
    suitableFor: ['情侣出行', '摄影爱好者', '人文历史', '亲子家庭'],
    tags: ['5A景区', '世界遗产', '园林古迹', '人文打卡'],
  },
  {
    id: 'suzhou-zhouzhuang',
    name: '周庄古镇',
    city: '苏州',
    province: '江苏省',
    ticketType: 'paid',
    priceText: '约¥100起',
    coverImage: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1080&q=80',
    summary: '“中国第一水乡”，九百余年水乡神韵，双桥弄影，枕河人家。',
    description: '周庄四面环水，因河成镇，依水成街，以街为市。井字型河道上完整保存着元、明、清各代古石桥14座，张厅、沈厅等江南古宅尽展水乡富庶之美。',
    address: '苏州市昆山市周庄镇全福路43号',
    openingHours: '08:00-21:00',
    recommendedDuration: '半天至1天',
    aliases: ['周庄水乡', '昆山周庄'],
    highlights: ['中国第一水乡', '双桥水乡画境', '江南巨贾沈万三故居'],
    tips: ['夜晚水巷亮灯乘摇橹船极具诗意', '门票可办理多次入园', '推荐品尝当地特色万三蹄与阿婆茶'],
    suitableFor: ['古镇控', '摄影打卡', '家庭休闲', '慢节奏出游'],
    tags: ['5A景区', '水乡古镇', '江南风情', '历史街区'],
  },

  // --- 浙江 ---
  {
    id: 'jiaxing-wuzhen',
    name: '乌镇风景区',
    city: '嘉兴',
    province: '浙江省',
    ticketType: 'paid',
    priceText: '约¥150起',
    coverImage: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1080&q=80',
    summary: '世界互联网大会永久举办地，江南水乡古镇的极致审美与现代生活典范。',
    description: '乌镇分为东栅与西栅。西栅由十二个碧水环绕的岛屿组成，夜景璀璨，木心美术馆与昭明书院伫立其间，是传统与现代文艺交融的梦里水乡。',
    address: '嘉兴市桐乡市乌镇石佛南路18号',
    openingHours: '09:00-22:00（西栅）',
    recommendedDuration: '1-2天',
    aliases: ['乌镇西栅', '乌镇东栅', '桐乡乌镇'],
    highlights: ['江南六大古镇之冠', '木心美术馆', '水上集市与极致夜景'],
    tips: ['建议留宿西栅景区内客栈享受清晨无人的静谧', '木心美术馆需提前单独预约', '夜游摇橹船体验绝佳'],
    suitableFor: ['文艺青年', '情侣度假', '摄影爱好者', '慢生活体验'],
    tags: ['5A景区', '水乡名镇', '文艺美学', '夜景天花板'],
  },
  {
    id: 'zhoushan-putuoshan',
    name: '普陀山风景区',
    city: '舟山',
    province: '浙江省',
    ticketType: 'paid',
    priceText: '约¥160起',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80',
    summary: '中国佛教四大名山之一，海天佛国，观音道场，南海圣境。',
    description: '普陀山四面环海，山海相映，风光秀丽，古刹宏伟。南海观音巨佛法相庄严，普济禅寺、法雨禅寺、慧济禅寺香火绵延，被誉为“海天佛国，南海圣境”。',
    address: '舟山市普陀区普陀山梅岭中路1号',
    openingHours: '06:00-18:00',
    recommendedDuration: '1-2天',
    aliases: ['海天佛国', '舟山普陀山'],
    highlights: ['中国四大佛教名山', '33米高南海观音立像', '海天佛国百步沙'],
    tips: ['需提前购买朱家尖至普陀山的进岛轮渡船票', '岛内交通以旅游公交为主，需备好零钱或扫码', '进殿祈福遵守寺规礼仪'],
    suitableFor: ['祈福修心', '海岛度假', '长辈同行', '文化探索'],
    tags: ['5A景区', '佛教名山', '海岛风光', '祈福静心'],
  },

  // --- 安徽 ---
  {
    id: 'huangshan-scenic',
    name: '黄山风景区',
    city: '黄山',
    province: '安徽省',
    ticketType: 'paid',
    priceText: '约¥190起',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=80',
    summary: '“五岳归来不看山，黄山归来不看岳”，奇松、怪石、云海、温泉、冬雪五绝天下一品。',
    description: '联合国教科文组织世界文化与自然双重遗产，中华十大名山之一。七十二峰挺拔险峻，迎客松苍翠挺拔，云海漫卷如仙境，展现大自然无与伦比的造化奇观。',
    address: '黄山市黄山区汤口镇黄山风景区',
    openingHours: '06:00-17:30',
    recommendedDuration: '1-2天',
    aliases: ['安徽黄山', '黄山'],
    highlights: ['世界文化与自然双遗产', '迎客松与光明顶', '奇松怪石云海日出'],
    tips: ['登山建议备登山杖与轻便防滑鞋', '看日出推荐住宿山顶光明顶或白云宾馆', '索道上下山可大幅节省体力'],
    suitableFor: ['户外徒步', '摄影发烧友', '大好河山', '日出云海'],
    tags: ['5A景区', '双遗产', '地质奇观', '天下名山'],
  },
  {
    id: 'huangshan-hongcun',
    name: '宏村景区',
    city: '黄山',
    province: '安徽省',
    ticketType: 'paid',
    priceText: '约¥104起',
    coverImage: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1080&q=80',
    summary: '“中国画里的乡村”，牛形古村落，徽派建筑精粹，月沼倒影如诗如画。',
    description: '世界文化遗产，宏村依山傍水，独特的牛形水系人工水圳贯穿家家户户。南湖与月沼如明镜般倒映着粉墙黛瓦与马头墙，是东方古典水墨写意的极致化身。',
    address: '黄山市黟县宏村镇宏村景区',
    openingHours: '全天开放（购票核验07:30-17:30）',
    recommendedDuration: '半天至1天',
    aliases: ['黟县宏村', '中国画里乡村'],
    highlights: ['世界文化遗产', '月沼春晓水墨倒影', '卧虎藏龙取景地'],
    tips: ['清晨与黄昏是摄影采风黄金时段', '门票在三天内实名有效', '推荐品尝徽州臭鳜鱼与毛豆腐'],
    suitableFor: ['摄影绘画', '人文建筑', '古村探索', '情侣漫步'],
    tags: ['5A景区', '世界遗产', '古村落', '徽派美学'],
  },

  // --- 江西 ---
  {
    id: 'jiujiang-lushan',
    name: '庐山风景名胜区',
    city: '九江',
    province: '江西省',
    ticketType: 'paid',
    priceText: '约¥160起',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80',
    summary: '“不识庐山真面目，只缘身在此山中”，天下避暑胜地，人文名山云雾圣境。',
    description: '世界文化景观遗产，雄峙长江南岸，鄱阳湖之滨。飞瀑如三叠泉轰鸣直下，含鄱口吞吐云海，锦绣谷悬崖峭壁，千百年来留下了李白、苏轼等文豪的千古名篇。',
    address: '九江市庐山市牯岭镇河西路19号',
    openingHours: '全天开放',
    recommendedDuration: '1-2天',
    aliases: ['江西庐山', '庐山'],
    highlights: ['世界文化遗产', '三叠泉飞瀑', '牯岭云中山城'],
    tips: ['庐山山顶牯岭镇设施齐备犹如云端小城', '观光车是山上核心交通工具建议购买联票', '夏季气候凉爽是绝佳避暑胜地'],
    suitableFor: ['避暑度假', '人文探幽', '自然风光', '全家出游'],
    tags: ['5A景区', '世界遗产', '避暑胜地', '名瀑云海'],
  },

  // --- 山东 ---
  {
    id: 'taian-taishan',
    name: '泰山风景名胜区',
    city: '泰安',
    province: '山东省',
    ticketType: 'paid',
    priceText: '约¥115起',
    coverImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1080&q=80',
    summary: '“会当凌绝顶，一览众山小”，五岳独尊，华夏民族精神图腾与天下第一名山。',
    description: '世界文化与自然双遗产，自古为帝王封禅、文人墨客朝圣之地。十八盘雄险壮观，南天门横空出世，玉皇顶云海日出万丈金光，气势磅礴冠绝五岳。',
    address: '泰安市泰山区红门路',
    openingHours: '全天开放（索道及巴士有运营时间）',
    recommendedDuration: '1天至夜爬看日出',
    aliases: ['东岳泰山', '泰山'],
    highlights: ['五岳之首·五岳独尊', '天下第一名山', '玉皇顶日出与雄伟十八盘'],
    tips: ['夜爬泰山看日出是青年人经典挑战，山顶风大务必租防寒大衣', '白天可从天外村乘车至中天门再登顶节省体力', '石刻遍山极具历史书法价值'],
    suitableFor: ['登山挑战', '日出摄影', '文化溯源', '青年打卡'],
    tags: ['5A景区', '双遗产', '五岳独尊', '日出名胜'],
  },
  {
    id: 'qingdao-laoshan',
    name: '崂山风景区',
    city: '青岛',
    province: '山东省',
    ticketType: 'paid',
    priceText: '约¥90起',
    coverImage: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1080&q=80',
    summary: '“泰山虽云高，不如东海崂”，海上第一名山，道教仙山山海相连。',
    description: '崂山矗立于黄海之滨，拔海而起，山光海色交相辉映。巨峰巍峨险峻，太清宫千年道教古柏参天，仰口海滩碧波荡漾，被誉为“海上名山第一”。',
    address: '青岛市崂山区崂山风景区',
    openingHours: '07:30-17:00',
    recommendedDuration: '1天',
    aliases: ['青岛崂山', '海上名山第一'],
    highlights: ['海上名山第一', '山海相映壮丽风光', '太清道教千载祖庭'],
    tips: ['崂山分为南线太清、中线巨峰和北线九水，一日游建议精选一条主线', '夏季可登高望海伴随清凉海风', '太清宫需单独购买门票'],
    suitableFor: ['山海观光', '道教文化', '户外健行', '全家度假'],
    tags: ['5A景区', '道教圣地', '山海奇观', '滨海名胜'],
  },

  // --- 湖南 ---
  {
    id: 'zhangjiajie-wulingyuan',
    name: '张家界武陵源风景名胜区',
    city: '张家界',
    province: '湖南省',
    ticketType: 'paid',
    priceText: '约¥228起',
    coverImage: 'https://images.unsplash.com/photo-1513415564515-763d91423bdd?auto=format&fit=crop&w=1080&q=80',
    summary: '《阿凡达》哈利路亚山取景地，世界绝版石英砂岩峰林地貌，三千奇峰八百秀水。',
    description: '世界自然遗产，中国第一个国家森林公园。三千多座奇峰拔地而起，金鞭溪流水潺潺，百龙天梯直插云霄，天子山峰林如林海狂涛，令人叹为观止。',
    address: '张家界市武陵源区国家森林公园',
    openingHours: '07:30-18:00',
    recommendedDuration: '2-3天',
    aliases: ['张家界森林公园', '武陵源', '哈利路亚山'],
    highlights: ['世界自然遗产', '阿凡达悬浮山原型', '天下第一梯百龙天梯'],
    tips: ['森林公园门票4天有效，建议留足2-3天深度游玩', '注意防范野生猕猴，切勿手提塑料袋或当面翻找食物', '天子山与袁家界云雾天气最似仙境'],
    suitableFor: ['自然探险', '科幻奇观', '摄影采风', '户外旅行'],
    tags: ['5A景区', '世界遗产', '峰林奇观', '阿凡达取景地'],
  },
  {
    id: 'zhangjiajie-tianmen',
    name: '张家界天门山国家森林公园',
    city: '张家界',
    province: '湖南省',
    ticketType: 'paid',
    priceText: '约¥275起',
    coverImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1080&q=80',
    summary: '“湘西第一神山”，天门洞开拔地倚天，世界最长高山索道与惊险玻璃栈道。',
    description: '天门山孤峰高耸，世界罕见的海拔千米喀斯特溶洞天门洞拔地而起。长达7455米的索道飞架城市与云海之巅，鬼谷悬空玻璃栈道云雾缭绕，步步惊心。',
    address: '张家界市永定区大庸路天门山索道下站',
    openingHours: '07:00-18:00',
    recommendedDuration: '大半天至1天',
    aliases: ['天门山景区', '天门洞'],
    highlights: ['世界最长高山客运索道', '天门洞开自然奇观', '高空峭壁玻璃栈道'],
    tips: ['购票分A/B/C不同游览线路，推荐A线索道上山、环保车下山最为顺畅', '玻璃栈道需购买鞋套，恐高者可走常规栈道', '旺季需提前选定入园时段'],
    suitableFor: ['极限挑战', '云海景观', '高空体验', '网红打卡'],
    tags: ['5A景区', '天门奇观', '高空索道', '悬崖栈道'],
  },

  // --- 湖北 ---
  {
    id: 'wuhan-huanghelou',
    name: '黄鹤楼公园',
    city: '武汉',
    province: '湖北省',
    ticketType: 'paid',
    priceText: '约¥70起',
    coverImage: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&w=1080&q=80',
    summary: '“昔人已乘黄鹤去，此地空余黄鹤楼”，江南三大名楼之首，楚天第一名楼。',
    description: '耸立于武昌蛇山之巅，俯瞰浩瀚长江与武汉长江大桥。主楼飞檐五层，金碧辉煌，历代无数文人骚客登楼赋诗，是江城武汉最负盛名的城市精神地标。',
    address: '武汉市武昌区蛇山西山坡特1号',
    openingHours: '08:30-17:00（日场），19:30-22:00（夜游场）',
    recommendedDuration: '2-3小时',
    aliases: ['武汉黄鹤楼', '天下江山第一楼'],
    highlights: ['江南三大名楼之首', '登楼俯瞰长江大桥与江城风貌', '夜游光影沉浸演艺'],
    tips: ['登主楼顶层可远眺长江一桥双层通车震撼奇景', '司门口黄鹤楼地铁站红墙夜拍黄鹤楼同框是超级机位', '夜场光影秀需单独购票'],
    suitableFor: ['地标打卡', '登高远眺', '古诗溯源', '家庭出游'],
    tags: ['5A景区', '千古名楼', '江城地标', '历史文化'],
  },
  {
    id: 'yichang-sanxia',
    name: '三峡大坝旅游区',
    city: '宜昌',
    province: '湖北省',
    ticketType: 'free',
    priceText: '景区门票免费（观光车约¥35）',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80',
    summary: '世界最大水利枢纽工程，大国重器，高峡出平湖，中华水利奇迹。',
    description: '当今世界最大的水力发电工程，坛子岭俯瞰大坝全貌，185园区近距离感受大坝巍峨气魄，截流纪念园回溯长江截流伟业，尽展国之重器的宏伟雄浑。',
    address: '宜昌市夷陵区三斗坪镇江峡大道',
    openingHours: '08:00-17:00',
    recommendedDuration: '半天',
    aliases: ['三峡大坝', '长江三峡枢纽'],
    highlights: ['世界最大水利枢纽', '坛子岭制高点全景观览', '感受高峡出平湖大国宏图'],
    tips: ['中国居民凭身份证免门票入园，需购买景区内观光车票', '需提前在官方平台进行实名预约', '配合三峡游轮可体验水上过五级船闸奇观'],
    suitableFor: ['大国工程', '爱国研学', '全家同行', '壮丽山河'],
    tags: ['5A景区', '大国重器', '水利工程', '长江地标'],
  },

  // --- 四川 ---
  {
    id: 'jiuzhaigou-scenic',
    name: '九寨沟风景名胜区',
    city: '阿坝',
    province: '四川省',
    ticketType: 'paid',
    priceText: '约¥190起（观光车约¥90）',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=80',
    summary: '“九寨归来不看水”，童话世界，人间仙境，五彩斑斓的高山翠海与叠瀑飞泉。',
    description: '世界自然遗产，高山喀斯特地貌发育的奇迹。翠海、叠瀑、彩林、雪峰、藏情被誉为“九寨五绝”。五花海变幻多姿，诺日朗瀑布奔腾如绢，宛若瑶池降落凡间。',
    address: '阿坝藏族羌族自治州九寨沟县漳扎镇',
    openingHours: '07:30-17:00',
    recommendedDuration: '1-2天',
    aliases: ['九寨沟', '童话世界九寨沟'],
    highlights: ['世界自然遗产', '五花海水下钙华森林', '中国最美高山水景天花板'],
    tips: ['景区呈Y字形分布，乘观光车游览推荐先走日则沟再走则查洼沟', '秋季彩林映衬碧水为全年颜值巅峰', '高原紫外线强需做好防晒保暖'],
    suitableFor: ['绝美自然', '摄影狂热', '一生必去', '情侣自驾'],
    tags: ['5A景区', '世界遗产', '水景之王', '童话仙境'],
  },
  {
    id: 'emeishan-scenic',
    name: '峨眉山风景区',
    city: '乐山',
    province: '四川省',
    ticketType: 'paid',
    priceText: '约¥160起',
    coverImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1080&q=80',
    summary: '“峨眉天下秀”，中国四大佛教名山，普贤菩萨道场，金顶云海佛光圣境。',
    description: '世界文化与自然双遗产。海拔3079米金顶耸立着48米高十方普贤金像，金碧辉煌直指苍穹。清晨云海翻滚，霞光万道，佛光圣灯令人心生敬畏。',
    address: '乐山市峨眉山市黄湾镇',
    openingHours: '06:00-17:00',
    recommendedDuration: '1-2天',
    aliases: ['四川峨眉山', '峨眉金顶'],
    highlights: ['世界文化与自然双遗产', '金顶十方普贤金像', '壮观云海日出与佛光'],
    tips: ['山脚至雷洞坪需乘坐约2小时景区观光车', '金顶海拔三千多米气温极低需备厚外套', '清音阁至生态猴区沿线谨防猴群抢夺物品'],
    suitableFor: ['祈福朝圣', '日出云海', '名山徒步', '避暑休假'],
    tags: ['5A景区', '双遗产', '四大佛山', '金顶云海'],
  },
  {
    id: 'leshandafo-scenic',
    name: '乐山大佛景区',
    city: '乐山',
    province: '四川省',
    ticketType: 'paid',
    priceText: '约¥80起',
    coverImage: 'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?auto=format&fit=crop&w=1080&q=80',
    summary: '“山是一座佛，佛是一座山”，世界最大古代摩崖石刻造像，千载守护三江安澜。',
    description: '世界文化与自然双遗产。通高71米的弥勒坐佛依岷江、青衣江、大渡河三江汇流处山崖开凿而成。神情端庄肃穆，气度磅礴，见证唐代石刻工匠的巧夺天工。',
    address: '乐山市市中区凌云路2435号',
    openingHours: '07:30-18:30',
    recommendedDuration: '3-4小时',
    aliases: ['乐山大佛', '嘉州大佛'],
    highlights: ['世界第一大石刻弥勒佛', '九曲栈道抱佛脚体验', '三江汇流奇景'],
    tips: ['走九曲栈道近距离仰观大佛需排队，推荐顺便乘船远眺大佛睡佛全景', '景区内乌尤寺与麻浩崖墓文化深厚值得连带游览', '乐山街头美食（钵钵鸡、甜皮鸭）不容错过'],
    suitableFor: ['历史古迹', '佛教石刻', '美食之旅', '亲子研学'],
    tags: ['5A景区', '双遗产', '石刻奇观', '大佛祈福'],
  },
  {
    id: 'dujiangyan-scenic',
    name: '青城山-都江堰旅游景区',
    city: '成都',
    province: '四川省',
    ticketType: 'paid',
    priceText: '约¥80起',
    coverImage: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1080&q=80',
    summary: '“拜水都江堰，问道青城山”，两千余年水利长青造就天府之国，道教发祥幽秀天下。',
    description: '世界文化遗产。李冰父子开凿的都江堰无坝引水工程滋养天府之国至今；青城山诸峰环峙，林木苍翠，四季常青，道观古朴典雅，尽显“青城天下幽”之意境。',
    address: '成都市都江堰市公园路',
    openingHours: '08:00-18:00',
    recommendedDuration: '1天',
    aliases: ['都江堰水利工程', '青城山景区'],
    highlights: ['世界文化遗产', '两千余年活水利工程奇迹', '青城天下幽道家祖庭'],
    tips: ['都江堰鱼嘴、飞沙堰、宝瓶口三要素需细心品味其物理分水原理', '青城山分前山（人文道观）和后山（自然徒步溪流）', '成都犀浦站可乘城际高铁直达离堆公园站'],
    suitableFor: ['人文历史', '道家探幽', '水利工程', '短途自驾'],
    tags: ['5A景区', '世界遗产', '水利工程', '青城天下幽'],
  },

  // --- 重庆 ---
  {
    id: 'chongqing-wulong',
    name: '武隆喀斯特旅游区（天生三桥）',
    city: '重庆',
    province: '重庆市',
    ticketType: 'paid',
    priceText: '约¥125起',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80',
    summary: '《满城尽带黄金甲》《变形金刚4》取景地，世界规模最大喀斯特天生石桥群。',
    description: '世界自然遗产。天龙桥、青龙桥、黑龙桥三座石拱桥横跨深幽峡谷，桥下深坑天坑相连，坑底天福官驿青砖黛瓦隐匿古林之中，雄浑险峻如魔幻史诗。',
    address: '重庆市武隆区仙女山镇白果村',
    openingHours: '08:30-16:30',
    recommendedDuration: '半天至1天',
    aliases: ['武隆天生三桥', '天坑地缝'],
    highlights: ['世界自然遗产', '亚洲最大天生桥群', '天福官驿影视同款场景'],
    tips: ['乘观光电梯垂直下降至坑底极为震撼', '可与附近的仙女山国家森林公园、龙水峡地缝联游', '雨后天生三桥云雾蒸腾更具魔幻大片质感'],
    suitableFor: ['地质探秘', '影视打卡', '户外徒步', '自然摄影'],
    tags: ['5A景区', '世界遗产', '喀斯特地貌', '电影取景'],
  },

  // --- 陕西 ---
  {
    id: 'xian-huashan',
    name: '华山风景名胜区',
    city: '渭南',
    province: '陕西省',
    ticketType: 'paid',
    priceText: '约¥160起',
    coverImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1080&q=80',
    summary: '“自古华山一条路，奇险天下第一山”，奇拔险峻，绝壁千仞，长空栈道冠绝五岳。',
    description: '国家重点风景名胜区，中华名山奇险之冠。东峰朝阳看日出，南峰落雁登华山之巅，西峰莲花绝壁陡峭，鹞子翻身与长空栈道引天下勇者竞相折腰。',
    address: '渭南市华阴市华山镇集灵路',
    openingHours: '全天开放（索道运营07:00-19:00）',
    recommendedDuration: '1天至夜爬',
    aliases: ['西岳华山', '华山'],
    highlights: ['奇险天下第一山', '西峰绝壁与南峰极顶', '长空栈道惊险挑战'],
    tips: ['乘西峰索道上、北峰索道下（西上北下）是经典轻松一日路线', '夜爬登东峰看日出需备头灯与防滑手套', '登临险段务必抓牢铁锁慢步慢行'],
    suitableFor: ['极限挑战', '名山绝景', '日出摄影', '青年打卡'],
    tags: ['5A景区', '五岳西岳', '奇险名山', '长空栈道'],
  },

  // --- 山西 ---
  {
    id: 'jinzhong-pingyao',
    name: '平遥古城景区',
    city: '晋中',
    province: '山西省',
    ticketType: 'paid',
    priceText: '古城免费开放（通票约¥125）',
    coverImage: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=1080&q=80',
    summary: '中国保存最完整的汉民族古代县城，世界文化遗产，晋商发祥地日升昌票号故里。',
    description: '世界文化遗产。龟城城墙巍峨完好，城内四大街八小街七十二条蚰蜒巷纵横交错。中国第一家票号日升昌、县衙、文庙等明清古建林立，古朴沧桑，晋韵流长。',
    address: '晋中市平遥县照壁南街58号',
    openingHours: '08:00-18:00（景点通票检票时间）',
    recommendedDuration: '1-2天',
    aliases: ['平遥古城', '晋中平遥'],
    highlights: ['世界文化遗产', '完整明清龟形古城墙', '中国银行业鼻祖日升昌票号'],
    tips: ['古城进入免费，参观城墙、日升昌、县衙等内部22处景点需购买通票', '推荐观看大型室内情境体验剧《又见平遥》', '租一套晋商少奶奶汉服在古街拍照非常出片'],
    suitableFor: ['历史古建', '晋商文化', '民俗探寻', '汉服摄影'],
    tags: ['5A景区', '世界遗产', '晋商摇篮', '完整古城'],
  },
  {
    id: 'datong-yungang',
    name: '云冈石窟',
    city: '大同',
    province: '山西省',
    ticketType: 'paid',
    priceText: '约¥120起',
    coverImage: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=1080&q=80',
    summary: '中国三大石窟之一，公元5世纪东方石刻艺术巅峰，融合西域与华夏造像之大成。',
    description: '世界文化遗产。依武周山开凿，现存主要洞窟45个，大小造像59000余尊。第20窟大佛高鼻深目、神态超然，展现了北魏早期鲜卑王朝的恢弘气度与多元融合。',
    address: '大同市云冈区云冈镇1号',
    openingHours: '08:30-17:00',
    recommendedDuration: '3-4小时',
    aliases: ['大同云冈石窟', '云冈大佛'],
    highlights: ['世界文化遗产', '北魏早期造像巅峰', '第20窟露天大佛'],
    tips: ['建议请人工讲解员或租用智能导览耳机品读石窟背后的北魏拓跋氏历史', '窟内严禁使用闪光灯拍照以保护古代矿物颜料', '邻近有大同古城与华严寺可一日游串联'],
    suitableFor: ['历史考古', '石刻造像', '学术研学', '人文探索'],
    tags: ['5A景区', '世界遗产', '三大石窟', '北魏石雕'],
  },

  // --- 河南 ---
  {
    id: 'luoyang-longmen',
    name: '龙门石窟',
    city: '洛阳',
    province: '河南省',
    ticketType: 'paid',
    priceText: '约¥90起',
    coverImage: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=1080&q=80',
    summary: '中国四大石窟之一，盛唐造像艺术巅峰，卢舍那大佛微笑穿越千载时光。',
    description: '世界文化遗产。龙门石窟密布于伊水两岸的西山与东山悬崖峭壁上。奉先寺卢舍那大佛相传依武则天容貌仪态雕刻，雍容庄重而又温柔亲和，被誉为东方石刻艺术维纳斯。',
    address: '洛阳市洛龙区龙门中街13号',
    openingHours: '08:00-18:00',
    recommendedDuration: '3-4小时',
    aliases: ['洛阳龙门石窟', '奉先寺大佛'],
    highlights: ['世界文化遗产', '奉先寺卢舍那大佛', '伊水两岸千窟万佛夜游亮灯'],
    tips: ['夜游龙门亮灯时刻大佛如从夜空生辉，视觉极为震撼', '游览路线通常为西山石窟（核心）→ 东山石窟 → 香山寺 → 白园', '可结合洛阳应天门、洛邑古城汉服体验行程'],
    suitableFor: ['人文艺术', '大唐气韵', '夜游观光', '国风打卡'],
    tags: ['5A景区', '世界遗产', '盛唐美学', '东方大佛'],
  },

  // --- 甘肃 ---
  {
    id: 'dunhuang-mogaoku',
    name: '莫高窟',
    city: '酒泉',
    province: '甘肃省',
    ticketType: 'paid',
    priceText: '约¥238起（含数字展示中心）',
    coverImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1080&q=80',
    summary: '“东方艺术明珠”，丝绸之路千年艺术宝库，飞天翩跹，壁画彩塑举世无双。',
    description: '世界文化遗产，公元4世纪至14世纪千余年营建的佛教艺术殿堂。现存壁画4.5万平方米，泥质彩塑2415尊，融合了希腊、印度与华夏多文明精华，是人类文明的不朽交响。',
    address: '酒泉市敦煌市鸣山路',
    openingHours: '08:00-18:00',
    recommendedDuration: '半天',
    aliases: ['敦煌莫高窟', '千佛洞'],
    highlights: ['世界文化遗产', '丝绸之路文明交汇地', '精美绝伦飞天壁画与九层楼'],
    tips: ['务必提前通过莫高窟参观预约网实名预约正常票（A类票含数字电影与8个实体洞窟）', '窟内绝对禁止拍照以免损害脆弱壁画颜料', '由敦煌研究院专业讲解员分批带队讲解'],
    suitableFor: ['文史朝圣', '艺术殿堂', '一生必去', '丝路溯源'],
    tags: ['5A景区', '世界遗产', '丝路明珠', '千年壁画'],
  },
  {
    id: 'dunhuang-mingshashan',
    name: '鸣沙山月牙泉景区',
    city: '酒泉',
    province: '甘肃省',
    ticketType: 'paid',
    priceText: '约¥110起',
    coverImage: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1080&q=80',
    summary: '“塞外风光之一绝”，山泉共处，沙水共生，千古沙泉不涸的沙漠奇迹。',
    description: '月牙泉如一弯新月静卧在狂风卷起的黄沙环抱之中，碧波荡漾，清澈如镜。夕阳西下时鸣沙山如金色锦缎，骑驼队漫步沙丘之上，宛若重回千年丝路驼铃旧梦。',
    address: '酒泉市敦煌市鸣沙山路',
    openingHours: '06:00-20:30',
    recommendedDuration: '半天',
    aliases: ['鸣沙山', '月牙泉'],
    highlights: ['沙泉共处千古奇观', '金色沙脊驼队与大漠落日', '万人星空演唱会狂欢'],
    tips: ['建议下午四五点后前往避开烈日暴晒，看大漠日落余晖最佳', '进入沙漠需准备鞋套与手机防沙套', '夏季夜晚有万人星空音乐合唱氛围极其热烈'],
    suitableFor: ['大漠体验', '日落星空', '驼队漫游', '情侣旅拍'],
    tags: ['5A景区', '塞外奇观', '沙漠之月', '丝路驼铃'],
  },

  // --- 广西 ---
  {
    id: 'guilin-lijiang',
    name: '桂林漓江风景名胜区',
    city: '桂林',
    province: '广西壮族自治区',
    ticketType: 'paid',
    priceText: '约¥215起（三星/四星游船）',
    coverImage: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1080&q=80',
    summary: '“桂林山水甲天下”，二十元人民币背景图，百里山水画廊碧水连天。',
    description: '世界自然遗产，中国山水风光的至高代表。九马画山巧夺天工，黄布倒影波光粼粼，两岸奇峰罗列，翠竹掩映，乘一叶扁舟荡漾于烟雨画卷之中，如入世外桃源。',
    address: '桂林市阳朔县兴坪镇至磨盘山/竹江码头',
    openingHours: '08:00-17:30',
    recommendedDuration: '半天至1天',
    aliases: ['漓江', '桂林漓江'],
    highlights: ['世界自然遗产', '20元人民币背面实景黄布倒影', '九马画山天地神工'],
    tips: ['桂林至阳朔全程大游船（约4小时）可观赏全段精华', '兴坪古镇段可打卡20元人民币观景台', '雨季烟雨漓江最具传统水墨神韵'],
    suitableFor: ['山水大片', '游船度假', '全家出游', '经典旅行'],
    tags: ['5A景区', '世界遗产', '山水甲天下', '人民币地标'],
  },

  // --- 西藏 ---
  {
    id: 'lasa-budalagong',
    name: '布达拉宫景区',
    city: '拉萨',
    province: '西藏自治区',
    ticketType: 'paid',
    priceText: '约¥200起（淡季约¥100）',
    coverImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1080&q=80',
    summary: '世界海拔最高的古代宫堡建筑群，雪域圣殿，藏传佛教圣地，五十元人民币背面背景。',
    description: '世界文化遗产。依红山而建，红白相间的宫墙巍峨耸立于雪域日光之城。珍藏着历代达赖喇嘛灵塔、浩瀚典籍与无数奇珍异宝，是西藏政教合一历史与藏族建筑艺术的最高丰碑。',
    address: '拉萨市城关区北京中路35号',
    openingHours: '09:00-15:40',
    recommendedDuration: '2-3小时',
    aliases: ['拉萨布达拉宫', '布宫'],
    highlights: ['世界文化遗产', '世界上海拔最高宫殿', '50元人民币背面图案'],
    tips: ['参观必须提前7天实名预约门票，务必带好原件身份证', '进入宫殿遵循逆时针单向参观，严禁踩踏门槛或用手指佛像', '药王山观景台是拍摄50元人民币同款经典机位'],
    suitableFor: ['藏地信仰', '高原朝圣', '建筑奇迹', '心灵净化'],
    tags: ['5A景区', '世界遗产', '雪域圣殿', '人民币地标'],
  },

  // --- 新疆 ---
  {
    id: 'xinjiang-kanasi',
    name: '喀纳斯景区',
    city: '阿勒泰',
    province: '新疆维吾尔自治区',
    ticketType: 'paid',
    priceText: '约¥160起（区间车约¥70）',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1080&q=80',
    summary: '“神的自留地”，变色湖泊、原始泰加林、图瓦人村落与月亮湾静谧画卷。',
    description: '国家重点风景名胜区。雪山环抱的高山湖泊喀纳斯湖随着光照四季变色；神仙湾晨雾迷蒙如梦，月亮湾碧波弯转如弯月；白哈巴与禾木村木屋炊烟袅袅，保留着古老原始的纯净安宁。',
    address: '阿勒泰地区布尔津县232省道',
    openingHours: '08:30-20:00',
    recommendedDuration: '2-3天',
    aliases: ['新疆喀纳斯', '神的后花园'],
    highlights: ['神的自留地原始秘境', '三湾（卧龙湾、月亮湾、神仙湾）晨雾', '神秘喀纳斯湖怪传说'],
    tips: ['9月中下旬至10月初金秋彩林是全年最美时节', '早起在神仙湾拍摄晨雾需备好保暖羽绒服', '禾木与白哈巴村可安排留宿木屋体验慢节奏'],
    suitableFor: ['北疆自驾', '秋景摄影', '原始探索', '度假天堂'],
    tags: ['5A景区', '神的自留地', '自然湖泊', '北疆大美'],
  },
]

/**
 * 转换并输出为系统标准 AttractionRow 数据行
 */
export function buildNational5ARows(): AttractionRow[] {
  return NATIONAL_5A_SPOTS.map(spot => {
    const ctripLink = buildCtripTicketLink({
      city: spot.city,
      spotName: spot.name,
    })

    return {
      id: spot.id,
      name: spot.name,
      city: spot.city,
      ticket_type: spot.ticketType,
      price_text: spot.priceText,
      cover_image: spot.coverImage,
      summary: spot.summary,
      description: spot.description,
      address: spot.address,
      opening_hours: spot.openingHours,
      recommended_duration: spot.recommendedDuration,
      aliases: spot.aliases ?? [],
      highlights: spot.highlights,
      tips: spot.tips,
      suitable_for: spot.suitableFor ?? ['家庭出行', '好友结伴', '摄影打卡'],
      booking_links: {
        ctrip: ctripLink,
      },
      tags: spot.tags,
    }
  })
}

/**
 * 将扩充数据持久化至 src/knowledge/national-5a-attractions.json
 */
export function writeNational5AJsonFile(): void {
  const jsonPath = path.resolve(__dirname, '../src/knowledge/national-5a-attractions.json')
  const jsonContent = JSON.stringify(NATIONAL_5A_SPOTS, null, 2)
  fs.writeFileSync(jsonPath, jsonContent, 'utf-8')
  console.log(`✅ 成功写入全国 5A 景区库 JSON 文件: ${jsonPath} (共 ${NATIONAL_5A_SPOTS.length} 个权威景区)`)
}

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')

  console.log(`🚀 开始处理全国国家 5A 级景区扩充数据...`)
  writeNational5AJsonFile()

  const rows = buildNational5ARows()
  console.log(`📍 准备导入 ${rows.length} 条全国权威 5A 景区数据 (涵盖 ${new Set(rows.map(r => r.city)).size} 个城市)`)

  if (isDryRun) {
    console.log(`ℹ️ [dry-run] 校验通过，未连接数据库写入。`)
    return
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.warn(`⚠️ 未配置 DATABASE_URL，仅生成了 JSON 数据文件，跳过数据库导入。`)
    return
  }

  const pool = new Pool({ connectionString: databaseUrl })
  const client = await pool.connect()
  try {
    const count = await seedAttractions(client, rows)
    console.log(`🎉 成功在 PostgreSQL 数据库中事务 UPSERT 了 ${count} 条全国 5A 景区及标签！`)
  }
  finally {
    client.release()
    await pool.end()
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch(err => {
    console.error('❌ 执行失败:', err)
    process.exit(1)
  })
}
