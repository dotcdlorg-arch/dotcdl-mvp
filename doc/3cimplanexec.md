# 3cimplanexec.md — 今日（2026-05-27）执行排程

> **生成日期：** 2026-05-27
> **依据：** [`doc/2implan.md`](2implan.md) §11 工时表 + [`doc/skillsavi.md`](skillsavi.md) §6 技能组合包
> **目标：** 在今天一个工作日内（约 6–7 小时有效编码时间），完成 2implan.md 中 **PR2（#8 语言持久化）+ 启动 PR1（#14 + #9 进度加载）**，按"高 ROI / 低风险优先"原则推进。
> **执行原则：** CLAUDE.md §1–§4（思考先于编码 / 极简 / 外科手术式改动 / 目标驱动）+ AGENTS.md。

---

## 0. 今日任务概览

| 序号 | PR | 对应项 | 预计耗时 | 风险 | 用户可见收益 |
|---|---|---|---:|---|---|
| **T1** | PR2 | P1 #8 — 语言偏好持久化（`useLang` + `LanguageProvider` + `localStorage`） | 3–4h | 🟢 低 | 切换语言后刷新/跨页面跳转都保持 |
| **T2** | PR1 | P1 #14 + #9 合并 — `useProgress` hook + `/api/progress` 挂载时加载 | 3–4h | 🟢 低 | 已登录用户重新打开 `/practice` 和 `/signs` 时侧边栏统计与状态徽章正确恢复 |
| T3（如有余时） | — | 为 PR3（#10 toast 系统）画一份组件设计草图 + 列出所有 `alert()` 调用位置 | <1h | 🟢 低 | 为明天提速 |

**为什么是这两项？**

1. **风险全部 🟢 低**：单日内闭环，不会留下"半成品"过夜（CLAUDE.md §2 "Simplicity First" + AGENTS.md "no half-finished implementations"）。
2. **2implan.md §9.1 已建议把 #14 + #9 合并成一个 PR**，避免双重脚手架。
3. **PR2 与 PR1 互不依赖**：可以顺序提交两个独立 PR，任何一个出问题不会卡住另一个。
4. **跳过的高风险项**：#12（`useRecorder`，🔴 iOS 回归风险）、#16（i18n，体量大）、#15 Phase C（QuestionCard 拆分）—— 都需要独立深度验证，不适合塞进首日。

---

## 1. 今日时间表（建议）

| 时段 | 任务 | 关键产出 |
|---|---|---|
| 09:00–09:30 | **准备：** 跑 `git status` / `npm run build` 确认基线干净；同步读 [`app/practice/page.js`](../app/practice/page.js) 第 290 行附近、[`components/AppShell.js`](../components/AppShell.js) 的 `setLang` 用法 | 基线确认 |
| 09:30–12:30 | **T1：PR2 — 语言持久化**（详见 §2） | 1 个新文件 + 6 个页面改动 + 1 次 `npm run build` 通过 |
| 12:30–13:30 | 午餐 + `verify` skill 验证 T1 | 6 种语言 × 跨页面切换均保持 |
| 13:30–17:00 | **T2：PR1 — 进度加载**（详见 §3） | 1 个 hook + 2 页面改动 + 真实数据回归测试通过 |
| 17:00–17:30 | T3：为 #10 toast 列出落点 + 简短笔记 | `grep alert\\( app/` 结果 + 设计草稿 |
| 17:30 | 收尾、提交、写 `doc/4claudelog7.md` 记录 | 两个 git commit + 日志 |

---

## 2. T1 — PR2：P1 #8 语言偏好持久化（详细步骤）

### 2.1 目标

- 在任意页面切换语言后：**刷新页面** 或 **跨页面跳转** 都保持当前语言。
- 不引入 `next-intl`（参见 [`doc/skillsavi.md`](skillsavi.md) §1.1）。

### 2.2 技能组合

按 [`doc/skillsavi.md`](skillsavi.md) §6.1 第一批推荐：

| 阶段 | 技能 | 用法 |
|---|---|---|
| 设计 | **`Plan` agent**（5 ⭐） | 仅当方案不明时调用；当前 2implan.md §2 已给出完整方案，**可跳过**。 |
| 实施 | 直接代码改动（Edit / Write） | 见下文 §2.3 步骤 |
| 自审 | **`simplify` skill**（5 ⭐） | 提交前跑一次，确认无过度抽象 |
| 验证 | **`verify` skill**（5 ⭐） | 启动 dev server，浏览器手工切换语言 + 刷新 + 跨页 |

### 2.3 实施步骤

> 文件路径全部相对项目根。

1. **新建** [`lib/lang-context.js`](../lib/lang-context.js)：
   - `'use client'` 声明
   - `LanguageProvider`：`useState('zh')` 初始；`useEffect` 内从 `localStorage.getItem('cdl-lang')` 读取并校验在 LANGS allowlist 中
   - `setLang` 写 state + `localStorage.setItem('cdl-lang', value)`（try/catch 包裹，Safari 隐私模式会抛错）
   - 导出 `useLang()`，未在 Provider 内使用时 `throw new Error('useLang must be used within LanguageProvider')`
   - **SSR 注意**：服务端始终用 `'zh'` 初始，客户端 `useEffect` 后再 hydrate；不会触发 React hydration mismatch
2. **修改** [`app/layout.js`](../app/layout.js)：
   - 在 `<ClerkProvider>` 内、`<body>` 内层包一层 `<LanguageProvider>`
3. **修改** 6 个页面，把 `const [lang, setLang] = useState('zh')` 替换为 `const { lang, setLang } = useLang()`：
   - [`app/practice/page.js`](../app/practice/page.js)（约第 290 行）
   - [`app/mock/page.js`](../app/mock/page.js)（约第 262 行）
   - [`app/drive/page.js`](../app/drive/page.js)（约第 206 行）
   - [`app/signs/page.js`](../app/signs/page.js)（约第 52 行）
   - [`app/terms/page.js`](../app/terms/page.js)（约第 143 行）
   - [`app/page.js`](../app/page.js)（landing）
4. **不要改** [`components/AppShell.js`](../components/AppShell.js) 的 `setLang` prop 签名 —— prop 继续从页面传入，hook 内部细节对 AppShell 透明。
5. **运行** `npm run build` 验证编译通过。
6. **`verify` skill 验证**：
   - 在 `/practice` 选 `Español` → 硬刷新 → 仍是西班牙语
   - 在 `/practice` 选 `Tiếng Việt` → 跳到 `/signs` → 仍是越南语
   - 打开 DevTools → Application → Local Storage → 有 `cdl-lang` 键

### 2.4 风险与守则

- **SSR hydration mismatch**：用 "服务端默认 + 客户端 useEffect 异步 hydrate" 标准模式（已在 2implan.md §2 第 3 点写明）。在 Provider 文件加一行注释说明，避免未来 dev "好心修回去"。
- **CLAUDE.md §3（外科手术式改动）**：只动 6 处 `useState('zh')`，不要顺手"美化"相邻代码。
- **预计行数**：+50 (provider) / −6 (六个页面一行)，净 +44 行。

### 2.5 提交

```bash
git add lib/lang-context.js app/layout.js app/practice/page.js app/mock/page.js \
        app/drive/page.js app/signs/page.js app/terms/page.js app/page.js
git commit -m "feat(lang): persist language preference via Context + localStorage (P1 #8)"
```

---

## 3. T2 — PR1：P1 #14 + #9 进度加载（详细步骤）

### 3.1 目标

- 已登录用户重新打开 `/practice` 或 `/signs`：
  - 侧边栏统计（seen / understood / review / avgScore）显示真实历史，而非全 0
  - 已答题状态徽章正确恢复
- 保留**乐观更新**语义：`markStatus` 仍然同步写本地状态，POST 后台异步进行。

### 3.2 技能组合

按 [`doc/skillsavi.md`](skillsavi.md) §6.1：

| 阶段 | 技能 | 用法 |
|---|---|---|
| 设计 | **`Plan` agent**（5 ⭐） | 2implan.md §7 已给完整方案，**可跳过** |
| 实施 | 直接代码改动 | 见 §3.3 |
| 自审 | **`simplify` skill**（5 ⭐） | 防止 hook 过度泛化（参数列表最小） |
| 验证 | **`verify` skill**（5 ⭐） | 真实账号 + DevTools Network 看 GET `/api/progress` 只触发一次 |

### 3.3 实施步骤

1. **新建** [`hooks/useProgress.js`](../hooks/useProgress.js)：
   - 签名：`useProgress({ type })` → `{ progress, stats, loading, markQuestion, markSign }`
   - `useEffect` 挂载时调用 `fetch('/api/progress', { credentials: 'same-origin' })`
   - **401 静默无 op**（匿名用户路径不破）；**5xx** 仅 `console.warn`（toast 留给 PR3）
   - **响应整形**：服务端返回数组 → 整形为 `{ [code]: { status, score, transcript, viewCount: 1 } }`
   - **合并保护**：若挂载时本地 `progress` 已有 key（来自快速点击的乐观写），保留本地值
   - `markQuestion(code, status, score, transcript)`：先 `setProgress`（同步乐观），再 `fetch('/api/progress', { method: 'POST', ... })`，失败 `console.warn`
   - `stats`：`useMemo` 计算 `{ seen, total, understood, review, avgScore }`（从 [`app/practice/page.js`](../app/practice/page.js) 第 372–381 行原地搬移公式）
2. **改造** [`app/practice/page.js`](../app/practice/page.js)：
   - 删掉本地 `const [progress, setProgress] = useState({})`
   - 删掉本地 `saveProgress` 函数
   - 改造 `markStatus` 调用 `markQuestion`
   - `stats` 解构自 hook
3. **改造** [`app/signs/page.js`](../app/signs/page.js)：
   - 同上，但 `type: 'sign'`
   - 注意：signs 当前用的形状是 `{ [sign_code]: number }`，hook 内统一返回对象形状 `{ [sign_code]: { score } }`；signs 渲染处改取 `.score`
4. **不动** [`app/drive/page.js`](../app/drive/page.js)：drive 页只 POST 不显示进度。今日**先不引入** hook 到 drive，等 PR1 验证稳定后另起一次小提交（CLAUDE.md §3 外科手术式改动）。
5. **加载守卫**：在 hook `loading=true` 期间，practice/signs 的侧边栏统计区域可以不渲染或显示骨架；为防止 0/0 闪烁，可加 `loading || stats.seen === 0` 时不渲染数字，等 800ms 后再 fallback 显示 0。
6. **`npm run build` 验证编译通过**。
7. **`verify` skill 验证**：
   - 登录 → `/practice` → 答 3 题 → 标 2 个 "understood" → 硬刷新 → 侧边栏 seen=3 / understood=2
   - 登出 → `/practice` → 页面正常显示题目，无 401 提示
   - DevTools Network：每次进入页面 GET `/api/progress` 恰好 1 次

### 3.4 风险与守则

- **乐观更新回归是最高风险**：必须先 `setProgress(...)` 同步更新，再 `fetch` POST。**绝不**在 `setProgress` 之前 `await` POST（2implan.md §7 风险点）。在 DevTools 节流为 "Slow 3G" 下点击 understood，UI 必须 <100ms 内变化。
- **挂载时的 GET 与快速点击的竞态**：用 §3.3 第 1 点最后子项的合并保护防御。
- **关键文件提醒**：`hooks/` 目录此前不存在，今日首次创建。
- **预计行数**：+100 (hook)，−60 (两页面去掉的内联 useState/saveProgress)，净 +40。

### 3.5 提交

```bash
git add hooks/useProgress.js app/practice/page.js app/signs/page.js
git commit -m "feat(progress): add useProgress hook with GET-on-mount hydration (P1 #14 + #9)"
```

---

## 4. T3（如有余时） — PR3（#10 toast）侦察

### 4.1 目标

仅完成"侦察"：不写代码，只输出明天起步所需的清单。

### 4.2 步骤

1. `grep -rn "alert(" app/` → 列出所有 alert 调用位置（已知 `app/practice/page.js` 第 438、463 行）
2. `grep -rn "saveProgress" app/ | grep "catch"` → 列出所有 `.catch(() => {})` 静默失败位置
3. 在 [`doc/3cimplanexec.md`](3cimplanexec.md) §4.3 追加一份"明日 PR3 落点清单"
4. （可选）调用 **`frontend-design` skill**，让它给一份纯 CSS（**强调：项目用纯 CSS variables，禁止 Tailwind**）的 `<Toast>` + `<InlineAlert>` 样式草稿；但**今日不落地代码**，仅作为参考素材。

### 4.3 明日 PR3 落点清单（待 T3 填写）

> 占位。T3 执行时把 grep 结果写到这里。

---

## 5. 推荐使用的技能与 agent（今日清单汇总）

| 技能 / agent | 评级 | 今日用途 | 引用 |
|---|---|---|---|
| **`verify`** skill | 5 ⭐ | T1、T2 完成后浏览器手工验证 | [`skillsavi.md`](skillsavi.md) §10.3 |
| **`simplify`** skill | 5 ⭐ | T1、T2 提交前自审 | [`skillsavi.md`](skillsavi.md) §10.3 |
| **`run`** skill | 5 ⭐ | T1 启动 dev server | [`skillsavi.md`](skillsavi.md) §10.3 |
| **`Plan`** agent | 5 ⭐ | 不调用（2implan.md 已含设计） | — |
| **`Explore`** agent | 5 ⭐ | 不调用（路径已知） | — |
| **`frontend-design`** skill | 5 ⭐ | T3 可选侦察 toast 样式时用，**prompt 必须强调 "保留 CSS variables，禁止 Tailwind"** | [`skillsavi.md`](skillsavi.md) §10.2 |
| **`webapp-testing`** skill | 5 ⭐ | 今日不用（E2E 测试是 P3 阶段） | — |
| **Sentry plugin** | 5 ⭐ | 今日不用（属第三批） | — |

**今日明确不引入的资源**：所有社区 skill（2–3 ⭐评级）+ 任何 MCP server + `next-intl` 包 + Stripe / Sentry 集成。所有第三方依赖 0 新增。

---

## 6. 验收清单（今日收尾时核对）

- [ ] T1 完成：`lib/lang-context.js` 已创建；6 个页面 + `app/layout.js` 已改；`npm run build` 通过；浏览器 6 种语言切换 + 跨页面 + 刷新全部保持
- [ ] T1 已 commit（一个独立 commit）
- [ ] T2 完成：`hooks/useProgress.js` 已创建；`/practice` 和 `/signs` 已迁移；`/practice` 答题后刷新统计正确；Network 只发一次 GET
- [ ] T2 已 commit（一个独立 commit）
- [ ] 乐观更新未回归：Slow 3G 下点 "understood" UI <100ms 内变化
- [ ] [`doc/4claudelog7.md`](4claudelog7.md) 已追加今日 action 记录
- [ ] （可选）T3 侦察结果写入 §4.3

---

## 7. 风险预警

| 风险 | 概率 | 缓解 |
|---|---|---|
| SSR hydration mismatch（T1） | 中 | 服务端默认 `'zh'` + 客户端 `useEffect` hydrate；不要在 SSR 阶段访问 `localStorage` |
| 乐观更新回归（T2） | 高 | **`setProgress` 必须在 `await fetch` 之前**；DevTools Slow 3G 验证 |
| signs 页面进度形状变化（T2） | 中 | hook 统一返回对象形状；signs 渲染改一处 `progress[code]` → `progress[code]?.score` |
| 行数超出预算（任一） | 低 | CLAUDE.md §4 "if you write 200 lines and it could be 50, rewrite it" |
| iOS gesture 路径触碰 | 低 | 今日两个任务都不动 `MediaRecorder` / `unlockAudio()` 代码 |

---

## 8. 不在今日范围内（明确排除）

- ❌ P1 #10 toast 系统（明日 PR3）—— 仅做侦察（T3）
- ❌ P1 #11 lint 验证 —— 独立小任务，待空闲时段
- ❌ P2 #12 `useRecorder` —— 🔴 iOS 回归风险，需独立日 + 真机验证
- ❌ P2 #13 `useScoring` —— 必须在 #12 之后
- ❌ P2 #15 组件库拆分 —— 需先完成 #16 i18n
- ❌ P2 #16 i18n 集中化 —— 2 天工程量，跨日
- ❌ P3 全部（Prettier / 测试 / CI / Sentry / 日志 / TS）—— 长期分批
- ❌ 设备限制策略（需产品决策）
- ❌ Stripe 商业化（需产品决策）

---

## 9. 一句话总结

今日聚焦两个 🟢 低风险、用户立即可见的 PR：**先半天补齐"语言记住"，下午补齐"历史记住"**；不动任何与录音/iOS 手势/翻译表相关的高敏代码；所有改动都遵循"外科手术式 + 极简优先"。今日产出预期：**2 个独立 commit + 2 个可独立回滚的 PR + 1 份明日 toast 系统的侦察清单**。
