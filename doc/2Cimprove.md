# 2Cimprove.md — 当前项目状态 vs 改进计划

> **审计日期：** 2026-05-27
> **对照参考：** [`doc/1improve.md`](1improve.md)（架构分析报告）、[`doc/2gptimprove.md`](2gptimprove.md)（分阶段执行计划）
> **操作历史：** [`doc/4claudelog.md`](4claudelog.md)（Action 1–37）· [`doc/4claudelog2.md`](4claudelog2.md)（Action 37–44）· [`doc/4claudelog3.md`](4claudelog3.md)（Action 45–51）· [`doc/4claudelog4.md`](4claudelog4.md)（Action 52–57）· [`doc/4claudelog5.md`](4claudelog5.md)（Action 58–62）· [`doc/4claudelog6.md`](4claudelog6.md)（Action 63–69）

图例说明：✅ 已完成 · ⚠️ 部分完成 · ❌ 未启动

---

## 0. 总览评分卡

| 阶段（出自 2gptimprove.md） | 总项数 | 已完成 | 部分完成 | 未启动 |
|---|---:|---:|---:|---:|
| **P0 — 成本与安全（阶段一）** | 5 | 5 | 0 | 0 |
| **P1 — UX 修复（阶段二）** | 6 | 4 | 0 | 2 |
| **P2 — 结构重构（阶段三）** | 5 | 0 | 0 | 5 |
| **阶段四 — 设备限制** | 1 | 0 | 0 | 1 |
| **阶段五 — 工程化** | 5 | 0 | 0 | 5 |
| **阶段六 — 商业化（Stripe）** | 1 | 0 | 0 | 1 |
| **超出计划范围 — 功能开发** | 30+ | 30+ | 0 | — |
| **路线图项目总计** | 23 | 9 | 0 | 14 |

**一句话总结：** 所有 P0 安全/成本风险已全部消除；大部分 P1 UX 缺口也已修复；**但大规模结构重构（P2/P3 — i18n 拆分、Hook 提取、组件库、TypeScript、测试、CI）至今完全没有动**，三个大页面文件还在功能压力下持续膨胀（~700 行 → 800+ 行）。

---

## 1. 阶段一 — 成本与安全（P0）— ✅ 全部完成

来源：2gptimprove.md §3 + 1improve.md §13 高严重度风险清单。

| # | 项目 | 状态 | 证据 |
|---|---|---|---|
| 1 | `/api/speak` 速率限制 | ✅ | [`lib/rate-limit.js`](../lib/rate-limit.js) 在 **Action 1** 创建，**Action 2** 接入 [`app/api/speak/route.js`](../app/api/speak/route.js)。用户级 20 次/分钟。 |
| 2 | `/api/transcribe` 速率限制 | ✅ | **Action 3** — 10 次/分钟 |
| 3 | `/api/score` 速率限制 | ✅ | **Action 4** — 30 次/分钟 |
| 4 | TTS `Cache-Control` 改为 `private` | ✅ | **Action 2** — 头部现为 `private, max-age=3600`（已通过 grep 在 `app/api/speak/route.js:74` 验证）。 |
| 5 | `/api/progress` 输入校验 | ✅ | **Action 5** — `questionCode` / `signCode` 白名单 + `score` 范围检查 + `status` 枚举校验。 |

**`/api/translate` 也获得了速率限制**（Action 59 上线 Q&A 翻译功能时一并补上）—— 原计划未涵盖的额外保护。

---

## 2. 阶段二 — UX 修复（P1）— ⚠️ 6 项中已完成 4 项

来源：2gptimprove.md §4。

| # | 项目 | 状态 | 证据 |
|---|---|---|---|
| 6 | App Router 状态页（`loading.js`、`error.js`、`not-found.js`） | ✅ | **Action 6** — 三个文件均已创建：[`app/loading.js`](../app/loading.js)、[`app/error.js`](../app/error.js)、[`app/not-found.js`](../app/not-found.js)。 |
| 7 | 通过 `next/font` 加载 Google Fonts | ✅ | **Action 7** — Inter + JetBrains_Mono 现已在 [`app/layout.js:1`](../app/layout.js#L1) 通过 `next/font/google` 加载；CSS `@import` 已移除。 |
| 8 | 语言偏好持久化 | ❌ | **未完成。** 每个页面仍各自独立调用 `useState('zh')`（例如 [`app/practice/page.js:290`](../app/practice/page.js#L290)）。刷新会重置为中文；跨页面导航会丢失选择。没有 `useLang` hook，没有 `LanguageProvider`，没有 `localStorage` 写入。 |
| 9 | 挂载时加载历史进度（`GET /api/progress`） | ❌ | **未完成。** [`app/practice/page.js`](../app/practice/page.js) 和 [`app/signs/page.js`](../app/signs/page.js) 都没有在 mount 时调用 `GET /api/progress` —— 只有写入用的 `POST`。刷新后侧边栏统计仍从零开始。 |
| 10 | 统一的用户反馈（toast / inline alerts） | ❌ | 麦克风错误仍用 `alert()`，`/api/progress` POST 失败时静默无反馈。没有 `<Toast>` / `<InlineAlert>` 组件。 |
| 11 | lint 脚本校验 | ⚠️ | `package.json` 仍保留 `"lint": "next lint"`。构建可正常运行（每次 `npx next build` 都 ✓ 18/18），但 lint 脚本从未明确针对 ESLint 9 兼容性做过重新验证。 |

**阶段二净结论：** 可见的故障项（loading/error 页、字体阻塞）都已关闭。行为层面的项（语言记忆、进度恢复）每次访问还是会咬用户一口。

---

## 3. 阶段三 — 结构重构（P2）— ❌ 未启动

来源：2gptimprove.md §5 + 1improve.md §16 目标架构。

| # | 项目 | 状态 | 备注 |
|---|---|---|---|
| 12 | `hooks/useRecorder.js` | ❌ | `hooks/` 目录不存在。录音逻辑仍重复散布在 `app/practice/page.js`、`app/mock/page.js`、`app/drive/page.js`。 |
| 13 | `hooks/useScoring.js` | ❌ | 同上 —— transcribe→score→progress 调用链仍内嵌在每个页面。 |
| 14 | `hooks/useProgress.js` | ❌ | 未建立。 |
| 15 | 组件库（`components/ui/`、`components/features/`、`components/layout/`） | ❌ | 只有 [`components/AppShell.js`](../components/AppShell.js) 存在。没有提取 `ScoreRing`、`RecordButton`、`WaveformIndicator`、`QuestionCard`、`LanguageSelector` —— 它们仍内嵌于页面中。 |
| 16 | 集中化 i18n（`lib/i18n/`） | ❌ | 每个页面仍维护自己的 `T` / `MT` / `T`（Terms）翻译表。6 语言 × 4 页面 = 仍是 4 个维护点。没有 `next-intl`，没有 `lib/i18n/messages.{zh,es,hi,pa,vi}.js`。 |
| — | `constants/` 目录 | ❌ | `SCENARIOS`、`VOICE_MAP`、`OFFICER_VOICES`、受保护路由列表 —— 仍散布在各处。 |

### 文件体积压力（即 1improve.md §13 问题 6 所说的"单文件过大"）

| 文件 | 1improve.md 基线 | 当前（Action 68 之后） | 增量 |
|---|---:|---:|---:|
| `app/practice/page.js` | ~700 | **872** | +172 |
| `app/mock/page.js` | ~700 | **781** | +81 |
| `app/drive/page.js` | ~700 | **818** | +118 |
| `components/AppShell.js` | ~230 | **300** | +70 |
| `app/globals.css` | ~436 | **514** | +78 |

功能开发（Action 8–11 连续播放；43–44 Drive 体验优化；45–47 Hear-answer 按钮；51–54 Terms；58–62 Practice 翻译卡片；65–67 手机顶部栏）全部落在了现有文件里。**结构重构现在已经不只是被推迟 —— 而是逾期了**，拖得越久，最终需要改的差异就越大。

---

## 4. 阶段四 — 设备限制 — ❌ 未处理

[`app/api/device/route.js`](../app/api/device/route.js) 当前仍然：
- ⚠️ 前端无任何调用方（搜遍 `app/` 都找不到 caller）
- ⚠️ 信任客户端传入的 `fingerprint`（伪造毫无门槛）

未记录任何产品决策（2gptimprove.md 阶段四明确要求用户先在方案 A / B / C 之间做出选择）。建议要么删掉路由，要么用服务端可信信号 + 前端 caller 重新激活；当前状态是死代码。

---

## 5. 阶段五 — 工程化（P3）— ❌ 未启动

| # | 项目 | 状态 |
|---|---|---|
| 17 | Prettier（`.prettierrc`、`npm run format`） | ❌ |
| 18 | 单元测试（`scoreKeywords`、`getExplanation`、路由校验） | ❌ 没有 `*.test.*` / `*.spec.*` 文件。没有配置 Vitest / Jest。 |
| 19 | E2E 测试（Playwright） | ❌ |
| 20 | CI 流水线（`.github/workflows/`） | ❌ 没有 `.github/` 目录。 |
| 21 | 错误监控（Sentry 或同类工具） | ❌ 各处仍只用 `console.error`。 |
| 22 | 结构化日志（Pino / Winston） | ❌ |
| 23 | TypeScript 迁移 | ❌ 纯 JavaScript，`node_modules` 之外没有任何 `.ts` / `.tsx` 文件。 |

---

## 6. 阶段六 — 商业化 / Stripe — ❌ 未处理

`profiles.plan` 字段仍存在于 schema 中。没有 Stripe SDK，没有 Checkout 流程，没有 webhook，middleware 也没有 PRO 权限拦截。`/drive` 任何已登录用户均可访问。

---

## 7. 计划之外的工作 —— 已完成内容（Action 1–68）

按任务来源分类：以下内容**不在** 1improve.md 或 2gptimprove.md 范围内。它们来自 68 次记录在案会话中的直接用户功能需求。

### 7.1 Vercel / 部署稳定化 — Action 12–29

为修复 Vercel 上的 `MIDDLEWARE_INVOCATION_FAILED` 500 错误所进行的 17 步诊断与修复链：
- 锁定 Clerk 依赖行（Action 13）
- 最终将 middleware 切到 Node.js runtime + `vercel.json` 框架提示（Action 27–28）
- 在隔离出 Edge Runtime 根因之后恢复 `clerkMiddleware`（Action 29）

结果：生产部署正常运行。详细记录见 [`doc/4claudelog.md`](4claudelog.md)。

### 7.2 OpenAI TTS 统一化 — Action 30–35

将 `practice`、`mock`、`drive` 中所有 `speak()` / `speakWithCb()` / `speakText()` 调用统一路由到 `/api/speak`（部分原本使用浏览器 SpeechSynthesis）。API 增加可选 `speed` 参数。结果：各处声音一致；速率限制 + 认证现在真正保护到了每一次 TTS 调用。

### 7.3 成本追踪文档 — Action 36–37

创建 [`doc/Vercerror_Soluti.md`](Vercerror_Soluti.md)，包含 OpenAI 调用面的成本核算章节。

### 7.4 移动端 UX 全面优化 — Action 37、41、57、65–67

- 底部 6 标签移动端导航（Action 41、57）
- `/practice`（Action 65–66）和 `/signs`（Action 67）的手机专用图标顶栏控件
- 通过 `.hide-on-phone` / `.hide-on-desktop` 工具类显式保留桌面端 UI
- 品牌名在手机端从 "CDL English Pro" 折叠为 "ELP"

### 7.5 连续播放 — Action 8–11

为 listening 模式、mock 书面模式、drive 场景预览、drive 对话阶段（免提）添加自动循环 "Play all"。后续修复手机端无声 bug（Action 60–61）—— 根因是 iOS autoplay 在 `await fetch` 之后丢失手势许可；用持久解锁的 `<audio>` 元素解决。

### 7.6 Terms 功能 — Action 51–54

新增 `/terms` 页面，包含 63 个卡车术语 × 6 种语言 × 路检官-司机对话对。双声音播放（路检官与司机用不同声音）。所选语言翻译并排卡片。

### 7.7 Practice → Listening / Speak + AI 改进 — Action 58–62、64

- 标准答案下方始终可见的所选语言解释块（Action 58）
- Keywords 字段替换为实时 OpenAI Q&A 翻译卡片，localStorage 缓存（Action 59）
- Q&A 卡片中英文小字字号放大，与解释块对齐（Action 64）

### 7.8 Drive Mode 精修 — Action 44、46–50

- Hear-answer 语音按钮（Action 44）
- 对话上一题/下一题导航（Action 46）
- 场景下拉选择器（Action 48）
- 多次修复路检官冻结 / 自动推进 bug（Action 47、49、50）

### 7.9 Mock Inspection — Action 43、62

- 口语模式现显示正确答案 + 解释 + Prev/Next（Action 43）
- Model Answer 卡片上的 🔊 Hear-answer 按钮，使用与路检官不同的声音（Action 62）

### 7.10 多语言落地页 — Action 38–40

落地页 `app/page.js` 翻译为 6 种 UI 语言并加入选择器；进度报告页（`/report`）也获得了语言选择器（Action 40 —— 关闭了 1improve.md §5.5 中报告的一个缺口）。

### 7.11 筛选 UX — Action 55–56、63

- Practice + Signs 中类别下拉框换成 chip 按钮（Terms 风格）（Action 55）
- 手机端单行可横向滚动 chips（Action 56）
- Practice / Terms / Signs 完全移除搜索输入框（Action 63）

### 7.12 文档 — Action 36、68

- [`doc/Vercerror_Soluti.md`](Vercerror_Soluti.md) — Vercel 调试 + 成本核算
- [`../data.md`](../data.md) — 完整内容清单：140 题、84 标志、63 术语、63 对话对 ×5 语言、6 场景

---

## 8. 交叉对照 —— 原始 1improve.md 问题清单

针对 1improve.md §13 中编号的 11 个问题：

| # | 问题 | 当前状态 | 解决记录 |
|---|---|---|---|
| 1 | 🔴 `/api/speak` 无速率限制（OpenAI 账单风险） | ✅ 已修复 | Action 2 |
| 2 | 🔴 设备 fingerprint 可伪造 | ❌ 未关闭 | 阶段四等待产品决策 |
| 3 | 🔴 i18n 分散在 4 个文件 | ❌ 未关闭且在恶化 | 现在又多了第 5 个文件（`app/terms/page.js`） |
| 4 | 🟡 语言偏好不持久化 | ❌ 未关闭 | P1 项目仍待办 |
| 5 | 🟡 Practice 页不加载历史进度 | ❌ 未关闭 | P1 项目仍待办 |
| 6 | 🟡 单页面文件过大 | ❌ 未关闭且更差 | 三个文件分别增加了 80–170 行 |
| 7 | 🟡 Google Fonts `@import` 阻塞 | ✅ 已修复 | Action 7 |
| 8 | 🟡 缺少 `loading.js` / `error.js` / `not-found.js` | ✅ 已修复 | Action 6 |
| 9 | 🟡 TTS Cache-Control 不应为 `public` | ✅ 已修复 | Action 2 |
| 10 | 🟢 Report 页无语言切换 | ✅ 已修复 | Action 40 |
| 11 | 🟢 Device API 前端无 caller | ❌ 未关闭 | 同 #2 —— 等待决策 |

**得分：11 项中已修 5 项，开放 5 项，恶化 1 项。**

---

## 9. 推荐下一批工作（按优先级）

如果要挑选下一批 4–6 项交付，建议顺序如下：

### 🔴 最高杠杆、成本低

1. **历史进度加载**（P1 #9，约 1 天）—— 在 `/practice` 和 `/signs` 中各加一个 `useEffect(() => { fetch('/api/progress').then(setProgress) }, [])`。侧边栏统计立即变真实。用户可直接感知的胜利。

2. **语言偏好持久化**（P1 #8，约半天）—— `useLang` hook + localStorage 读写；在 `app/layout.js` 中通过轻量 Context provider 把 `lang` 串起来。消除"每个页面都重置为中文"的体验小石子。

### 🟡 每周都在变大的债务

3. **i18n 集中化**（P2 #16，约 2 天）—— 把所有 `T` / `MT` 对象抽到 `lib/i18n/messages.{en,zh,es,hi,pa,vi}.js`。先**不要**引入 `next-intl` —— 一个扁平的 `t(lang, key)` 函数就够了。现在不做就再难做了：每加一个功能就要再稀释一张 `T` 表。

4. **抽取 `useRecorder` hook**（P2 #12，约 1 天）—— `practice`、`mock`、`drive` 三个文件都在手写 `MediaRecorder` 设置。单一真理源能彻底消除反复出现的手机手势 bug（参见 Action 60–61 + 65–67）。

### 🟢 复利收益的工程卫生

5. **第一个单元测试：`scoreKeywords`**（P3 #18，约半天）—— 单个函数被测试覆盖能解锁后续整套测试基础设施。1improve.md §12 称这是"最容易也最有价值的起点"。加 Vitest 配置 + 8–10 条关键词评分数学的断言。

6. **加一段 `hide-on-phone` / `hide-on-desktop` 文档注释**（约 10 分钟）—— Action 65–67 临时引入了这套工具类。在 `app/globals.css` 文件头部记录这个模式，下一个仅手机功能开发时就能查得到。

### ⚪ 仍待用户决策（来自 2gptimprove.md §12）

以下事项不做产品决策就无法实施：

- Stripe / PRO 权限模型
- 设备限制策略（方案 A：禁用 / B：仅记录 / C：完整管理）
- 默认语言策略（固定 `zh` 还是浏览器检测）
- URL 是否加语言前缀（`/zh/practice`？）
- 日志 / 监控服务选型（Sentry？）

---

## 10. 架构 vs 目标 —— 可视化对比

[`1improve.md`](1improve.md) §16 规划（左）vs 当前实际（右）：

```
                  目标                                当前
                  ─────────                           ──────────
app/                                          app/
  layout.js                  ✅                  layout.js
  loading.js                 ✅                  loading.js
  error.js                   ✅                  error.js
  not-found.js               ✅                  not-found.js
  practice/page.js  (~150)   ❌ 872 行           practice/page.js  (872)
  mock/page.js               ❌ 781 行           mock/page.js  (781)
  drive/page.js              ❌ 818 行           drive/page.js  (818)
  report/page.js             ✅                  report/page.js

components/
  layout/                    ❌                  components/AppShell.js  (300)
    AppShell.js
    Sidebar.js
    Topbar.js
  ui/                        ❌                  （无）
    ScoreRing.js
    RecordButton.js
    WaveformIndicator.js
    ProgressBar.js
    BadgeChip.js
  features/                  ❌                  （无）
    QuestionCard.js
    OfficerBubble.js
    DriverBubble.js
    VoiceSelector.js

hooks/                       ❌                  （目录不存在）
  useRecorder.js
  useScoring.js
  useLang.js
  useProgress.js

lib/
  data.js                    ✅                  lib/data.js
  i18n/                      ❌                  （目录不存在）
    zh.json                                      — 翻译仍嵌入在
    es.json                                        practice / mock / drive / signs
    hi.json                                        / terms / AppShell 各页面
    pa.json
    vi.json
    index.js
  supabase/                  ✅                  lib/supabase/
  rate-limit.js              ✅（已新增）        lib/rate-limit.js
  terms.js                   — （新增）          lib/terms.js  (Action 51)

constants/                   ❌                  （目录不存在）
  voices.js
  scenarios.js
  routes.js
```

---

## 11. 收尾一段话

项目早在几个月前就跨过了"不会着火"那条线 —— 原始分析中所有 P0 成本/安全风险都已修复，Vercel 上的部署稳定，功能交付持续不断（68 次记录在案的 action，每周大约 5 项用户可见改进）。**没有发生的是结构重构** —— i18n 仍内嵌在 5 个页面文件、三个页面在向 800+ 行逼近、不存在 `hooks/` 或 `components/ui/`、测试覆盖率仍是零。接下来 6–8 周应当切换节奏：净新功能少做一些，集中精力打第 §9 节列出的四项重构组合包 + 第一个单元测试。这一拖延每持续一周，最终的重写规模就更大一些，diff 也更吓人一些。
