/**
 * 城市搜索服务
 *
 * 接入高德地图行政区域查询API，支持国内外城市搜索
 * API文档：https://lbs.amap.com/api/webservice/guide/api/district
 */

interface DistrictItem {
  adcode: string
  center: string
  citycode: string
  districts: DistrictItem[]
  level: string
  name: string
}

interface AmapDistrictResponse {
  districts: DistrictItem[]
  infocode: string
  info: string
  status: string
}

export interface CityResult {
  /** 城市名称 */
  name: string
  /** 区域编码 */
  adcode: string
  /** 层级：country / province / city / district */
  level: string
  /** 上级区域名称（省份或国家） */
  parent?: string
  /** 中心点经纬度 */
  center?: string
}

const AMAP_BASE_URL = 'https://restapi.amap.com/v3/config/district'

/**
 * 搜索城市（调用高德API）
 * @param keyword 搜索关键字
 * @param subdistrict 子级数量（0=不返回子级，1=返回下一级）
 */
export async function searchCities(keyword: string, subdistrict = 0): Promise<CityResult[]> {
  const apiKey = process.env.AMAP_API_KEY
  if (!apiKey) {
    console.warn('AMAP_API_KEY 未配置，使用本地城市列表')
    return []
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      keywords: keyword,
      subdistrict: String(subdistrict),
      extensions: 'base',
    })

    const response = await fetch(`${AMAP_BASE_URL}?${params}`)
    const data: AmapDistrictResponse = await response.json()

    if (data.status !== '1') {
      console.error('高德API错误:', data.info)
      return []
    }

    return flattenDistricts(data.districts)
  }
  catch (error) {
    console.error('城市搜索失败:', error)
    return []
  }
}

/**
 * 获取热门城市（国内主要城市）
 */
export async function getHotCities(): Promise<CityResult[]> {
  const apiKey = process.env.AMAP_API_KEY
  if (!apiKey) {
    return []
  }

  try {
    // 查询中国下一级（省份）
    const params = new URLSearchParams({
      key: apiKey,
      keywords: '中华人民共和国',
      subdistrict: '2', // 返回两级（省+市）
      extensions: 'base',
    })

    const response = await fetch(`${AMAP_BASE_URL}?${params}`)
    const data: AmapDistrictResponse = await response.json()

    if (data.status !== '1') {
      return []
    }

    // 提取直辖市和省会城市
    const results: CityResult[] = []
    for (const country of data.districts) {
      for (const province of country.districts) {
        for (const city of province.districts) {
          if (isMajorCity(city.name)) {
            results.push({
              name: city.name,
              adcode: city.adcode,
              level: city.level,
              parent: province.name,
              center: city.center,
            })
          }
        }
      }
    }

    return results
  }
  catch (error) {
    console.error('获取热门城市失败:', error)
    return []
  }
}

/**
 * 扁平化行政区划数据
 */
function flattenDistricts(districts: DistrictItem[], parent?: string): CityResult[] {
  const results: CityResult[] = []

  for (const item of districts) {
    results.push({
      name: item.name,
      adcode: item.adcode,
      level: item.level,
      parent,
      center: item.center,
    })

    // 递归处理子级
    if (item.districts && item.districts.length > 0) {
      results.push(...flattenDistricts(item.districts, item.name))
    }
  }

  return results
}

/**
 * 判断是否为主要城市（直辖市、省会、计划单列市等）
 */
function isMajorCity(name: string): boolean {
  const majorCities = [
    '北京',
    '上海',
    '天津',
    '重庆',
    '广州',
    '深圳',
    '成都',
    '杭州',
    '西安',
    '南京',
    '武汉',
    '长沙',
    '郑州',
    '济南',
    '哈尔滨',
    '长春',
    '沈阳',
    '昆明',
    '贵阳',
    '南宁',
    '兰州',
    '乌鲁木齐',
    '拉萨',
    '呼和浩特',
    '太原',
    '石家庄',
    '福州',
    '南昌',
    '合肥',
    '海口',
    '银川',
    '西宁',
    '苏州',
    '青岛',
    '大连',
    '厦门',
    '宁波',
    '无锡',
    '佛山',
    '东莞',
    '三亚',
    '丽江',
    '大理',
    '桂林',
    '张家界',
    '黄山',
    '九寨沟',
  ]
  return majorCities.includes(name)
}
