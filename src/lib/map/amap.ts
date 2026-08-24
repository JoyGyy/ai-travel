/**
 * 地图地理计算、坐标数据库与路线规划工具
 */

export interface GeoPoint {
  address?: string
  lat: number
  lng: number
  name: string
}

// 常见城市预置中心点坐标
export const CITY_COORDINATES: Record<string, { lat: number, lng: number }> = {
  三亚: { lat: 18.2528, lng: 109.5119 },
  上海: { lat: 31.2304, lng: 121.4737 },
  北京: { lat: 39.9042, lng: 116.4074 },
  南京: { lat: 32.0603, lng: 118.7969 },
  厦门: { lat: 24.4798, lng: 118.0894 },
  大理: { lat: 25.6065, lng: 100.2676 },
  敦煌: { lat: 40.1421, lng: 94.6620 },
  广州: { lat: 23.1291, lng: 113.2644 },
  成都: { lat: 30.5728, lng: 104.0668 },
  昆明: { lat: 24.8801, lng: 102.8329 },
  杭州: { lat: 30.2741, lng: 120.1551 },
  武汉: { lat: 30.5928, lng: 114.3055 },
  洛阳: { lat: 34.6181, lng: 112.4540 },
  桂林: { lat: 25.2736, lng: 110.2902 },
  苏州: { lat: 31.2990, lng: 120.5853 },
  西安: { lat: 34.3416, lng: 108.9398 },
  重庆: { lat: 29.5630, lng: 106.5516 },
  长沙: { lat: 28.2282, lng: 112.9388 },
  青岛: { lat: 36.0671, lng: 120.3826 },
  丽江: { lat: 26.8721, lng: 100.2299 },
}

// 知名景点真实坐标库（全面覆盖热门旅游城市核心景点）
export const SPOT_COORDINATES: Record<string, { lat: number, lng: number }> = {
  // 西安
  '兵马俑': { lat: 34.3841, lng: 109.2785 },
  '华清宫': { lat: 34.3640, lng: 109.2130 },
  '骊山': { lat: 34.3580, lng: 109.2190 },
  '陕西历史博物馆': { lat: 34.2255, lng: 108.9540 },
  '大雁塔': { lat: 34.2189, lng: 108.9640 },
  '大慈恩寺': { lat: 34.2185, lng: 108.9635 },
  '大唐不夜城': { lat: 34.2045, lng: 108.9645 },
  '大唐芙蓉园': { lat: 34.2120, lng: 108.9730 },
  '长安十二时辰': { lat: 34.2060, lng: 108.9650 },
  '钟楼': { lat: 34.2610, lng: 108.9420 },
  '鼓楼': { lat: 34.2620, lng: 108.9390 },
  '回民街': { lat: 34.2655, lng: 108.9420 },
  '西安城墙': { lat: 34.2588, lng: 108.9470 },
  '永宁门': { lat: 34.2510, lng: 108.9420 },
  '碑林博物馆': { lat: 34.2530, lng: 108.9485 },
  '小雁塔': { lat: 34.2380, lng: 108.9380 },
  '大明宫': { lat: 34.2980, lng: 108.9630 },
  '大明宫国家遗址公园': { lat: 34.2980, lng: 108.9630 },
  '青龙寺': { lat: 34.2320, lng: 108.9850 },

  // 成都
  '大熊猫繁育研究基地': { lat: 30.7335, lng: 104.1448 },
  '文殊院': { lat: 30.6778, lng: 104.0725 },
  '奎星楼街': { lat: 30.6725, lng: 104.0550 },
  '宽窄巷子': { lat: 30.6690, lng: 104.0530 },
  '人民公园': { lat: 30.6580, lng: 104.0560 },
  '天府广场': { lat: 30.6570, lng: 104.0660 },
  '春熙路': { lat: 30.6558, lng: 104.0799 },
  '太古里': { lat: 30.6540, lng: 104.0820 },
  '武侯祠': { lat: 30.6455, lng: 104.0489 },
  '锦里': { lat: 30.6480, lng: 104.0498 },
  '杜甫草堂': { lat: 30.6599, lng: 104.0279 },
  '青羊宫': { lat: 30.6610, lng: 104.0390 },
  '玉林路': { lat: 30.6321, lng: 104.0620 },
  '东郊记忆': { lat: 30.6680, lng: 104.1280 },
  '金沙遗址博物馆': { lat: 30.6820, lng: 104.0080 },
  '都江堰': { lat: 30.9980, lng: 103.6120 },
  '青城山': { lat: 30.9020, lng: 103.5710 },

  // 杭州
  '西湖': { lat: 30.2435, lng: 120.1450 },
  '断桥残雪': { lat: 30.2589, lng: 120.1489 },
  '平湖秋月': { lat: 30.2530, lng: 120.1410 },
  '苏堤春晓': { lat: 30.2390, lng: 120.1320 },
  '花港观鱼': { lat: 30.2310, lng: 120.1340 },
  '雷峰塔': { lat: 30.2312, lng: 120.1480 },
  '灵隐寺': { lat: 30.2415, lng: 120.1009 },
  '飞来峰': { lat: 30.2420, lng: 120.0990 },
  '龙井村': { lat: 30.2189, lng: 120.1089 },
  '九溪十八涧': { lat: 30.1989, lng: 120.1120 },
  '西溪湿地': { lat: 30.2718, lng: 120.0620 },
  '宋城': { lat: 30.1788, lng: 120.0988 },
  '河坊街': { lat: 30.2390, lng: 120.1680 },
  '拱宸桥': { lat: 30.3180, lng: 120.1420 },
  '良渚古城遗址': { lat: 30.3950, lng: 119.9880 },

  // 北京
  '天安门': { lat: 39.9054, lng: 116.3976 },
  '天安门广场': { lat: 39.9054, lng: 116.3976 },
  '故宫': { lat: 39.9163, lng: 116.3972 },
  '故宫博物院': { lat: 39.9163, lng: 116.3972 },
  '景山公园': { lat: 39.9245, lng: 116.3975 },
  '北海公园': { lat: 39.9280, lng: 116.3880 },
  '什刹海': { lat: 39.9380, lng: 116.3870 },
  '南锣鼓巷': { lat: 39.9360, lng: 116.4030 },
  '恭王府': { lat: 39.9370, lng: 116.3850 },
  '雍和宫': { lat: 39.9480, lng: 116.4170 },
  '天坛': { lat: 39.8822, lng: 116.4066 },
  '天坛公园': { lat: 39.8822, lng: 116.4066 },
  '颐和园': { lat: 39.9998, lng: 116.2755 },
  '圆明园': { lat: 40.0070, lng: 116.2990 },
  '鸟巢': { lat: 39.9928, lng: 116.3965 },
  '水立方': { lat: 39.9920, lng: 116.3880 },
  '八达岭长城': { lat: 40.3598, lng: 116.0150 },
  '慕田峪长城': { lat: 40.4310, lng: 116.5620 },
  '798艺术区': { lat: 39.9840, lng: 116.4950 },

  // 上海
  '外滩': { lat: 31.2398, lng: 121.4905 },
  '陆家嘴': { lat: 31.2380, lng: 121.5010 },
  '东方明珠': { lat: 31.2396, lng: 121.4998 },
  '上海中心大厦': { lat: 31.2330, lng: 121.5050 },
  '豫园': { lat: 31.2272, lng: 121.4920 },
  '城隍庙': { lat: 31.2260, lng: 121.4910 },
  '南京路步行街': { lat: 31.2345, lng: 121.4780 },
  '新天地': { lat: 31.2180, lng: 121.4740 },
  '武康路': { lat: 31.2080, lng: 121.4420 },
  '静安寺': { lat: 31.2230, lng: 121.4460 },
  '迪士尼乐园': { lat: 31.1415, lng: 121.6570 },
  '田子坊': { lat: 31.2085, lng: 121.4680 },

  // 南京
  '中山陵': { lat: 32.0620, lng: 118.8480 },
  '明孝陵': { lat: 32.0570, lng: 118.8350 },
  '夫子庙': { lat: 32.0210, lng: 118.7880 },
  '秦淮河': { lat: 32.0200, lng: 118.7850 },
  '总统府': { lat: 32.0440, lng: 118.7960 },
  '玄武湖': { lat: 32.0720, lng: 118.7980 },
  '鸡鸣寺': { lat: 32.0590, lng: 118.7970 },
  '老门东': { lat: 32.0160, lng: 118.7910 },
  '牛首山': { lat: 31.9120, lng: 118.7490 },

  // 三亚
  '亚龙湾': { lat: 18.2120, lng: 109.6450 },
  '海棠湾': { lat: 18.3050, lng: 109.7350 },
  '蜈支洲岛': { lat: 18.3120, lng: 109.7610 },
  '天涯海角': { lat: 18.2930, lng: 109.3480 },
  '鹿回头': { lat: 18.2210, lng: 109.5020 },
  '南山文化旅游区': { lat: 18.3060, lng: 109.1820 },
  '椰梦长廊': { lat: 18.2720, lng: 109.4650 },
  '后海村': { lat: 18.3080, lng: 109.7420 },

  // 大理
  '大理古城': { lat: 25.6989, lng: 100.1645 },
  '崇圣寺三塔': { lat: 25.7088, lng: 100.1469 },
  '才村': { lat: 25.7188, lng: 100.1989 },
  '才村码头': { lat: 25.7188, lng: 100.1989 },
  '龙龛码头': { lat: 25.6880, lng: 100.2010 },
  '洱海生态廊道': { lat: 25.7350, lng: 100.1850 },
  '喜洲': { lat: 25.8569, lng: 100.1345 },
  '喜洲古镇': { lat: 25.8569, lng: 100.1345 },
  '周城': { lat: 25.9080, lng: 100.1420 },
  '双廊': { lat: 25.9142, lng: 100.1923 },
  '双廊古镇': { lat: 25.9142, lng: 100.1923 },
  '挖色': { lat: 25.8369, lng: 100.2312 },
  '挖色镇': { lat: 25.8369, lng: 100.2312 },
  '小普陀': { lat: 25.8120, lng: 100.2450 },
  '海东': { lat: 25.7258, lng: 100.2789 },
  '海东镇': { lat: 25.7258, lng: 100.2789 },
  '文笔村': { lat: 25.6890, lng: 100.2850 },
  '理想邦': { lat: 25.6720, lng: 100.2760 },
  '苍山': { lat: 25.6421, lng: 100.1120 },

  // 丽江
  '丽江古城': { lat: 26.8721, lng: 100.2299 },
  '大研古镇': { lat: 26.8721, lng: 100.2299 },
  '玉龙雪山': { lat: 27.1250, lng: 100.1820 },
  '蓝月谷': { lat: 27.1180, lng: 100.2050 },
  '束河古镇': { lat: 26.9210, lng: 100.2050 },
  '白沙古镇': { lat: 26.9580, lng: 100.2180 },
  '木府': { lat: 26.8690, lng: 100.2330 },
  '泸沽湖': { lat: 27.7050, lng: 100.7810 },

  // 厦门
  '鼓浪屿': { lat: 24.4450, lng: 118.0670 },
  '南普陀寺': { lat: 24.4410, lng: 118.0980 },
  '厦门大学': { lat: 24.4370, lng: 118.0990 },
  '环岛路': { lat: 24.4320, lng: 118.1450 },
  '曾厝垵': { lat: 24.4280, lng: 118.1250 },
  '沙坡尾': { lat: 24.4400, lng: 118.0870 },
  '植物园': { lat: 24.4490, lng: 118.1060 },
  '万石植物园': { lat: 24.4490, lng: 118.1060 },
  '集美学村': { lat: 24.5710, lng: 118.0980 },

  // 重庆
  '解放碑': { lat: 29.5570, lng: 106.5770 },
  '洪崖洞': { lat: 29.5630, lng: 106.5780 },
  '长江索道': { lat: 29.5580, lng: 106.5860 },
  '李子坝': { lat: 29.5540, lng: 106.5390 },
  '磁器口': { lat: 29.5820, lng: 106.4460 },
  '鹅岭二厂': { lat: 29.5490, lng: 106.5380 },
  '三峡博物馆': { lat: 29.5620, lng: 106.5490 },
  '朝天门': { lat: 29.5680, lng: 106.5880 },

  // 武汉
  '黄鹤楼': { lat: 30.5440, lng: 114.3030 },
  '东湖': { lat: 30.5580, lng: 114.4120 },
  '武汉长江大桥': { lat: 30.5510, lng: 114.2920 },
  '户部巷': { lat: 30.5490, lng: 114.2980 },
  '昙华林': { lat: 30.5520, lng: 114.3120 },
  '湖北省博物馆': { lat: 30.5630, lng: 114.3640 },

  // 青岛
  '栈桥': { lat: 36.0590, lng: 120.3180 },
  '八大关': { lat: 36.0540, lng: 120.3540 },
  '五四广场': { lat: 36.0620, lng: 120.3820 },
  '信号山公园': { lat: 36.0660, lng: 120.3320 },
  '崂山': { lat: 36.1420, lng: 120.6120 },

  // 苏州
  '拙政园': { lat: 31.3240, lng: 120.6290 },
  '留园': { lat: 31.3170, lng: 120.5980 },
  '虎丘': { lat: 31.3380, lng: 120.5780 },
  '寒山寺': { lat: 31.3120, lng: 120.5700 },
  '平江路': { lat: 31.3160, lng: 120.6350 },
  '山塘街': { lat: 31.3180, lng: 120.6020 },
  '苏州博物馆': { lat: 31.3250, lng: 120.6270 },

  // 洛阳
  '龙门石窟': { lat: 34.5580, lng: 112.4680 },
  '白马寺': { lat: 34.7210, lng: 112.5980 },
  '洛邑古城': { lat: 34.6850, lng: 112.4850 },
  '应天门': { lat: 34.6780, lng: 112.4580 },

  // 桂林
  '象鼻山': { lat: 25.2680, lng: 110.2980 },
  '漓江': { lat: 25.2750, lng: 110.3020 },
  '阳朔西街': { lat: 24.7780, lng: 110.4950 },
  '遇龙河': { lat: 24.7920, lng: 110.4580 },
  '兴坪古镇': { lat: 24.9210, lng: 110.5310 },

  // 敦煌
  '莫高窟': { lat: 40.0380, lng: 94.8080 },
  '鸣沙山月牙泉': { lat: 40.0880, lng: 94.6720 },
}

/**
 * 计算两点间的球面真实距离 (公里)
 */
export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a
    = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const dist = R * c
  return Number(Math.max(dist, 0.8).toFixed(1))
}

/**
 * 计算两点间的行进方位角 (Heading，0-360度)，用于指示载具方向
 */
export function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180)
  const x
    = Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180)
      - Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng)
  const brng = (Math.atan2(y, x) * 180) / Math.PI
  return (brng + 360) % 360
}

/**
 * 根据两点距离和交通方式估算耗时 (分钟)
 */
export function estimateDurationMinutes(
  distanceKm: number,
  mode: 'driving' | 'transit' | 'walking' = 'driving',
): number {
  if (mode === 'driving') {
    // 市区平均 35km/h + 5分钟红绿灯等待
    return Math.max(Math.round((distanceKm / 35) * 60) + 4, 6)
  }
  if (mode === 'transit') {
    // 公交地铁平均 22km/h + 10分钟等车与步行
    return Math.max(Math.round((distanceKm / 22) * 60) + 10, 12)
  }
  // walking: 步行约 4.5km/h
  return Math.max(Math.round((distanceKm / 4.5) * 60), 8)
}

/**
 * 格式化分钟为易读文案
 */
export function formatMinutesText(mins: number): string {
  if (mins < 60)
    return `${mins}分钟`
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  return rest > 0 ? `${hours}小时${rest}分` : `${hours}小时`
}

/**
 * 获取景点经纬度，若无精确坐标则在城市中心周围做有序地理展开
 */
export function getSpotCoordinates(spotName: string, cityName: string, index = 0): { lat: number, lng: number } {
  const cleanName = spotName.trim()
  if (SPOT_COORDINATES[cleanName]) {
    return SPOT_COORDINATES[cleanName]
  }

  // 模糊匹配
  for (const [key, coord] of Object.entries(SPOT_COORDINATES)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return coord
    }
  }

  // 降级使用城市中心并围绕排布
  const cityCenter = CITY_COORDINATES[cityName] || { lat: 39.9042, lng: 116.4074 }
  const angle = (index * 60 * Math.PI) / 180
  const radius = 0.022 + (index % 3) * 0.015

  return {
    lat: Number((cityCenter.lat + Math.sin(angle) * radius).toFixed(5)),
    lng: Number((cityCenter.lng + Math.cos(angle) * radius).toFixed(5)),
  }
}

/**
 * 生成高德地图 Web / 移动端路线导航直达链接
 */
export function generateAmapRouteUrl(
  startName: string,
  destName: string,
  city: string,
  mode: 'bus' | 'car' | 'ride' | 'walk' = 'car',
): string {
  const encodedFrom = encodeURIComponent(startName)
  const encodedTo = encodeURIComponent(destName)
  const encodedCity = encodeURIComponent(city)
  return `https://uri.amap.com/navigation?from=${encodedFrom}&to=${encodedTo}&mode=${mode}&policy=1&src=mypage&coordinate=gaode&callnative=0&city=${encodedCity}`
}

/**
 * 生成百度地图路线规划直达链接
 */
export function generateBaiduRouteUrl(
  startName: string,
  destName: string,
  city: string,
  mode: 'driving' | 'transit' | 'walking' = 'driving',
): string {
  const origin = encodeURIComponent(startName)
  const destination = encodeURIComponent(destName)
  const region = encodeURIComponent(city)
  return `https://api.map.baidu.com/direction?origin=${origin}&destination=${destination}&mode=${mode}&region=${region}&output=html&src=webapp.travel`
}

/**
 * 生成腾讯地图路线规划链接
 */
export function generateTencentRouteUrl(
  startName: string,
  destName: string,
  city: string,
  mode: 'bus' | 'drive' | 'walk' = 'drive',
): string {
  const from = encodeURIComponent(startName)
  const to = encodeURIComponent(destName)
  const region = encodeURIComponent(city)
  return `https://apis.map.qq.com/uri/v1/routeplan?type=${mode}&from=${from}&to=${to}&city=${region}&referer=travel-ai`
}
