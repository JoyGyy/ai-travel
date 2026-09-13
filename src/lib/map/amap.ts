/**
 * 地图地理计算、坐标数据库与路线规划工具
 */

export interface GeoPoint {
  address?: string;
  lat: number;
  lng: number;
  name: string;
}

export interface RouteEndpoint {
  lat?: number;
  lng?: number;
  name: string;
}

// 常见城市预置中心点坐标
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  三亚: { lat: 18.2528, lng: 109.5119 },
  上海: { lat: 31.2304, lng: 121.4737 },
  北京: { lat: 39.9042, lng: 116.4074 },
  南京: { lat: 32.0603, lng: 118.7969 },
  厦门: { lat: 24.4798, lng: 118.0894 },
  大理: { lat: 25.6065, lng: 100.2676 },
  敦煌: { lat: 40.1421, lng: 94.662 },
  广州: { lat: 23.1291, lng: 113.2644 },
  成都: { lat: 30.5728, lng: 104.0668 },
  昆明: { lat: 24.8801, lng: 102.8329 },
  杭州: { lat: 30.2741, lng: 120.1551 },
  武汉: { lat: 30.5928, lng: 114.3055 },
  洛阳: { lat: 34.6181, lng: 112.454 },
  桂林: { lat: 25.2736, lng: 110.2902 },
  苏州: { lat: 31.299, lng: 120.5853 },
  西安: { lat: 34.3416, lng: 108.9398 },
  重庆: { lat: 29.563, lng: 106.5516 },
  长沙: { lat: 28.2282, lng: 112.9388 },
  青岛: { lat: 36.0671, lng: 120.3826 },
  丽江: { lat: 26.8721, lng: 100.2299 },
};

// 知名景点真实坐标库（全面覆盖热门旅游城市核心景点）
export const SPOT_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // 西安
  兵马俑: { lat: 34.3841, lng: 109.2785 },
  华清宫: { lat: 34.364, lng: 109.213 },
  骊山: { lat: 34.358, lng: 109.219 },
  陕西历史博物馆: { lat: 34.2255, lng: 108.954 },
  大雁塔: { lat: 34.2189, lng: 108.964 },
  大慈恩寺: { lat: 34.2185, lng: 108.9635 },
  大唐不夜城: { lat: 34.2045, lng: 108.9645 },
  大唐芙蓉园: { lat: 34.212, lng: 108.973 },
  长安十二时辰: { lat: 34.206, lng: 108.965 },
  钟楼: { lat: 34.261, lng: 108.942 },
  鼓楼: { lat: 34.262, lng: 108.939 },
  回民街: { lat: 34.2655, lng: 108.942 },
  西安城墙: { lat: 34.2588, lng: 108.947 },
  永宁门: { lat: 34.251, lng: 108.942 },
  碑林博物馆: { lat: 34.253, lng: 108.9485 },
  小雁塔: { lat: 34.238, lng: 108.938 },
  大明宫: { lat: 34.298, lng: 108.963 },
  大明宫国家遗址公园: { lat: 34.298, lng: 108.963 },
  青龙寺: { lat: 34.232, lng: 108.985 },

  // 成都
  大熊猫繁育研究基地: { lat: 30.7335, lng: 104.1448 },
  文殊院: { lat: 30.6778, lng: 104.0725 },
  奎星楼街: { lat: 30.6725, lng: 104.055 },
  宽窄巷子: { lat: 30.669, lng: 104.053 },
  人民公园: { lat: 30.658, lng: 104.056 },
  天府广场: { lat: 30.657, lng: 104.066 },
  春熙路: { lat: 30.6558, lng: 104.0799 },
  太古里: { lat: 30.654, lng: 104.082 },
  武侯祠: { lat: 30.6455, lng: 104.0489 },
  锦里: { lat: 30.648, lng: 104.0498 },
  杜甫草堂: { lat: 30.6599, lng: 104.0279 },
  青羊宫: { lat: 30.661, lng: 104.039 },
  玉林路: { lat: 30.6321, lng: 104.062 },
  东郊记忆: { lat: 30.668, lng: 104.128 },
  金沙遗址博物馆: { lat: 30.682, lng: 104.008 },
  都江堰: { lat: 30.998, lng: 103.612 },
  青城山: { lat: 30.902, lng: 103.571 },

  // 杭州
  西湖: { lat: 30.2435, lng: 120.145 },
  断桥残雪: { lat: 30.2589, lng: 120.1489 },
  白堤: { lat: 30.2575, lng: 120.1472 },
  孤山: { lat: 30.2541, lng: 120.1388 },
  平湖秋月: { lat: 30.253, lng: 120.141 },
  曲院风荷: { lat: 30.251, lng: 120.131 },
  苏堤春晓: { lat: 30.239, lng: 120.132 },
  花港观鱼: { lat: 30.231, lng: 120.134 },
  三潭印月: { lat: 30.2388, lng: 120.142 },
  柳浪闻莺: { lat: 30.242, lng: 120.158 },
  雷峰塔: { lat: 30.2312, lng: 120.148 },
  灵隐寺: { lat: 30.2415, lng: 120.1009 },
  飞来峰: { lat: 30.242, lng: 120.099 },
  龙井村: { lat: 30.2189, lng: 120.1089 },
  九溪十八涧: { lat: 30.1989, lng: 120.112 },
  西溪湿地: { lat: 30.2718, lng: 120.062 },
  深潭口: { lat: 30.2662, lng: 120.061 },
  河渚街: { lat: 30.2702, lng: 120.0645 },
  宋城: { lat: 30.1788, lng: 120.0988 },
  河坊街: { lat: 30.239, lng: 120.168 },
  南宋御街: { lat: 30.2435, lng: 120.17 },
  拱宸桥: { lat: 30.318, lng: 120.142 },
  良渚古城遗址: { lat: 30.395, lng: 119.988 },

  // 北京
  天安门: { lat: 39.9054, lng: 116.3976 },
  天安门广场: { lat: 39.9054, lng: 116.3976 },
  故宫: { lat: 39.9163, lng: 116.3972 },
  故宫博物院: { lat: 39.9163, lng: 116.3972 },
  景山公园: { lat: 39.9245, lng: 116.3975 },
  北海公园: { lat: 39.928, lng: 116.388 },
  什刹海: { lat: 39.938, lng: 116.387 },
  南锣鼓巷: { lat: 39.936, lng: 116.403 },
  恭王府: { lat: 39.937, lng: 116.385 },
  雍和宫: { lat: 39.948, lng: 116.417 },
  天坛: { lat: 39.8822, lng: 116.4066 },
  天坛公园: { lat: 39.8822, lng: 116.4066 },
  颐和园: { lat: 39.9998, lng: 116.2755 },
  圆明园: { lat: 40.007, lng: 116.299 },
  鸟巢: { lat: 39.9928, lng: 116.3965 },
  水立方: { lat: 39.992, lng: 116.388 },
  八达岭长城: { lat: 40.3598, lng: 116.015 },
  慕田峪长城: { lat: 40.431, lng: 116.562 },
  '798艺术区': { lat: 39.984, lng: 116.495 },

  // 上海
  外滩: { lat: 31.2398, lng: 121.4905 },
  陆家嘴: { lat: 31.238, lng: 121.501 },
  东方明珠: { lat: 31.2396, lng: 121.4998 },
  上海中心大厦: { lat: 31.233, lng: 121.505 },
  豫园: { lat: 31.2272, lng: 121.492 },
  城隍庙: { lat: 31.226, lng: 121.491 },
  南京路步行街: { lat: 31.2345, lng: 121.478 },
  新天地: { lat: 31.218, lng: 121.474 },
  武康路: { lat: 31.208, lng: 121.442 },
  静安寺: { lat: 31.223, lng: 121.446 },
  迪士尼乐园: { lat: 31.1415, lng: 121.657 },
  田子坊: { lat: 31.2085, lng: 121.468 },

  // 南京
  中山陵: { lat: 32.062, lng: 118.848 },
  明孝陵: { lat: 32.057, lng: 118.835 },
  夫子庙: { lat: 32.021, lng: 118.788 },
  秦淮河: { lat: 32.02, lng: 118.785 },
  总统府: { lat: 32.044, lng: 118.796 },
  玄武湖: { lat: 32.072, lng: 118.798 },
  鸡鸣寺: { lat: 32.059, lng: 118.797 },
  老门东: { lat: 32.016, lng: 118.791 },
  牛首山: { lat: 31.912, lng: 118.749 },

  // 三亚
  亚龙湾: { lat: 18.212, lng: 109.645 },
  海棠湾: { lat: 18.305, lng: 109.735 },
  蜈支洲岛: { lat: 18.312, lng: 109.761 },
  天涯海角: { lat: 18.293, lng: 109.348 },
  鹿回头: { lat: 18.221, lng: 109.502 },
  南山文化旅游区: { lat: 18.306, lng: 109.182 },
  椰梦长廊: { lat: 18.272, lng: 109.465 },
  后海村: { lat: 18.308, lng: 109.742 },

  // 大理
  大理古城: { lat: 25.6989, lng: 100.1645 },
  崇圣寺三塔: { lat: 25.7088, lng: 100.1469 },
  才村: { lat: 25.7188, lng: 100.1989 },
  才村码头: { lat: 25.7188, lng: 100.1989 },
  龙龛码头: { lat: 25.688, lng: 100.201 },
  洱海生态廊道: { lat: 25.735, lng: 100.185 },
  喜洲: { lat: 25.8569, lng: 100.1345 },
  喜洲古镇: { lat: 25.8569, lng: 100.1345 },
  周城: { lat: 25.908, lng: 100.142 },
  双廊: { lat: 25.9142, lng: 100.1923 },
  双廊古镇: { lat: 25.9142, lng: 100.1923 },
  挖色: { lat: 25.8369, lng: 100.2312 },
  挖色镇: { lat: 25.8369, lng: 100.2312 },
  小普陀: { lat: 25.812, lng: 100.245 },
  海东: { lat: 25.7258, lng: 100.2789 },
  海东镇: { lat: 25.7258, lng: 100.2789 },
  文笔村: { lat: 25.689, lng: 100.285 },
  理想邦: { lat: 25.672, lng: 100.276 },
  苍山: { lat: 25.6421, lng: 100.112 },

  // 丽江
  丽江古城: { lat: 26.8721, lng: 100.2299 },
  大研古镇: { lat: 26.8721, lng: 100.2299 },
  玉龙雪山: { lat: 27.125, lng: 100.182 },
  蓝月谷: { lat: 27.118, lng: 100.205 },
  束河古镇: { lat: 26.921, lng: 100.205 },
  白沙古镇: { lat: 26.958, lng: 100.218 },
  木府: { lat: 26.869, lng: 100.233 },
  泸沽湖: { lat: 27.705, lng: 100.781 },

  // 厦门
  鼓浪屿: { lat: 24.445, lng: 118.067 },
  南普陀寺: { lat: 24.441, lng: 118.098 },
  厦门大学: { lat: 24.437, lng: 118.099 },
  环岛路: { lat: 24.432, lng: 118.145 },
  曾厝垵: { lat: 24.428, lng: 118.125 },
  沙坡尾: { lat: 24.44, lng: 118.087 },
  植物园: { lat: 24.449, lng: 118.106 },
  万石植物园: { lat: 24.449, lng: 118.106 },
  集美学村: { lat: 24.571, lng: 118.098 },

  // 重庆
  解放碑: { lat: 29.557, lng: 106.577 },
  洪崖洞: { lat: 29.563, lng: 106.578 },
  长江索道: { lat: 29.558, lng: 106.586 },
  李子坝: { lat: 29.554, lng: 106.539 },
  磁器口: { lat: 29.582, lng: 106.446 },
  鹅岭二厂: { lat: 29.549, lng: 106.538 },
  三峡博物馆: { lat: 29.562, lng: 106.549 },
  朝天门: { lat: 29.568, lng: 106.588 },

  // 武汉
  黄鹤楼: { lat: 30.544, lng: 114.303 },
  东湖: { lat: 30.558, lng: 114.412 },
  武汉长江大桥: { lat: 30.551, lng: 114.292 },
  户部巷: { lat: 30.549, lng: 114.298 },
  粮道街: { lat: 30.547, lng: 114.31 },
  辛亥革命博物馆: { lat: 30.536, lng: 114.305 },
  辛亥革命武昌起义纪念馆: { lat: 30.5375, lng: 114.3045 },
  首义广场: { lat: 30.537, lng: 114.304 },
  昙华林: { lat: 30.552, lng: 114.312 },
  湖北省博物馆: { lat: 30.563, lng: 114.364 },
  江汉路: { lat: 30.582, lng: 114.291 },
  江汉路步行街: { lat: 30.582, lng: 114.291 },
  汉口江滩: { lat: 30.591, lng: 114.309 },
  晴川阁: { lat: 30.552, lng: 114.286 },
  古琴台: { lat: 30.553, lng: 114.27 },

  // 襄阳
  古隆中: { lat: 32.012, lng: 112.035 },
  襄阳古城: { lat: 32.019, lng: 112.147 },
  唐城: { lat: 31.972, lng: 112.158 },
  襄阳唐城影视基地: { lat: 31.972, lng: 112.158 },
  米公祠: { lat: 32.032, lng: 112.148 },
  习家池: { lat: 31.977, lng: 112.152 },

  // 青岛
  栈桥: { lat: 36.059, lng: 120.318 },
  八大关: { lat: 36.054, lng: 120.354 },
  五四广场: { lat: 36.062, lng: 120.382 },
  信号山公园: { lat: 36.066, lng: 120.332 },
  崂山: { lat: 36.142, lng: 120.612 },

  // 苏州
  拙政园: { lat: 31.324, lng: 120.629 },
  留园: { lat: 31.317, lng: 120.598 },
  虎丘: { lat: 31.338, lng: 120.578 },
  寒山寺: { lat: 31.312, lng: 120.57 },
  平江路: { lat: 31.316, lng: 120.635 },
  山塘街: { lat: 31.318, lng: 120.602 },
  苏州博物馆: { lat: 31.325, lng: 120.627 },

  // 洛阳
  龙门石窟: { lat: 34.558, lng: 112.468 },
  白马寺: { lat: 34.721, lng: 112.598 },
  洛邑古城: { lat: 34.685, lng: 112.485 },
  应天门: { lat: 34.678, lng: 112.458 },

  // 桂林
  象鼻山: { lat: 25.268, lng: 110.298 },
  漓江: { lat: 25.275, lng: 110.302 },
  阳朔西街: { lat: 24.778, lng: 110.495 },
  遇龙河: { lat: 24.792, lng: 110.458 },
  兴坪古镇: { lat: 24.921, lng: 110.531 },

  // 敦煌
  莫高窟: { lat: 40.038, lng: 94.808 },
  鸣沙山月牙泉: { lat: 40.088, lng: 94.672 },
};

/**
 * GCJ-02 (高德/腾讯坐标系) 转 BD-09 (百度坐标系)
 */
export function gcj02ToBd09(
  lat: number,
  lng: number,
): { lat: number; lng: number } {
  const xPi = (Math.PI * 3000.0) / 180.0;
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * xPi);
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * xPi);
  const bdLng = z * Math.cos(theta) + 0.0065;
  const bdLat = z * Math.sin(theta) + 0.006;
  return { lat: Number(bdLat.toFixed(6)), lng: Number(bdLng.toFixed(6)) };
}

/**
 * 计算两点间的球面真实距离 (公里)
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Number(Math.max(dist, 0.8).toFixed(1));
}

/**
 * 计算两点间的行进方位角 (Heading，0-360度)，用于指示载具方向
 */
export function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * 计算两点中点经纬度坐标 (用于在路径中点展示通勤耗时气泡)
 */
export function calculateMidPoint(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): { lat: number; lng: number } {
  return {
    lat: Number(((lat1 + lat2) / 2).toFixed(6)),
    lng: Number(((lng1 + lng2) / 2).toFixed(6)),
  };
}

/**
 * 计算线段中点在垂直法线方向上的微调坐标 (用于防止耗时气泡与折线或端点标点死板重叠)
 */
export function calculateNormalOffset(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  offsetRatio = 0.08,
): { lat: number; lng: number } {
  const mid = calculateMidPoint(lat1, lng1, lat2, lng2);
  const dLat = lat2 - lat1;
  const avgLatRad = (mid.lat * Math.PI) / 180;
  const dLng = (lng2 - lng1) * Math.cos(avgLatRad);
  const len = Math.sqrt(dLat * dLat + dLng * dLng);

  if (len < 1e-6) {
    return mid;
  }

  const normLat = -dLng / len;
  const normLng = dLat / len / Math.cos(avgLatRad);

  const offsetMagnitude = len * offsetRatio;
  return {
    lat: Number((mid.lat + normLat * offsetMagnitude).toFixed(6)),
    lng: Number((mid.lng + normLng * offsetMagnitude).toFixed(6)),
  };
}

/**
 * 为两点生成平滑的二次贝塞尔弧线点集 (模拟商业旅行地图大跨度线路的自然地理曲线，消除生硬折线)
 */
export function generateCurvedSegmentPoints(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number },
  curvature = 0.12,
  numSegments = 16,
): [number, number][] {
  const dist = calculateDistanceKm(p1.lat, p1.lng, p2.lat, p2.lng);
  if (dist < 0.8 || curvature === 0) {
    return [
      [p1.lat, p1.lng],
      [p2.lat, p2.lng],
    ];
  }

  const mid = calculateMidPoint(p1.lat, p1.lng, p2.lat, p2.lng);
  const dLat = p2.lat - p1.lat;
  const avgLatRad = (mid.lat * Math.PI) / 180;
  const dLng = (p2.lng - p1.lng) * Math.cos(avgLatRad);
  const len = Math.sqrt(dLat * dLat + dLng * dLng);

  const normLat = -dLng / len;
  const normLng = dLat / len / Math.cos(avgLatRad);

  const ctrlLat = mid.lat + normLat * len * curvature;
  const ctrlLng = mid.lng + normLng * len * curvature;

  const points: [number, number][] = [];
  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments;
    const invT = 1 - t;
    const lat = invT * invT * p1.lat + 2 * invT * t * ctrlLat + t * t * p2.lat;
    const lng = invT * invT * p1.lng + 2 * invT * t * ctrlLng + t * t * p2.lng;
    points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }
  return points;
}

/**
 * 生成全路线平滑连续轨迹点集
 */
export function generateSmoothRoutePolyline(
  points: { lat: number; lng: number }[],
  curvature = 0.08,
): [number, number][] {
  if (points.length < 2) {
    return points.map((p) => [p.lat, p.lng]);
  }

  const fullPath: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const sign = i % 2 === 0 ? 1 : -0.7;
    const segment = generateCurvedSegmentPoints(
      points[i],
      points[i + 1],
      curvature * sign,
      12,
    );
    if (i > 0) {
      fullPath.push(...segment.slice(1));
    } else {
      fullPath.push(...segment);
    }
  }
  return fullPath;
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
    return Math.max(Math.round((distanceKm / 35) * 60) + 4, 6);
  }
  if (mode === 'transit') {
    // 公交地铁平均 22km/h + 10分钟等车与步行
    return Math.max(Math.round((distanceKm / 22) * 60) + 10, 12);
  }
  // walking: 步行约 4.5km/h
  return Math.max(Math.round((distanceKm / 4.5) * 60), 8);
}

/**
 * 格式化分钟为易读文案
 */
export function formatMinutesText(mins: number): string {
  if (mins < 60) return `${mins}分钟`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest > 0 ? `${hours}小时${rest}分` : `${hours}小时`;
}

/**
 * 获取景点经纬度，若无精确坐标则在城市中心周围做有序地理展开
 */
export function getSpotCoordinates(
  spotName: string,
  cityName: string,
  index = 0,
): { lat: number; lng: number } {
  const cleanName = spotName.trim();
  if (SPOT_COORDINATES[cleanName]) {
    return SPOT_COORDINATES[cleanName];
  }

  // 模糊匹配
  for (const [key, coord] of Object.entries(SPOT_COORDINATES)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return coord;
    }
  }

  // 降级使用城市中心并围绕排布
  const cityCenter = CITY_COORDINATES[cityName] || {
    lat: 39.9042,
    lng: 116.4074,
  };
  const angle = (index * 60 * Math.PI) / 180;
  const radius = 0.022 + (index % 3) * 0.015;

  return {
    lat: Number((cityCenter.lat + Math.sin(angle) * radius).toFixed(5)),
    lng: Number((cityCenter.lng + Math.cos(angle) * radius).toFixed(5)),
  };
}

/**
 * 生成高德地图 Web / 移动端路线导航直达链接 (带真实经纬度、途经点与名称)
 */
export function generateAmapRouteUrl(
  start: string | RouteEndpoint,
  dest: string | RouteEndpoint,
  city: string,
  mode: 'bus' | 'car' | 'ride' | 'walk' = 'car',
  waypoints: (string | RouteEndpoint)[] = [],
): string {
  const startName = (typeof start === 'string' ? start : start.name)
    .replace(/[,，]/g, ' ')
    .trim();
  const destName = (typeof dest === 'string' ? dest : dest.name)
    .replace(/[,，]/g, ' ')
    .trim();

  const startCoord =
    typeof start === 'object' && start.lat && start.lng
      ? { lat: start.lat, lng: start.lng }
      : getSpotCoordinates(startName, city);

  const destCoord =
    typeof dest === 'object' && dest.lat && dest.lng
      ? { lat: dest.lat, lng: dest.lng }
      : getSpotCoordinates(destName, city);

  const encodedFrom = encodeURIComponent(startName);
  const encodedTo = encodeURIComponent(destName);
  const encodedCity = encodeURIComponent(city);

  let viaParam = '';
  if (waypoints && waypoints.length > 0) {
    const viaList = waypoints.map((pt, idx) => {
      const name = (typeof pt === 'string' ? pt : pt.name)
        .replace(/[,，|]/g, ' ')
        .trim();
      const coord =
        typeof pt === 'object' && pt.lat && pt.lng
          ? { lat: pt.lat, lng: pt.lng }
          : getSpotCoordinates(name, city, idx + 1);
      return `${coord.lng},${coord.lat},${encodeURIComponent(name)}`;
    });
    viaParam = `&via=${viaList.join('|')}`;
  }

  // 高德导航 URI 规范: from=lng,lat,name&to=lng,lat,name&via=lng,lat,name|... (经度在前，纬度在后)
  return `https://uri.amap.com/navigation?from=${startCoord.lng},${startCoord.lat},${encodedFrom}&to=${destCoord.lng},${destCoord.lat},${encodedTo}${viaParam}&mode=${mode}&policy=1&src=mypage&coordinate=gaode&callnative=0&city=${encodedCity}`;
}

/**
 * 生成百度地图路线规划直达链接 (带真实经纬度 BD-09、途经点与名称)
 */
export function generateBaiduRouteUrl(
  start: string | RouteEndpoint,
  dest: string | RouteEndpoint,
  city: string,
  mode: 'driving' | 'transit' | 'walking' = 'driving',
  waypoints: (string | RouteEndpoint)[] = [],
): string {
  const startName = (typeof start === 'string' ? start : start.name)
    .replace(/\|/g, ' ')
    .trim();
  const destName = (typeof dest === 'string' ? dest : dest.name)
    .replace(/\|/g, ' ')
    .trim();

  const startCoord =
    typeof start === 'object' && start.lat && start.lng
      ? { lat: start.lat, lng: start.lng }
      : getSpotCoordinates(startName, city);

  const destCoord =
    typeof dest === 'object' && dest.lat && dest.lng
      ? { lat: dest.lat, lng: dest.lng }
      : getSpotCoordinates(destName, city);

  const bdStart = gcj02ToBd09(startCoord.lat, startCoord.lng);
  const bdDest = gcj02ToBd09(destCoord.lat, destCoord.lng);

  const encodedFrom = encodeURIComponent(startName);
  const encodedTo = encodeURIComponent(destName);
  const encodedCity = encodeURIComponent(city);

  let viaParam = '';
  if (waypoints && waypoints.length > 0) {
    const viaList = waypoints.map((pt, idx) => {
      const name = (typeof pt === 'string' ? pt : pt.name)
        .replace(/\|/g, ' ')
        .trim();
      const coord =
        typeof pt === 'object' && pt.lat && pt.lng
          ? { lat: pt.lat, lng: pt.lng }
          : getSpotCoordinates(name, city, idx + 1);
      const bd = gcj02ToBd09(coord.lat, coord.lng);
      return `latlng:${bd.lat},${bd.lng}|name:${encodeURIComponent(name)}`;
    });
    viaParam = `&waypoints=${viaList.join('|')}`;
  }

  // 百度地图 URI 规范: origin=latlng:lat,lng|name:xxx&destination=latlng:lat,lng|name:xxx&waypoints=...
  return `https://api.map.baidu.com/direction?origin=latlng:${bdStart.lat},${bdStart.lng}|name:${encodedFrom}&destination=latlng:${bdDest.lat},${bdDest.lng}|name:${encodedTo}${viaParam}&mode=${mode}&region=${encodedCity}&output=html&src=webapp.travel`;
}

/**
 * 生成腾讯地图路线规划链接 (带真实经纬度、途经点与名称)
 */
export function generateTencentRouteUrl(
  start: string | RouteEndpoint,
  dest: string | RouteEndpoint,
  city: string,
  mode: 'bus' | 'drive' | 'walk' = 'drive',
  waypoints: (string | RouteEndpoint)[] = [],
): string {
  const startName = (typeof start === 'string' ? start : start.name).trim();
  const destName = (typeof dest === 'string' ? dest : dest.name).trim();

  const startCoord =
    typeof start === 'object' && start.lat && start.lng
      ? { lat: start.lat, lng: start.lng }
      : getSpotCoordinates(startName, city);

  const destCoord =
    typeof dest === 'object' && dest.lat && dest.lng
      ? { lat: dest.lat, lng: dest.lng }
      : getSpotCoordinates(destName, city);

  const encodedFrom = encodeURIComponent(startName);
  const encodedTo = encodeURIComponent(destName);
  const encodedCity = encodeURIComponent(city);

  let viaParam = '';
  if (waypoints && waypoints.length > 0) {
    const viaList = waypoints.map((pt, idx) => {
      const name = (typeof pt === 'string' ? pt : pt.name).trim();
      const coord =
        typeof pt === 'object' && pt.lat && pt.lng
          ? { lat: pt.lat, lng: pt.lng }
          : getSpotCoordinates(name, city, idx + 1);
      return `${coord.lat},${coord.lng},${encodeURIComponent(name)}`;
    });
    viaParam = `&via=${viaList.join(';')}`;
  }

  // 腾讯地图 URI 规范: type=drive&from=xxx&fromcoord=lat,lng&to=xxx&tocoord=lat,lng&via=...
  return `https://apis.map.qq.com/uri/v1/routeplan?type=${mode}&from=${encodedFrom}&fromcoord=${startCoord.lat},${startCoord.lng}&to=${encodedTo}&tocoord=${destCoord.lat},${destCoord.lng}${viaParam}&policy=1&referer=travel-ai&city=${encodedCity}`;
}

/**
 * 生成单点标记查看链接 (高德地图)
 */
export function generateAmapSpotUrl(
  spot: string | RouteEndpoint,
  city: string,
): string {
  const name = (typeof spot === 'string' ? spot : spot.name)
    .replace(/[,，]/g, ' ')
    .trim();
  const coord =
    typeof spot === 'object' && spot.lat && spot.lng
      ? { lat: spot.lat, lng: spot.lng }
      : getSpotCoordinates(name, city);
  const encodedName = encodeURIComponent(name);
  return `https://uri.amap.com/marker?position=${coord.lng},${coord.lat}&name=${encodedName}&src=mypage&coordinate=gaode&callnative=0`;
}

/**
 * 生成单点标记查看链接 (百度地图)
 */
export function generateBaiduSpotUrl(
  spot: string | RouteEndpoint,
  city: string,
): string {
  const name = (typeof spot === 'string' ? spot : spot.name).trim();
  const coord =
    typeof spot === 'object' && spot.lat && spot.lng
      ? { lat: spot.lat, lng: spot.lng }
      : getSpotCoordinates(name, city);
  const bd = gcj02ToBd09(coord.lat, coord.lng);
  const encodedName = encodeURIComponent(name);
  const encodedCity = encodeURIComponent(city);
  return `https://api.map.baidu.com/marker?location=${bd.lat},${bd.lng}&title=${encodedName}&content=${encodedCity}&output=html&src=webapp.travel`;
}

/**
 * 生成单点标记查看链接 (腾讯地图)
 */
export function generateTencentSpotUrl(
  spot: string | RouteEndpoint,
  city: string,
): string {
  const name = (typeof spot === 'string' ? spot : spot.name).trim();
  const coord =
    typeof spot === 'object' && spot.lat && spot.lng
      ? { lat: spot.lat, lng: spot.lng }
      : getSpotCoordinates(name, city);
  const encodedName = encodeURIComponent(name);
  const encodedCity = encodeURIComponent(city);
  return `https://apis.map.qq.com/uri/v1/marker?marker=coord:${coord.lat},${coord.lng};title:${encodedName};addr=${encodedCity}&referer=travel-ai`;
}

/**
 * 生成高德地图原生 App 唤起导航协议 (URI Scheme: amapuri://route/plan)
 * 支持移动端一键唤起真实高德 App 发起导航规划
 */
export function generateAmapNativeSchemeUrl(
  start: string | RouteEndpoint,
  dest: string | RouteEndpoint,
  city: string,
  mode: 'bus' | 'car' | 'ride' | 'walk' = 'car',
): string {
  const startName = (typeof start === 'string' ? start : start.name).trim();
  const destName = (typeof dest === 'string' ? dest : dest.name).trim();

  const startCoord =
    typeof start === 'object' && start.lat && start.lng
      ? { lat: start.lat, lng: start.lng }
      : getSpotCoordinates(startName, city);

  const destCoord =
    typeof dest === 'object' && dest.lat && dest.lng
      ? { lat: dest.lat, lng: dest.lng }
      : getSpotCoordinates(destName, city);

  // 高德 Scheme: t: 0驾车, 1公交, 2步行, 3骑行
  const modeCodeMap: Record<string, number> = {
    car: 0,
    bus: 1,
    walk: 2,
    ride: 3,
  };
  const t = modeCodeMap[mode] ?? 0;

  return `amapuri://route/plan/?sourceApplication=TravelAI&sname=${encodeURIComponent(
    startName,
  )}&slat=${startCoord.lat}&slon=${startCoord.lng}&dname=${encodeURIComponent(
    destName,
  )}&dlat=${destCoord.lat}&dlon=${destCoord.lng}&dev=0&t=${t}`;
}
