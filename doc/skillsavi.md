# skillsavi.md — 可用技能与方法对照（针对 2improve.md 中未解决问题）

> **生成日期：** 2026-05-27
> **目标：** 针对 [`doc/2improve.md`](2improve.md) / [`doc/2Cimprove.md`](2Cimprove.md) 中列出的所有未解决项（"open" / "not started"），逐项匹配可用的 Claude Code 内置技能、Anthropic 官方 skills 仓库内容、以及社区生态中可立即使用的技能/插件/MCP 服务。
>
> **研究来源：**
> - Anthropic 官方 skills 仓库（[github.com/anthropics/skills](https://github.com/anthropics/skills)）—— 17 个官方 skill
> - Claude Code 内置可调用 skill（出现在系统 `available-skills` 列表中）
> - Anthropic 官方 plugin 目录（[claude.com/plugins](https://claude.com/plugins)）
> - 社区聚合仓库：[VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)（1000+ 技能）、[claudemarketplaces.com](https://claudemarketplaces.com/)（6700+ 技能）、[mcpmarket.com](https://mcpmarket.com)
> - 单一用途仓库：[wrsmith108/stripe-mcp-skill](https://github.com/wrsmith108/stripe-mcp-skill)、[SpillwaveSolutions/mastering-typescript-skill](https://github.com/SpillwaveSolutions/mastering-typescript-skill) 等

---

## 0. 资源全景速查表

### 0.1 Anthropic 官方 17 个 skill

| Skill 名 | 用途 | 与本项目相关性 |
|---|---|---|
| **algorithmic-art** | 程序化艺术生成 | ❌ |
| **brand-guidelines** | 品牌指南文档 | ❌ |
| **canvas-design** | Canvas 设计 | ❌ |
| **claude-api** | Claude API / SDK 集成、迁移、缓存优化 | ⚪ 现项目未集成 Anthropic SDK |
| **doc-coauthoring** | 文档协作写作 | ⚪ 仅文档相关 |
| **docx** | Word 文档处理 | ❌ |
| **frontend-design** | 高质量前端 UI 设计、组件、页面构建 | ✅✅✅ **直接相关** |
| **internal-comms** | 内部沟通文档 | ❌ |
| **mcp-builder** | 构建 MCP server | ⚪ 仅当需要自定义 MCP 时 |
| **pdf** | PDF 处理 | ❌ |
| **pptx** | PowerPoint 处理 | ❌ |
| **skill-creator** | 创建/优化自定义 skill | ✅ 可用于为本项目生产专属 skill |
| **slack-gif-creator** | Slack GIF 制作 | ❌ |
| **theme-factory** | 主题/配色生成 | ⚪ |
| **web-artifacts-builder** | 构建独立可分享的网页 artifact | ⚪ |
| **webapp-testing** | 用 Playwright 自动化测试本地 web 应用 | ✅✅✅ **直接相关** |
| **xlsx** | Excel 处理 | ❌ |

### 0.2 Claude Code 内置可立即调用的 skill

来自当前会话的 `available-skills` 列表（无需安装，直接 `Skill` 工具调用）：

| Skill 名 | 用途 | 与本项目相关性 |
|---|---|---|
| **simplify** | 审视已改动代码，从复用/质量/效率角度修正问题 | ✅✅✅ 适用于所有重构任务 |
| **verify** | 启动应用、在浏览器中观察行为以验证改动是否真的工作 | ✅✅ 适用于所有 UX 修复 |
| **review** | PR 代码审查 | ✅ 适用于结构重构完成后的自审 |
| **security-review** | 当前分支的安全审查（pending changes） | ✅ 适用于设备限制问题、Stripe 集成审查 |
| **run** | 启动并驱动项目应用以查看改动效果 | ✅✅ 各类 UI 改动验证 |
| **init** | 初始化 / 更新 CLAUDE.md 项目说明文档 | ⚪ |
| **update-config** | 配置 `.claude/settings.json`、hooks、权限、env vars | ✅ Prettier / 测试集成时可用 |
| **fewer-permission-prompts** | 扫描历史会话 → 把常用只读 Bash 命令加入项目 allowlist | ✅ 长期效率优化 |
| **keybindings-help** | 自定义 Claude Code 键盘快捷键 | ⚪ |
| **loop** | 在固定间隔重复运行某个 prompt / slash command | ⚪ |
| **schedule** | cron 计划 + 远程 agent 调度 | ⚪ |
| **claude-api** | 构建/调试/优化 Claude API / Anthropic SDK 应用 | ⚪ |

### 0.3 内置专门 agent 类型（通过 `Agent` 工具调用）

| Agent | 用途 | 推荐使用场景 |
|---|---|---|
| **Plan** | 软件架构师：为复杂任务设计实施方案、识别关键文件、权衡架构 | ✅✅ i18n 集中化、hook 提取、组件库拆分前先用此 agent 出方案 |
| **Explore** | 只读快速搜索：定位文件/符号/关键词 | ✅ 大文件分析、重复代码定位 |
| **general-purpose** | 多步骤研究 + 任意工具 | ✅ 复杂调研类任务 |
| **claude-code-guide** | Claude Code 自身使用问题答疑 | ⚪ |
| **statusline-setup** | 状态栏配置 | ⚪ |

### 0.4 社区/市场关键资源

| 名称 | 链接 | 类型 |
|---|---|---|
| Sentry 官方 plugin | [claude.com/plugins/sentry](https://claude.com/plugins/sentry) | 官方 plugin（错误监控） |
| stripe-mcp-skill | [github.com/wrsmith108/stripe-mcp-skill](https://github.com/wrsmith108/stripe-mcp-skill) | MCP server（Stripe 集成） |
| mastering-typescript-skill | [github.com/SpillwaveSolutions/mastering-typescript-skill](https://github.com/SpillwaveSolutions/mastering-typescript-skill) | 企业级 TS 模式（React、NestJS） |
| react-modernization | mcpmarket.com 收录 | 类组件 → hooks、React 并发特性 |
| Next-intl localization skill | [mcpmarket.com/tools/skills/next-intl-localization](https://mcpmarket.com/tools/skills/next-intl-localization) | i18n 文件管理 |
| vercel-labs/next-best-practices | awesome-agent-skills 收录 | Next.js 最佳实践 |
| vercel-labs/react-best-practices | 同上 | React 最佳实践 |
| vercel-labs/composition-patterns | 同上 | 组件组合与复用模式 |
| openai/playwright | 同上 | 浏览器自动化测试 |
| trailofbits/testing-handbook-skills | 同上 | 多框架测试方法论 |
| callstackincubator/github | 同上 | GitHub workflow / Actions 模式 |
| alirezarezvani/claude-skills | [github.com/alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | 329 个 skill 大合集 |

---

## 1. 阶段二（P1）未完成项 → 推荐技能/方法

### 1.1 P1 #8 — 语言偏好持久化（lang preference persistence）

**问题描述：** 每个页面独立 `useState('zh')`，刷新或跨页面跳转都重置为中文。需要 `localStorage` 持久化 + Context 跨页面共享。

**严重度：** 🟡 中等 · **预计工时：** ~半天

#### 推荐组合

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. 设计方案 | **`Plan` agent** | 让架构师 agent 出 `useLang` hook + `LanguageProvider` 的最小设计（避免引入 next-intl 的重型方案） |
| 2. 实施 | 直接代码改动（无需 skill） | 写入 `hooks/useLang.js` + 在 `app/layout.js` 包一层 `<LanguageProvider>` + 修改所有页面用 `useLang()` 替代 `useState('zh')` |
| 3. 验证 | **`verify` skill** | 打开浏览器 → 切换语言 → 刷新 → 跨页面跳转 → 确认语言保持 |
| 4. 自审 | **`simplify` skill** | 检查是否引入了不必要的抽象、是否有更小的实现 |

#### 关键说明

- ❌ 不推荐：第一步就引入 `next-intl`。理由：2gptimprove.md §6 明确说"先做轻量 `LanguageProvider`，因为这样改动小、风险低"。
- ✅ 若未来确实需要 URL 语言前缀（`/zh/practice`）或服务端渲染翻译，再考虑迁移到 next-intl。

---

### 1.2 P1 #9 — 历史进度加载（GET /api/progress on mount）

**问题描述：** `/practice` 和 `/signs` 页面挂载时不调用 `GET /api/progress`，导致刷新后侧边栏统计归零、已学习题目状态丢失。

**严重度：** 🟡 中等 · **预计工时：** ~1 天

#### 推荐组合

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. 设计方案 | **`Plan` agent** | 让 agent 出 `useProgress` hook 设计（参数：page 类型；返回 `{progress, loading, error}`） |
| 2. 实施 | 直接代码改动 | 在 `app/practice/page.js` / `app/signs/page.js` 加 `useEffect(() => { fetch('/api/progress').then(...) }, [])`；或先做无 hook 的最小可用版本 |
| 3. 错误处理 | 见 §1.3（统一反馈） | API 失败时应有可见提示而非静默 |
| 4. 验证 | **`verify` skill** | 完成几道题 → 刷新 → 看到已答题状态正确恢复 |

#### 关键说明

- ⚠️ 注意：现状的本地乐观更新（POST progress 后立即更新本地状态）应保留，避免回到"等 API 才更新"的差体验。
- ⚠️ 注意：`useProgress` hook 若设计得太"重"，会跟未来的 `useRecorder` / `useScoring` 撞代码风格 —— 建议三个 hook 一起设计接口。

---

### 1.3 P1 #10 — 统一用户反馈（toast / inline alert）

**问题描述：** 麦克风错误用 `alert()`，`/api/progress` POST 失败静默无反馈，AI 评分失败时降级未通知用户。

**严重度：** 🟡 中等 · **预计工时：** ~1 天

#### 推荐组合

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. 设计 toast UI | **`frontend-design`**（Anthropic 官方 skill） | 该 skill 强调"distinctive, production-grade web interfaces"，可生成有设计感的 `<Toast>` / `<InlineAlert>` 组件，避免 generic AI aesthetics |
| 2. 实施 | 直接代码改动 | 创建 `components/ui/Toast.js` + `components/ui/InlineAlert.js` + 在 `app/layout.js` 挂 `<ToastProvider>` |
| 3. 替换 `alert()` | 直接代码改动 | 把所有 `alert(...)` 调用换成 `toast.show({...})` |
| 4. 验证 | **`verify` skill** | 故意拒绝麦克风权限 / 断网 → 确认有 toast 提示 |

#### 关键说明

- 本项目使用纯 CSS 变量，不用 Tailwind。`frontend-design` skill 输出多框架兼容，但要在 prompt 中明确"项目用纯 CSS + CSS vars，不要引入 Tailwind / styled-components"。

---

### 1.4 P1 #11 — lint 脚本校验

**问题描述：** `"lint": "next lint"` 未针对 ESLint 9 兼容性显式验证。

**严重度：** 🟢 低 · **预计工时：** ~10 分钟

#### 推荐组合

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. 直接验证 | `Bash` 工具 | 跑 `npm run lint` → 看是否报 "next lint is deprecated" 或类似警告 |
| 2. 修复（如需） | `Edit` 工具 | 改 `package.json` 的 `lint` 为 `eslint .` + 新增 `eslint.config.mjs`（仅当 next lint 失效时） |

无需任何 skill；纯运维任务。

---

## 2. 阶段三（P2 结构重构）未完成项 → 推荐技能/方法

### 2.1 P2 #12 — 抽取 `useRecorder` hook

**问题描述：** `MediaRecorder` 初始化、开始、停止、清理逻辑在 `app/practice/page.js`、`app/mock/page.js`、`app/drive/page.js` 三处重复。

**严重度：** 🟡 中等 · **预计工时：** ~1 天

#### 推荐组合

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. 重复代码定位 | **`Explore` agent** | "在 `app/practice/page.js`、`app/mock/page.js`、`app/drive/page.js` 中找出所有 `MediaRecorder`、`getUserMedia`、`mr.start()`、`mr.stop()` 相关代码块" |
| 2. 设计 hook 接口 | **`Plan` agent** | 让架构师统一返回签名 `{isRecording, startRecording, stopRecording, error, audioBlob}`，确保三处都能用同一个 |
| 3. 实施 | 直接代码改动 | 创建 `hooks/useRecorder.js`，替换三处的内联实现 |
| 4. 重构后审视 | **`simplify` skill** | 检查 hook 是否过度泛化、参数列表是否最小 |
| 5. 验证 | **`verify` skill** | 在三个页面分别录音 → 转写 → 评分，确认行为不变 |

#### 关键说明

- ⚠️ 历史教训：Action 60–61、65–67 都涉及 iOS 自动播放/手势失效问题。`useRecorder` 必须封装 `unlockAudio()` 调用模式，避免未来再次踩坑。

---

### 2.2 P2 #13 — 抽取 `useScoring` hook

**问题描述：** transcribe → score → progress 调用链在三个页面重复。

**推荐组合：** 与 §2.1 完全相同（`Plan` → 直接实施 → `simplify` → `verify`）。

#### 关键说明

- ✅ 必须保留 `scoreKeywords()` 本地降级（API 失败时用关键词评分）—— 这是 2gptimprove.md §5 步骤 11 明确强调的。

---

### 2.3 P2 #14 — 抽取 `useProgress` hook

**问题描述：** 同 §1.2，建议与 §1.2 合并实施。

---

### 2.4 P2 #15 — 组件库拆分（`components/ui/`、`components/features/`、`components/layout/`）

**问题描述：** 项目只有 `components/AppShell.js`，应拆出 `ScoreRing`、`RecordButton`、`WaveformIndicator`、`QuestionCard`、`OfficerBubble`、`DriverBubble`、`VoiceSelector` 等。

**严重度：** 🟡 中等 · **预计工时：** ~3–5 天

#### 推荐组合

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. 候选组件清单 | **`Explore` agent** | 找出三个大页面中重复的 JSX 块（`score-ring`、`rec-zone`、`waveform`、`q-officer` 等 className） |
| 2. 视觉设计审视 | **`frontend-design`** skill | 在拆出 `ScoreRing` / `RecordButton` 时让它给出有设计感的版本（保留现有 CSS 变量配色） |
| 3. 拆分实施 | 直接代码改动 | 一次拆一个组件 + 跑一次 build + 验证 UI 没变形 |
| 4. 组合模式参考 | 社区 skill：[vercel-labs/composition-patterns](https://github.com/VoltAgent/awesome-agent-skills) | 给出 React 组件组合的最佳实践 |
| 5. 整理后审视 | **`simplify` skill** | 防止过早抽象（CLAUDE.md §2 强调 "Simplicity First"） |
| 6. 验证 | **`verify` skill** | 桌面端 + 手机端各页面跑一遍，截图对比 |

#### 关键说明

- ⚠️ 本项目 1improve.md §2 写明："**未使用 Tailwind、CSS Modules 或 styled-components**"。`frontend-design` 默认会推荐 Tailwind 风格 —— prompt 必须明确：**"保持现有 `app/globals.css` + CSS variables 的纯 CSS 体系，不要引入 Tailwind。"**

---

### 2.5 P2 #16 — i18n 集中化（最痛但最有杠杆）

**问题描述：** 翻译散落在 5 个文件（`AppShell.js`、`practice/page.js`、`mock/page.js`、`drive/page.js`、`terms/page.js`），共 400+ 行重复结构。

**严重度：** 🔴 高 · **预计工时：** ~2 天（轻量方案）/ ~4 天（next-intl 完整方案）

#### 方案 A：轻量集中（推荐第一步）

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. 提取所有翻译 | **`Explore` agent** + **`general-purpose` agent** | 让 agent 把 5 个文件中的 `T` / `MT` 对象逐个迁移到 `lib/i18n/messages.{en,zh,es,hi,pa,vi}.js` |
| 2. 统一 `t(lang, key)` | 直接代码改动 | 在 `lib/i18n/index.js` 导出统一的 `t()` 函数，所有页面引用 |
| 3. 缺失 key 警告 | 直接代码改动 | 开发环境下 `console.warn` 缺失的 key |
| 4. 验证 | **`verify` skill** | 在每个页面切换 6 种语言，确认所有文案正确显示 |

#### 方案 B：完整 next-intl（未来）

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. 架构方案 | **`Plan` agent** | 是否需要 URL 语言前缀（`/zh/practice`）、是否需要服务端渲染翻译、消息提取流程 |
| 2. 实施参考 | 社区 skill：[next-intl-localization](https://mcpmarket.com/tools/skills/next-intl-localization)（mcpmarket） | 该 skill 专门为 Next.js + next-intl 项目设计的翻译文件管理 + UI 字符串映射规则 |
| 3. RTL 准备 | 社区参考：[next-intl 官方 useExtracted 博客](https://next-intl.dev/blog/use-extracted) | 提取 hook 模式，跨组件移动消息无痛 |
| 4. 验证 | **`verify` skill** + **`webapp-testing`** | Playwright 自动化验证 6 种语言 × 5 页面 |

#### 关键说明

- 🔴 2gptimprove.md §5 步骤 13 明确说"**先不急着引入 next-intl**"。理由：项目还在快速演进，方案 A 改动小、可回滚。
- 🔴 推荐顺序：先做方案 A → 待结构稳定后再评估是否需要方案 B。
- ✅ 方案 A 完成后，"新增第 6 种语言只需新增一个消息文件"这件事就达成了 —— 这是 1improve.md §13 问题 3 的核心痛点。

---

### 2.6 P2 额外项 — `constants/` 目录

**问题描述：** `SCENARIOS`、`VOICE_MAP`、`OFFICER_VOICES`、protected-routes 列表分散在 `lib/data.js`、`app/api/speak/route.js`、`middleware.js`。

**严重度：** 🟢 低 · **预计工时：** ~半天

#### 推荐组合

直接代码改动，无需 skill。可在 §2.4 组件拆分时顺手完成。

---

### 2.7 P2 额外项 — 大文件继续膨胀（practice 872 / mock 781 / drive 818 行）

**严重度：** 🟡 中等 · **预计工时：** §2.1–§2.5 完成后自然瘦身

#### 推荐组合

| 工具/技能 | 用法 |
|---|---|
| **`Plan` agent** | 一次性出三个文件的"目标行数 + 拆分路径"重构方案 |
| **`simplify` skill** | 每次抽取组件/hook 之后跑一次，防止意外保留死代码 |
| **`Explore` agent** | 跟踪行数变化（`wc -l`）作为重构进度指标 |

---

## 3. 阶段四 — 设备限制（需先做产品决策）

### 3.1 问题 #2 + #11

[`app/api/device/route.js`](../app/api/device/route.js) 存在但：
- 前端无 caller
- fingerprint 来自客户端 body，可伪造

**这是产品决策问题，不是技能问题。** 待用户在三个方案中选一个：A) 暂时禁用 / B) 仅记录风险 / C) 完整设备管理（2gptimprove.md §6）。

#### 推荐组合（决策后）

| 方案 | 工具/技能 | 用法 |
|---|---|---|
| 方案 A（删除） | 直接代码改动 | 删除路由 + middleware 引用 |
| 方案 B（仅记录） | **`security-review`** skill | 在改动后跑一遍安全审查，确认服务端信号（IP hash + UA hash）够用 |
| 方案 C（完整管理） | **`Plan` agent** + **`frontend-design`** skill | 设计设备管理页面 + 移除旧设备 UI + 拦截策略 |

---

## 4. 阶段五（P3 工程化）未完成项 → 推荐技能/方法

### 4.1 P3 #17 — Prettier

**严重度：** 🟢 低 · **预计工时：** ~1 小时

#### 推荐组合

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. 安装与配置 | 直接代码改动 | `npm i -D prettier` + 创建 `.prettierrc` + 新增 `"format": "prettier --write ."` |
| 2. 集成到 hook | **`update-config`** skill | 配置 `.claude/settings.json`，在保存时自动 format（或保留为手动） |
| 3. 忽略文件 | `Edit` | `.prettierignore` 排除 `node_modules`、`.next`、`public/signs`、`data/*.json` |

---

### 4.2 P3 #18 — 单元测试（Vitest）

**严重度：** 🟡 中等 · **预计工时：** ~2 天（首批 5–10 个测试）

#### 推荐组合

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. 选首批被测对象 | 见 2gptimprove.md §7 步骤 16 | `scoreKeywords()` → `getExplanation()` → `/api/progress` 输入校验 |
| 2. Vitest 配置 | 直接代码改动 | `npm i -D vitest @testing-library/react jsdom` + `vitest.config.js` |
| 3. 测试模式参考 | 社区 skill：[trailofbits/testing-handbook-skills](https://github.com/VoltAgent/awesome-agent-skills) | 多框架测试方法论 |
| 4. 编写测试 | 直接代码改动 | 先写 `scoreKeywords` 的 8–10 条断言 |
| 5. 验证 | `Bash` | `npm test` 通过 |

#### 关键说明

- ✅ 1improve.md §12 称 `scoreKeywords()` 是"**最容易也最有价值的单元测试起点**"。从它开始能解锁后续整套基础设施。

---

### 4.3 P3 #19 — E2E 测试（Playwright）

**严重度：** 🟡 中等 · **预计工时：** ~2 天（首个核心路径）

#### 推荐组合

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. Playwright 安装 | **`webapp-testing`** skill（Anthropic 官方） | 该 skill 自带 `scripts/with_server.py` 管理 server lifecycle + Playwright Python 自动化模式 |
| 2. 首个测试 | **`webapp-testing`** skill | 覆盖 "登录 → /practice → 选题 → 录音 → 评分" 完整路径 |
| 3. 备选 skill | [openai/playwright](https://github.com/VoltAgent/awesome-agent-skills) | 社区版本，模式相同 |
| 4. 验证 | **`verify`** skill | 跑 Playwright 测试 + 在真实浏览器手工对比 |

#### 关键说明

- ⚠️ 测试本项目时需要 mock：Clerk 认证、Supabase、OpenAI API（用 fixture 而非真实调用）。`webapp-testing` 的示例中提到"reconnaissance-then-action"模式 —— 先 screenshot + DOM 调研，再执行 action，适合本项目的多状态 UI（录音中 / 转写中 / 评分中）。

---

### 4.4 P3 #20 — CI 流水线（GitHub Actions）

**严重度：** 🟡 中等 · **预计工时：** ~半天

#### 推荐组合

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. workflow 模板 | 社区 skill：[callstackincubator/github](https://github.com/VoltAgent/awesome-agent-skills) | GitHub workflow / PR / 分支模式参考 |
| 2. 写入 `.github/workflows/ci.yml` | 直接代码改动 | install → lint → test → build 四步 |
| 3. Vercel 集成 | 直接代码改动 | 使用 Vercel 内置 GitHub 集成 + workflow 仅做 lint + test（避免重复 build） |
| 4. 验证 | `Bash` + GitHub UI | 推一个 PR → 看 Actions 是否跑过 |

---

### 4.5 P3 #21 — 错误监控（Sentry）

**严重度：** 🟡 中等 · **预计工时：** ~1 天

#### 推荐组合

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. 注册 Sentry 项目 | 浏览器（不在本工具内） | Sentry 自建项目 |
| 2. 安装 Sentry SDK | 直接代码改动 | `npm i @sentry/nextjs` + `npx @sentry/wizard` |
| 3. **Sentry plugin** | [claude.com/plugins/sentry](https://claude.com/plugins/sentry)（官方 plugin） | **强烈推荐安装。** 集成后可在 Claude Code 内直接：访问/分析错误、识别模式、获取修复建议、按用户影响排序、自然语言查询（`/seer "过去 24 小时最多的错误是什么"`）、自动在 PR 中分析 + 修 bug |
| 4. 备选 skill | [sentry-cli-integration](https://mcpmarket.com/tools/skills/sentry-cli-integration) | 通过 Sentry CLI 操作（认证、组织/项目管理、issue triage、AI 根因分析） |
| 5. 验证 | **`verify`** skill | 故意触发一个错误 → 在 Sentry dashboard 看到记录 |

#### 关键说明

- 🔴 **Sentry plugin 是本项目最高 ROI 的工具集成之一**。它把错误监控的"配置 + 查询 + 分析 + 修复建议"全部接入 Claude Code 工作流，开发者不再需要切到 Sentry UI 排查问题。
- ⚠️ 敏感数据：不要把 OpenAI key、用户录音全文、个人学习内容发到 Sentry。Sentry plugin 内置 PII 自动脱敏，但要再确认配置。

---

### 4.6 P3 #22 — 结构化日志（Pino / Winston）

**严重度：** 🟢 低 · **预计工时：** ~半天

#### 推荐组合

直接代码改动 + `simplify` skill。无专门 skill 推荐。建议：

- 在所有 API 路由统一用 Pino（轻量）
- 关键字段：`route`、`userId`、`status`、`duration`、`error_code`
- 不记录敏感字段：`transcript`、`answer` 全文、用户录音 URL

---

### 4.7 P3 #23 — TypeScript 渐进迁移

**严重度：** 🟡 中等 · **预计工时：** ~1–2 月（渐进）

#### 推荐组合

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. 设计迁移路径 | **`Plan` agent** | 从 `lib/data.js` 和 API 路由开始的渐进策略；何时启用 `strict: true` |
| 2. 类型定义参考 | 社区 skill：[mastering-typescript-skill](https://github.com/SpillwaveSolutions/mastering-typescript-skill) | 企业级 TS 模式 + React/NestJS 集成模式 |
| 3. React 现代化 | 社区 skill：react-modernization | 从类组件到 hooks（本项目已全部是 hooks，可跳过此步） |
| 4. 实施 | 直接代码改动 | `tsconfig.json` + `allowJs: true` 渐进迁移；先迁 `lib/data.js` 和最小 API 路由 |
| 5. 验证 | **`verify`** skill + **`Bash`** | `npx tsc --noEmit` 通过 + 应用功能不变 |

#### 关键说明

- ✅ 1improve.md §8 已给出了 4 个核心类型定义（`Question`、`ScoreResult`、`OfficerVoice` 等），可直接复用作为迁移起点。
- ⚠️ 不要一次性切换；保持 `allowJs: true` 让 `.js` 和 `.ts` 共存数月。

---

## 5. 阶段六 — 商业化（Stripe）

### 5.1 Stripe 集成

**严重度：** 🟡 中等（取决于产品节奏）· **预计工时：** ~1 周

#### 推荐组合

| 步骤 | 工具/技能 | 用法 |
|---|---|---|
| 1. 产品决策 | （用户决策） | 见 2gptimprove.md §8 的 5 个待确认问题（免费/PRO 边界、试用、优惠码等） |
| 2. Stripe MCP skill | [wrsmith108/stripe-mcp-skill](https://github.com/wrsmith108/stripe-mcp-skill) | **核心推荐。** 通过 MCP 直接在 Claude Code 内：创建 customer、订阅管理、invoice 操作、产品目录、文档搜索 —— 自然语言指令，无需手写 API 调用 |
| 3. 备选 skill | [mcpmarket.com 的 Stripe Payments Integration](https://mcpmarket.com/tools/skills/stripe-payments-integration-7) | 同类替代 |
| 4. Checkout + Webhook | **`Plan` agent** | 设计 Checkout flow + Webhook 幂等性 + 与 `profiles.plan` 字段同步 |
| 5. 权限拦截 | **`security-review`** skill | 在 middleware 或页面层保护 PRO 功能（如 `/drive`）后跑一次安全审查 |
| 6. 验证 | **`verify`** skill + Stripe 测试卡 | 模拟支付 → 看 `profiles.plan` 是否更新 → 取消订阅 → 看权限是否降级 |

#### 关键说明

- ⚠️ Webhook 必须幂等（同一事件可重复调用不出错），这是 2gptimprove.md §8 的验收标准。
- ✅ 使用 Stripe 测试模式 + Stripe CLI 转发 webhook 到本地，比起真实部署再测试快很多。

---

## 6. 综合应用建议（下一批工作的 skill 组合包）

按 2improve.md §9 推荐的优先级顺序：

### 6.1 第一批（最高杠杆、低成本）

> 历史进度加载 + 语言偏好持久化

| 阶段 | 推荐 skill 组合 |
|---|---|
| 设计 | `Plan` agent（一次性出 `useLang` + `useProgress` 双 hook 接口） |
| 实施 | 直接代码改动 |
| 自审 | `simplify` skill |
| 验证 | `verify` skill |

**预计总耗时：** ~1.5 天

---

### 6.2 第二批（增长中的债务）

> i18n 集中化方案 A + `useRecorder` hook 抽取

| 阶段 | 推荐 skill 组合 |
|---|---|
| 探索 | `Explore` agent（找出 i18n 散布点 + 三处 MediaRecorder 重复） |
| 设计 | `Plan` agent |
| 实施 | 直接代码改动 + 可选 `general-purpose` agent 批量迁移翻译 |
| 自审 | `simplify` skill |
| 验证 | `verify` skill |

**预计总耗时：** ~3 天

---

### 6.3 第三批（工程化复利）

> 首个单元测试 + Prettier + Sentry plugin 集成

| 阶段 | 推荐 skill 组合 |
|---|---|
| Vitest 设置 | 直接代码改动（参考 `trailofbits/testing-handbook-skills` 模式） |
| `scoreKeywords` 测试 | 直接代码改动 |
| Prettier | 直接代码改动 + `update-config` skill 配置 hook |
| Sentry | **Sentry 官方 plugin**（claude.com/plugins/sentry）+ `verify` skill |

**预计总耗时：** ~2 天

---

### 6.4 第四批（中期）

> 组件库拆分 + i18n 集中化方案 B（next-intl，仅当确实需要 URL 前缀或 SSR 翻译时）

| 阶段 | 推荐 skill 组合 |
|---|---|
| 探索 | `Explore` agent |
| 设计 | `Plan` agent |
| 视觉 | `frontend-design` skill（明确 prompt：保留 CSS variables） |
| 实施 | 直接代码改动 |
| 自审 | `simplify` skill |
| 集成验证 | `verify` skill + `webapp-testing` skill（Playwright） |

**预计总耗时：** ~1–2 周

---

### 6.5 第五批（长期）

> TypeScript 迁移 + CI + 全面 E2E

| 阶段 | 推荐 skill 组合 |
|---|---|
| TS 设计 | `Plan` agent + `mastering-typescript-skill`（社区） |
| CI 模板 | `callstackincubator/github` skill（社区） |
| E2E 全面 | `webapp-testing` skill（Anthropic 官方） |
| 监控 | Sentry plugin（已在第三批完成基础） |

---

### 6.6 商业化（产品决策后）

| 阶段 | 推荐 skill 组合 |
|---|---|
| 产品边界 | 用户决策 |
| Stripe 集成 | `stripe-mcp-skill`（MCP）+ `Plan` agent 设计 webhook 幂等性 |
| 权限审查 | `security-review` skill |
| 验证 | `verify` skill + Stripe 测试卡 |

---

## 7. 风险与注意事项

### 7.1 skill 引入风险

| 风险 | 应对 |
|---|---|
| 社区 skill 质量参差不齐 | 优先 Anthropic 官方（17 个）和官方 plugin。社区 skill 先 fork / 本地化验证后再用。 |
| skill 推荐技术栈与本项目不匹配（如 Tailwind） | prompt 中明确"保留现有 CSS variables 体系"。`frontend-design` 尤其需注意。 |
| MCP server 引入额外依赖 / 维护成本 | 评估前先看 issue 数 + 最近提交。Stripe 官方 MCP > 第三方 wrapper。 |
| skill 内置 PII 行为不可控 | 在 Sentry plugin 等接入前手工核对 scrub 规则；不传输录音全文。 |

### 7.2 优先级原则

1. **官方 > 社区**：Anthropic 17 个官方 skill 优先使用。
2. **内置 > 安装**：Claude Code 自带的 `simplify` / `verify` / `Plan` / `Explore` 是零成本的杠杆点。
3. **小步 > 大爆炸**：每个 skill 引入后先用最小 case 验证，再扩大范围。
4. **可回滚 > 不可回滚**：所有 skill 推荐的方案都必须可以 `git checkout` 回滚。

---

## 8. 速查：开放问题 → 推荐 skill 一表

| 开放问题（来自 2improve.md） | 严重度 | 首选 skill / 方法 | 备选 |
|---|---|---|---|
| 语言偏好持久化（P1 #8） | 🟡 | `Plan` + 直接实施 + `verify` | — |
| 历史进度加载（P1 #9） | 🟡 | `Plan` + 直接实施 + `verify` | — |
| 统一用户反馈（P1 #10） | 🟡 | `frontend-design` + `verify` | — |
| lint 脚本校验（P1 #11） | 🟢 | 直接 `npm run lint` | — |
| `useRecorder` hook（P2 #12） | 🟡 | `Explore` + `Plan` + `simplify` + `verify` | — |
| `useScoring` hook（P2 #13） | 🟡 | 同上 | — |
| `useProgress` hook（P2 #14） | 🟡 | 同上 | — |
| 组件库拆分（P2 #15） | 🟡 | `Explore` + `frontend-design` + `simplify` + `verify` | `vercel-labs/composition-patterns` |
| i18n 集中化方案 A（P2 #16） | 🔴 | `Explore` + `Plan` + `general-purpose` + `verify` | — |
| i18n 方案 B（next-intl） | 🔴 | `Plan` + `next-intl-localization` 社区 skill + `webapp-testing` | — |
| 设备限制策略（Phase 4） | ⚪ 待决策 | `Plan` + `security-review`（决策后） | — |
| Prettier（P3 #17） | 🟢 | 直接实施 + `update-config` | — |
| 单元测试（P3 #18） | 🟡 | 直接实施（Vitest）+ `trailofbits/testing-handbook` | — |
| E2E 测试（P3 #19） | 🟡 | **`webapp-testing`** + `verify` | `openai/playwright` |
| CI 流水线（P3 #20） | 🟡 | `callstackincubator/github` + 直接实施 | — |
| 错误监控（P3 #21） | 🟡 | **Sentry 官方 plugin** | `sentry-cli-integration` |
| 结构化日志（P3 #22） | 🟢 | 直接实施 + `simplify` | — |
| TypeScript 迁移（P3 #23） | 🟡 | `Plan` + `mastering-typescript-skill` + `verify` | `react-modernization` |
| Stripe 商业化（Phase 6） | ⚪ 待决策 | **`stripe-mcp-skill`** + `security-review` + `verify` | mcpmarket Stripe skill |

---

## 9. 一段话总结

本项目当前最高 ROI 的"skill 杠杆点"集中在四个方向：**(1)** 用 `Plan` agent 在每次重构前先出方案、避免边写边想；**(2)** 安装 **Sentry 官方 plugin**，让生产错误监控+分析+修复建议都进入 Claude Code 工作流；**(3)** 用 **`webapp-testing`** skill 建立第一条 E2E 测试，覆盖核心训练路径；**(4)** 长期视角下用 **`stripe-mcp-skill`** 完成商业化、用 **`mastering-typescript-skill`** 完成 TypeScript 渐进迁移。所有的"小修小补"任务（i18n 提取、hook 抽取、组件库）都首选 `Explore` → 直接实施 → `simplify` → `verify` 的内置链路，**不需要安装任何第三方 skill**。社区 skill 仅在涉及外部生态（Stripe、Sentry、Playwright、next-intl、TypeScript 模式）时才引入，且必须先小规模验证再扩展。

---

## 参考资源

- [github.com/anthropics/skills](https://github.com/anthropics/skills) — 官方 17 个 skill
- [claude.com/plugins](https://claude.com/plugins) — Anthropic 官方 plugin 目录（含 Sentry）
- [claudemarketplaces.com](https://claudemarketplaces.com/) — 6700+ skill 社区聚合
- [github.com/VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) — 1000+ skill 整理仓库
- [github.com/alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) — 329 个 skill 大合集
- [github.com/wrsmith108/stripe-mcp-skill](https://github.com/wrsmith108/stripe-mcp-skill) — Stripe MCP
- [github.com/SpillwaveSolutions/mastering-typescript-skill](https://github.com/SpillwaveSolutions/mastering-typescript-skill) — TS 迁移
- [next-intl.dev/blog/use-extracted](https://next-intl.dev/blog/use-extracted) — next-intl 提取 hook 模式

---

## 10. 可靠性评级（1–5 分，5 = 最可靠）

> **追加日期：** 2026-05-27
> **评级方法学：** 综合判断 (1) 维护方身份（官方 vs 个人）、(2) GitHub 星数/最近活跃度/提交频率、(3) 文档完整度、(4) 与本项目技术栈匹配度、(5) 真实生产案例。

### 10.1 评分定义

| 分值 | 含义 | 使用建议 |
|---|---|---|
| **5 ⭐⭐⭐⭐⭐** | Anthropic 官方维护、长期支持、文档完整、广泛应用 | 可放心使用；首选 |
| **4 ⭐⭐⭐⭐** | 知名公司/团队维护、活跃、有真实案例（如 Vercel Labs、OpenAI、Trail of Bits） | 推荐使用；引入前快速浏览仓库即可 |
| **3 ⭐⭐⭐** | 社区维护但底层技术成熟（如 next-intl、Sentry CLI 本身可靠），skill 仅作为薄封装 | 可用，但建议优先看官方文档而非 skill 内容 |
| **2 ⭐⭐** | 单个个人维护、星数少、活跃度低，需自己阅读源码后再用 | 慎用；优先寻找官方替代 |
| **1 ⭐** | 仓库几乎无活动、文档缺失、或与项目栈完全不匹配 | 不推荐 |
| **N/A** | 聚合目录（不是 skill 本身），不参与评分 | 用作发现入口 |

---

### 10.2 Anthropic 官方 17 个 skill —— 评级

| Skill | 评级 | 说明 |
|---|---|---|
| **frontend-design** | 5 ⭐⭐⭐⭐⭐ | Anthropic 官方维护，SKILL.md 详尽，强调 production-grade UI 输出。⚠️ 默认偏向 Tailwind，使用时需 prompt 明确"保留 CSS variables" |
| **webapp-testing** | 5 ⭐⭐⭐⭐⭐ | 官方 Playwright 自动化 skill，自带 `with_server.py` 管理 server 生命周期，模式成熟（reconnaissance-then-action） |
| **skill-creator** | 5 ⭐⭐⭐⭐⭐ | 官方元工具，支持迭代式 skill 开发 + 评估框架，适合为本项目定制 skill |
| **mcp-builder** | 5 ⭐⭐⭐⭐⭐ | 官方四阶段 MCP 开发指南；仅当需要自定义 MCP 时使用 |
| **claude-api** | 5 ⭐⭐⭐⭐⭐ | 官方，Anthropic SDK 集成/迁移/缓存优化指导 |
| **doc-coauthoring** | 5 ⭐⭐⭐⭐⭐ | 官方，本项目用不上 |
| **theme-factory** | 5 ⭐⭐⭐⭐⭐ | 官方，本项目用不上 |
| **web-artifacts-builder** | 5 ⭐⭐⭐⭐⭐ | 官方，本项目用不上 |
| **brand-guidelines / canvas-design / algorithmic-art / docx / pdf / pptx / xlsx / internal-comms / slack-gif-creator** | 5 ⭐⭐⭐⭐⭐ | 官方质量；与本项目无关 |

**结论：** Anthropic 17 个 skill 全部 5 星可靠性。相关性高的是 `frontend-design`、`webapp-testing`、`skill-creator`、`mcp-builder` 这 4 个。

---

### 10.3 Claude Code 内置 skill —— 评级

所有内置 skill 由 Anthropic 随 Claude Code CLI 一起分发，与产品版本同步，**全部 5 星**。

| Skill | 评级 | 说明 |
|---|---|---|
| **simplify** | 5 ⭐⭐⭐⭐⭐ | 适用所有重构任务 |
| **verify** | 5 ⭐⭐⭐⭐⭐ | 浏览器内验证改动，UX 修复必备 |
| **review** | 5 ⭐⭐⭐⭐⭐ | PR 自审标准动作 |
| **security-review** | 5 ⭐⭐⭐⭐⭐ | 当前分支安全审查 |
| **run** | 5 ⭐⭐⭐⭐⭐ | 启动应用查看改动效果 |
| **update-config** | 5 ⭐⭐⭐⭐⭐ | settings.json / hooks 配置 |
| **init** | 5 ⭐⭐⭐⭐⭐ | CLAUDE.md 初始化 |
| **fewer-permission-prompts** | 5 ⭐⭐⭐⭐⭐ | 权限 allowlist 优化 |
| **keybindings-help / loop / schedule / claude-api** | 5 ⭐⭐⭐⭐⭐ | 官方分发 |

---

### 10.4 内置 agent 类型 —— 评级

| Agent | 评级 | 说明 |
|---|---|---|
| **Plan** | 5 ⭐⭐⭐⭐⭐ | 复杂重构前的标准动作 |
| **Explore** | 5 ⭐⭐⭐⭐⭐ | 只读快速搜索 |
| **general-purpose** | 5 ⭐⭐⭐⭐⭐ | 多步骤研究 |
| **claude-code-guide** | 5 ⭐⭐⭐⭐⭐ | Claude Code 自身问题答疑 |
| **statusline-setup** | 5 ⭐⭐⭐⭐⭐ | 状态栏配置 |

---

### 10.5 Anthropic 官方 plugin —— 评级

| Plugin | 评级 | 说明 |
|---|---|---|
| **Sentry plugin**（claude.com/plugins/sentry）| 5 ⭐⭐⭐⭐⭐ | 由 Anthropic + Sentry 联合维护。Sentry 是行业标准错误监控工具，2026 年估值 $10B+。功能完整：错误访问、模式识别、根因建议、`/seer` 自然语言查询、issue-summarizer agent、PR 自动修复 |

---

### 10.6 社区 skill —— 评级（重要差异）

#### Stripe 集成（⚠️ 上文推荐有更新）

| 资源 | 评级 | 说明 |
|---|---|---|
| **Stripe 官方 MCP 服务器（mcp.stripe.com）** | 5 ⭐⭐⭐⭐⭐ | **首选。** Stripe 公司亲自维护的远程 MCP server，OAuth 认证 |
| **`@stripe/mcp` 本地 server** | 5 ⭐⭐⭐⭐⭐ | 官方 npm 包：`npx -y @stripe/mcp --api-key=YOUR_KEY` |
| **`@stripe/agent-toolkit`** | 5 ⭐⭐⭐⭐⭐ | 官方 SDK（Python + TypeScript），集成 OpenAI Agent SDK、LangChain、CrewAI、Vercel AI SDK |
| **stripe/ai 仓库** | 5 ⭐⭐⭐⭐⭐ | Stripe 官方 AI 工具汇总 |
| ~~wrsmith108/stripe-mcp-skill~~ | **1 ⭐** | **⚠️ 上文 §5.1 错误推荐。实测仅 1 星 + 1 个 commit，几乎无维护。强烈建议改用上面 4 个官方资源。** |

> 📌 **修正：** §5.1 表格中"核心推荐"的 stripe-mcp-skill 应替换为 **`@stripe/mcp` 官方包** 或 Stripe 远程 MCP server（mcp.stripe.com）。

#### TypeScript / React 现代化

| 资源 | 评级 | 说明 |
|---|---|---|
| **SpillwaveSolutions/mastering-typescript-skill** | 3 ⭐⭐⭐ | 单一个人/组织维护，未验证星数。声称"企业级"，但需自行 review 内容。TS 迁移本身有大量官方文档，skill 价值在于"为 Claude 提供项目特定模式" |
| **react-modernization**（mcpmarket） | 2 ⭐⭐ | mcpmarket 聚合 skill，质量未验证。React 19 + hooks 是现成生态，官方 docs 已经足够好 |
| **React & TypeScript Refactoring**（mcpmarket） | 2 ⭐⭐ | 同上 |

> 建议：**TypeScript 迁移直接看 [Next.js TypeScript 官方指南](https://nextjs.org/docs/app/api-reference/config/typescript) + 1improve.md §8 给出的类型定义模板即可**，不必依赖第三方 skill。

#### Next.js / React 模式

| 资源 | 评级 | 说明 |
|---|---|---|
| **vercel-labs/next-best-practices** | 4 ⭐⭐⭐⭐ | Vercel Labs 维护，Vercel 是 Next.js 公司，权威性高 |
| **vercel-labs/react-best-practices** | 4 ⭐⭐⭐⭐ | 同上 |
| **vercel-labs/composition-patterns** | 4 ⭐⭐⭐⭐ | 同上 |

#### i18n

| 资源 | 评级 | 说明 |
|---|---|---|
| **next-intl-localization**（mcpmarket） | 3 ⭐⭐⭐ | 聚合 skill；底层的 [next-intl 官方文档](https://next-intl.dev) 极完整，建议直接看官方文档而非依赖 skill |
| **internationalization-localization-2**（mcpmarket） | 2 ⭐⭐ | 通用 i18n skill，质量未验证 |

#### 测试

| 资源 | 评级 | 说明 |
|---|---|---|
| **openai/playwright** | 4 ⭐⭐⭐⭐ | OpenAI 团队发布，可信。功能与 Anthropic `webapp-testing` 重叠，建议优先用 Anthropic 官方 |
| **trailofbits/testing-handbook-skills** | 4 ⭐⭐⭐⭐ | Trail of Bits 是知名安全/测试咨询公司，方法论可信 |
| **microsoft/azure-microsoft-playwright-testing-ts** | 4 ⭐⭐⭐⭐ | Microsoft 官方，但偏向 Azure 云测试基础设施，本项目用不上 |

#### CI/CD

| 资源 | 评级 | 说明 |
|---|---|---|
| **callstackincubator/github** | 4 ⭐⭐⭐⭐ | Callstack 是知名 React Native 咨询公司，GitHub workflow 模式可信 |

#### Sentry（社区版本）

| 资源 | 评级 | 说明 |
|---|---|---|
| **sentry-cli-integration**（mcpmarket） | 3 ⭐⭐⭐ | Sentry CLI 本身可靠，skill 仅作为薄封装。建议用 §10.5 的 Anthropic 官方 Sentry plugin 替代 |
| **Sentry Error Monitoring skill** | 3 ⭐⭐⭐ | 同上 |

#### 大型聚合仓库 / 个人 mega-collections

| 资源 | 评级 | 说明 |
|---|---|---|
| **alirezarezvani/claude-skills**（329 个 skill 合集） | 2 ⭐⭐ | 单人维护的 mega-collection，质量参差。可用作灵感来源，但不建议成批引入 |
| **canatufkansu/claude-skills** | 2 ⭐⭐ | 单人维护，需逐一审视 |
| **secondsky/claude-skills** | 3 ⭐⭐⭐ | 小型聚焦合集（Cloudflare、React、Tailwind v4），针对性更好 |
| **blencorp/claude-code-kit** | 3 ⭐⭐⭐ | 包含 tailwindcss 等 kits，但本项目不用 Tailwind |

---

### 10.7 目录类资源（N/A — 不评分，仅作发现入口）

| 资源 | 用途 |
|---|---|
| **VoltAgent/awesome-agent-skills** | 1000+ skill 目录，跨平台兼容（Codex、Cursor、Gemini CLI） |
| **claudemarketplaces.com** | 6700+ skill / 2500+ marketplace / 840+ MCP server 目录 |
| **agentskill.club** | 3640+ 免费 open-source skill |
| **mcpmarket.com** | MCP server + skill 聚合 |
| **lobehub.com/skills** | skill 浏览市场 |

> **使用建议：** 这些目录适合用来"找有没有 X 类 skill"。找到后，**必须**点入仓库验证维护状态、star 数、最近 commit，再决定是否引入。

---

### 10.8 评分使用指南

#### 在本项目中的推荐安装序

按"性价比 × 可靠性"排序，建议立即引入的：

1. **Sentry 官方 plugin**（5 星）— 一次安装，覆盖所有错误监控需求
2. **Anthropic `webapp-testing` skill**（5 星）— 第一条 E2E 测试的基础
3. **Stripe 官方 MCP**（5 星，`mcp.stripe.com` 或 `@stripe/mcp`）— 商业化阶段唯一推荐
4. **Anthropic `frontend-design` skill**（5 星）— 组件库拆分阶段使用，但 prompt 中强调 "保留 CSS variables"
5. **Anthropic `skill-creator` skill**（5 星）— 若决定为本项目（如 CDL 路检术语）定制专属 skill 时使用

#### 建议**避免**或**先验证**的：

| 资源 | 原因 |
|---|---|
| ~~wrsmith108/stripe-mcp-skill~~ | 1 星，1 commit，几乎无维护。改用官方 Stripe MCP |
| mcpmarket 上各种通用 skill | 多为薄封装，底层官方文档更可靠 |
| 个人 mega-collections（alirezarezvani、canatufkansu） | 数量大但质量不一，逐一审视成本高 |

#### 通用原则

1. **官方 ≥ 知名公司团队 > 个人 skill**：Anthropic 官方、Vercel Labs、OpenAI、Trail of Bits、Microsoft、Stripe 自家维护的优先。
2. **薄封装 skill 不如直接读官方文档**：next-intl、Stripe API、Sentry 都有极好的官方文档，skill 价值在于"为 AI 提供项目上下文模板"，不是替代文档。
3. **MCP server 引入需额外评估维护成本**：每个外部 MCP 都是一个外部依赖；除了 Stripe / Sentry 这种生产关键的，其他能用文档解决就别引入 MCP。
4. **小步验证**：任何引入新 skill，先用最小 case 跑一遍，确认输出符合本项目编码规范（CSS variables、纯 JS、不引入 Tailwind）后再扩大使用。

---

### 10.9 速查 —— 评级总表

| 类别 | 资源 | 评级 |
|---|---|---|
| Anthropic 官方 skill | 全部 17 个 | **5** ⭐⭐⭐⭐⭐ |
| Claude Code 内置 skill | simplify / verify / review / security-review / run / init / update-config / 等 | **5** ⭐⭐⭐⭐⭐ |
| 内置 agent | Plan / Explore / general-purpose / claude-code-guide / statusline-setup | **5** ⭐⭐⭐⭐⭐ |
| Anthropic 官方 plugin | Sentry plugin | **5** ⭐⭐⭐⭐⭐ |
| Stripe 官方 | mcp.stripe.com / @stripe/mcp / @stripe/agent-toolkit / stripe/ai | **5** ⭐⭐⭐⭐⭐ |
| 知名公司 skill | vercel-labs/* / openai/playwright / trailofbits/* / callstackincubator/github | **4** ⭐⭐⭐⭐ |
| 薄封装社区 skill（底层成熟） | next-intl-localization / sentry-cli-integration / mastering-typescript-skill | **3** ⭐⭐⭐ |
| mcpmarket 通用 skill | react-modernization / internationalization-localization-2 | **2** ⭐⭐ |
| 单人 mega-collections | alirezarezvani / canatufkansu / blencorp / secondsky | **2** ⭐⭐ |
| **⚠️ 不推荐** | wrsmith108/stripe-mcp-skill | **1** ⭐ |
| 目录/聚合站 | VoltAgent / claudemarketplaces / mcpmarket / agentskill.club | N/A |
