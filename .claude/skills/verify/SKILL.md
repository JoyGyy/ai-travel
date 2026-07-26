---
name: verify
description: 启动并验证 React Travel 前后端运行时行为
---

# React Travel 运行时验证

## 启动

后端：

```bash
pnpm --dir /Users/joygy/Documents/react/react-travel/server dev
```

前端：

```bash
pnpm --dir /Users/joygy/Documents/react/react-travel dev
```

等待服务可用：

```bash
curl http://127.0.0.1:3030/api/health
curl http://127.0.0.1:5181
```

## API 冒烟验证

```bash
curl -i http://127.0.0.1:3030/api/health
curl -i --get --data-urlencode "city=北京" http://127.0.0.1:3030/api/weather
curl -i http://127.0.0.1:3030/api/weather
curl -i -X POST http://127.0.0.1:3030/api/travel/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"北京有哪些必去的景点？","messages":[]}' \
  --max-time 10
```

## 浏览器验证

访问 `http://127.0.0.1:5181`：

1. 首页应正常渲染。
2. `/login` 可打开，注册本地测试账号后返回首页。
3. `/weather` 输入“北京”并回车，应显示天气概览。
4. `/chat` 未登录会重定向到 `/login`；登录后可进入聊天页。
5. 在聊天页点击“北京有哪些必去的景点？”，应显示 Agent 步骤、景点回复和参考来源。

## 注意事项

- 本地验证建议使用 `127.0.0.1:5181` 或 `localhost:5181`，两者都应在后端默认 CORS 中允许。
- 直接 curl 中文 query 时使用 `--data-urlencode`，与前端 `encodeURIComponent` 行为一致。
