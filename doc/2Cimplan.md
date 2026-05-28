# 2Cimplan.md — 开放重构事项详细实施计划

> **创建日期：** 2026-05-27
> **来源审计：** [`doc/2improve.md`](2improve.md) §9 “Recommended next batch”
> **生成者：** Claude Code `Plan` agent（subagent_type: Plan），只读研究轮次
> **范围：** 8 个开放重构事项，覆盖 P1（UX 修复）+ P2（结构性重构）
> **范围外：** P3 工程卫生项（Prettier、测试、CI、Sentry、日志、TypeScript）— 已在 `doc/skillsavi.md` §4 单独覆盖
>
> **本文档使用方式：**
> - 每次重构前先选择下面一个 PR 小节；除非重新运行 Plan agent，否则不要偏离列出的文件路径和函数签名。
> - 每个事项都列出目标、文件、分步计划、风险、验证方式和 LoC 估算。
> - 实现完某个事项后，按 `CLAUDE.md` 规则把操作追加到 `doc/4claudelog{N}.md`。
> - PR 顺序建议见文末 §9 “跨事项建议”。

---

# Batch 1 — P1 最高杠杆项

---

## 1. P1 #9 — 页面挂载时加载历史进度

**目标：** 当已登录用户打开 `/practice` 或 `/signs` 时，从 `GET /api/progress` 注入本地 `progress` 状态，让侧边栏统计和每题状态徽章反映真实历史，而不是从 0 开始。

**需要修改的文件：**
- [`app/practice/page.js`](../app/practice/page.js) — 增加挂载时 fetch + 状态注入（后续会被 #14 的 `useProgress` hook 替换）
- [`app/signs/page.js`](../app/signs/page.js) — 同上
- 后端无需修改 — [`app/api/progress/route.js`](../app/api/progress/route.js) 已有 `GET /api/progress`，并返回 `{ questionProgress, signProgress, recentMocks }`。

**分步计划：**
1. 在 `PracticeInner`（practice 页面）中添加 `useEffect(() => { ... }, [])`，执行带 `credentials: 'same-origin'`（Clerk cookie）的 `fetch('/api/progress')`。验证：DevTools Network 首次渲染时只发出一次 GET。
2. 转换响应结构：服务端返回数组 `questionProgress: [{ question_code, status, last_score, last_transcript, updated_at, ... }]`。把它映射成本地状态已使用的 keyed object：`{ [code]: { status, score, transcript, viewCount: 1 } }`。验证：`console.log` 出来的结构与 `markStatus` 写入的结构一致。
3. 遇到 401（未认证）时静默 no-op，不影响匿名流程。遇到 5xx 时吞掉错误，只 `console.warn`。验证：登出 → 打开页面 → 无错误、暂不弹 toast（toast 属于事项 #3）。
4. 成功注入后，practice 中现有的 `stats` 派生逻辑（第 372–381 行）会自动得到真实 `seen / understood / review / avgScore`。视觉验证：一个以前答过题的用户，侧边栏数字应大于 0。
5. 在 `app/signs/page.js` 做同样修改：读取 `signProgress: [{ sign_code, score, ... }]`，转换成页面当前使用的 `{ [sign_code]: score }` map（第 79 行）。
6. 增加一个小的 `loading` boolean，这样首次渲染时不会在即将 fetch 的情况下闪一下 “0 seen / 0 understood”。在 fetch 结束或 800ms 后再显示统计，以先到者为准，避免布局跳动。验证：在 `/practice` 硬刷新，快速网络下不再出现 0 闪烁。

**风险 / 坑点：**
- **与 `markStatus` 竞态：** 如果用户在 GET 仍在飞行的前约 200ms 内点击 “Understood”，POST 的乐观更新可能被稍后返回的 GET 覆盖。缓解：只为本地 `progress` 中尚不存在的 key 注入历史状态，也就是合并时本地优先。
- **乐观 UI 回退风险：** 保持 `markStatus` 立即写本地状态的现有模式。挂载时 GET 只填充初始状态；之后的写入仍保持乐观。
- **匿名用户：** `/practice` 登出状态仍应可用。把 401 静默视为 “无历史”。
- **统计显示变化：** 侧边栏当前包含 `mocks` 计数派生，但该页面没有计算它。#9 只覆盖 question/sign progress，不覆盖 mocks count。

**验证标准：**
- 登录 → 在 `/practice` 答 3 题 → 标记 2 题 understood → 刷新页面 → 侧边栏显示 seen=3、understood=2。当前行为是 0/0。
- `/signs` 同样流程可用。
- Network tab 每次 mount 只显示一次 `GET /api/progress`。
- 登出用户仍能正常看到题目渲染。

**预计 LoC：** +60 行（每页约 30 行，含 merge 逻辑），0 删除。半天到 1 天。

---

## 2. P1 #8 — 语言偏好持久化

**目标：** 在任何位置选择语言后，刷新和跨页面导航都能保持。用一个基于 Context + `localStorage` 的共享 `useLang()` hook 替换 5 处重复的 `useState('zh')`。

**需要创建的文件：**
- [`lib/lang-context.js`](../lib/lang-context.js) — 导出 `LanguageProvider` 和 `useLang()`。（放在 `lib/` 而不是 `hooks/`，避免在 #5 前创建空 `hooks/` 目录；等 #12 引入 `hooks/` 后可再迁移。）

**需要修改的文件：**
- [`app/layout.js`](../app/layout.js) — 用 `<LanguageProvider>` 包裹 `<body>` children（必须在 `<ClerkProvider>` 内，并通过 client boundary；provider 文件顶部加 `'use client'`）。
- [`app/practice/page.js`](../app/practice/page.js)（第 290 行）、[`app/mock/page.js`](../app/mock/page.js)（第 262 行）、[`app/drive/page.js`](../app/drive/page.js)（第 206 行）、[`app/signs/page.js`](../app/signs/page.js)（第 52 行）、[`app/terms/page.js`](../app/terms/page.js)（第 143 行）、[`app/page.js`](../app/page.js)（landing）— 把 `const [lang, setLang] = useState('zh')` 替换为 `const { lang, setLang } = useLang()`。
- [`components/AppShell.js`](../components/AppShell.js) — `setLang` prop 继续保持相同用法；公共 API 不变。

**分步计划：**
1. 编写 `LanguageProvider`：持有 `lang` state，初始化时从 `localStorage.getItem('cdl-lang')` 读取，回退到当前默认 `'zh'`。用 LANGS allowlist 校验值；非法值重置为 `'zh'`。验证：篡改 localStorage 不会破坏应用。
2. `setLang` wrapper 同时写 state 和 `localStorage.setItem('cdl-lang', value)`，放在 try/catch 中（Safari private mode 可能抛错）。验证：切换语言 → DevTools Application → localStorage 有 `cdl-lang`。
3. **SSR hydration 陷阱：** Next.js 先在服务端渲染，那里没有 `localStorage` → 服务端用 `'zh'`，客户端可能不同 → hydration mismatch。解决：服务端初始值固定 `'zh'`，然后 `useEffect` 在 mount 后读取 localStorage 并更新。接受一帧闪烁。验证：console 中没有 React hydration warning。
4. 导出 `useLang()`；如果在 provider 外使用则抛错（早失败比静默 bug 好）。
5. 在 `app/layout.js` 包裹 children。由于 layout.js 是 Server Component，provider 必须是顶部带 `'use client'` 的 Client Component。验证：build 仍通过（`npx next build`）。
6. 迁移 6 个页面：删除本地 `useState('zh')`；添加 `import { useLang } from '@/lib/lang-context'` 并使用 `const { lang, setLang } = useLang()`。验证：在 `/practice` 选择西班牙语 → 导航到 `/signs` → 页面已是西班牙语（当前会重置中文）。
7. 刷新测试：切换语言 → 硬刷新 → 仍保持所选语言。

**风险 / 坑点：**
- **Hydration mismatch** — 通过服务端默认值 + 客户端 `useEffect` hydration 处理。这是 Next.js 常见模式；加一个注释，避免未来开发者把它 “修回去”。
- **不要引入 next-intl** — 按需求明确不在范围内。
- **`AppShell` 仍接收 `setLang` prop：** 不破坏 API，只是从新 hook 透传。
- **匿名用户也能持久化语言** — localStorage 在浏览器侧，不需要认证。

**验证标准：**
- 6 个页面 × 6 种语言：任意页面切换、刷新后语言保留。
- 跨页导航不重置（practice → signs → drive → terms 均共享）。
- 初次加载无新的 console warning。
- `npx next build` 成功。

**预计 LoC：** +50（provider/hook），−6（6 个文件各删一行 `useState`）；净 +44。半天。

---

## 3. P1 #10 — 统一用户反馈（toast / inline alert）

**目标：** 用纯 CSS 的最小 `<Toast>` 和 `<InlineAlert>` 系统，替换 [`app/practice/page.js`](../app/practice/page.js) 中 3 个 `alert()` 调用（第 438、463 行）以及多处静默 `.catch(() => {})` POST 失败。

**需要创建的文件：**
- [`lib/toast-context.js`](../lib/toast-context.js) — `ToastProvider`、`useToast()`，返回 `{ showToast(msg, type) }`，其中 `type` ∈ `'info'|'success'|'warn'|'error'`。内部维护 queue array，4 秒后自动关闭。
- [`components/Toast.js`](../components/Toast.js) — 小型 toast stack 渲染器。监听 provider state。使用现有 CSS variables（`--red`、`--green`、`--amber`、`--brand`）。
- [`components/InlineAlert.js`](../components/InlineAlert.js) — 无状态组件，用于卡片内警告（例如把 “Microphone unavailable” 放在 speak panel 内，而不是全局 toast）。
- 在 [`app/globals.css`](../app/globals.css) 追加 CSS：`.toast-stack`、`.toast`、`.toast-error`、`.toast-success`、`.toast-warn`、`.inline-alert`（约 30 行）。

**需要修改的文件：**
- [`app/layout.js`](../app/layout.js) — 用 `<ToastProvider>` 包裹 children（放在 `LanguageProvider` 内或旁边均可）。
- [`app/practice/page.js`](../app/practice/page.js) — 把 `alert('Microphone requires HTTPS…')` 和 `alert('Microphone error: ' + e.message)` 替换为 `showToast(msg, 'error')`。麦克风权限拒绝还应在录音按钮旁显示 `<InlineAlert>`，因为 toast 会自动消失，用户可能错过。
- 对 [`app/mock/page.js`](../app/mock/page.js)（第 352 行 catch block）和 [`app/drive/page.js`](../app/drive/page.js)（第 443 行 `console.error`）做同样的外科式替换。
- `saveProgress(...).catch(() => {})` 模式（4 处）小升级为：`.catch(() => showToast(t(lang,'saveFailed'), 'warn'))`。注意：这需要新增 i18n key（如果与 #4 绑定可一并处理）；当前可先硬编码英文，等 #4 落地再迁移。

**分步计划：**
1. 构建 `ToastProvider`，使用 `toasts: [{id, msg, type}]` 数组；`showToast` push；`setTimeout(4000)` 按 id 移除。验证：用测试按钮触发，toast 出现并自动消失。
2. `<Toast>` 在桌面端固定 top-right stack，手机端 top-center。ARIA：info/success 用 `role="status"`，warn/error 用 `role="alert"`。验证：屏幕阅读器可播报。
3. 在 `practice/page.js` 接入 `useToast()`。替换两个 `alert(…)`。验证：浏览器撤销麦克风权限 → 出现 error toast，而不是原生 alert dialog。
4. 在 speak panel 内，当 `recState === 'error'`（新增状态）时显示 `<InlineAlert>`。验证：toast 自动消失后，错误仍可见。
5. 处理 3 个静默 POST 失败点（practice 的 `saveProgress`、mock 的 `fetch('/api/mock')` catch、drive 的 `fetch('/api/progress')` catch）。这些使用 `'warn'` toast（本地已有乐观持久化，所以非致命）。验证：模拟离线 → toast 触发。

**风险 / 坑点：**
- **不要刷屏：** 如果 5 个 progress POST 连续失败，不要显示 5 个 toast。实现 2 秒内按 `msg` 去重。
- **iOS safe-area：** 手机上 top-center 要尊重 `env(safe-area-inset-top)`，避免被刘海遮挡。
- **Provider 顺序：** `ToastProvider` 与 `LanguageProvider` 相互独立，顺序均可。两者都放在 `ClerkProvider` 内。
- **i18n 耦合：** toast 消息最终应支持 i18n。目前先硬编码英文；等 #4（i18n centralization）落地后再处理，并在消息旁注明 `// TODO: i18n in #16`。

**验证标准：**
- `app/practice/page.js` 中现有 3 个 `alert()` 调用消失。
- 触发麦克风权限拒绝 → toast + 持久 inline alert 出现。
- 强制 `/api/progress` 500（DevTools block）→ warn toast 出现，本地状态仍更新（保持乐观）。
- `app/` 下不再有 `alert(` 字符串。

**预计 LoC：** +130（provider 40、Toast 30、InlineAlert 20、CSS 30、调用点编辑 10），−6（alert 行）。约 1 天。

---

# Batch 2 — P2 结构性重构

---

## 4. P2 #16 — i18n 集中化（轻量，不使用 next-intl）

**目标：** 把 5 份文件内翻译字典（`practice` 的 `T`、`mock` 的 `MT`、`drive` 的 `DT`、`terms` 的 `T`、`AppShell` 的 `NAV_LABELS`）迁移到按语言拆分的模块 + 单一 `t(lang, key)` resolver。不要使用 `next-intl`，不要 JSON；用纯 JS module 保持零新依赖。

**需要创建的文件：**
- [`lib/i18n/messages.en.js`](../lib/i18n/messages.en.js)
- [`lib/i18n/messages.zh.js`](../lib/i18n/messages.zh.js)
- [`lib/i18n/messages.es.js`](../lib/i18n/messages.es.js)
- [`lib/i18n/messages.hi.js`](../lib/i18n/messages.hi.js)
- [`lib/i18n/messages.pa.js`](../lib/i18n/messages.pa.js)
- [`lib/i18n/messages.vi.js`](../lib/i18n/messages.vi.js)
- [`lib/i18n/index.js`](../lib/i18n/index.js) — 导出 `t(lang, key)` 和 `LANGS` allowlist。Resolver：命名空间 key 查找，回退到英文。

**需要修改的文件：**
- [`app/practice/page.js`](../app/practice/page.js) — 删除 80 行 `T` table（第 8–87 行）+ 本地 `t()`（第 89 行）。从 `lib/i18n` 导入 `t`，调用点加 namespace 前缀（例如 `t(lang, 'practice.officer')`）。
- [`app/mock/page.js`](../app/mock/page.js)、[`app/drive/page.js`](../app/drive/page.js)、[`app/terms/page.js`](../app/terms/page.js)、[`components/AppShell.js`](../components/AppShell.js) 同理。

**分步计划：**
1. **确定 namespace 形状：** 使用带前缀的 flat keys（`'practice.officer'`、`'mock.startWrite'`、`'nav.training'`）。Flat 结构避免 nested object 的样板，并符合现有单字符串 `key` 调用。每个 `messages.{lang}.js` 导出一个 flat object。验证：先只在 `practice` 上做原型。
2. **构建 `lib/i18n/index.js`：**
   ```js
   export function t(lang, key) { /* lookup messages[lang][key] || messages.en[key] || key; warn dev-only on miss */ }
   ```
   缺失 key 的开发环境 warning 使用 `if (process.env.NODE_ENV !== 'production') console.warn(...)`。用 per-key warned-once Set 避免 console 刷屏。验证：故意改一个 key → console.warn 只触发一次。
3. **先迁移 `practice`（canary）。** 把 inline `T.en/zh/es/hi/pa/vi` 的 22 个 key 全部移入 `messages.{lang}.js`，加 `practice.` 前缀。删除 `T`、本地 `t()`，把所有 `tx('key')` 调用替换成 `t(lang, 'practice.key')`。验证：`/practice` 语言切换仍正常，6 种语言都可用。
4. 迁移 `mock`（32 个 key，`mock.` 前缀）、`drive`（38 个 key，`drive.` 前缀）、`terms`（约 15 个 key，`terms.` 前缀）、`AppShell` 的 `NAV_LABELS`（17 个 key，`nav.` 前缀）。验证：每页每种语言做视觉扫查。
5. **删除死代码：** 删除各文件中不再使用的 `T`/`MT`/`DT`/`NAV_LABELS` 和本地 `t/mt/dt/nl` helper。
6. **可选但强烈建议：** 在 `lib/i18n/index.js` 增加一个 dev-only assertion：import 时检查每个非英文文件与英文文件 key set 一致（捕获 drift）。生产环境跳过。验证：从 `messages.zh.js` 删除一个 key → 下一次 dev build 记录缺失 key。

**风险 / 坑点：**
- **编辑量大：** 约删除 280 行、增加 280 行，但集中到语言文件中。PR 会较大；建议用 key-by-key diff 工具 review。**建议：每页一个 PR**（5 个小 PR，每个约移动 60 行），而不是一个大 PR。
- **Key 冲突：** namespace 前缀消除风险（`practice.next`、`mock.next`、`drive.next` 分开）。
- **Bundle size：** 6 个语言文件全部 eager import。约 6 × 4 KB = 24 KB，可接受。不要在量化前过度设计 dynamic imports。
- **不要引入 `next-intl`** — 已确认使用纯 JS module。
- **生产关闭 warning** — missing-key warning 必须用 `NODE_ENV !== 'production'` gate。

**验证标准：**
- 每页 6 种语言仍正常工作。
- `grep` `const T = {` 在 `app/` 中无结果。
- 每个 key 只有一个权威位置。
- Build 成功；bundle size 增量 < +20 KB。

**预计 LoC：** +400（6 个约 60 行语言文件 + 40 行 index），−350（删除 5 个文件内 inline tables）。净 +50，但维护成本显著降低。**约 2 天；拆成 5 个小 PR 发布。**

---

## 5. P2 #12 — 抽取 `useRecorder` hook

**目标：** 为 `getUserMedia` + `MediaRecorder` + `mr.start/stop` + blob handoff 建立单一事实来源，并内置 iOS gesture preservation。消除 3 份手写重复实现。

**需要创建的文件：**
- [`hooks/useRecorder.js`](../hooks/useRecorder.js) — 默认导出 `useRecorder()`。
- 可选：把目前内联在 `practice/page.js` 第 122–174 行的 `unlockAudio()` 移到相邻的 [`lib/audio-unlock.js`](../lib/audio-unlock.js)，供 hook + 页面级 autoplay 共享。**强烈建议** 集中 iOS 模式。

**需要修改的文件：**
- [`app/practice/page.js`](../app/practice/page.js) — 用 `const { isRecording, startRecording, stopRecording, error, audioBlob } = useRecorder()` 替换第 435–472 行（startRecording + stopRecording）。
- [`app/mock/page.js`](../app/mock/page.js) — 替换第 308–357 行。
- [`app/drive/page.js`](../app/drive/page.js) — 替换第 416–450 行。

**建议签名：**
```js
const { isRecording, error, audioBlob, startRecording, stopRecording, reset } = useRecorder({
  onStop: async (blob) => { /* caller-provided: transcribe+score */ },
  mimeType: 'auto', // resolved via MediaRecorder.isTypeSupported
})
```

**分步计划：**
1. 构建 `useRecorder.js`。内部 state：`isRecording`、`error`、`audioBlob`。Refs：`mrRef`、`streamRef`。mount 时不做事。`startRecording()` 中，在 `await getUserMedia` 之前同步调用 `unlockAudio()`（这是 iOS gesture-preservation 要求 — Actions 60–61）。`mr.onstop`：停止 tracks，构建 blob，设置 `audioBlob`，如果提供了 `onStop(blob)` 则调用。验证：console.log 选中的 mimeType。
2. 把 `unlockAudio()` 从 `practice/page.js` 移入 `lib/audio-unlock.js`。保持 persistent `<audio>` element + silent WAV pattern 完全一致。Practice 页面再导入它，用于 autoplay。验证：iPhone Safari 上 `/practice` continuous play 仍能播放音频（Actions 60–61 的回归检查）。
3. 先迁移 `practice`。把 `onStop` 接到现有 `/api/transcribe` POST → `setTranscript`。验证：录音 + 转写仍正常。
4. 迁移 `mock`。注意 mock 的 `onStop` 做更多事（transcribe → score → state update）；传入一个完成整条链路的 `onStop`。验证：`/mock` speak mode 仍能正确评分。
5. 迁移 `drive`。其 `onStop` 触发 `scoreAndAdvance(text)`。验证：officer/driver bubbles 仍出现，scores 仍保存。
6. **通过事项 #3 的 toast 系统暴露错误**（这也是 #12 应在 #3 后执行的原因）：hook 设置 `error` state，页面通过 `useEffect` 调用 `showToast(error.message, 'error')`。验证：拒绝麦克风权限 → 3 个页面都以一致方式显示 toast。

**风险 / 坑点：**
- **iOS autoplay 回归：** 这是最大风险。`unlockAudio()` 必须在 `startRecording` 内任何 `await` 之前同步调用。如果 hook 不小心先 await，移动端播放会再次坏掉。合并前必须用真实 iPhone（或 Safari iOS Simulator）验证，不只测桌面 Chrome。
- **mimeType 不匹配：** Safari 偏好 `audio/mp4`，Chrome/Firefox 偏好 `audio/webm`。当前代码是 `isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'`。保留此逻辑；可考虑把 `audio/mp4` 加为 Safari macOS 的第三 fallback。
- **Stream 泄漏：** 用户录音中途离开页面时必须停止 stream tracks。在 `useEffect(() => () => { stop tracks }, [])` 中加 cleanup。
- **`alert()` removal 与 #3 耦合：** practice 的两个 `alert()` 在 `startRecording` 内。要移除它们，需要 #3 先合并，或传入一个由页面接到 toast 的 `onError` callback。

**验证标准：**
- 3 个页面（`practice`、`mock`、`drive`）都使用 `useRecorder`。
- iPhone Safari：continuous play 仍正常（手动测试）。
- 拒绝麦克风权限 → 3 页都有 toast（或 inline error）。
- `grep new MediaRecorder app/` 无结果（只在 `hooks/` 中存在）。
- 录音 + 转写 + 评分链路未断。

**预计 LoC：** +120（hook 80、audio-unlock module 40），−180（3 × 60 行从页面删除）。净 −60。约 1 天。

---

## 6. P2 #13 — 抽取 `useScoring` hook

**目标：** 封装 `practice`、`mock`、`drive` 中手写的 `transcribe → score → progress` 链路。保留 `/api/score` 不可用时的 **`scoreKeywords()` 本地 fallback**。

**需要创建的文件：**
- [`hooks/useScoring.js`](../hooks/useScoring.js)

**需要修改的文件：**
- [`app/practice/page.js`](../app/practice/page.js) — 用 hook 调用替换 `runScore`（第 474–504 行）。
- [`app/mock/page.js`](../app/mock/page.js) — 替换 `startRec` 的 `onstop` 内联 scoring block（第 327–346 行）。
- [`app/drive/page.js`](../app/drive/page.js) — 替换 `scoreAndAdvance`（第 452–489 行）。

**建议签名：**
```js
const { score, feedback, wordScores, scoring, scoreAnswer } = useScoring()
await scoreAnswer({ questionCode, officerQuestion, correctAnswer, keywords, userAnswer, userLanguage })
```

`scoreAnswer` 返回 `{ score, feedback, wordScores }`。API 失败（非 2xx 或 throw）时，内部调用 `scoreKeywords(userAnswer, keywords)`，并返回 `{ score: kwScore, feedback: null, wordScores: null, fallback: true }`。

**分步计划：**
1. 构建 hook。State：`scoring`（boolean）、`lastResult`。fallback **必须** 从 `@/lib/data` 导入 `scoreKeywords`。验证：临时破坏 API endpoint URL 做单测 — score 仍应来自 `scoreKeywords`。
2. 先迁移 `practice`。替换 `runScore` body。注意：practice 目前在评分后调用 `markStatus(...)` — 保留在页面中（职责分离：hook 负责评分，页面负责持久化）。验证：输入答案 → 返回 score → ring 渲染。
3. 迁移 `mock`。Mock 流程在 `onStop` 中录音后评分。完成 `useRecorder`（#12）后，链路变为：`onStop(blob)` → `transcribe(blob)` → `scoreAnswer({...})`。考虑 `transcribe` 是否需要自己的小 hook；建议保留为 `lib/api/transcribe.js` 中的普通函数（无需 state）。验证：speak mode 仍评分。
4. 迁移 `drive`。`scoreAndAdvance` 变为 `scoreAnswer + setConvHistory + setSessionScores + saveProgress`。验证：bubble 带分数出现，sessionScores 累积。
5. **保留 `userLanguage` 参数** — 现有每处调用都传 `lang`。验证：AI feedback 仍以用户所选语言返回。

**风险 / 坑点：**
- **Fallback 回归** — 这是最重要的行为。写一条手动测试说明：在 DevTools 阻断 `/api/score` → 录音/输入答案 → 确认仍出现分数（来自 `scoreKeywords`）。当前 fallback 在 `app/practice/page.js:496–502`。
- **markStatus / saveProgress 不是 hook 的职责。** 保留在调用页面；hook 只返回评分。这避免把 scoring 与 persistence 耦合。
- **API shape 稳定性：** `/api/score/route.js` 返回 `{ score, feedback, wordScores }` — hook 内不要改形状；让页面消费原始 shape，方便未来 API 新字段自然透传。
- **排在 #5（`useRecorder`）之后** — 如果 recorder hook 已经就位，`mock` 和 `drive` 的迁移最干净。

**验证标准：**
- 在 DevTools 阻断 `/api/score` → 3 个页面仍通过 keyword fallback 显示分数。
- `grep fetch('/api/score' app/` 无结果。
- 3 个页面仍按用户所选语言渲染 AI feedback。

**预计 LoC：** +80（hook），−120（3 × 40 行 block）。净 −40。约 1 天。

---

## 7. P2 #14 — 抽取 `useProgress` hook（与 #1 打包）

**目标：** 集中处理挂载时 `GET /api/progress` + 更新时乐观 POST。**强烈建议：与事项 #1 打包**，因为 #1 需要的新行为就是 mount 时 GET；先 inline 做一遍再 hook 化会浪费工作。

**需要创建的文件：**
- [`hooks/useProgress.js`](../hooks/useProgress.js)

**需要修改的文件：**
- [`app/practice/page.js`](../app/practice/page.js) — 用 `const { progress, markQuestion } = useProgress({ type: 'question' })` 替换本地 `const [progress, setProgress] = useState({})` + `saveProgress` + `markStatus` body。
- [`app/signs/page.js`](../app/signs/page.js) — 使用 `{ type: 'sign' }` 做同样替换。
- [`app/drive/page.js`](../app/drive/page.js) — drive 只 POST（不显示 progress）；调用 `useProgress({ readOnly: false, type: 'question' })`，只使用 `markQuestion`。

**建议签名：**
```js
const { progress, stats, loading, markQuestion, markSign } = useProgress({ type })
// progress: { [code]: { status, score, transcript } }
// markQuestion(code, status, score, transcript): optimistic local + POST
```

**分步计划：**
1. 构建 hook。mount 时：`GET /api/progress` → 转换为 `{ [code]: {…} }`。State：`progress`、`loading`。合并逻辑保护乐观写入（见事项 #1 风险说明）。
2. `markQuestion` 立即写本地状态，然后后台 POST。POST 失败 → toast `'warn'`（事项 #3）。**必须保留乐观语义** — UI 永远不等待服务器。
3. 派生 `stats`：用 `useMemo` 计算 `{ seen, total, understood, review, avgScore }`。（practice 当前在第 372–381 行 inline 计算 — 同公式迁到 hook。）
4. 迁移 practice。验证：标记 understood 仍有效，侧边栏数字立即增加（不等 API roundtrip）。
5. 迁移 signs。验证：给 sign 打分会更新侧边栏计数。
6. Drive：只使用 `markQuestion`（该页不展示 progress）。

**风险 / 坑点：**
- **乐观 UI 回归 — 关键。** 本地 `setProgress` 必须同步发生，在 fetch 之前。如果重构时不小心先 `await` POST 再 set state，UI 会变慢。用 DevTools 把网络限速到 “Slow 3G” 测试。
- **`/signs` 使用不同 shape：** 当前 progress map 是 `{ [sign_code]: scoreNumber }`，而 practice 是 `{ [code]: { status, score, ... } }`。要么统一 normalize 为 object shape，要么让 `useProgress({ type })` 按 type 返回对应 shape。建议统一为 object shape（sign render 小迁移，约 5 LoC）。
- **与 #1 打包：** 顺序上 #14 让 #1 更干净，因为 mount-time GET 从第一天就只在一个地方。先实现 #14，#1 就只是把 `progress` 接入 UI。

**验证标准：**
- 答题后刷新 → `/practice` 和 `/signs` 都显示历史 progress（即事项 #1）。
- 标记 understood 后 UI 在 <50ms 内更新（乐观）。
- API 失败 toast（warn）触发；UI state 仍正确。
- `grep fetch('/api/progress' app/` 无命中（只在 `hooks/` 中）。

**预计 LoC：** +100（hook），−60（3 个 inline block）。净 +40。若与 #1 打包，则在 #1 基础上多半天（并包含 #1）。

**建议：把 #1 + #14 作为一个 PR 发布。**

---

## 8. P2 #15 — 组件库拆分

**目标：** 把 3 个增长中的页面从 “所有东西 inline” 推向 `components/{ui,features,layout}/`。**不要** 一次性抽取所有内容。800+ 行文件之所以大，主要是重复 inline JSX block；优先抽取重复度最高的块，能获得最大收益。

**需要创建的文件（按依赖顺序）：**

**Phase A — leaf UI（[`components/ui/`](../components/ui/)），零依赖：**
- [`components/ui/ScoreRing.js`](../components/ui/ScoreRing.js) — score-circle JSX 出现在 `practice`（第 802–806 行）、`mock`（第 693–696、740–743 行）、`drive`（`convHistory` 渲染中）。纯 props in，JSX out。约 25 行。
- [`components/ui/ProgressBar.js`](../components/ui/ProgressBar.js) — `<div className="bar"><div className="bar-fill" style={{width:`${pct}%`}}/></div>` 模式在页面间重复约 12 次。约 10 行。
- [`components/ui/WaveformIndicator.js`](../components/ui/WaveformIndicator.js) — `{[1,2,3,4,5].map(i => <span key={i} ... />)}` 模式在 3 页复制。约 10 行。
- [`components/ui/BadgeChip.js`](../components/ui/BadgeChip.js) — `<span className={\`badge ${classFor(score)}\`}>{label}</span>` + 小型 `classFor` helper。约 15 行。

**Phase B — 消费 Phase A 的 UI：**
- [`components/ui/RecordButton.js`](../components/ui/RecordButton.js) — 包装 start/stop 按钮和 `tpa-rec` indicator，通过 props 接收 `useRecorder` 输出（`isRecording`、`onStart`、`onStop`）。约 30 行。
- [`components/ui/LanguageSelector.js`](../components/ui/LanguageSelector.js) — 从 `AppShell` 第 201–210 行抽取；无复杂动态逻辑，只是在 `LANGS` allowlist 上渲染 `<select>`。当 `/page.js`（landing）也需要 selector 时有用。约 20 行。

**Phase C — features（使用 Phase A + B）：**
- [`components/features/QuestionCard.js`](../components/features/QuestionCard.js) — 从 `practice/page.js` 第 607–746 行抽取 officer-question + standard-answer + explanation + Q&A translation block。重活，约移动 150 LoC。Props：`q`、`lang`、`qaTrans`、`mode`、`tx`。约 150 行。
- [`components/features/OfficerBubble.js`](../components/features/OfficerBubble.js) + [`components/features/DriverBubble.js`](../components/features/DriverBubble.js) — drive 页面渲染 `convHistory.map(...)` 的 chat bubbles。两个组件，各约 30 LoC。
- [`components/features/VoiceSelector.js`](../components/features/VoiceSelector.js) — drive 页面第 510–535 行 voice grid。约 40 行。

**Phase D — layout（最低优先级）：**
- [`components/layout/Sidebar.js`](../components/layout/Sidebar.js) — 从 `AppShell.js` 第 224–267 行抽取。
- [`components/layout/Topbar.js`](../components/layout/Topbar.js) — 从 `AppShell.js` 第 184–221 行抽取。
- [`components/layout/MobileTabs.js`](../components/layout/MobileTabs.js) — `AppShell.js` 第 274–297 行。

**依赖顺序（重要）：**
1. 先做 Phase A（无依赖）。
2. Phase B（使用 A）。
3. Phase C — 先做 `ScoreRing` 再做 `QuestionCard`，因为 `QuestionCard` 使用它。先做 `BadgeChip` 再做 `OfficerBubble`/`DriverBubble`。
4. Phase D 最后；`AppShell` 重构应等页面级抽取稳定后再做（AppShell 是当前唯一稳定组件，不要先动它）。

**分步计划：**
1. **PR 8.1 — Phase A**（4 个组件，合计约 60 LoC）。把所有 inline 使用迁移到新组件。视觉验证没有变化。
2. **PR 8.2 — Phase B**。`RecordButton` 必须把 recorder hook 输出作为 props 接收（不要在组件内部调用 hook — 保持纯净且可测试）。验证 3 个页面录音都可用。
3. **PR 8.3 — Phase C: `QuestionCard`**。这是主要收益 — 从 `practice/page.js` 抽走约 150 行。验证 6 种语言渲染、Q&A translation card 仍出现、explanation block 仍出现。
4. **PR 8.4 — Phase C: `OfficerBubble`/`DriverBubble`/`VoiceSelector`**。Drive 页面专属。验证 scenario start → conversation flow。
5. **PR 8.5 — Phase D（可选）**。只有当 AppShell 开始阻碍新功能时再做。可无限期推迟。

**风险 / 坑点：**
- **不要破坏 iOS gesture pattern。** `RecordButton` 的 onClick handler 中，在同步 `unlockAudio()` 调用前不得引入任何 `await`。可把 `unlockAudio` 作为 prop 传入或直接 import。
- **Inline styles vs CSS classes：** 当前文件大量使用 inline `style={{...}}`（例如 practice page 的 Q&A translation card）。抽成组件是把它们迁到 CSS class 的好机会，但**不要在同一个 PR 中做** — 先抽取，后续再样式化（Surgical Changes 原则）。
- **`tx` translation function 透传：** 如果事项 #4 已先发布，组件可直接调用 `t(lang, key)`。否则就需要把 `tx` 作为 prop 传入，比较尴尬。**强烈建议：先发布 #4（i18n），再做 #15（组件拆分）。**
- **Prop drilling 变多** — `QuestionCard` 需要 `q`、`lang`、`mode`、`qaTrans`、`tx`、`progress`、`markStatus` 和若干 handlers。这可以接受，直接声明 props。不要为此引入 Context — 这是单页消费。
- **不要把 `useRecorder` 调用方抽到一个同时运行 hook 的组件里** — hook 应留在页面，组件通过 props 接收结果状态。这样测试边界更干净。

**验证标准：**
- PR 8.3 后：`practice/page.js` 行数从 872 降到约 720。
- 全部 5 个 PR 后：`practice` ≤ 600、`mock` ≤ 550、`drive` ≤ 550、`AppShell` ≤ 250。
- 视觉回归：每页每种语言做 before/after 并排截图，没有 pixel diff。
- 没有新组件 import 整个页面级 state；所有组件都使用显式 props。

**预计 LoC：**
- Phase A：+60，−80，净 −20。
- Phase B：+50，−50，净 0。
- Phase C（QuestionCard）：+150，−180，净 −30。
- Phase C（drive bubbles + voice）：+100，−130，净 −30。
- Phase D（推迟）。
- **总计：页面净 −80，但新增模块 +360。** 文件更小，模块数量更高。约 3–5 天，5 个顺序 PR。

---

# 9. 跨事项建议

## 9.1 PR 顺序

**单独 PR：**
- **PR 1 → ITEMS #14 + #9 打包。** `useProgress` hook + mount 时 GET + `/practice` 与 `/signs` 侧边栏注入。关键路径用户可见收益。
- **PR 2 → ITEM #8。** `LanguageProvider` + 6 个页面迁移。范围小但触及文件多；隔离处理。
- **PR 3 → ITEM #10。** Toast + InlineAlert 系统。必须先于 #5，才能让 recorder hook 干净地通过 toast 暴露错误。
- **PR 4a–4e → ITEM #16，拆成 5 个子 PR。** 每页一个（practice、mock、drive、terms、AppShell）。每个约移动 60 LoC + smoke test。
- **PR 5 → ITEM #12。** `useRecorder` + `audio-unlock.js`。重点做 iOS 测试。
- **PR 6 → ITEM #13。** `useScoring`，保留 `scoreKeywords` fallback。
- **PRs 7.1–7.5 → ITEM #15。** Phase A、B、C-QuestionCard、C-drive、D（可选）。

**打包建议摘要：**
- **打包 #14 + #9**（节省约半天，避免重复脚手架）。
- **不要打包 #12 + #13**，即使它们触及相同页面 — #12 的 iOS 回归风险值得在移动评分逻辑前做专门验证。顺序推进，不要打包。
- **不要打包 #16（i18n）与 #15（components）** — 会形成 1000 行 diff。#16 必须先发布，这样 #15 的组件可直接调用 `t(lang, key)`。

## 9.2 PR 间验证门

每个 PR 合并前：
1. `npx next build` 干净通过（无新增 warning）。
2. 手动 smoke test：登录 → `/practice` → 答一题 → 标记 understood → 刷新 → 仍为 understood。
3. 移动端 gesture 测试（#5 + #12 后）：iPhone Safari 上 continuous play 仍有音频，录音仍能转写。
4. 语言测试：在 landing 切到西班牙语 → 导航到每个页面 → 仍为西班牙语（#8 后）；每页渲染时没有 missing-key warning（#16 后）。
5. Fallback 测试（#13 后）：DevTools 阻断 `/api/score` → 仍通过 `scoreKeywords` 显示分数。
6. Toast non-spam 检查（#10 后）：1 秒内触发 3 次麦克风错误 → 只出现 1 个 toast（已去重）。

## 9.3 回滚策略

- 每个 PR 都是独立的，可通过 `git revert <sha>` 单独回滚。没有 PR 依赖数据库迁移；没有 PR 删除公共 API。
- `useRecorder` 抽取（#12）是风险最高的单个 PR。把旧的 inline `MediaRecorder` block 保留在 git 历史中；如果合并后 iOS 播放回归，干净回滚 PR 5，不影响后续 PR（后续只依赖 recorder API surface，不依赖 hook 内部形状）。
- 组件库 PR（#15）仅为视觉/结构层面；回滚任一 phase 不影响数据或认证。
- 对 #16（i18n）：如果某个 key 迁移破坏一种语言，只回滚该页面的子 PR。其他语言和页面不受影响，因为每页迁移是独立 commit。

## 9.4 CLAUDE.md 合规行为检查

每个 PR 必须满足：
- **外科式修改：** 每一行改动都能追溯到该事项目标。不要顺手 “改进” 相邻 inline styles，不要重构无关注释。
- **简单优先：** 如果某事项实现超过 LoC 估算 50%，暂停并 review — 很可能过度设计（例如不要为 `useRecorder` 增加 “未来灵活性” 的配置 flags；发布最小实现）。
- **目标驱动执行：** 上述验证标准可直接转成每次合并前的手动或自动检查。

---

# 10. 实施关键文件（单一参考）

- [`app/practice/page.js`](../app/practice/page.js) — 事项 #1、#2、#3、#4、#5、#6、#7、#8 会触及
- [`app/mock/page.js`](../app/mock/page.js) — 事项 #2、#3、#4、#5、#6、#8 会触及
- [`app/drive/page.js`](../app/drive/page.js) — 事项 #2、#3、#4、#5、#6、#7、#8 会触及
- [`app/signs/page.js`](../app/signs/page.js) — 事项 #1、#2、#7 会触及
- [`app/terms/page.js`](../app/terms/page.js) — 事项 #2、#4 会触及
- [`app/page.js`](../app/page.js) — 事项 #2 会触及
- [`components/AppShell.js`](../components/AppShell.js) — 事项 #2、#4、#8（Phase D）会触及
- [`app/layout.js`](../app/layout.js) — 事项 #2、#3 会触及
- [`app/api/progress/route.js`](../app/api/progress/route.js) — 不修改；由事项 #1、#7 消费
- [`app/globals.css`](../app/globals.css) — 事项 #3 会触及

---

# 11. 总工作量估算

| PR | 事项 | 天数 | 风险 |
|---|---|---:|---|
| 1 | #14 + #9 打包 | 1.0 | 低 |
| 2 | #8 语言持久化 | 0.5 | 低 |
| 3 | #10 toast 系统 | 1.0 | 低 |
| 4a–4e | #16 i18n × 5 个 PR | 2.0 | 中（体量） |
| 5 | #12 useRecorder | 1.0 | **高（iOS 回归）** |
| 6 | #13 useScoring | 1.0 | 中（保留 fallback） |
| 7.1 | #15 Phase A（4 个 UI） | 0.5 | 低 |
| 7.2 | #15 Phase B（RecordButton、LangSelector） | 0.5 | 中 |
| 7.3 | #15 Phase C（QuestionCard） | 1.0 | 中 |
| 7.4 | #15 Phase C（drive bubbles + voice） | 1.0 | 低 |
| 7.5 | #15 Phase D（layout，可选） | 1.0 | 低 |
| **总计** | 全部 8 项 | **约 10.5 天** | |

如果推迟 Phase D layout split（PR 7.5），总工作量降至约 9.5 天。
