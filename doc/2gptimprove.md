# CDL English Pro 改进执行计划

> 依据：`improve.md`、当前源码目录、核心页面/API 抽样核对  
> 日期：2026-05-21  
> 目标：把现有 MVP 项目改造成更安全、更稳定、更容易继续开发的可运行产品  
> 原则：不替产品意图做猜测；涉及商业模式、付费边界、用户语言策略、设备限制策略的事项全部列为“待确认”

---

## 1. 当前包体核对结论

### 1.1 项目现状

项目是一个 Next.js App Router 应用，核心功能包括：

- 登录注册：Clerk
- 数据库：Supabase
- AI 能力：OpenAI Whisper 转写、GPT 评分、TTS 语音
- 页面：`/practice`、`/signs`、`/mock`、`/drive`、`/report`
- 静态数据：`data/questions.json` 与 `data/signs.json`
- 标志图片：`public/signs/PDF_SIGN_001.png` 至 `PDF_SIGN_084.png`

### 1.2 与 `improve.md` 一致的高风险点

- `/api/speak` 没有速率限制，存在 OpenAI TTS 费用风险。
- `/api/speak` 使用 `Cache-Control: public, max-age=86400`，缓存策略需要重新评估。
- `device` API 依赖客户端传入的 fingerprint，可被伪造。
- 语言状态 `lang` 在多个页面独立 `useState('zh')`，刷新与跳转会丢失。
- `practice` 与 `signs` 会写入进度，但页面初始化没有加载历史进度。
- i18n 翻译散落在 `AppShell.js`、`practice/page.js`、`mock/page.js`、`drive/page.js`。
- `practice`、`mock`、`drive`、`AppShell` 文件偏大，录音和评分逻辑重复。
- 缺少测试、CI、错误监控、统一日志、Prettier。
- 缺少 `app/loading.js`、`app/error.js`、`app/not-found.js`。

### 1.3 需要修正的报告细节

- `practice/page.js` 当前约 450 行，不是约 700 行。
- `mock/page.js` 当前约 615 行，`drive/page.js` 当前约 624 行。
- `signs/page.js` 已经会 `POST /api/progress` 保存标志进度，但仍没有 `GET /api/progress` 加载历史。
- `middleware.js` 包含 `/api/conversation`、`/api/pronunciation` 保护路径，但源码中没有对应 API 路由，需要确认是预留还是遗留。
- `package.json` 的 `lint` 脚本是 `next lint`，在当前 Next.js 版本组合下需要验证是否仍可用。

---

## 2. 总体改进顺序

推荐按以下顺序推进：

1. 先控成本和安全风险。
2. 再修复用户可感知的状态丢失和错误页缺失。
3. 然后做结构拆分，降低后续开发成本。
4. 最后补工程化、测试、监控和商业化能力。

不要先做大规模重构。这个项目已经有可用业务流程，第一阶段应尽量小步、可回滚、每步可验证。

---

## 3. 阶段一：立即修复，目标 1 周内

### 步骤 1：给 AI API 增加最小可用保护

涉及文件：

- `app/api/speak/route.js`
- `app/api/transcribe/route.js`
- `app/api/score/route.js`
- `.env.example`
- 可新增：`lib/rate-limit.js`

执行内容：

1. 先确定速率限制方案。
2. 对 `/api/speak` 添加用户级速率限制。
3. 同步给 `/api/transcribe` 与 `/api/score` 添加较宽松限制，避免单用户持续刷接口。
4. 限制请求体大小或文本长度。
5. 对超限请求返回 `429` 和明确错误信息。

建议默认值：

- `/api/speak`：每用户每分钟 20 次，每天 300 次。
- `/api/transcribe`：每用户每分钟 10 次。
- `/api/score`：每用户每分钟 30 次。

待你确认：

- 是否愿意新增 Upstash Redis、Vercel KV 或 Supabase 表作为速率限制存储？
- 如果不新增外部服务，是否接受先做内存级限制作为临时保护？它在 serverless 多实例环境下不完全可靠。

验收标准：

- 未登录用户仍被拒绝。
- 超过限制返回 `429`。
- OpenAI 调用前完成限流判断。
- `.env.example` 包含所需环境变量说明。

### 步骤 2：修复 TTS 缓存策略

涉及文件：

- `app/api/speak/route.js`

执行内容：

1. 将 `Cache-Control: public, max-age=86400` 改为更保守策略。
2. 如果语音内容只来自固定训练题，可考虑服务端缓存；如果未来可能包含用户自定义文本，必须使用 private。

建议实现：

```js
'Cache-Control': 'private, max-age=3600'
```

待你确认：

- `/api/speak` 是否只允许播放固定题库问题？
- 未来是否会播放用户自定义文本或个性化内容？

验收标准：

- 响应仍为 `audio/mpeg`。
- 浏览器可正常播放。
- 响应头不再使用 `public`。

### 步骤 3：补齐 App Router 基础状态页

涉及文件：

- 新增 `app/loading.js`
- 新增 `app/error.js`
- 新增 `app/not-found.js`

执行内容：

1. `loading.js` 显示统一加载骨架或简洁 loading。
2. `error.js` 使用 client component，提供重试按钮。
3. `not-found.js` 提供返回训练首页或首页的入口。

验收标准：

- 页面切换时有加载状态。
- 运行时错误不会直接白屏。
- 不存在的路径显示自定义 404。

### 步骤 4：修复 Google Fonts 加载方式

涉及文件：

- `app/globals.css`
- `app/layout.js`

执行内容：

1. 移除 CSS 顶部的 Google Fonts `@import`。
2. 使用 `next/font/google` 在 `layout.js` 加载字体。
3. 将字体 className 挂到 `<body>`。

验收标准：

- 首屏不再由 CSS `@import` 阻塞字体加载。
- 页面视觉与当前基本一致。
- 构建不报错。

### 步骤 5：校验并修复 lint 脚本

涉及文件：

- `package.json`
- 可能新增：`eslint.config.mjs`

执行内容：

1. 运行现有 `npm run lint`。
2. 如果 `next lint` 不可用，改为 ESLint 9 可执行脚本。
3. 保持 Next 推荐规则。

验收标准：

- `npm run lint` 可以运行。
- 新脚本不依赖已废弃命令。

---

## 4. 阶段二：用户体验修复，目标 1 至 2 周

### 步骤 6：统一并持久化语言偏好

涉及文件：

- 可新增 `hooks/useLang.js`
- 可新增 `components/providers/LanguageProvider.js`
- `components/AppShell.js`
- `app/practice/page.js`
- `app/signs/page.js`
- `app/mock/page.js`
- `app/drive/page.js`
- `app/report/page.js`

执行内容：

1. 建立全局语言状态。
2. 首次加载默认中文。
3. 用户切换语言后写入 `localStorage`。
4. 页面跳转时保持语言。
5. 报告页补上语言来源。

建议先不用完整引入 `next-intl`，先做轻量 `LanguageProvider`，因为这样改动小、风险低。

待你确认：

- 默认语言是否固定为中文？
- 是否需要根据浏览器语言自动选择西语、印地语、旁遮普语或越南语？

验收标准：

- 在任意页面切换语言后，刷新仍保持。
- 从 `/practice` 跳到 `/mock` 后语言不重置。
- `AppShell` 不再依赖每个页面单独传 `lang` 才能工作。

### 步骤 7：加载历史学习进度

涉及文件：

- 可新增 `hooks/useProgress.js`
- `app/practice/page.js`
- `app/signs/page.js`
- `app/api/progress/route.js`

执行内容：

1. 页面 mount 后调用 `GET /api/progress`。
2. 将 `questionProgress` 转换为当前页面使用的 progress object。
3. 将 `signProgress` 转换为标志页使用的 progress object。
4. 加载期间显示轻量状态，不阻塞浏览题目。
5. 保存失败时保留本地乐观更新，但需要可见错误提示。

验收标准：

- 用户刷新后仍能看到已练习题、需复习题、已有分数。
- 侧边栏统计不再从 0 开始。
- API 失败时页面仍可用。

### 步骤 8：增加输入校验

涉及文件：

- `app/api/progress/route.js`
- `app/api/mock/route.js`
- `app/api/score/route.js`
- `lib/data.js`

执行内容：

1. 校验 `questionCode` 必须存在于 `QUESTIONS`。
2. 校验 `signCode` 必须存在于 `SIGNS`。
3. 校验 `score` 范围为 0 至 100。
4. 校验 `status` 只能是允许值。
5. 限制 `lastTranscript`、`answer` 最大长度。

建议允许值：

- `status`: `viewed`、`understood`、`needs_review`
- `score`: integer 0-100

验收标准：

- 非法题号返回 `400`。
- 超长文本被拒绝或截断，策略要一致。
- 合法请求行为不变。

### 步骤 9：统一用户反馈

涉及文件：

- 可新增 `components/ui/Toast.js`
- 可新增 `components/ui/InlineAlert.js`
- 使用页面：`practice`、`signs`、`mock`、`drive`

执行内容：

1. 麦克风失败显示页面内错误，不只用 `alert()`。
2. AI 评分失败时显示“已使用关键词评分”的提示。
3. 保存进度失败时提示用户。
4. 转写失败时提示用户重新录音。

验收标准：

- 常见失败路径有明确反馈。
- 不破坏现有练习流程。

---

## 5. 阶段三：结构重构，目标 2 至 4 周

### 步骤 10：提取录音 Hook

涉及文件：

- 新增 `hooks/useRecorder.js`
- 修改 `app/practice/page.js`
- 修改 `app/mock/page.js`
- 修改 `app/drive/page.js`

执行内容：

1. 将 `MediaRecorder` 初始化、开始、停止、清理封装到 hook。
2. hook 返回 `isRecording`、`startRecording`、`stopRecording`、`error`。
3. 转写请求可以先留在页面，也可以作为可选 callback。
4. 确保停止录音时释放 stream tracks。

验收标准：

- 三个页面不再重复完整录音逻辑。
- 录音开始、停止、转写行为与当前一致。
- 麦克风错误可被 UI 接收并显示。

### 步骤 11：提取评分 Hook

涉及文件：

- 新增 `hooks/useScoring.js`
- 修改 `app/practice/page.js`
- 修改 `app/mock/page.js`
- 修改 `app/drive/page.js`

执行内容：

1. 封装 `POST /api/score` 调用。
2. 保留本地 `scoreKeywords()` fallback。
3. 统一返回 `scoreData`、`scoring`、`error`。
4. 评分成功后触发进度保存。

验收标准：

- 三个页面评分行为一致。
- API 失败时仍有本地关键词评分。
- 页面组件行数明显下降。

### 步骤 12：拆分共享 UI 组件

建议新增目录：

```text
components/ui/
components/features/
components/layout/
```

优先提取组件：

- `ScoreRing`
- `RecordButton`
- `WaveformIndicator`
- `QuestionCard`
- `AnswerPanel`
- `LanguageSelector`
- `VoiceSelector`
- `ConversationBubble`

验收标准：

- `AppShell.js` 专注布局和导航。
- 页面文件只保留页面级状态与组合逻辑。
- 不改变用户可见功能。

### 步骤 13：集中 i18n 文案

涉及文件：

- 新增 `lib/i18n/index.js`
- 新增 `lib/i18n/messages.zh.js`
- 新增 `lib/i18n/messages.es.js`
- 新增 `lib/i18n/messages.hi.js`
- 新增 `lib/i18n/messages.pa.js`
- 新增 `lib/i18n/messages.vi.js`

执行内容：

1. 先不急着引入 `next-intl`。
2. 将现有页面内 `T` 对象迁移到统一文件。
3. 统一 key 命名。
4. 提供 `t(lang, key, fallback)` 方法。
5. 对缺失翻译做开发期警告。

待你确认：

- 是否希望直接引入 `next-intl`？
- 是否需要 URL 带语言前缀，例如 `/zh/practice`？

验收标准：

- 页面内不再有大段翻译对象。
- 新增语言只需要新增一个消息文件并注册。
- 缺失 key 有 fallback。

### 步骤 14：整理常量与业务数据

建议新增：

- `constants/routes.js`
- `constants/voices.js`
- `constants/status.js`
- `lib/scenarios.js`

执行内容：

1. 将 `VOICE_MAP`、`SPEED_MAP`、声音列表统一。
2. 将受保护路由列表与导航列表减少重复。
3. 将 mock/drive 的随机题目逻辑移出页面。

验收标准：

- 修改声音配置不需要同时改多个文件。
- 页面中的常量减少。

---

## 6. 阶段四：设备限制策略，需先确认产品意图

当前 `app/api/device/route.js` 有实现，但存在两个问题：

- 前端没有发现调用。
- fingerprint 来自客户端 body，不可信。

这里不能直接替你决定保留或删除，因为它涉及商业策略和账号共享策略。

待你确认：

1. 是否真的需要限制一个账号只能登录 2 台设备？
2. 超限后是强制拦截，还是只记录风险？
3. 是否允许用户在页面里管理已登录设备？
4. 是否可以使用 IP、User-Agent、Clerk session、最近活动时间等信号？

可选方案：

### 方案 A：暂时禁用

执行内容：

- 删除或隐藏 device API 调用计划。
- 保留文件但标注未启用。

适合情况：

- 现在重点是训练体验，不急着做反共享。

### 方案 B：只记录风险，不拦截

执行内容：

- 服务端生成 device key。
- 记录 IP hash、User-Agent hash、Clerk userId。
- 超过阈值只写风险日志，不影响用户。

适合情况：

- 想观察账号共享情况，但不想误伤用户。

### 方案 C：正式设备管理

执行内容：

- 建立设备管理页面。
- 用户可移除旧设备。
- 超限时明确拦截。

适合情况：

- 已经有付费订阅，账号共享是明确业务风险。

---

## 7. 阶段五：工程化，目标 1 个月内

### 步骤 15：添加 Prettier

涉及文件：

- `package.json`
- 新增 `.prettierrc`
- 新增 `.prettierignore`

验收标准：

- 有 `npm run format`。
- 格式化不改动构建产物和图片。

### 步骤 16：添加基础测试

优先级：

1. `scoreKeywords()` 单元测试。
2. `getExplanation()` 单元测试。
3. `/api/progress` 输入校验测试。
4. `useRecorder` hook 测试。
5. Playwright 覆盖核心路径。

建议工具：

- Vitest
- React Testing Library
- Playwright

验收标准：

- `npm test` 可以运行。
- 至少覆盖评分核心逻辑。
- 至少一个 E2E 测试覆盖登录后训练页加载。

### 步骤 17：添加 CI

建议 GitHub Actions 步骤：

1. install
2. lint
3. test
4. build

验收标准：

- PR 或 push 时自动运行。
- 构建失败时能阻止合并。

### 步骤 18：添加错误监控与日志

待你确认：

- 是否使用 Sentry？
- 是否已经部署在 Vercel？

建议内容：

- 前端错误：Sentry
- 服务端异常：Sentry 或结构化日志
- OpenAI 调用失败：记录 route、userId、状态码，不记录敏感文本全文

验收标准：

- 生产错误可追踪。
- 不泄露 OpenAI key、用户录音全文、私人学习内容。

---

## 8. 阶段六：商业化，需先确认产品意图

`improve.md` 提到项目已有 `plan` 字段概念，但没有支付集成。这里不能直接假设商业模式。

待你确认：

1. 是否要接 Stripe？
2. 免费用户和 PRO 用户具体差异是什么？
3. `/drive` 是否一定是 PRO？
4. AI 评分、TTS、mock 次数是否要限额？
5. 是否需要优惠码、试用期、退款流程？

如果确认做 Stripe，建议步骤：

1. 建立 `plans` 与权限矩阵。
2. 接 Stripe Checkout。
3. 接 Stripe webhook。
4. 同步 Supabase `profiles.plan`。
5. 在 middleware 或页面层保护 PRO 功能。
6. 给免费用户显示升级入口。

验收标准：

- 支付成功后用户权限自动更新。
- 取消订阅后权限按规则降级。
- Webhook 可重复调用且幂等。

---

## 9. 推荐目标目录结构

```text
app/
  loading.js
  error.js
  not-found.js
  layout.js
  page.js
  practice/page.js
  signs/page.js
  mock/page.js
  drive/page.js
  report/page.js
  api/

components/
  layout/
    AppShell.js
    Sidebar.js
    Topbar.js
  ui/
    ScoreRing.js
    RecordButton.js
    WaveformIndicator.js
    InlineAlert.js
    Toast.js
  features/
    QuestionCard.js
    AnswerPanel.js
    ConversationBubble.js
    VoiceSelector.js

hooks/
  useLang.js
  useProgress.js
  useRecorder.js
  useScoring.js

lib/
  data.js
  rate-limit.js
  i18n/
    index.js
    messages.zh.js
    messages.es.js
    messages.hi.js
    messages.pa.js
    messages.vi.js
  supabase/

constants/
  routes.js
  voices.js
  status.js
```

---

## 10. 每个阶段的完成定义

### 阶段一完成定义

- OpenAI 相关 API 有速率限制或明确临时保护。
- TTS cache header 已修复。
- loading/error/not-found 已添加。
- 字体加载不再使用 CSS `@import`。
- lint 脚本可运行。

### 阶段二完成定义

- 语言偏好跨页面、跨刷新保持。
- 练习和标志历史进度能自动加载。
- API 输入有基本校验。
- 常见失败路径有 UI 提示。

### 阶段三完成定义

- 三个大页面中的录音、评分、UI 重复明显减少。
- i18n 文案集中管理。
- `AppShell` 拆分或瘦身。
- 页面行为保持不变。

### 阶段四完成定义

- 设备限制策略被明确选择。
- 如果启用，不能再依赖纯客户端 fingerprint。
- 如果暂不启用，代码和文档明确标注。

### 阶段五完成定义

- 有格式化工具。
- 有最小测试集。
- 有 CI。
- 有生产错误追踪方案。

### 阶段六完成定义

- 付费功能边界明确。
- 支付、webhook、权限同步闭环。
- 免费/付费用户体验路径清晰。

---

## 11. 建议优先级清单

### P0：必须先做

1. `/api/speak` 速率限制。
2. TTS cache header 改为 private。
3. `app/error.js`，避免生产白屏。
4. `/api/progress`、`/api/score` 基础输入校验。

### P1：很快做

1. 语言偏好持久化。
2. 历史进度加载。
3. `loading.js` 与 `not-found.js`。
4. Google Fonts 改用 `next/font`。
5. 修复 lint 脚本。

### P2：结构优化

1. `useRecorder`。
2. `useScoring`。
3. `useProgress`。
4. UI 组件拆分。
5. i18n 集中管理。

### P3：产品与工程长期能力

1. 测试。
2. CI。
3. Sentry 或等价监控。
4. Stripe。
5. 管理后台。

---

## 12. 需要你确认的问题

为了避免猜测你的意图，以下问题需要你决定后才能进入对应实现：

1. 速率限制使用什么存储：Upstash Redis、Vercel KV、Supabase 表，还是临时内存限制？
2. 默认语言是否固定中文，还是按浏览器语言自动选择？
3. 是否需要 URL 语言前缀，例如 `/zh/practice`？
4. `/drive` 是否一定是付费 PRO 功能？
5. 是否要接 Stripe？如果要，免费版和 PRO 版边界是什么？
6. 设备限制是否真实启用？如果启用，超限是拦截还是仅记录？
7. `middleware.js` 中的 `/api/conversation`、`/api/pronunciation` 是未来预留还是遗留路径？
8. 是否需要保留当前所有 emoji 图标，还是后续统一换成图标库？

---

## 13. 建议第一轮实施包

如果要最稳地开始，第一轮只做下面 6 件事：

1. 修复 `/api/speak` cache header。
2. 添加临时速率限制抽象，并接入 `/api/speak`。
3. 添加 `app/error.js`、`app/loading.js`、`app/not-found.js`。
4. 用 `next/font` 替换 CSS `@import`。
5. 给 `/api/progress` 加 question/sign/status/score 校验。
6. 给 `practice` 和 `signs` 加历史进度加载。

这一轮完成后，项目的成本风险、白屏风险和用户进度丢失问题会明显下降，同时不会触碰商业模式和大规模重构。
