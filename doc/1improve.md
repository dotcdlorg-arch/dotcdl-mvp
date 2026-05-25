# CDL English Pro — Next.js 项目技术分析报告

> **版本**: v2.1.0 · **分析日期**: 2026年5月 · **分析师**: AI 架构顾问
> **技术栈**: Next.js 15.5.18 · React 19 · Clerk v6 · Supabase · OpenAI

---

## 总体评级

| 维度 | 评级 | 说明 |
|------|------|------|
| 产品完整度 | **B+** | 核心功能覆盖全面，AI集成有亮点 |
| 代码可维护性 | **B** | 结构基本清晰，存在文件过大问题 |
| 工程化成熟度 | **C** | 零测试、零CI/CD、零监控 |
| 技术选型 | **B+** | 全部最新稳定版，选型现代 |

---

## 1. 项目概览

**CDL English Pro** 是一款面向美国 CDL（商业驾驶执照）卡车司机的 AI 英语训练平台，核心解决非英语母语司机在 DOT 路边检查时无法用英语正确应对执法官员的痛点。

**目标用户**：讲中文、西班牙语、印地语、旁遮普语、越南语的职业 CDL 司机。

### 数据规模

- **140 道**警官问答题（5个类别，16个字段含5语言解释）
- **84 张**交通标志（含图片、意义、动作、5语言解释）
- **5 种**界面语言（中/西/印地/旁遮普/越南语）
- **8 种** AI 警官声音（北/南/东/西 × 男/女）

### 核心页面

| 路径 | 功能 | 渲染类型 |
|------|------|----------|
| `/` | 落地页/营销 | Server Component |
| `/practice` | 题目练习（文字/听力/口语） | Client Component |
| `/signs` | 交通标志学习 | Client Component |
| `/mock` | 模拟路边检查 | Client Component |
| `/drive` | 驾驶模式语音对话 | Client Component |
| `/report` | 进度报告 | Server Component ✓ 最佳实践 |
| `/sign-in` `/sign-up` | Clerk 认证 | Clerk UI |

### 功能完整度

- ✅ 用户认证（Clerk 完整集成，Webhook 同步）
- ✅ 文字/听力/口语练习（3种模式，AI评分，发音分析）
- ✅ 交通标志（84张，关键词评分，5语言解释）
- ✅ 模拟检查（19题，书面+口语双模式）
- ✅ 驾驶模式（OpenAI TTS真人声音，8种口音）
- ✅ 进度追踪（Supabase 云端持久化）
- ⚠️ 付费订阅（架构存在 plan 字段，**无支付集成**）
- ❌ 管理后台（不存在）

---

## 2. 技术栈分析

### 核心框架

| 技术 | 版本 | 状态 |
|------|------|------|
| Next.js | 15.5.18 | ✅ 最新安全版 |
| React | ^19 | ✅ 最新 |
| @clerk/nextjs | ^6.12.4 | ✅ Core 3 |
| @supabase/supabase-js | ^2.49.4 | ✅ 最新 |
| svix | ^1.61.0 | ✅ 最新 |
| eslint | ^9 | ✅ 最新 |
| TypeScript | — | ⚠️ 未使用，纯 JavaScript |

### 外部服务

| 服务 | 用途 | 环境变量 |
|------|------|----------|
| Clerk | 用户认证/会话管理 | `CLERK_*` |
| Supabase | PostgreSQL 数据库 | `SUPABASE_*` |
| OpenAI Whisper | 语音转文字 STT | `OPENAI_API_KEY` |
| OpenAI GPT-4o-mini | 语义评分+发音分析 | `OPENAI_API_KEY` |
| OpenAI TTS-1 | AI 警官真人语音合成 | `OPENAI_API_KEY` |

### 架构模式

- **App Router**（Next.js 15 原生）
- **Server Components**（report 页面等）
- **Client Components**（practice/drive/mock 等）
- **Route Handlers**（7 个 API 路由）
- ❌ **未使用 Server Actions**（所有数据变更通过显式 `fetch('/api/...')` 完成）

### 样式方案

项目使用**纯 CSS 自定义属性（CSS Variables）+ 全局 CSS 类**，未使用 Tailwind、CSS Modules 或 styled-components。

- `app/globals.css` — 436行，包含完整设计系统
- 支持 `prefers-color-scheme: dark` 自动暗黑模式
- ⚠️ 部分页面（home、report）使用内联 `style={}` 对象，与全局 CSS 风格不统一

---

## 3. 目录结构分析

```
cdl_pro/
├── app/                            # Next.js App Router 根
│   ├── layout.js                   # Root layout — ClerkProvider + metadata
│   ├── page.js                     # 落地页 (Server Component)
│   ├── globals.css                 # ⚠ 全局样式 436行，略长
│   ├── practice/page.js            # ⚠ 单文件过大 ~700行
│   ├── signs/page.js
│   ├── mock/page.js                # ⚠ ~700行，含i18n大表格
│   ├── drive/page.js               # ⚠ ~700行，含i18n大表格
│   ├── report/page.js              # ✓ Server Component 最佳实践
│   ├── sign-in/[[...sign-in]]/
│   ├── sign-up/[[...sign-up]]/
│   └── api/
│       ├── speak/                  # OpenAI TTS
│       ├── transcribe/             # Whisper STT
│       ├── score/                  # GPT-4o-mini 评分
│       ├── progress/               # GET/POST 进度
│       ├── mock/                   # 模拟结果
│       ├── device/                 # 设备限制
│       └── webhooks/clerk/         # Clerk Webhook
├── components/
│   └── AppShell.js                 # ⚠ 单一组件 ~230行，含所有i18n
├── lib/
│   ├── data.js                     # 数据导出 + scoreKeywords + SCENARIOS
│   └── supabase/
│       ├── server.js               # Service Role 客户端
│       └── client.js               # Anon 浏览器客户端
├── data/
│   ├── questions.json              # 140题，16字段含5语言解释
│   └── signs.json                  # 84个标志，15字段
├── public/signs/                   # 84张标志PNG图片
├── middleware.js                   # Clerk 路由保护
├── next.config.mjs
├── package.json
├── jsconfig.json                   # @/* 路径别名
└── .env.example                    # 环境变量模板
```

### 结构优点

- ✅ 路由文件夹与功能一一对应，层次清晰
- ✅ `lib/` 与 `data/` 分离合理
- ✅ Supabase 客户端按 server/client 分离
- ✅ `@/` 路径别名配置正确
- ✅ 环境变量有 `.env.example` 模板

### 结构问题

- ❌ 所有 i18n 翻译内嵌在各页面，无集中管理
- ❌ `components/` 只有 1 个文件
- ❌ 缺少 `hooks/`、`types/`、`constants/` 目录
- ❌ practice/mock/drive page.js 单文件过大
- ❌ 缺少 `loading.js`、`error.js`、`not-found.js`
- ❌ 无任何测试文件

---

## 4. 框架架构分析

### 4.1 路由渲染策略

| 路由 | 渲染类型 | 认证 | 评价 |
|------|----------|------|------|
| `/` | Server Component | 公开 | ✅ 合理 |
| `/practice` | Client Component | Middleware保护 | ⚠️ 文件过大 |
| `/signs` | Client Component | Middleware保护 | ✅ 合理 |
| `/mock` | Client Component | Middleware保护 | ⚠️ 文件过大 |
| `/drive` | Client Component | Middleware保护 | ⚠️ 文件过大 |
| `/report` | Server Component | auth()+redirect | ✅ 最佳实践 |

> **`/report` 是最佳实践示例**：Server Component 直接调用 Supabase，无需客户端 fetch，数据在服务端合并后直接渲染，SEO 友好，无 loading 状态问题。

### 4.2 组件架构问题

当前项目**只有一个共享组件** `AppShell.js`，承担导航、语言切换、侧边栏统计、移动端切换等多重职责。

**建议拆出的组件（当前未存在）**：

- `ScoreRing` — 评分环形图（在 practice/mock/drive 三处重复）
- `WaveformIndicator` — 录音波形动画
- `RecordButton` — 录音控制按钮
- `QuestionCard` — 题目展示卡片
- `OfficerBubble` / `DriverBubble` — 对话气泡
- `VoicePreviewButton` — 声音试听
- `LanguageSelector` — 语言切换器

### 4.3 状态管理分析

| 状态 | 当前位置 | 问题 | 建议 |
|------|----------|------|------|
| 语言偏好 `lang` | 每个页面独立 useState | 刷新/跳转重置 | localStorage + Context |
| 练习进度 `progress` | practice/signs 各自 useState | 刷新丢失 | 从 API 加载历史 |
| 录音状态 | drive/practice/mock 各自管理 | 逻辑重复3处 | `useRecorder` hook |
| 认证状态 | Clerk 托管 | — | ✅ 合理 |

> **最明显的问题**：`lang`（界面语言）在每个页面各自维护，刷新后重置，跳转会丢失。建议用 `localStorage` + Context 持久化。

---

## 5. 模块分析

### 5.1 用户认证模块

**位置**：`middleware.js` · `app/api/webhooks/clerk/` · `app/sign-in/` · `app/sign-up/`

**优点**：
- Webhook 签名验证完整（Svix）
- 用户删除支持级联清理
- Graceful degradation（缺少 secret 返回 500 非崩溃）

**问题**：
- ⚠️ 无 `user.updated` 事件处理（语言偏好等字段变更时 profiles 不同步）
- ⚠️ 无邮件验证要求

---

### 5.2 练习模块

**位置**：`app/practice/page.js`（约 700 行）

**数据流**：`questions.json → 本地过滤 → 渲染 → 用户交互 → /api/transcribe → /api/score → /api/progress`

**优点**：三种模式由 URL searchParam 切换，过滤器完整，本地进度响应及时。

**主要问题**：
- 🔴 单文件 ~700 行，i18n 表格 ~100 行内嵌
- 🟡 刷新后本地 progress 状态丢失（未从 API 加载历史进度）
- 🟡 `speak()` 仍用浏览器 Web Speech（非真人声音，与 drive 模式不一致）
- 🟡 录音逻辑与 drive/mock 重复，应提取为 `useRecorder` hook

---

### 5.3 驾驶模式模块

**位置**：`app/drive/page.js` · `app/api/speak/route.js`

**亮点**：
- OpenAI TTS-1 真人语音（8种口音），graceful fallback 到浏览器 TTS
- 24小时音频缓存（相同问题重复播放零成本）
- `questionsRef` 解决 React 闭包过期问题

**问题**：
- 🔴 `/api/speak` 无速率限制，可能被滥用产生高额 OpenAI 费用
- 🟡 `Cache-Control: public` 应改为 `private`
- 🟡 对话历史仅存内存，关闭标签页即丢失

---

### 5.4 模拟检查模块

**位置**：`app/mock/page.js` · `app/api/mock/route.js`

**优点**：书面/口语双模式设计清晰，结果保存至 Supabase，5语言完整支持。

**问题**：
- 🟡 题目随机选取逻辑在组件内，应移至服务层
- 🟢 口语模式跳过题目不计0分，影响统计准确性

---

### 5.5 进度报告模块

**位置**：`app/report/page.js` · `app/api/progress/route.js`

**优点**（最佳实践）：纯 Server Component，并发 `Promise.all` 查询，auth 检查 + redirect 安全。

**问题**：
- 🟡 报告页无语言切换（只有英文），与其他页面不一致

---

### 5.6 国际化模块（最需重构）

**位置**：`components/AppShell.js` · `app/practice/page.js` · `app/drive/page.js` · `app/mock/page.js`

**现状**：每个页面内嵌独立翻译对象，共约 **400+ 行重复结构**，4 处分散，key 命名不统一。

**影响**：
- 🔴 新增第 6 种语言需改动 4+ 个文件
- 🔴 翻译 key 不一致导致 fallback 失效
- 🟡 不支持标准 i18n 方案生态

**解决方案**：创建 `lib/i18n/` 目录，统一 JSON 翻译文件，使用 `next-intl`。

---

### 5.7 设备管理模块

**位置**：`app/api/device/route.js`

**问题**：
- 🔴 fingerprint 来自客户端 body，**可完全伪造**
- 🟡 超限时仍插入记录但未真正拦截
- 🟡 前端未见调用此 API 的代码，**功能实际上未激活**

---

## 6. 数据流与状态管理

```
1. 练习流程
   data/questions.json → lib/data.js → practice/page.js (filter+render)
   → 用户输入 → /api/transcribe (Whisper STT)
   → /api/score (GPT-4o-mini) → /api/progress (Supabase upsert)

2. 驾驶模式流程
   用户选择场景 → SCENARIOS → 随机抽题
   → /api/speak (TTS音频) → 用户录音
   → /api/transcribe → /api/score → /api/progress → 下一题

3. 进度报告流程（纯服务端）
   auth() → Supabase 并发 Promise.all（3张表）
   → 计算统计 → Server Component 直接渲染
```

> **关键问题**：本地练习进度（`useState progress`）和数据库进度（Supabase）是**两个独立数据源**。练习页加载时不从 `/api/progress GET` 拉取历史数据，用户看不到上次学习状态。

---

## 7. API 与后端交互分析

### Route Handlers 总览

| 端点 | 方法 | 认证 | 外部服务 | 评级 |
|------|------|------|----------|------|
| `/api/speak` | POST | ✅ | OpenAI TTS | ⚠️ 无速率限制 |
| `/api/transcribe` | POST | ✅ | OpenAI Whisper | ✅ 良好 |
| `/api/score` | POST | ✅ | OpenAI GPT-4o-mini | ✅ 良好 |
| `/api/progress` | GET/POST | ✅ | — | ⚠️ POST无校验 |
| `/api/mock` | GET/POST | ✅ | — | ✅ 良好 |
| `/api/device` | POST | ✅ | — | ❌ fingerprint可伪造 |
| `/api/webhooks/clerk` | POST | Svix签名 | — | ✅ 良好 |

### API 设计亮点

1. **双层评分机制**：先运行本地 `scoreKeywords()`（0成本），再叠加 GPT-4o-mini 语义分，优雅降级
2. **音频缓存**：`Cache-Control: public, max-age=86400`，相同问题重复播放无额外费用
3. **Supabase upsert**：使用 `onConflict` 幂等操作，防止重复记录
4. **并发查询**：`Promise.all` 并发 3 张表查询，性能最优

> 🚨 **严重问题**：`/api/speak` 无速率限制。认证用户可无限调用 OpenAI TTS，高频调用可能导致账单冲击。**需立即处理**。

---

## 8. 类型系统分析

项目使用 **JavaScript（非 TypeScript）**，无类型定义文件，无 JSDoc 注释，API 返回类型、数据库模型、组件 props 均无类型约束。

### 应定义的核心类型

```typescript
// Question 题目结构（来自 questions.json）
type Question = {
  question_code: string
  category: 'Basic Identity / Documents' | 'Route / Cargo' | 'HOS / ELD' | 'Vehicle Condition' | 'Accident / Emergency'
  difficulty: 'Beginner' | 'Intermediate' | 'Mock Test'
  officer_question_en: string
  simple_driver_answer_en: string
  required_keywords: string[]
  explanation_zh: string
  explanation_es: string
  explanation_hi: string
  explanation_pa: string
  explanation_vi: string
}

// ScoreResult — /api/score 返回值
type ScoreResult = {
  score: number           // 0-100
  feedback: string | null
  wordScores: { word: string; score: number }[] | null
}

// OfficerVoice — Drive Mode
type OfficerVoice = {
  id: 'north_m' | 'south_m' | 'east_m' | 'west_m' | 'north_f' | 'south_f' | 'east_f' | 'west_f'
  label: string
  region: string
  gender: 'male' | 'female'
}
```

---

## 9. UI 与用户体验分析

### 优点

- ✅ 深色模式（`prefers-color-scheme`）自动支持
- ✅ 完整设计系统（CSS Variables 贯穿全局）
- ✅ 移动端汉堡菜单支持
- ✅ 活跃导航项视觉高亮（蓝色左边框 + 亮点）
- ✅ 录音状态明确（波形动画 + 红点）
- ✅ AI 评分结果清晰（环形进度条 + 颜色编码）
- ✅ 落地页视觉专业

### 需要改进

- ❌ **无 loading 状态页**（缺 `loading.js`）
- ❌ **无错误边界**（缺 `error.js`）— API 失败时白屏
- ❌ **无 404 页**（缺 `not-found.js`）
- ❌ 报告页无语言切换
- ❌ `aria-label` 不完整，键盘导航未完善
- ❌ 无 toast/notification 系统
- ❌ 表单无校验反馈

---

## 10. 性能分析

### 性能优点

- ✅ 题目/标志数据本地 JSON，无网络延迟
- ✅ Server Component report，服务端并发查询
- ✅ TTS 音频 24h 缓存，重复播放零成本
- ✅ `next/image` 优化标志图片
- ✅ `useCallback` 用于 markStatus

### 性能问题

- 🔴 **Bundle 膨胀**：所有 i18n 表格（~400行）打包进每个页面 JS
- 🟡 **Google Fonts 外链**：`globals.css` 中 `@import`，阻塞首次渲染
- 🟡 **无 React.memo**：重复渲染的 UI 组件无优化
- 🟡 **无动态导入**：drive/mock 大页面无 `dynamic()` 代码分割
- 🟡 **无 revalidate 策略**

> **最高优先级性能优化**：将 Google Fonts 改为 `next/font`；将 i18n 表格提取到独立文件；大页面使用 `dynamic(import, {loading: () => ...})`。

---

## 11. 安全性分析

### 安全优点

- ✅ 所有 API 路由均有 Clerk auth 检查
- ✅ Supabase Service Role Key 仅在服务端使用
- ✅ Webhook 使用 Svix 签名验证
- ✅ `.env.example` 区分公开/私密变量
- ✅ Middleware 覆盖所有敏感路径
- ✅ React JSX 自动转义，无 XSS 风险

### 安全风险

| 等级 | 问题 | 位置 |
|------|------|------|
| 🔴 高 | `/api/speak` 无速率限制，可刷 OpenAI 费用 | `app/api/speak/route.js` |
| 🔴 高 | device fingerprint 来自客户端，完全可伪造 | `app/api/device/route.js` |
| 🟡 中 | `/api/progress POST` 无输入校验，questionCode 无白名单 | `app/api/progress/route.js` |
| 🟡 中 | TTS `Cache-Control: public` 不应用于个性化内容 | `app/api/speak/route.js` |
| 🟡 中 | OpenAI API Key 若泄露，攻击者可直接消费 | 服务端环境变量 |

---

## 12. 测试与工程化分析

| 项目 | 状态 | 建议 |
|------|------|------|
| 单元测试 | ❌ 不存在 | Jest + React Testing Library |
| E2E 测试 | ❌ 不存在 | Playwright |
| API 测试 | ❌ 不存在 | Vitest + supertest |
| Lint | ✅ ESLint 9 | 可加 eslint-plugin-react-hooks |
| 格式化 | ❌ 无 Prettier | 建议添加 |
| CI/CD | ❌ 不存在 | GitHub Actions |
| 环境区分 | ✅ .env.example 齐全 | 建议加 .env.staging |
| 错误监控 | ❌ 不存在 | Sentry |
| 日志 | ❌ 只有 console.error | Pino 或 Winston |
| TypeScript | ❌ 纯 JavaScript | 渐进式迁移 |

> ⚠️ 项目**完全没有测试覆盖**。`scoreKeywords()`（核心评分逻辑）是最容易且最有价值的单元测试起点。

---

## 13. 问题清单（按严重程度排序）

### 🔴 高严重度

---

**问题 1：API 速率限制缺失 — OpenAI 账单风险**

- **文件**：`app/api/speak/route.js`
- **描述**：`/api/speak` 无任何调用频率限制。认证用户可无限循环调用 OpenAI TTS。
- **影响**：一个恶意用户可在数分钟内产生数百美元 OpenAI 费用。
- **解决方案**：使用 Upstash Redis 或 Vercel KV 实现滑动窗口速率限制，每用户每分钟最多 20 次。
- **修复成本**：中

---

**问题 2：Device Fingerprint 可被伪造**

- **文件**：`app/api/device/route.js`
- **描述**：设备限制依赖客户端传入的 fingerprint 字段，攻击者只需每次传不同字符串即可绕过。
- **影响**：防账号共享功能形同虚设。
- **解决方案**：改用服务端可信信号（IP + User-Agent hash）；或直接禁用此功能直到有可靠实现。
- **修复成本**：中

---

**问题 3：i18n 翻译分散 — 4 处重复，维护成本极高**

- **文件**：`AppShell.js` · `practice/page.js` · `drive/page.js` · `mock/page.js`
- **描述**：每个页面独立维护翻译对象，共约 400+ 行重复结构，key 命名不统一。
- **影响**：新增第 6 种语言需改动 4+ 个文件；翻译遗漏难以发现。
- **解决方案**：创建 `lib/i18n/` 目录，使用 `next-intl`。
- **修复成本**：高

---

### 🟡 中严重度

---

**问题 4：语言偏好不持久化 — 刷新后重置**

- **文件**：所有页面 lang useState
- **描述**：`lang` 在每个页面独立用 `useState('zh')`，刷新或跳转后重置为中文。
- **解决方案**：`localStorage` 持久化 + React Context 跨页面共享。
- **修复成本**：低

---

**问题 5：练习页历史进度不加载 — 每次从零开始**

- **文件**：`app/practice/page.js` · `app/signs/page.js`
- **描述**：加载时不调用 `GET /api/progress` 获取历史数据，progress 状态从空对象开始。
- **影响**：用户看不到上次学习状态，侧边栏统计归零。
- **解决方案**：用 `useEffect` 在 mount 时调用 `GET /api/progress`。
- **修复成本**：低

---

**问题 6：单页面文件过大**

- **文件**：`app/practice/page.js` · `app/mock/page.js` · `app/drive/page.js`
- **描述**：i18n 表格、业务逻辑、UI 渲染全混在单文件，各约 700 行。
- **解决方案**：提取 `useRecorder()`、`useScoring()` hooks；提取 i18n；抽象组件。
- **修复成本**：高

---

**问题 7：Google Fonts @import 阻塞渲染**

- **文件**：`app/globals.css`（第 1 行）
- **描述**：CSS 中 `@import` Google Fonts 会阻塞首次渲染。
- **解决方案**：改用 `next/font/google` 在 `layout.js` 中加载。
- **修复成本**：低

---

**问题 8：缺少 loading.js / error.js / not-found.js**

- **文件**：`app/` 根目录
- **描述**：App Router 页面加载、API 失败、404 均无对应处理文件。
- **影响**：API 错误导致白屏；404 显示 Next.js 默认页面。
- **修复成本**：低

---

**问题 9：TTS Cache-Control 策略不当**

- **文件**：`app/api/speak/route.js`
- **描述**：`Cache-Control: public` 允许中间代理缓存个性化内容。
- **解决方案**：改为 `Cache-Control: private, max-age=3600`。
- **修复成本**：低

---

### 🟢 低严重度

---

**问题 10：报告页缺少语言切换**

- **文件**：`app/report/page.js`
- **描述**：纯 Server Component，无语言选择器，只有英文。
- **修复成本**：中

---

**问题 11：Device API 前端调用缺失**

- **文件**：`app/api/device/route.js`
- **描述**：设备管理 API 已完整实现，但前端代码中未发现任何调用。
- **解决方案**：在 AppShell 中调用设备注册 API；或同步删除此 API。
- **修复成本**：低

---

## 14. 重构建议

### 阶段 1：快速修复（1-2 周）

目标：消除高危风险，修复明显 bug，提升稳定性。

- [ ] 🔴 添加 `/api/speak` 速率限制（Upstash Redis，每用户每分钟 20 次）
- [ ] 🔴 修复 TTS 缓存策略 → `Cache-Control: private`
- [ ] 🟡 添加 `loading.js` / `error.js` / `not-found.js`（各约 20 行）
- [ ] 🟡 持久化语言偏好（localStorage 读写，useEffect 初始化）
- [ ] 🟡 练习页加载历史进度（mount 时调用 GET /api/progress）
- [ ] 🟡 修复 Google Fonts → 迁移至 `next/font/google`
- [ ] 🟢 添加 `/api/progress` 输入校验（questionCode 白名单验证）
- [ ] 🟢 连接 device API 或清理删除

---

### 阶段 2：结构优化（3-4 周）

目标：代码解耦，提升可读性，为团队协作做准备。

- [ ] **统一 i18n 系统** — 创建 `lib/i18n/{zh,es,hi,pa,vi}.json`，安装 `next-intl`
- [ ] **提取 useRecorder hook** — 录音逻辑目前在 practice/mock/drive 三处重复
- [ ] **提取 useScoring hook** — transcribe → score → progress 调用链封装
- [ ] **组件拆分** — 创建 `components/ui/`：ScoreRing, WaveformIndicator, RecordButton 等
- [ ] **API 响应格式统一** — 所有路由统一返回 `{ ok, data, error }` 结构
- [ ] **添加 Prettier** + 调整 ESLint 规则（react-hooks/exhaustive-deps）
- [ ] **渐进式 TypeScript 迁移** — 从 `lib/data.js` 和 API 路由开始

---

### 阶段 3：长期扩展（持续进行）

目标：支持商业化、多租户、团队开发和产品规模化。

- [ ] **支付系统** — Stripe 集成，连接 profiles.plan，保护 PRO 功能
- [ ] **测试体系** — Jest 单元测试 + Playwright E2E
- [ ] **CI/CD** — GitHub Actions：lint + test + build + Vercel preview deploy
- [ ] **错误监控** — Sentry 前端错误追踪 + Vercel Logs
- [ ] **管理后台** — `/admin` 路由（题目管理、用户统计、收入数据）
- [ ] **内容管理** — 题目和标志数据迁移至 Supabase，支持在线编辑
- [ ] **用户学习路径** — 基于弱点自动推荐下一题（个性化算法）

---

## 15. 未来扩展指南

### 新增页面标准流程

1. 在 `app/[feature]/page.js` 创建页面文件
2. 若需认证，在 `middleware.js` 的 `isProtected` 添加路径
3. 若有客户端交互，文件顶部加 `'use client'`
4. 在 `AppShell` 的 NAV 数组添加导航项
5. 在 `lib/i18n/` 各语言文件添加新翻译 key
6. 若有 API，在 `app/api/[feature]/route.js` 创建路由

### 新增 API 路由标准

```javascript
// app/api/[feature]/route.js
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req) {
  // 1. 认证
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. 参数解析与校验
  const body = await req.json()
  const { field } = body
  if (!field?.trim()) return Response.json({ error: 'Missing field' }, { status: 400 })

  // 3. 业务逻辑
  const db = createServerClient()
  const { data, error } = await db.from('table').insert({ user_id: userId, field })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // 4. 统一返回格式
  return Response.json({ ok: true, data })
}
```

### 新增 Supabase 数据表流程

```sql
-- 1. 设计 Schema
CREATE TABLE public.new_feature (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,  -- Clerk user ID
  content text NOT NULL,
  score int,
  created_at timestamptz DEFAULT now()
);

-- 2. 启用 RLS
ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own data"
  ON new_feature FOR ALL
  USING (auth.uid()::text = user_id);
```

---

## 16. 推荐目标架构

```
cdl_pro/
├── app/                          # App Router — 只放路由文件
│   ├── layout.js
│   ├── loading.js                # 【新增】全局 loading skeleton
│   ├── error.js                  # 【新增】全局错误边界
│   ├── not-found.js              # 【新增】404 页面
│   ├── practice/page.js          # 精简至 ~150行（组件提取后）
│   ├── signs/page.js
│   ├── mock/page.js
│   ├── drive/page.js
│   ├── report/page.js
│   └── api/                      # 所有 Route Handlers
│
├── components/
│   ├── layout/                   # 【新增】布局组件
│   │   ├── AppShell.js           # 瘦身后仅处理布局
│   │   ├── Sidebar.js            # 【新增】
│   │   └── Topbar.js             # 【新增】
│   ├── ui/                       # 【新增】原子 UI 组件
│   │   ├── ScoreRing.js
│   │   ├── RecordButton.js
│   │   ├── WaveformIndicator.js
│   │   ├── ProgressBar.js
│   │   └── BadgeChip.js
│   └── features/                 # 【新增】业务组件
│       ├── QuestionCard.js
│       ├── OfficerBubble.js
│       ├── DriverBubble.js
│       └── VoiceSelector.js
│
├── hooks/                        # 【新增】自定义 Hooks
│   ├── useRecorder.js            # 录音逻辑（目前重复3处）
│   ├── useScoring.js             # transcribe+score+progress 链
│   ├── useLang.js                # 语言持久化
│   └── useProgress.js            # 进度数据加载与同步
│
├── lib/
│   ├── data.js                   # 现有，保留
│   ├── i18n/                     # 【新增】统一翻译
│   │   ├── zh.json
│   │   ├── es.json
│   │   ├── hi.json
│   │   ├── pa.json
│   │   ├── vi.json
│   │   └── index.js              # 统一导出 t() 函数
│   └── supabase/                 # 现有，保留
│
├── constants/                    # 【新增】常量
│   ├── voices.js                 # OFFICER_VOICES 数组
│   ├── scenarios.js              # SCENARIOS
│   └── routes.js                 # protected routes 列表
│
├── data/                         # 现有，保留
├── public/                       # 现有，保留
├── middleware.js                 # 现有，保留
└── jsconfig.json                 # 现有，保留
```

---

## 17. 优先级路线图

### 🚨 立即处理（本周）

- `P0` `/api/speak` 添加速率限制
- `P0` 修复 TTS Cache-Control 为 private
- `P0` 添加 `loading.js` + `error.js` + `not-found.js`

### ⚡ 近期处理（2周内）

- `P1` 语言偏好持久化
- `P1` 练习页历史进度加载
- `P1` 修复 Google Fonts → `next/font`
- `P1` `/api/progress` 输入校验

### 📦 结构优化（1个月内）

- `P2` 统一 i18n 系统
- `P2` 提取 useRecorder / useScoring hooks
- `P2` 组件库建立（components/ui/）
- `P2` 添加 Prettier

### 🚀 长期演进（季度计划）

- `P3` TypeScript 渐进式迁移
- `P3` 测试覆盖（Jest + Playwright）
- `P3` CI/CD 流水线（GitHub Actions）
- `P3` Stripe 支付集成
- `P3` Sentry 错误监控

---

## 18. 总结

### 项目亮点

- **产品方向清晰**：面向真实痛点，功能覆盖完整
- **技术选型现代**：Next.js 15 + React 19 + Clerk v6，全部最新稳定版
- **AI 集成深度好**：Whisper STT + GPT 评分 + OpenAI TTS 三路 AI，且有优雅降级
- **双层评分机制设计精妙**：本地关键词 + AI 语义，成本控制优秀
- **多语言支持全面**：5 种语言，数据模型中含 5 语言解释字段
- **`/report` 是架构最佳实践**：纯 Server Component + 并发查询

### 主要风险

- **最高优先级**：TTS API 无速率限制，有账单风险
- **可维护性瓶颈**：i18n 翻译分散 4 处，单页文件过大
- **用户体验缺口**：语言偏好不持久，历史进度不加载
- **工程化空白**：零测试，零 CI/CD，零错误监控
- **商业化未就绪**：付费功能有 plan 字段但无支付流程

---

> **结论**：这是一个功能丰富、产品思路清晰、技术选型现代的 MVP 级应用。核心业务流程完整，AI 集成设计有亮点。主要短板在于工程化基础设施缺失和代码结构的可扩展性。按照三阶段重构计划推进，可以在保持功能正常的前提下将技术债务有序清偿。

---

*CDL English Pro — Next.js 技术分析报告 · 2026年5月 · 基于 v2.1.0 源码分析*
