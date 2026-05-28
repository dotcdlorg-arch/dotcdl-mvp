# 32cimplanexec.md — 第一阶段执行排程（按 2implan.md 官方顺序）

> **生成日期：** 2026-05-27
> **依据文档：**
> - [`doc/2implan.md`](2implan.md) §9.1 PR 顺序建议 + §11 工时表
> - [`doc/skillsavi.md`](skillsavi.md) §6.1 第一批组合包 + §10 可靠性评级
> - [`doc/3cimplanexecAns.md`](3cimplanexecAns.md) 顺序审计结论（采纳 Option A：按官方顺序执行）
> **修订关键点：** 与 [`doc/3cimplanexec.md`](3cimplanexec.md) 相比，本排程**已修正 T1/T2 执行顺序** —— 按 2implan.md §9.1 明确建议，**PR1（#14 + #9 进度加载，标记为 critical-path user-visible win）置于最前**，PR2（#8 语言持久化）紧随其后。
> **执行原则：** [`CLAUDE.md`](../CLAUDE.md) §1–§4（思考先于编码 / 极简 / 外科手术式改动 / 目标驱动）+ [`AGENTS.md`](../AGENTS.md)。

---

## 0. 本阶段（"第一部分"）范围界定

**"第一部分" = 2implan.md §9.1 PR 序列中的前 2 个 PR**（合计 1.5 天，全部 🟢 低风险），即：

| 序号 | PR | 对应 2implan.md 条目 | 工时 | 风险 | 用户立即可见的收益 |
|---|---|---|---:|---|---|
| **PR1** | #14 + #9 合并 | `useProgress` hook + `/api/progress` 挂载加载 | 1.0 天 | 🟢 低 | 已登录用户在 `/practice` / `/signs` 刷新后看到真实学习历史与统计 |
| **PR2** | #8 | `LanguageProvider` + `localStorage` 持久化 | 0.5 天 | 🟢 低 | 语言选择跨刷新、跨页面保持 |

**为什么是这两项？**（CLAUDE.md §1 "State your assumptions"）

1. **2implan.md §9.1 明确推荐**：PR1 标注 "critical-path user-visible win"；PR2 紧随其后。
2. **2implan.md §11 工时表**：两项均 🟢 低风险，合计 ≤ 1.5 天，可在 1 个完整工作日内闭环（CLAUDE.md §2 "no half-finished implementations"）。
3. **可独立回滚**：两个 PR 互不依赖，任一回滚不影响另一项。
4. **跳过的高风险项**：#10 toast（依赖 #5、#6 抽取）、#12 useRecorder（🔴 iOS 回归风险）、#16 i18n（体量大、需 5 个 sub-PR）—— 全部留给后续阶段。

**先 PR1 后 PR2 的额外理由**（参见 [`doc/3cimplanexecAns.md`](3cimplanexecAns.md) §6）：

- 风险不对称：PR1 涉及 hook 设计 + 乐观更新语义保护，工程难度高于 PR2 → "趁脑力清醒先做硬的"。
- 用户价值不对称：PR1 是"已登录用户的核心痛点修复"（统计归零问题），优先级高于 PR2 的"语言记忆"便利性。

---

## 1. 时间表

| 时段 | 任务 | 关键产出 |
|---|---|---|
| 09:00–09:30 | **基线确认**：`git status` / `npm run build` 干净；同步阅读 [`app/api/progress/route.js`](../app/api/progress/route.js)、[`app/practice/page.js`](../app/practice/page.js) 第 372–381 行（stats 公式）、第 290 行（lang state）、[`app/signs/page.js`](../app/signs/page.js) 第 52、79 行 | 基线确认 + 待改文件熟悉 |
| 09:30–13:00 | **PR1：#14 + #9 进度加载**（详见 §2） | `hooks/useProgress.js` 新建 + practice/signs 改造 + 真实数据回归测试通过 |
| 13:00–14:00 | 午餐 + 用 **`verify` skill** 完整验证 PR1 | 6 项验收用例（§2.5）全部通过 |
| 14:00–17:00 | **PR2：#8 语言持久化**（详见 §3） | `lib/lang-context.js` 新建 + `app/layout.js` + 6 页面改造 |
| 17:00–17:30 | 用 **`verify` skill** 验证 PR2；写 [`doc/4claudelog7.md`](4claudelog7.md) action 记录 | 两个 commit + 日志条目 |
| 17:30–18:00 | （可选） **`simplify` skill** 对当日变更全量自审 | 防止意外抽象 / 死代码 |

---

## 2. PR1 —— P1 #14 + #9 进度加载（详细步骤）

### 2.1 目标（可验证）

- 已登录用户进入 `/practice` 或 `/signs` 时，自动 `GET /api/progress` 并把历史进度 hydrate 到本地 `progress` 状态。
- 侧边栏 `seen / understood / review / avgScore` 与状态徽章基于真实历史，而非全 0。
- **保留乐观更新语义**：`markStatus` 同步写本地状态，POST 后台异步（绝不能回退为"等 API"模式）。
- 401（未登录）静默 no-op，匿名用户路径不破。

### 2.2 技能组合（来自 [`doc/skillsavi.md`](skillsavi.md) §6.1）

| 阶段 | 技能 / agent | 评级 | 用法 |
|---|---|---|---|
| 设计 | **`Plan` agent** | 5 ⭐ | **可跳过** —— 2implan.md §7 已给完整接口设计（`useProgress({ type })` → `{ progress, stats, loading, markQuestion, markSign }`） |
| 探索 | **`Explore` agent** | 5 ⭐ | **可跳过** —— 关键行号已在 2implan.md §1、§7 明列 |
| 实施 | 直接代码改动（Edit / Write） | — | 见 §2.3 |
| 自审 | **`simplify` skill** | 5 ⭐ | 提交前跑一次，确认 hook 参数列表最小、无过度泛化 |
| 验证 | **`verify` skill** | 5 ⭐ | 真实账号 + DevTools Network 看 GET 只触发一次；Slow 3G 测乐观更新 |

**不引入**：任何第三方 skill / MCP server / 新 npm 依赖。

### 2.3 实施步骤

> 文件路径全部相对项目根。

1. **新建** [`hooks/useProgress.js`](../hooks/useProgress.js)：
   - **签名**：`useProgress({ type })` 其中 `type ∈ 'question' | 'sign'`
   - **返回**：`{ progress, stats, loading, markQuestion, markSign }`
   - **挂载时**：`useEffect(() => { fetch('/api/progress', { credentials: 'same-origin' }) }, [])`
     - 服务端返回 `{ questionProgress: [...], signProgress: [...], recentMocks: [...] }`
     - 整形为键控对象：`{ [code]: { status, score, transcript, viewCount: 1 } }`
     - **401 静默** no-op（不抛错、不 toast）；**5xx** 仅 `console.warn`（toast 留给后续 PR3）
   - **合并保护**（防竞态）：若挂载时本地 `progress[code]` 已存在（来自快速点击的乐观写），保留本地值。代码：
     ```js
     setProgress(prev => {
       const merged = { ...next };  // 服务端数据
       Object.keys(prev).forEach(k => { merged[k] = prev[k]; });  // 本地优先
       return merged;
     });
     ```
   - **`markQuestion(code, status, score, transcript)`**：
     - 第 1 行：`setProgress(prev => ({ ...prev, [code]: { status, score, transcript, viewCount: ... } }))`（同步乐观）
     - 第 2 行：`fetch('/api/progress', { method: 'POST', body: JSON.stringify({...}) }).catch(e => console.warn(e))`
     - **绝不**在 `setProgress` 前 `await fetch`
   - **`stats`**：`useMemo` 计算 `{ seen, total, understood, review, avgScore }`
     - 公式从 [`app/practice/page.js`](../app/practice/page.js) 第 372–381 行原地搬移
     - `total` 由调用方通过参数传入 OR 在 hook 内不计算 total（让页面自己算）—— 选后者，保持 hook 纯粹
2. **改造** [`app/practice/page.js`](../app/practice/page.js)：
   - 删除：本地 `const [progress, setProgress] = useState({})`、本地 `saveProgress` 函数
   - 新增：`const { progress, stats: hookStats, loading, markQuestion } = useProgress({ type: 'question' })`
   - 改造：`markStatus` 内调用 `markQuestion`
   - 改造：原 `stats` 计算块 → 直接用 `hookStats`，`total` 仍由页面用 `QUESTIONS.length` 提供
3. **改造** [`app/signs/page.js`](../app/signs/page.js)：
   - 同上但 `type: 'sign'`
   - ⚠️ **形状变化**：signs 当前用 `{ [sign_code]: number }`（直接是分数）。hook 统一返回对象形状 `{ [sign_code]: { score } }`。signs 页面渲染处改：
     - 旧：`progress[code]`
     - 新：`progress[code]?.score`
4. **不动** [`app/drive/page.js`](../app/drive/page.js)：drive 仅 POST 不显示进度。**第一阶段不引入 hook 到 drive**，避免外科手术式改动溢出（CLAUDE.md §3）。drive 留给后续小 PR。
5. **零闪烁守卫**（来自 2implan.md §1 第 6 步）：
   - `loading=true` 期间：侧边栏统计区不渲染数字（或显示骨架）
   - 800ms 超时后即使未 resolve 也 fallback 渲染（避免无限灰屏）
6. **`npm run build` 编译通过**。

### 2.4 风险与守则

| 风险 | 缓解 |
|---|---|
| **乐观更新回归（最高风险）** | `setProgress` 必须 *先于* `fetch` 调用。DevTools 节流 "Slow 3G" 测试：点 "understood" 后 UI 须 <100ms 内变化。代码评审重点：搜 `await fetch` 是否在 `setProgress` 之前出现。 |
| 挂载 GET 与快速点击竞态 | §2.3 第 1 点的"合并保护"防御。 |
| signs 形状变化破坏现有渲染 | 改造 signs 页面的渲染处时全文搜 `progress[` 一次性改完，避免漏点。 |
| `hooks/` 目录首次创建 | Next.js 13+ App Router 对自定义 hooks 目录无约束，但 hook 文件需 `'use client'` 标记（因使用 `useState`/`useEffect`）。 |
| 行数超预算 | 2implan.md §7 预计 +100 / −60，净 +40。若 hook 超过 130 行，停下来用 `simplify` skill 自审（CLAUDE.md §2）。 |

### 2.5 验收清单（PR1）

- [ ] 登录 → `/practice` → 答 3 题 → 标 2 个 "understood" → 硬刷新 → 侧边栏显示 **seen=3 / understood=2**（当前为 0/0）
- [ ] 登录 → `/signs` → 评 2 个 signs → 硬刷新 → 侧边栏数字非零
- [ ] 登出 → `/practice` → 页面正常渲染题目，**无 401 提示**
- [ ] DevTools Network：每次进入页面 `GET /api/progress` **恰好 1 次**
- [ ] DevTools 节流 "Slow 3G" → 点 "understood" → UI **<100ms 内变化**
- [ ] `npm run build` 无新增警告

### 2.6 提交

```bash
git add hooks/useProgress.js app/practice/page.js app/signs/page.js
git commit -m "feat(progress): add useProgress hook with GET-on-mount hydration (P1 #14 + #9)"
```

---

## 3. PR2 —— P1 #8 语言偏好持久化（详细步骤）

### 3.1 目标（可验证）

- 任意页面切换语言 → **刷新页面** 或 **跨页面跳转** 保持当前语言
- 持久化媒介：`localStorage`（key = `cdl-lang`）
- 不引入 `next-intl`、不改 `AppShell` 的 `setLang` prop 公开签名

### 3.2 技能组合（来自 [`doc/skillsavi.md`](skillsavi.md) §1.1 + §6.1）

| 阶段 | 技能 / agent | 评级 | 用法 |
|---|---|---|---|
| 设计 | **`Plan` agent** | 5 ⭐ | **可跳过** —— 2implan.md §2 已给完整方案（含 SSR hydration 陷阱处理） |
| 实施 | 直接代码改动 | — | 见 §3.3 |
| 自审 | **`simplify` skill** | 5 ⭐ | 提交前自审 |
| 验证 | **`verify` skill** | 5 ⭐ | 6 种语言 × 跨页面 + 刷新均保持 |

### 3.3 实施步骤

1. **新建** [`lib/lang-context.js`](../lib/lang-context.js)：
   - 文件首行 `'use client'`
   - 导出 `LanguageProvider`：
     - 初始 state：`useState('zh')`（SSR 阶段服务端必须用默认值，避免 hydration mismatch）
     - `useEffect` 挂载后：从 `localStorage.getItem('cdl-lang')` 读取并校验在 LANGS allowlist 内（`['en', 'zh', 'es', 'hi', 'pa', 'vi']`），不合法则忽略
     - `setLang` 包装：写 state + `localStorage.setItem('cdl-lang', value)`（外层 try/catch，Safari 隐私模式会抛错）
   - 导出 `useLang()` hook：
     - 若 context 为 null（未在 Provider 内使用），`throw new Error('useLang must be used within LanguageProvider')` —— 早失败 > 静默 bug
   - **注释一行**说明"服务端默认 + 客户端 useEffect hydrate"是有意的 SSR 模式，未来 dev 不要"好心修回去"
2. **修改** [`app/layout.js`](../app/layout.js)：
   - 在 `<ClerkProvider>` 内、`<body>` 内层包一层 `<LanguageProvider>`
   - ⚠️ `app/layout.js` 是 Server Component；`LanguageProvider` 必须是 Client Component（已通过 `'use client'` 保证）
3. **修改** 6 个页面，把 `const [lang, setLang] = useState('zh')` → `const { lang, setLang } = useLang()`：

| 文件 | 当前行号（参考） |
|---|---|
| [`app/practice/page.js`](../app/practice/page.js) | ~290 |
| [`app/mock/page.js`](../app/mock/page.js) | ~262 |
| [`app/drive/page.js`](../app/drive/page.js) | ~206 |
| [`app/signs/page.js`](../app/signs/page.js) | ~52 |
| [`app/terms/page.js`](../app/terms/page.js) | ~143 |
| [`app/page.js`](../app/page.js)（landing） | — |

4. **不动** [`components/AppShell.js`](../components/AppShell.js)：`setLang` prop 继续从页面传入，hook 细节对 AppShell 透明（CLAUDE.md §3 外科手术式改动）。
5. **`npm run build` 编译通过**。

### 3.4 风险与守则

| 风险 | 缓解 |
|---|---|
| SSR hydration mismatch | 服务端默认 `'zh'` + 客户端 `useEffect` hydrate；不在 SSR 阶段访问 `localStorage`。代码注释明示。 |
| Safari 隐私模式 `localStorage.setItem` 抛错 | `setLang` 内 try/catch 包裹 |
| 6 处 `useState('zh')` 漏改 | 收尾时 `grep -rn "useState('zh')" app/` 确认无残留 |
| 行数超预算 | 2implan.md §2 预计 +50 / −6，净 +44。注意 Provider 文件控制在 70 行内。 |

### 3.5 验收清单（PR2）

- [ ] 在 `/practice` 选 `Español` → 硬刷新 → 仍是西班牙语
- [ ] 在 `/practice` 选 `Tiếng Việt` → 跳到 `/signs` → 仍是越南语
- [ ] 同样验证 `/mock`、`/drive`、`/terms`、`/`（landing）
- [ ] DevTools → Application → Local Storage → 有 `cdl-lang` 键，值随切换更新
- [ ] React DevTools 控制台**无 hydration mismatch 警告**
- [ ] `grep -rn "useState('zh')" app/` 返回 0 行
- [ ] `npm run build` 无新增警告

### 3.6 提交

```bash
git add lib/lang-context.js app/layout.js \
        app/practice/page.js app/mock/page.js app/drive/page.js \
        app/signs/page.js app/terms/page.js app/page.js
git commit -m "feat(lang): persist language preference via Context + localStorage (P1 #8)"
```

---

## 4. 技能使用清单（今日汇总）

| 技能 / agent | 评级（[`skillsavi.md`](skillsavi.md) §10） | 今日用途 | 调用时机 |
|---|---|---|---|
| **`verify`** skill | 5 ⭐ | PR1、PR2 浏览器手工验证 | 每个 PR 提交前 |
| **`simplify`** skill | 5 ⭐ | PR1、PR2 提交前自审 | 每个 PR 提交前 |
| **`run`** skill | 5 ⭐ | 启动 dev server（如需） | 验证阶段 |
| **`Plan`** agent | 5 ⭐ | **不调用**（2implan.md 设计已完整） | — |
| **`Explore`** agent | 5 ⭐ | **不调用**（路径与行号已知） | — |
| **`frontend-design`** skill | 5 ⭐ | **不用** —— 今日无 UI 新组件 | — |
| **`webapp-testing`** skill | 5 ⭐ | **不用** —— E2E 测试是 P3 阶段 | — |
| **Sentry plugin** | 5 ⭐ | **不用** —— 属第三批 | — |

**今日明确不引入**：所有 2–3 ⭐ 社区 skill + 任何 MCP server + `next-intl` / `prettier` / `vitest` / `playwright` 等新 npm 依赖 + Stripe / Sentry 集成。**零新增第三方依赖**。

---

## 5. 完整验收清单（收尾时核对）

### 5.1 代码侧

- [ ] PR1 完成：`hooks/useProgress.js` 已创建（≤ 130 行）；practice / signs 已迁移；`npm run build` 通过
- [ ] PR1 §2.5 全部 6 项验收通过
- [ ] PR2 完成：`lib/lang-context.js` 已创建；`app/layout.js` + 6 页面已改；`npm run build` 通过
- [ ] PR2 §3.5 全部 7 项验收通过
- [ ] 2 个独立 commit（不混在一起）

### 5.2 流程侧（CLAUDE.md / AGENTS.md）

- [ ] 外科手术式改动：每行改动都能溯源到 PR 目标
- [ ] 无未关联的"顺手改动"（comments、formatting、相邻代码）
- [ ] [`doc/4claudelog7.md`](4claudelog7.md) 已追加今日 2 个 action 记录
- [ ] 提交 message 遵循 conventional commits（`feat(progress): ...` / `feat(lang): ...`）

### 5.3 用户价值侧

- [ ] 已登录用户答题→刷新→统计正确恢复（PR1 解锁的核心价值）
- [ ] 切换语言→刷新→保持（PR2 解锁的核心价值）

---

## 6. 风险预警表

| 风险 | 出现概率 | 影响 | 缓解动作 |
|---|---|---|---|
| 乐观更新回归（PR1） | 中 | 高（UX 显著退化） | 代码评审搜 `await fetch` 位置；Slow 3G 验证 |
| SSR hydration mismatch（PR2） | 中 | 中（控制台警告，可见性低） | useEffect 模式 + 注释 |
| signs 形状变化漏改（PR1） | 中 | 中（页面渲染异常） | 全文 grep 后逐处改 |
| iOS 手势 / 录音回归 | **极低** | 高 | 今日两个 PR 都不动 `MediaRecorder` / `unlockAudio()` |
| 6 处 `useState('zh')` 漏改 | 低 | 中 | grep 收尾验证 |
| 行数超预算 50% | 低 | 低（早期信号） | CLAUDE.md §2 触发重写 |

---

## 7. 不在本阶段范围内（明确排除）

按 [`doc/2implan.md`](2implan.md) §9.1 顺序，**以下条目留给后续阶段**：

- ❌ **PR3 = P1 #10**（toast / inline alert 系统）—— 下一阶段
- ❌ **PR4a–4e = P2 #16**（i18n 集中化，5 个 sub-PR，2 天）—— 第二批
- ❌ **PR5 = P2 #12**（`useRecorder` hook）—— 🔴 iOS 回归风险，单独日 + 真机验证
- ❌ **PR6 = P2 #13**（`useScoring` hook）—— 必须在 #12 之后
- ❌ **PR7.1–7.5 = P2 #15**（组件库拆分 Phase A–D）—— 需先完成 #16
- ❌ **P1 #11**（lint 脚本校验）—— 独立小任务，待空闲时段
- ❌ **P3 全部**（Prettier / 测试 / CI / Sentry / 日志 / TS）—— 长期分批
- ❌ **设备限制策略**（Phase 4）—— 需产品决策
- ❌ **Stripe 商业化**（Phase 6）—— 需产品决策

---

## 8. 与 [`doc/3cimplanexec.md`](3cimplanexec.md) 的差异（一目了然）

| 维度 | `3cimplanexec.md`（旧） | `32cimplanexec.md`（本文件） |
|---|---|---|
| T1（上午） | PR2 = #8 语言持久化 | **PR1 = #14 + #9 进度加载** ✅ 按 2implan.md §9.1 |
| T2（下午） | PR1 = #14 + #9 进度加载 | **PR2 = #8 语言持久化** ✅ |
| T3（补充） | PR3 toast 侦察 | 用 `simplify` skill 全量自审 |
| 依据来源 | 个人节奏感（"warmup → deep work"） | 2implan.md §9.1 "critical-path user-visible win" 排序 + 风险不对称论证 |
| 文档对齐 | 与 2implan.md §9.1 略有偏离 | 完全对齐 2implan.md §9.1 |

> 详细顺序审计见 [`doc/3cimplanexecAns.md`](3cimplanexecAns.md)。本文件即该审计中 **Option A（推荐）** 的落地版本。

---

## 9. Github 提交命令（收尾时使用）

按 [`CLAUDE.md`](../CLAUDE.md) 末段"After finish any action, provide proper github command to the user"要求：

```bash
# 第一步：提交 PR1
git add hooks/useProgress.js app/practice/page.js app/signs/page.js
git commit -m "feat(progress): add useProgress hook with GET-on-mount hydration (P1 #14 + #9)"

# 第二步：提交 PR2
git add lib/lang-context.js app/layout.js \
        app/practice/page.js app/mock/page.js app/drive/page.js \
        app/signs/page.js app/terms/page.js app/page.js
git commit -m "feat(lang): persist language preference via Context + localStorage (P1 #8)"

# 第三步：把本规划文件本身入库
git add doc/32cimplanexec.md doc/4claudelog7.md
git commit -m "doc: add doc/32cimplanexec.md — first-stage execution schedule aligned with 2implan.md §9.1 (PR1 first, then PR2)"

# 第四步：推送
git push origin main
```

> ⚠️ **未经用户明确同意之前不要 `git push`。** 见 CLAUDE.md / AGENTS.md 关于"shared state"和"hard-to-reverse operations"的提醒。

---

## 10. 一句话总结

本阶段聚焦 2implan.md §9.1 的前 2 个 PR：**先 PR1（进度加载，1 天）后 PR2（语言持久化，0.5 天）**，全部 🟢 低风险、可独立回滚；今日产出预期：**2 个独立 commit + 0 个新增第三方依赖 + 2 项立即可见的用户价值（统计恢复 + 语言记忆）**。
