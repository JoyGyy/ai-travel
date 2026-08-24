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

// 知名景点真实坐标库（覆盖热门旅游城市核心景点）
export const SPOT_COORDINATES: Record<string, { lat: number, lng: number }> = {
  // 大理环洱海
  大理古城: { lat: 25.6989, lng: 100.1645 },
  崇圣寺三塔: { lat: 25.7088, lng: 100.1469 },
  才村: { lat: 25.7188, lng: 100.1989 },
  才村码头: { lat: 25.7188, lng: 100.1989 },
  洱海生态廊道: { lat: 25.7350, lng: 100.1850 },
  喜洲: { lat: 25.8569, lng: 100.1345 },
  喜洲古镇: { lat: 25.8569, lng: 100.1345 },
  周城: { lat: 25.9080, lng: 100.1420 },
  双廊: { lat: 25.9142, lng: 100.1923 },
  双廊古镇: { lat: 25.9142, lng: 100.1923 },
  挖色: { lat: 25.8369, lng: 100.2312 },
  挖色镇: { lat: 25.8369, lng: 100.2312 },
  小普陀: { lat: 25.8120, lng: 100.2450 },
  海东: { lat: 25.7258, lng: 100.2789 },
  海东镇: { lat: 25.7258, lng: 100.2789 },
  文笔村: { lat: 25.6890, lng: 100.2850 },
  理想邦: { lat: 25.6720, lng: 100.2760 },
  苍山: { lat: 25.6421, lng: 100.1120 },

  // 成都
  大熊猫繁育研究基地: { lat: 30.7335, lng: 104.1448 },
  文殊院: { lat: 30.6778, lng: 104.0725 },
  奎星楼街: { lat: 30.6725, lng: 104.0550 },
  宽窄巷子: { lat: 30.6690, lng: 104.0530 },
  人民公园: { lat: 30.6580, lng: 104.0560 },
  天府广场: { lat: 30.6570, lng: 104.0660 },
  春熙路: { lat: 30.6558, lng: 104.0799 },
  太古里: { lat: 30.6540, lng: 104.0820 },
  武侯祠: { lat: 30.6455, lng: 104.0489 },
  锦里: { lat: 30.6480, lng: 104.0498 },
  杜甫草堂: { lat: 30.6599, lng: 104.0279 },
  青羊宫: { lat: 30.6610, lng: 104.0390 },
  玉林路: { lat: 30.6321, lng: 104.0620 },
  东郊记忆: { lat: 30.6680, lng: 104.1280 },

  // 杭州
  西湖: { lat: 30.2435, lng: 120.1450 },
  断桥残雪: { lat: 30.2589, lng: 120.1489 },
  平湖秋月: { lat: 30.2530, lng: 120.1410 },
  苏堤春晓: { lat: 30.2390, lng: 120.1320 },
  花港观鱼: { lat: 30.2310, lng: 120.1340 },
  雷峰塔: { lat: 30.2312, lng: 120.1480 },
  灵隐寺: { lat: 30.2415, lng: 120.1009 },
  飞来峰: { lat: 30.2420, lng: 120.0990 },
  龙井村: { lat: 30.2189, lng: 120.1089 },
  九溪十八涧: { lat: 30.1989, lng: 120.1120 },
  西溪湿地: { lat: 30.2718, lng: 120.0620 },
  宋城: { lat: 30.1788, lng: 120.0988 },
  河坊街: { lat: 30.2390, lng: 120.1680 },

  // 北京
  天安门: { lat: 39.9054, lng: 116.3976 },
  故宫: { lat: 39.9163, lng: 116.3972 },
  故宫博物院: { lat: 39.9163, lng: 116.3972 },
  景山公园: { lat: 39.9245, lng: 116.3975 },
  北海公园: { lat: 39.9280, lng: 116.3880 },
  什刹海: { lat: 39.9380, lng: 116.3870 },
  南锣鼓巷: { lat: 39.9360, lng: 116.4030 },
  天坛: { lat: 39.8822, lng: 116.4066 },
  颐和园: { lat: 39.9998, lng: 116.2755 },
  圆明园: { lat: 40.0070, lng: 116.2990 },
  鸟巢: { lat: 39.9928, lng: 116.3965 },
  八达岭长城: { lat: 40.3598, lng: 116.0150 },

  // 西安
  钟楼: { lat: 34.2610, lng: 108.9420 },
  鼓楼: { lat: 34.2620, lng: 108.9390 },
  回民街: { lat: 34.2655, lng: 108.9420 },
  西安城墙: { lat: 34.2588, lng: 108.9470 },
  小雁塔: { lat: 34.2380, lng: 108.9380 },
  陕西历史博物馆: { lat: 34.2255, lng: 108.9540 },
  大雁塔: { lat: 34.2189, lng: 108.9640 },
  大唐芙蓉园: { lat: 34.2120, lng: 108.9730 },
  大唐不夜城: { lat: 34.2045, lng: 108.9645 },
  兵马俑: { lat: 34.3841, lng: 109.2785 },
  华清宫: { lat: 34.3640, lng: 109.2130 },

  // 重庆
  解放碑: { lat: 29.5570, lng: 106.5770 },
  洪崖洞: { lat: 29.5630, lng: 106.5780 },
  长江索道: { lat: 29.5580, lng: 106.5860 },
  李子坝: { lat: 29.5540, lng: 106.5390 },
  磁器口: { lat: 29.5820, lng: 106.4460 },
  鹅岭二厂: { lat: 29.5490, lng: 106.5380 },
  三峡博物馆: { lat: 29.5620, lng: 106.5490 },

  // 厦门
  鼓浪屿: { lat: 24.4450, lng: 118.0670 },
  南普陀寺: { lat: 24.4410, lng: 118.0980 },
  厦门大学: { lat: 24.4370, lng: 118.0990 },
  环岛路: { lat: 24.4320, lng: 118.1450 },
  曾厝垵: { lat: 24.4280, lng: 118.1250 },
  沙坡尾: { lat: 24.4400, lng: 118.0870 },
  植物园: { lat: 24.4490, lng: 118.1060 },
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
  return Number(Math.max(dist, 1.2).toFixed(1))
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
    return Math.max(Math.round((distanceKm / 35) * 60) + 5, 8)
  }
  if (mode === 'transit') {
    // 公交地铁平均 22km/h + 10分钟等车与步行
    return Math.max(Math.round((distanceKm / 22) * 60) + 12, 15)
  }
  // walking: 步行约 4.5km/h
  return Math.max(Math.round((distanceKm / 4.5) * 60), 10)
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

export interface AMapInstance {
  [key: string]: unknown
  Map: new (container: HTMLElement, options: Record<string, unknown>) => {
    add: (overlay: unknown) => void
    destroy: () => void
    setFitView: () => void
  }
  Marker: new (options: Record<string, unknown>) => {
    on: (event: string, callback: () => void) => void
  }
  Pixel: new (x: number, y: number) => unknown
  Polyline: new (options: Record<string, unknown>) => unknown
}

/**
 * 动态加载高德地图 JS API 2.0 脚本（若有配置独立 Key）
 */
export function loadAmapScript(apiKey: string, securityCode?: string): Promise<AMapInstance> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('window is undefined'))
      return
    }

    if (window.AMap) {
      resolve(window.AMap as unknown as AMapInstance)
      return
    }

    if (securityCode) {
      (window as unknown as { _AMapSecurityConfig: { securityJsCode: string } })._AMapSecurityConfig = {
        securityJsCode: securityCode,
      }
    }

    const existingScript = document.getElementById('amap-js-sdk')
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.AMap) {
          resolve(window.AMap as unknown as AMapInstance)
        }
        else {
          reject(new Error('高德地图加载失败'))
        }
      })
      existingScript.addEventListener('error', e => reject(e))
      return
    }

    const script = document.createElement('script')
    script.id = 'amap-js-sdk'
    script.type = 'text/javascript'
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Driving,AMap.Walking,AMap.Transfer,AMap.Geocoder`
    script.async = true
    script.onload = () => {
      if (window.AMap) {
        resolve(window.AMap as unknown as AMapInstance)
      }
      else {
        reject(new Error('高德地图 AMap 实例加载失败'))
      }
    }
    script.onerror = () => reject(new Error('高德地图脚本加载失败，请检查网络或 Key 配置'))

    document.head.appendChild(script)
  })
}

// 扩展 window.AMap 类型声明
declare global {
  interface Window {
    AMap?: unknown
  }
}
