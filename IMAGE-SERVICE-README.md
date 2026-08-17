# 图片服务实现总结

## 📋 实现概览

已成功实现 **免费图片API + 维基百科** 组合方案，支持多源图片获取和智能缓存。

## 🎯 核心功能

### 1. 多源图片获取
- **Unsplash API** - 主要来源（免费50次/小时）
- **Pexels API** - 备选来源（免费200次/小时）
- **维基百科** - 最后备选（无需配置）

### 2. 智能缓存机制
- 内存缓存，24小时过期
- 最大缓存1000条记录
- 自动清理过期缓存

### 3. 降级策略
- API失败时自动尝试下一个源
- 所有源失败时返回默认图片
- 支持按景点类型返回默认图片

## 📁 文件结构

```
src/
├── lib/
│   └── image-service.ts          # 图片服务核心模块
├── app/
│   ├── api/images/test/
│   │   └── route.ts              # 测试API端点
│   └── test-images/
│       └── page.tsx              # 测试页面
├── knowledge/
│   └── attractions-product.json  # 景点数据（待更新）
scripts/
└── update-attraction-images.ts   # 更新景点图片脚本
docs/
└── image-service.md              # 配置文档
```

## 🚀 快速开始

### 1. 配置API密钥（可选）

在 `.env.local` 中添加：

```bash
# Unsplash（推荐）
UNSPLASH_ACCESS_KEY=your_key_here

# Pexels（备选）
PEXELS_API_KEY=your_key_here
```

### 2. 测试图片服务

启动开发服务器：

```bash
pnpm dev
```

访问测试页面：

```
http://localhost:3000/test-images
```

### 3. 更新景点图片

使用脚本批量更新景点数据：

```bash
pnpm images:update
```

## 📊 API端点

### 单个查询

```bash
GET /api/images/test?query=故宫&city=北京
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "query": "故宫",
    "city": "北京",
    "imageUrl": "https://images.unsplash.com/..."
  },
  "cache": {
    "size": 1,
    "hitRate": 0
  }
}
```

### 批量测试

```bash
GET /api/images/test?batch=true
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "故宫": "https://images.unsplash.com/...",
    "长城": "https://images.unsplash.com/...",
    "外滩": "https://images.unsplash.com/..."
  },
  "cache": {
    "size": 7,
    "hitRate": 0
  }
}
```

## 💻 代码使用示例

### 获取单个景点图片

```typescript
import { getAttractionImage } from '@/lib/image-service'

const imageUrl = await getAttractionImage('故宫', '北京')
console.log(imageUrl) // https://images.unsplash.com/...
```

### 批量获取景点图片

```typescript
import { batchGetAttractionImages } from '@/lib/image-service'

const attractions = [
  { name: '故宫', city: '北京' },
  { name: '长城', city: '北京' },
  { name: '外滩', city: '上海' }
]

const imageMap = await batchGetAttractionImages(attractions)
console.log(imageMap.get('故宫')) // https://images.unsplash.com/...
```

## 🔧 技术细节

### 图片源优先级

1. **Unsplash** - 最高质量，专业摄影师作品
2. **Pexels** - 高质量，丰富的图片库
3. **维基百科** - 免费，无需配置，作为最后备选

### 缓存策略

- **缓存键**：景点名称 + 城市名称
- **缓存时间**：24小时
- **缓存大小**：最多1000条记录
- **清理策略**：过期自动删除，超过限制删除最旧记录

### 错误处理

- API调用失败时自动尝试下一个源
- 所有源失败时返回默认图片
- 详细的错误日志记录

## 📈 性能优化

### 1. 并发控制

批量获取时限制并发数为3，避免API限流：

```typescript
const concurrency = 3
for (let i = 0; i < attractions.length; i += concurrency) {
  const batch = attractions.slice(i, i + concurrency)
  // 并发处理
}
```

### 2. 请求间隔

批次间等待1秒，避免触发API限流：

```typescript
if (i + concurrency < attractions.length) {
  await new Promise(resolve => setTimeout(resolve, 1000))
}
```

### 3. 缓存预热

首次访问时预加载常用景点图片，提高后续访问速度。

## 🛡️ 安全考虑

### 1. API密钥保护

- API密钥存储在环境变量中
- 不在客户端代码中暴露
- 使用服务端API调用

### 2. 请求限制

- 遵守API提供商的使用条款
- 实现请求频率限制
- 监控API使用量

### 3. 内容安全

- 验证图片URL格式
- 检查图片内容类型
- 防止恶意URL注入

## 📝 待办事项

### 短期（1-2天）

- [ ] 注册Unsplash开发者账号
- [ ] 注册Pexels API账号
- [ ] 配置API密钥
- [ ] 测试图片服务
- [ ] 更新景点数据

### 中期（1周）

- [ ] 添加图片预加载
- [ ] 实现图片懒加载
- [ ] 添加图片压缩
- [ ] 监控API使用量

### 长期（1个月）

- [ ] 支持更多图片源
- [ ] 图片CDN加速
- [ ] 图片水印功能
- [ ] 图片版权管理

## 🐛 故障排除

### 问题1：图片无法加载

**可能原因**：
- API密钥未配置
- 网络连接问题
- API配额已用完

**解决方案**：
1. 检查 `.env.local` 配置
2. 测试网络连接
3. 查看API使用量

### 问题2：API限流

**可能原因**：
- 请求频率过高
- 免费额度已用完

**解决方案**：
1. 增加请求间隔
2. 配置多个API密钥
3. 升级API套餐

### 问题3：维基百科图片无法访问

**可能原因**：
- 在中国大陆可能被墙
- 图片链接失效

**解决方案**：
1. 配置代理或VPN
2. 使用国内镜像
3. 优先使用Unsplash/Pexels

## 📚 相关文档

- [Unsplash API文档](https://unsplash.com/documentation)
- [Pexels API文档](https://www.pexels.com/api/documentation/)
- [维基百科API文档](https://en.wikipedia.org/api/rest_v1/)

## 🎉 总结

本方案实现了：

✅ **多源图片获取** - Unsplash + Pexels + 维基百科  
✅ **智能缓存** - 24小时缓存，避免重复API调用  
✅ **降级策略** - API失败时自动切换源  
✅ **易于使用** - 简单的API接口和测试页面  
✅ **免费使用** - 免费额度足够小项目使用  

**下一步**：注册API密钥，配置环境变量，测试图片服务，更新景点数据。