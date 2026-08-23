import { evaluateRetrieval, type RagEvalCase } from '../src/lib/ai/rag-eval'
import { retrieve } from '../src/lib/services/rag'

const cases: RagEvalCase[] = [
  { city: '北京', expected: ['故宫博物院'], query: '皇家宫殿和明清历史' },
  { city: '北京', expected: ['八达岭长城'], query: '适合户外爬山的长城' },
  { city: '上海', expected: ['外滩'], query: '上海夜景和城市天际线' },
  { city: '杭州', expected: ['西湖'], query: '杭州自然风景和湖景' },
  { city: '杭州', expected: ['灵隐寺'], query: '杭州佛教古寺' },
  { city: '成都', expected: ['宽窄巷子'], query: '成都历史街区和小吃' },
  { city: '成都', expected: ['大熊猫繁育研究基地'], query: '成都看熊猫' },
  { city: '西安', expected: ['兵马俑'], query: '西安秦朝历史遗迹' },
  { city: '广州', expected: ['广州塔'], query: '广州地标和夜景' },
  { city: '重庆', expected: ['洪崖洞'], query: '重庆夜景和吊脚楼' },
  { city: '厦门', expected: ['鼓浪屿'], query: '厦门海岛和文艺街区' },
  { city: '三亚', expected: ['亚龙湾'], query: '三亚海滩和度假' },
]

const results = []
for (const item of cases) {
  const result = await retrieve(item.city, [], item.query)
  results.push(result?.attractions.slice(0, 5).map(attraction => attraction.name) || [])
}

console.log(JSON.stringify({
  cases: cases.length,
  metrics: evaluateRetrieval(cases, results),
  results,
}, null, 2))
