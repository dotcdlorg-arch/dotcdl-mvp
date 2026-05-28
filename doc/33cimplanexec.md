# 33cimplanexec.md — 阶段六：付费订阅（Stripe）实施排程

> **生成日期：** 2026-05-28
> **依据文档：**
> - [`doc/1improve.md`](1improve.md) §14.3「商业化」+ §17「Stripe 支付集成（P3）」+ §18「商业化未就绪」
> - [`doc/2improve.md`](2improve.md) §6「Phase 6 — Commercial / Stripe — ❌ NOT ADDRESSED」+ §9「Stripe / PRO gating model」
> - [`doc/2gptimprove.md`](2gptimprove.md) §8「阶段六：商业化，需先确认产品意图」+ §12「需要你确认的问题」第 4、5 条
> - [`doc/skillsavi.md`](skillsavi.md) §5.1 + **§10.6（重要更正）** + §10.9 评级总表
> - [`doc/2implan.md`](2implan.md) §9.1 PR-by-PR 排序范式
> - [`doc/32cimplanexec.md`](32cimplanexec.md) 格式与语气模板
> **生成方式：** Claude Code `Plan` agent（subagent_type: Plan）—— 只读研究 + 排程产出
> **执行原则：** [`CLAUDE.md`](../CLAUDE.md) §1–§4（思考先于编码 / 极简 / 外科手术式改动 / 目标驱动）+ [`AGENTS.md`](../AGENTS.md)。
> **关键约束：** 不引入 TypeScript · 不引入 Tailwind / CSS-in-JS · 不引入 `next-intl`（v1 全英文硬编码，待 #16 i18n 集中化后再国际化） · 仅新增 `stripe` 一个生产依赖 · Stripe Checkout 托管页（绝不自建 Elements，规避 PCI-DSS 范围）。

---

## 0. 范围界定

### 0.1 本计划解决什么 / 不解决什么

**解决：**

- 把 `profiles.plan` 字段从「形同虚设」升级为「由 Stripe 实付驱动的真实订阅状态」。
- 给 PRO 用户提供一条端到端的支付—回写—鉴权链路：Checkout → Webhook → Supabase → middleware 拦截。
- 用最小代码量证明商业模式可行；所有可延后的高级功能（退款、欠费追讨、税务、多币种、年付月付切换、家庭计划、礼品卡、推荐码、B2B 账单）一律不做。

**不解决（v1 明确排除，见 §9）：**

- 自动化退款 / refund webhook 处理
- 欠费追讨（dunning）邮件
- 销售税 / VAT / 多税务管辖区计算
- 多币种 / 汇率
- 月付 ↔ 年付切换 UI
- 家庭计划 / 团队席位
- 优惠券码（除非用户在 §0.2 确认要做）
- 试用期（除非用户在 §0.2 确认要做）
- B2B 发票 / Net30 账期
- 管理后台收入统计（属 [`1improve.md`](1improve.md) §14.3 的 `/admin` 路由，与本计划解耦）

### 0.2 待用户决策清单（写代码前必须回答）

> 直接摘自 [`doc/2gptimprove.md`](2gptimprove.md) §8 + §12 与 [`doc/2improve.md`](2improve.md) §9。**不替产品做猜测，等用户书面确认后再开 PR1。**

| # | 问题原文 | 出处 | 影响哪个 PR |
|---|---|---|---|
| Q1 | 是否要接 Stripe？ | 2gptimprove.md §8.1 + §12.5 | 全部 PR 是否启动 |
| Q2 | 免费用户和 PRO 用户具体差异是什么？ | 2gptimprove.md §8.2 | PR2（plan 字段语义）+ PR4（middleware 拦截路径） |
| Q3 | `/drive` 是否一定是 PRO？ | 2gptimprove.md §8.3 + §12.4 | PR4（middleware 拦截路径） |
| Q4 | AI 评分、TTS、mock 次数是否要限额？ | 2gptimprove.md §8.4 | 是否需要新增"配额表" — 若需要，单独排到 PR8（本计划默认不做） |
| Q5 | 是否需要优惠码、试用期、退款流程？ | 2gptimprove.md §8.5 | 是否在 Checkout Session 里传 `allow_promotion_codes` / `subscription_data.trial_period_days`；退款 webhook 是否处理 |
| Q6 | 定价模型：一次性买断 vs 订阅？月付 vs 年付？金额 USD？ | 2gptimprove.md §8 隐含 + 2improve.md §6 | PR1（Stripe Dashboard 建 Product/Price 时即固化） |
| Q7 | 升级入口放在哪里？侧边栏「升级 PRO」按钮 + 一个 `/pricing` 页面？ | 2gptimprove.md §8 步骤 6 | PR3（UI 入口） |
| Q8 | 免费用户访问 PRO 路由时：跳 `/pricing` 还是 inline 升级提示？ | 推断自 2gptimprove.md §8.6 | PR4（middleware 重定向目标） |

> ⚠️ **CLAUDE.md §1 明确禁止"hide confusion / silent assumption"。** 上述 8 个问题任一未答，对应 PR 都不开始。建议用户在本文件 §0.2 表格直接写答案，再进 §3。

### 0.3 假设清单（用户暂未回答前的临时默认，便于本计划自洽）

为让本文件**结构完整可阅读**，下方假设仅用于推演，**不构成实施前提**。任一假设被用户否决，对应 PR 必须返工。

- **A1**：Stripe 月付订阅模式（不做一次性买断、不做年付），单一 Price，USD。
- **A2**：免费 vs PRO 差异 = `/drive` 整路径仅 PRO 可见；`/mock` 仍对免费用户开放（v1 最小化拦截面）。
- **A3**：不做试用期、不做优惠码（Q5 → 否）。
- **A4**：不限速（Q4 → 否），现有 `lib/rate-limit.js` 的 OpenAI 调用限额对所有 plan 一视同仁。
- **A5**：升级入口 = 顶部/侧边栏一个 "Upgrade to PRO" 按钮 + 一个独立 `/pricing` 页（最简一行价格 + 一个 Checkout 按钮）。
- **A6**：免费用户访问 `/drive` 时，middleware → `302 /pricing?from=drive`。

---

## 1. 总体架构

### 1.1 数据流（文字时序图）

```
[未付费用户]
   │
   │  访问 /drive
   ▼
middleware.js  ── 读 Clerk userId ──▶ Supabase profiles.plan
   │                                       │
   │  plan='free'                          │
   ▼                                       │
302 → /pricing?from=drive                  │
                                           │
[/pricing 页]                              │
   │  点 "Upgrade to PRO"                  │
   ▼                                       │
POST /api/billing/checkout                 │
   │  (Clerk auth + Supabase 查/建         │
   │   stripe_customer_id)                 │
   ▼                                       │
stripe.checkout.sessions.create({          │
  mode: 'subscription',                    │
  customer: stripe_customer_id,            │
  line_items: [{ price: PRO_PRICE_ID }],   │
  success_url, cancel_url,                 │
  metadata: { clerk_user_id }              │
})                                         │
   │  → 返回 url                           │
   ▼                                       │
[浏览器跳转 Stripe Checkout 托管页]         │
   │  用户输入卡号（Stripe 域内，不入本站） │
   ▼                                       │
Stripe 后台事件触发                          │
   │                                       │
   ▼                                       │
POST /api/webhooks/stripe                  │
   │  1. stripe.webhooks.constructEvent     │
   │     (验签)                            │
   │  2. 查 stripe_events 表幂等            │
   │  3. 处理事件类型：                     │
   │     - checkout.session.completed       │
   │     - customer.subscription.updated    │
   │     - customer.subscription.deleted    │
   │     - invoice.payment_failed           │
   │  4. UPDATE profiles SET plan='pro'/    │
   │     'free' WHERE id=clerk_user_id      │
   │  5. INSERT stripe_events (event.id)    │
   ▼                                       │
[Supabase profiles.plan='pro'] ────────────┘

下次访问 /drive
   │
   ▼
middleware.js → plan='pro' → 放行
```

### 1.2 `profiles` 字段设计变更

现状（[`app/api/webhooks/clerk/route.js:36`](../app/api/webhooks/clerk/route.js#L36) 已自带 `plan: 'free'`）：

```
profiles
├── id                 text  (Clerk userId, PK)
├── email              text
├── language           text  default 'zh'
├── plan               text  default 'free'   ← 已存在
└── created_at         timestamptz
```

新增字段（PR2 迁移）：

```
profiles
├── stripe_customer_id      text  nullable   ← 新增（PR2）
├── stripe_subscription_id  text  nullable   ← 新增（PR2）
├── plan_renews_at          timestamptz nullable  ← 新增（PR2）
└── plan_status             text  default 'inactive'  ← 新增（PR2）
                            -- 取值：'active' | 'past_due' | 'canceled' | 'inactive'
```

新增表（PR5 webhook 幂等用）：

```
stripe_events
├── id          text   PK   -- Stripe event.id
└── received_at timestamptz default now()
```

### 1.3 路由 / 文件落点总览

| 类型 | 路径 | 来源 PR |
|---|---|---|
| 公开 | `app/pricing/page.js` | PR3 |
| 公开 | `app/billing/success/page.js`（Checkout `success_url` 回跳） | PR3 |
| 公开 | `app/billing/canceled/page.js`（Checkout `cancel_url` 回跳） | PR3 |
| API（已登录） | `app/api/billing/checkout/route.js` | PR3 |
| API（已登录） | `app/api/billing/portal/route.js`（Customer Portal 跳转） | PR6 |
| API（公开） | `app/api/webhooks/stripe/route.js` | PR5 |
| 库 | `lib/stripe.js` | PR1 |
| 库 | `lib/billing.js`（plan 读取 + 拦截判定辅助） | PR4 |
| 中间件 | `middleware.js`（拦截 PRO 路径） | PR4 |

### 1.4 服务端 vs 客户端职责（CLAUDE.md §3 外科手术式）

- **永远不在客户端组件**里读 / 写 `profiles.plan`；客户端只接收来自 server component 渲染的 `isPro` 布尔。
- 拦截一律在 **middleware** 或 **Server Component 顶部** 做；UI 上的"灰掉按钮"只是体验装饰，**不构成安全边界**。
- Stripe Secret Key、Webhook Secret 仅在 server route handler 里读取 `process.env`，绝不暴露给客户端 bundle。

---

## 2. 推荐技术栈与技能

### 2.1 Stripe 集成首选资源（全部 5 ⭐，来自 [`doc/skillsavi.md`](skillsavi.md) §10.6 修正条目）

| 资源 | 评级 | 用途 | 本计划中怎么用 |
|---|---|---|---|
| **Stripe 官方 MCP 服务器**（`mcp.stripe.com`） | 5 ⭐ | OAuth 认证的远程 MCP，Stripe 官方维护 | PR1 建 Product/Price、PR7 测试环境产品同步时用「自然语言指令」 |
| **`@stripe/mcp`** 本地 server | 5 ⭐ | `npx -y @stripe/mcp --api-key=sk_test_…` | 离线 / 受限网络环境替代远程 MCP |
| **`@stripe/agent-toolkit`** | 5 ⭐ | 官方 SDK，集成 Vercel AI SDK / LangChain | 本计划暂不用（不引入 AI agent 调用 Stripe） |
| **`stripe/ai` 仓库** | 5 ⭐ | Stripe 官方 AI 工具汇总 | 文档参考 |
| **`stripe` npm 包** | 5 ⭐ | Stripe Node.js SDK（官方） | **PR1 新增唯一生产依赖** |

### 2.2 ⚠️ 强烈不推荐

> 出自 [`doc/skillsavi.md`](skillsavi.md) §10.6 的明确更正：

| 资源 | 评级 | 不推荐原因 |
|---|---|---|
| ~~`wrsmith108/stripe-mcp-skill`~~ | **1 ⭐** | 1 个 commit，几乎无维护，[`skillsavi.md`](skillsavi.md) §5.1 旧版"核心推荐"已被 §10.6 撤回 |

### 2.3 本项目内建技能调用清单

| 技能 | 评级 | 用途 | 调用时机 |
|---|---|---|---|
| **`Plan` agent** | 5 ⭐ | 复杂决策点（如 webhook 幂等表 vs upsert 选型）可二次召唤 | PR5 设计前可选 |
| **`security-review`** skill | 5 ⭐ | webhook 签名验证 / 服务端拦截 / secret 泄露审查 | **PR4、PR5 提交前强制跑一次** |
| **`verify`** skill | 5 ⭐ | 用测试卡 `4242 4242 4242 4242` 走完整支付链路 | 每个 PR 提交前 |
| **`simplify`** skill | 5 ⭐ | 每个 PR 提交前自审，禁止"提前抽象" | 每个 PR 提交前 |
| **`run`** skill | 5 ⭐ | 启动 dev server + Stripe CLI webhook 转发 | 验证阶段 |

**本计划明确不引入**：`@stripe/agent-toolkit`、Vercel AI SDK、Anthropic SDK、`next-intl`、Tailwind、TypeScript、Prettier、Vitest、Playwright、Sentry SDK（均属其它阶段范围）。

---

## 3. 实施顺序（PR by PR）

> **核心交付物。** 按依赖顺序排列；每个 PR 必须独立可回滚、可灰度。**Q1（是否做 Stripe）= "是"** 之前，本节全部冻结。

### 3.0 总顺序速览

| PR | 目标 | 工时 | 风险 | 依赖 | 可单独回滚 |
|---|---|---:|---|---|---|
| **PR1** | 接入 `stripe` SDK + 环境变量骨架 + 一次性脚本对接 Stripe 测试模式 Product/Price | 0.5 天 | 🟢 低 | — | ✅ |
| **PR2** | Supabase 迁移：`profiles` 加 4 字段 + `stripe_events` 表 + RLS | 0.5 天 | 🟡 中（迁移） | PR1 | ✅（迁移可 down） |
| **PR3** | `/pricing` 页 + `app/api/billing/checkout` + 成功/取消页 | 1 天 | 🟡 中 | PR2 | ✅ |
| **PR4** | middleware + `lib/billing.js` 服务端拦截 `/drive`（按 A2/A6） | 0.5 天 | 🟠 中高（误伤付费用户） | PR2 | ✅ |
| **PR5** | `app/api/webhooks/stripe` + 幂等 + 4 类事件回写 | 1 天 | 🔴 高（金钱相关） | PR1+PR2 | ✅ |
| **PR6** | Customer Portal 入口（用户自助管理订阅 / 取消） | 0.5 天 | 🟢 低 | PR5 | ✅ |
| **PR7** | 测试模式端到端 QA 通过 + 文档（不动代码，仅 doc + Stripe CLI 验证） | 0.5 天 | 🟢 低 | PR6 | N/A |
| **PR8** | 生产 cutover：环境变量切 `sk_live_…` + Stripe 后台启用 live Webhook | 0.25 天 | 🔴 高（生产切换） | PR7 | ✅（env 切回测试） |

**合计：~4.75 天工时**（不含产品决策 / 法律 ToS / 隐私政策更新）。

---

### 3.1 PR1 —— 接入 Stripe SDK + 环境骨架

#### 目标

把 `stripe` 加入依赖、建立 `lib/stripe.js` 单例、定义所有 Stripe 相关环境变量、在 Stripe Dashboard 测试模式建好 Product + Price，**不写任何业务逻辑**。

#### 文件创建 / 修改

| 操作 | 路径 |
|---|---|
| 修改 | [`package.json`](../package.json) — 加 `"stripe": "^17.x"` |
| 新建 | `lib/stripe.js` |
| 修改 | `.env.local`（开发本地）— 加 4 个变量 |
| 修改 | [`AGENTS.md`](../AGENTS.md) "Stack" 段落 — 把 `Stripe ^17.x` 加入栈表（surgical：仅 1 行） |

#### 步骤

1. **依赖**：`npm install stripe@^17.0.0`（撰文时最新主版本，最低支持 Node 18）。
   - **验证**：`npm run build` 不退化。
2. **新建** `lib/stripe.js`：
   - 单例模式，避免在 dev hot-reload 时建立多个 Stripe 实例。
   - 显式锁定 API 版本（如 `'2024-12-18.acacia'`），避免 Stripe SDK 升级时行为漂移。
   - **验证**：在任一 route handler 内 `import { stripe } from '@/lib/stripe'` 不报错。
3. **环境变量**（[`AGENTS.md`](../AGENTS.md) "Env vars" 段落同步追加）：
   - `STRIPE_SECRET_KEY=sk_test_…`
   - `STRIPE_WEBHOOK_SECRET=whsec_…`（PR5 启用 Stripe CLI 时填）
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_…`（v1 不使用 Stripe.js，但保留以备 PR6 Portal 链接生成失败时 fallback）
   - `STRIPE_PRO_PRICE_ID=price_…`（PR1 在 Dashboard 创建后填入）
   - **验证**：`echo $STRIPE_SECRET_KEY` 仅以 `sk_test_` 开头；正则校验脚本可放 `lib/stripe.js` 顶部 `assert`（**只校验 prefix，不打印值**）。
4. **Stripe Dashboard 测试模式建 Product**（手动 / MCP）：
   - 用 **Stripe 官方 MCP**（5 ⭐）一句话："Create a recurring monthly product named CDL English Pro PRO, USD price per Q6 answer"。
   - 取回 `price_…` ID 填入 `STRIPE_PRO_PRICE_ID`。
   - **验证**：`stripe products list` / `stripe prices list` 能看到该价格。
5. **不写任何 API 路由 / UI**。

#### 风险与缓解

| 风险 | 缓解 |
|---|---|
| `stripe` 包体积影响 Vercel 冷启动 | 仅 server route 用，不进 client bundle；锁定 `apiVersion` 减少未来 SDK 兼容问题 |
| 误把 `sk_live_…` 写到 `.env.local` | 顶部 `assert` `sk_test_` 前缀；本 PR 显式只接受 test key |
| `STRIPE_PRO_PRICE_ID` 跨环境不一致（dev / staging / prod） | §3.8 PR8 cutover 时单独生成 live mode 价格；用同名 env var 不同值 |

#### 验收

- [ ] `npm run build` 通过且 client bundle size 无新增（Stripe 仅 server）。
- [ ] `lib/stripe.js` ≤ 30 行（CLAUDE.md §2）。
- [ ] `.env.example` 模板（如有则更新；无则 PR1 新建一个最小 `.env.example` 仅含 4 个新增 key 的占位符）。
- [ ] **`security-review` skill** 跑一次：确认 no secret in client bundle、no `process.env.STRIPE_SECRET_KEY` 被 `NEXT_PUBLIC_` 前缀化。

#### 回滚

```bash
npm uninstall stripe
rm lib/stripe.js
# 复原 .env.local 与 AGENTS.md
```

#### 预估 LoC

`lib/stripe.js` ≤ 30 行；`package.json` +1 行；`.env.example` +4 行。**净 +35 行 / -0**。

#### 提交

```bash
git add package.json package-lock.json lib/stripe.js .env.example AGENTS.md
git commit -m "feat(billing): add stripe SDK singleton and env scaffold (PR1 of Phase 6)"
```

---

### 3.2 PR2 —— Supabase 迁移

#### 目标

把 `profiles` 升级为可承载订阅状态；新增 `stripe_events` 表用于 webhook 幂等。

#### 文件创建 / 修改

| 操作 | 路径 |
|---|---|
| 新建 | `supabase/migrations/2026MMDDHHMM_add_stripe_fields.sql`（若项目用 Supabase CLI；否则手动 SQL 文件入 doc/） |
| 修改 | [`app/api/webhooks/clerk/route.js`](../app/api/webhooks/clerk/route.js) — `user.created` insert 时显式写 `plan_status: 'inactive'` 等默认值（**仅添加字段，不改逻辑**） |

#### SQL（PR2 主体）

详见 §4。

#### 步骤

1. **迁移 SQL**：见 §4.1 的完整 DDL；用 Supabase Studio 或 `supabase db push` 应用到测试 project。
   - **验证**：`select column_name from information_schema.columns where table_name='profiles'` 含 4 个新列。
2. **RLS 政策**：见 §4.2；新增列不应被客户端直接 SELECT；profiles 的 RLS 现状（用户读自己）保留，仅服务端用 service role 写。
   - **验证**：用 anon key 尝试 `select stripe_customer_id from profiles` 须被拒（或返空）。
3. **`stripe_events` 表**：详见 §4.3。仅服务端 service role 可写，公开角色不可读。
4. **Clerk webhook 同步**：现 `user.created` insert 只写 `id/email/language/plan/created_at`；本 PR 加入 `plan_status: 'inactive'` 显式默认，避免 NULL 歧义。
   - **验证**：删一个测试用户重新注册，profiles 行的 `plan_status='inactive'`。
5. **回填**（现网已有用户的 `plan_status` NULL 修复）：
   ```sql
   UPDATE profiles SET plan_status='inactive' WHERE plan_status IS NULL;
   ```

#### 风险与缓解

| 风险 | 缓解 |
|---|---|
| 迁移在生产 Supabase 失败回不来 | 迁移仅 `ADD COLUMN` + `CREATE TABLE`，全部可逆；先在测试 project 跑通 |
| RLS 配错导致客户端读到 `stripe_customer_id` | 不为 anon role 开 SELECT；只有 service role 写；客户端永远通过 server-rendered prop 拿 `isPro` 布尔，绝不直查 |
| Clerk webhook 改动破坏注册流程 | 仅添加默认值，不改字段名 / 删字段；先测试模式跑一遍 |

#### 验收

- [ ] `profiles` 表多出 4 列；`stripe_events` 表存在。
- [ ] anon key SELECT `stripe_customer_id` 返 0 行或被拒。
- [ ] 新注册测试用户的 `plan='free'`、`plan_status='inactive'`、`stripe_customer_id=NULL`。
- [ ] `npm run build` 通过。

#### 回滚

```sql
ALTER TABLE profiles DROP COLUMN stripe_customer_id;
ALTER TABLE profiles DROP COLUMN stripe_subscription_id;
ALTER TABLE profiles DROP COLUMN plan_renews_at;
ALTER TABLE profiles DROP COLUMN plan_status;
DROP TABLE stripe_events;
```

#### 预估 LoC

SQL ≤ 40 行;[`app/api/webhooks/clerk/route.js`](../app/api/webhooks/clerk/route.js) +1 字段。**净 +41 行 / -0**。

#### 提交

```bash
git add supabase/migrations/2026*_add_stripe_fields.sql \
        app/api/webhooks/clerk/route.js
git commit -m "feat(billing): add stripe_customer_id/subscription_id/plan_status to profiles + stripe_events table (PR2 of Phase 6)"
```

---

### 3.3 PR3 —— `/pricing` 页 + Checkout 创建端点

#### 目标

用户点 "Upgrade to PRO" → 服务端创建 Checkout Session → 浏览器跳到 Stripe 托管支付页 → 支付完成回跳 `/billing/success`。

#### 文件创建 / 修改

| 操作 | 路径 |
|---|---|
| 新建 | `app/pricing/page.js` — Server Component，渲染价格 + 一个 form 指向 `/api/billing/checkout` |
| 新建 | `app/api/billing/checkout/route.js` — POST，建 Checkout Session |
| 新建 | `app/billing/success/page.js` — Server Component，"支付成功"占位（v1 不展示订阅详情，避免与 webhook 竞态） |
| 新建 | `app/billing/canceled/page.js` — Server Component，"已取消"占位 |
| 修改 | [`components/AppShell.js`](../components/AppShell.js) — 在导航处加 "Upgrade" 链接（条件渲染：仅 `plan !== 'pro'` 时显示）。**注意：plan 必须由 layout/page 服务端读取后作 prop 传入，不在客户端直查 Supabase。** |

#### 步骤

1. **`app/pricing/page.js`**：
   - Server Component；顶部 `await auth()`：未登录跳 `/sign-in?redirect=/pricing`。
   - 已登录用户：渲染价格 + `<form action="/api/billing/checkout" method="POST"><button>Upgrade to PRO</button></form>`（**不用 client-side fetch + JS**，原生 form POST 最简、CSP 友好）。
   - 所有文案硬编码英文 + `// TODO: i18n in #16`（不引入 `next-intl`、不引入 `T`/`MT` 大对象 —— 全篇 ≤ 80 行）。
   - **验证**：未登录访问跳登录页；登录后渲染按钮。
2. **`app/api/billing/checkout/route.js`**：
   - `POST` handler。
   - 步骤：
     1. `const { userId } = await auth()`；未登录 401。
     2. `const db = createServerClient()` 从 profiles 查该用户。
     3. 若 `stripe_customer_id` 为空 → `stripe.customers.create({ email: profile.email, metadata: { clerk_user_id: userId } })` → 写回 profiles。
     4. `stripe.checkout.sessions.create({ mode: 'subscription', customer, line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }], success_url: …/billing/success, cancel_url: …/billing/canceled, metadata: { clerk_user_id: userId }, allow_promotion_codes: false })`。
     5. **重要：origin URL 拼接** —— `req.headers.get('origin')` 优先；fallback 用 `process.env.NEXT_PUBLIC_APP_URL`。
     6. 返回 `Response.redirect(session.url, 303)`。
   - **不**在此处直接更新 `profiles.plan = 'pro'` —— 只有 webhook 收到 `checkout.session.completed` 后才升级。这是幂等性 + 防"用户跳过支付页"漏洞的关键。
   - **验证**：POST 该端点（curl 带 Clerk session）→ 303 跳 `checkout.stripe.com/c/pay/…`。
3. **`app/billing/success/page.js`**：
   - Server Component，渲染"正在激活你的订阅，几秒后请刷新本页"。**不**轮询、不展示订阅详情（避免与 webhook 处理竞态——webhook 可能在用户跳回前还没到）。
   - 提供一个"返回首页"链接。
4. **`app/billing/canceled/page.js`**：
   - Server Component，渲染"已取消，未扣款"。链接回 `/pricing`。
5. **AppShell 链接**：
   - `AppShell` 当前是 Client Component（依据 [`components/AppShell.js`](../components/AppShell.js)）。`plan` 不能在 client 直查；改 layout：
     - **方案 A（推荐）**：[`app/layout.js`](../app/layout.js) 已是 Server Component；改为在 layout 里 `await auth()` + 查 profiles，把 `isPro` 作 prop 传给 AppShell。
     - 仅当 `isPro=false` 时 AppShell 渲染 "Upgrade" 链接（普通 `<Link href="/pricing">`，无 JS）。
   - **风险**：layout 增加一次 Supabase 查询会拉低所有页面 TTFB。缓解：使用一个 5 秒进程内缓存（`Map<userId, {plan, ts}>`）—— 但本计划 §2 极简原则下，先不加缓存，待 PR8 上线后用 Vercel Analytics 看数据再优化。

#### 风险与缓解

| 风险 | 缓解 |
|---|---|
| 已有 `stripe_customer_id` 的用户被重复创建 customer | step 3 之前必查 profiles；只在 NULL 时建 |
| `success_url` 拼接错误（生产 vs dev） | 同时支持 `req.headers.get('origin')` 与 `NEXT_PUBLIC_APP_URL`，单元测试覆盖（PR7） |
| 用户在 Checkout 页关掉而非取消 → 没回 `cancel_url` | Stripe 自动过期 session，无副作用；profiles.plan 仍 'free' |
| `AppShell` 改造导致 layout 每页多一次 DB 查询 | 暂不加缓存（CLAUDE.md §2）；监控 TTFB 后再决定 |
| Origin header 在某些代理后丢失 | 显式 fallback 到 `NEXT_PUBLIC_APP_URL`；本地 dev 时此 env var 必填 `http://localhost:3000` |

#### 验收

- [ ] 未登录访问 `/pricing` → 跳 `/sign-in`。
- [ ] 登录后点 "Upgrade to PRO" → 浏览器跳 `checkout.stripe.com`。
- [ ] 用测试卡 `4242 4242 4242 4242` + 任意 CVC + 未来日期 → 跳 `/billing/success`。
- [ ] 此时（webhook 尚未实现，PR5 完成前）profiles.plan 仍 'free' —— **这是预期**。
- [ ] 点 Checkout 页 "← Back" → 跳 `/billing/canceled`。
- [ ] AppShell 在 plan='free' 时显示 Upgrade 链接；plan='pro' 时不显示。
- [ ] `npm run build` 通过。
- [ ] **`simplify` skill** 自审：`app/pricing/page.js` ≤ 80 行，`app/api/billing/checkout/route.js` ≤ 100 行。

#### 回滚

```bash
rm -rf app/pricing app/billing app/api/billing
git checkout -- components/AppShell.js app/layout.js
```

#### 预估 LoC

新增约 230 行；AppShell + layout 修改 +30 / -5。**净 +255**。

#### 提交

```bash
git add app/pricing app/billing app/api/billing components/AppShell.js app/layout.js
git commit -m "feat(billing): add /pricing page and Stripe Checkout session endpoint (PR3 of Phase 6)"
```

---

### 3.4 PR4 —— middleware 服务端拦截 PRO 路由

#### 目标

按 **A2**：免费用户访问 `/drive` 一律 302 → `/pricing?from=drive`；PRO 用户放行。**安全边界仅在服务端**。

#### 文件创建 / 修改

| 操作 | 路径 |
|---|---|
| 新建 | `lib/billing.js` — 导出 `getPlan(userId)` / `isProRoute(pathname)` |
| 修改 | [`middleware.js`](../middleware.js) — 增加 PRO 路由拦截分支 |
| 修改 | [`app/drive/page.js`](../app/drive/page.js) — 顶部加 server-side 守卫（双层保险，应对 middleware 旁路风险） |

#### 步骤

1. **`lib/billing.js`**：
   - `export const PRO_ROUTES = ['/drive']`（A2，单一来源；未来增 PRO 路由只动这一行）。
   - `export function isProRoute(pathname) { return PRO_ROUTES.some(r => pathname.startsWith(r)) }`。
   - `export async function getPlan(userId)` — 用 service-role Supabase 查 profiles.plan + plan_status；返回 `{ plan, planStatus, isPro: plan === 'pro' && planStatus === 'active' }`。
   - **不缓存**（CLAUDE.md §2）；后续若 hot path 性能不达标再加 in-memory LRU。
2. **`middleware.js`** 改造：
   - 现状（13 行）极简，只做 `auth.protect()`。本 PR 在 `clerkMiddleware` 回调内追加：
     ```js
     if (isProtected(req)) await auth.protect()
     if (isProRoute(req.nextUrl.pathname)) {
       const { userId } = await auth()
       const { isPro } = await getPlan(userId)
       if (!isPro) {
         const url = req.nextUrl.clone()
         url.pathname = '/pricing'
         url.searchParams.set('from', 'drive')
         return NextResponse.redirect(url)
       }
     }
     ```
   - ⚠️ **runtime: 'nodejs'** 已在 `config` 中（[`middleware.js:16`](../middleware.js#L16)），允许使用 `@supabase/supabase-js`；不要回退到 Edge。
3. **`app/drive/page.js`** 顶部守卫：
   - 即便 middleware 误放行（部署偶发、矩阵配置漂移），server component 顶部再查一次 plan，未付费则 `redirect('/pricing?from=drive')`。
   - 这是双层防御，**不算过度抽象**——金钱相关路径必须双保险。
4. **不动客户端 UI**：不在 `AppShell` 隐藏 `/drive` 链接（避免暴露"哪些功能是 PRO"的产品决策给免费用户的更隐蔽体验：依赖产品决定，本 PR 默认全部显示，点击后再拦截）。

#### 风险与缓解

| 风险 | 缓解 |
|---|---|
| **误伤付费用户**（webhook 延迟导致 `plan` 还没翻到 'pro' 就访问 /drive） | webhook 收到 `checkout.session.completed` 后立即 UPDATE profiles；用户回跳 `/billing/success` 页提示"几秒后刷新"；middleware 拦截重定向 `/pricing` 时附 `from=drive`，pricing 页可读 query 提示"如刚支付完成，请稍候重试" |
| middleware 每次请求都查 Supabase → 性能 | 仅在 `isProRoute` 命中时查；非 PRO 路由零开销 |
| middleware 抛错导致全站 500 | `getPlan` 内 try/catch；DB 不可达时 fallback `isPro=false`（"宁可少给体验，不可少收钱"原则） |
| Edge Runtime 误配置导致 supabase-js 无法运行 | [`middleware.js:16`](../middleware.js#L16) 已硬编 `runtime: 'nodejs'`；提交前 `grep -rn "edge" middleware.js` 确认无残留 |

#### 验收

- [ ] **`security-review` skill** 跑一次：确认拦截位于服务端、无客户端绕过、无 plan 字段经 client API 返回。
- [ ] free 用户访问 `/drive` → 302 → `/pricing?from=drive`。
- [ ] PR3 走完支付（PR5 完成后 webhook 升级 plan） → 重新访问 `/drive` → 正常进入。
- [ ] 手动在 Supabase 把测试用户 `plan_status` 改 `'canceled'` → middleware 立即拦截。
- [ ] `/practice` / `/signs` / `/mock` 路径**不受影响**(A2)。
- [ ] `npm run build` 通过。

#### 回滚

```bash
git checkout -- middleware.js app/drive/page.js
rm lib/billing.js
```

#### 预估 LoC

`lib/billing.js` ≤ 60 行；`middleware.js` +20；`app/drive/page.js` +12 顶部守卫。**净 +92**。

#### 提交

```bash
git add lib/billing.js middleware.js app/drive/page.js
git commit -m "feat(billing): gate /drive on profiles.plan via middleware + server-side guard (PR4 of Phase 6)"
```

---

### 3.5 PR5 —— Stripe Webhook + 幂等

#### 目标

接 Stripe 4 类事件，把订阅状态回写 `profiles`；同一事件重复推送绝不双重计费 / 双重升级。

#### 文件创建 / 修改

| 操作 | 路径 |
|---|---|
| 新建 | `app/api/webhooks/stripe/route.js` |
| 修改 | [`middleware.js`](../middleware.js) `isProtected` 配置 —— **必须**确保 `/api/webhooks/stripe` **不**进 `isProtected`（Stripe 推送无 Clerk session） |

#### 步骤

1. **route handler 骨架**：
   - `export const runtime = 'nodejs'`（确保非 Edge，因为要 raw body）。
   - `export const dynamic = 'force-dynamic'`。
   - **关键：raw body** —— Stripe 签名校验需要 raw bytes，不能用 `req.json()`。用 `await req.text()`。
2. **验签**：
   ```js
   let event
   try {
     event = stripe.webhooks.constructEvent(
       rawBody,
       req.headers.get('stripe-signature'),
       process.env.STRIPE_WEBHOOK_SECRET
     )
   } catch (err) {
     return new Response('Invalid signature', { status: 400 })
   }
   ```
3. **幂等检查**（详见 §5）：
   ```js
   const { error: dupErr } = await db.from('stripe_events').insert({ id: event.id })
   if (dupErr?.code === '23505') {
     return new Response('Already processed', { status: 200 })
   }
   ```
4. **事件分发**（4 类，源自 [`doc/2gptimprove.md`](2gptimprove.md) §8 验收标准"支付成功后用户权限自动更新 / 取消订阅后权限按规则降级"）：

   | event.type | 动作 |
   |---|---|
   | `checkout.session.completed` | 从 `event.data.object.metadata.clerk_user_id` 取 userId；UPDATE profiles SET `plan='pro'`, `plan_status='active'`, `stripe_subscription_id=…`, `plan_renews_at=current_period_end` |
   | `customer.subscription.updated` | 用 `event.data.object.status` 同步 `plan_status`（active / past_due / canceled）；`current_period_end` 同步 `plan_renews_at` |
   | `customer.subscription.deleted` | UPDATE profiles SET `plan='free'`, `plan_status='canceled'`, `stripe_subscription_id=NULL`, `plan_renews_at=NULL` |
   | `invoice.payment_failed` | UPDATE profiles SET `plan_status='past_due'`（**不立即降级到 free** —— Stripe 会自动重试 3 次；最终失败时会触发 `customer.subscription.deleted`） |

5. **userId 查找**：优先 `metadata.clerk_user_id`；若缺失（如手动操作），通过 `customer` ID 反查 profiles 的 `stripe_customer_id`。
6. **错误处理**：DB 写失败时返回 `500`，让 Stripe 自动重试（Stripe 默认重试 72 小时）。**重要：500 之前不能已 INSERT `stripe_events`**——否则重试时被幂等表挡掉。所以 `stripe_events` 的 INSERT 必须在 profiles UPDATE 成功 *之后*（或用单一事务）。
   - **本 PR 选**：先 UPDATE，成功后再 INSERT `stripe_events`；UPDATE 失败返 500，Stripe 重试。
   - **副作用**：极小概率同一 event 触发两次 UPDATE，但 UPDATE 是幂等的（相同字段写相同值），可接受。
7. **绝不**在日志里打印 `event.data.object` 整体（含卡 BIN / IP 等）—— 仅记录 `event.id` + `event.type` + `clerk_user_id`。
8. **middleware 排除**：`isProtected` 当前未含 `/api/webhooks`；本 PR 加显式注释"`/api/webhooks/*` MUST stay public"。

#### 风险与缓解

| 风险 | 缓解 |
|---|---|
| 重复事件双重升级 | §5 的 `stripe_events` 唯一索引 |
| Race condition：UPDATE 完成但 INSERT events 失败 → 重试时只是相同 UPDATE 再跑一次 | UPDATE 幂等，可接受；监控 `stripe_events` 表的"长时间 NULL"行 |
| 签名校验绕过（攻击者伪造） | `constructEvent` 强制使用 `STRIPE_WEBHOOK_SECRET`；本地 dev 用 Stripe CLI `stripe listen` 自动生成测试 secret |
| 服务端误用 anon key 写 profiles | `lib/supabase/server.js` 已用 `SUPABASE_SERVICE_ROLE_KEY` |
| webhook 端点被错误地放进 `isProtected` | 提交前 `grep -n "webhooks" middleware.js` 复查 |
| Edge Runtime 干扰 raw body | 顶部 `export const runtime = 'nodejs'` 显式声明 |

#### 验收

- [ ] **`security-review` skill** 跑一次。
- [ ] Stripe CLI 本地：`stripe listen --forward-to localhost:3000/api/webhooks/stripe`，触发 `stripe trigger checkout.session.completed` → profiles.plan 翻 'pro'。
- [ ] **同一 event 重发两次**（CLI `--load-from-cache`） → 第二次返 200 + "Already processed"；profiles 无变化。
- [ ] 用测试卡 `4000 0000 0000 0341`（支付失败卡） → `invoice.payment_failed` → `plan_status='past_due'`，`plan` 仍 'pro'。
- [ ] 用测试卡 `4000 0000 0000 0259`（争议卡）暂不处理 —— 范围外。
- [ ] 模拟订阅取消 `stripe trigger customer.subscription.deleted` → profiles.plan 回 'free'，`plan_status='canceled'`。
- [ ] 重新访问 `/drive` 被 middleware 拦回 `/pricing`（与 PR4 串通）。
- [ ] `npm run build` 通过。

#### 回滚

```bash
rm -rf app/api/webhooks/stripe
# Stripe Dashboard 后台禁用 webhook endpoint
```

#### 预估 LoC

`app/api/webhooks/stripe/route.js` ≤ 140 行。**净 +140**。

#### 提交

```bash
git add app/api/webhooks/stripe/route.js middleware.js
git commit -m "feat(billing): add Stripe webhook with idempotency and plan sync (PR5 of Phase 6)"
```

---

### 3.6 PR6 —— Customer Portal 入口

#### 目标

PRO 用户能自助管理订阅（取消 / 更新卡 / 看发票），无需联系客服。

#### 文件创建 / 修改

| 操作 | 路径 |
|---|---|
| 新建 | `app/api/billing/portal/route.js` — POST，返回 `stripe.billingPortal.sessions.create(...)` 的 url |
| 修改 | [`components/AppShell.js`](../components/AppShell.js) 或 `app/account/page.js`（新建） — "Manage subscription" 链接 form |

#### 步骤

1. **`app/api/billing/portal/route.js`** —— 类似 PR3 的 checkout 端点，区别：
   - `stripe.billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: …/account })`
   - 没 customer 则 400（"Subscribe first"）。
2. **入口位置**（与产品 Q7 关联，本 PR 假设 A5）：
   - 最简：`AppShell` 中 `isPro=true` 时把 "Upgrade" 替换为 "Manage subscription"（form POST → `/api/billing/portal`）。
   - 可选：新建 `app/account/page.js` 集中所有账户操作。本 PR 默认选最简方案。
3. **Stripe Dashboard 配置**：Portal 中开启 "Cancel subscription"、"Update payment method"；禁用 "Switch plan"（v1 单一价格）。

#### 风险与缓解

| 风险 | 缓解 |
|---|---|
| 用户在 Portal 取消订阅 → Stripe 推送 `customer.subscription.deleted` → PR5 自动降级 | 这是预期，已被 PR5 覆盖 |
| Portal `return_url` 错误 | 同 PR3 的 origin/env 双 fallback |

#### 验收

- [ ] PRO 用户点 "Manage subscription" → 跳 Stripe Portal。
- [ ] Portal 中取消订阅 → 几秒后 profiles.plan 回 'free'。
- [ ] **重新访问** `/drive` → 被拦回 `/pricing`。

#### 预估 LoC

约 70 行。

#### 提交

```bash
git add app/api/billing/portal/route.js components/AppShell.js
git commit -m "feat(billing): add Customer Portal self-serve subscription management (PR6 of Phase 6)"
```

---

### 3.7 PR7 —— 端到端 QA + 文档

#### 目标

不改代码，仅按 §7 测试方案跑一遍完整链路；在 `doc/4claudelog?.md` 追加 action 记录；在 `AGENTS.md` 补 "Billing" 段。

#### 步骤

1. 执行 §7 的全部用例。
2. 把任一失败用例修复 → 单独小 PR 不进本计划。
3. 文档：
   - [`AGENTS.md`](../AGENTS.md) 增 "Billing" 段（≤ 40 行），列出环境变量、关键路由、webhook URL、Customer Portal 入口。
   - `doc/4claudelog?.md` 追加本次 actions。

#### 验收

- [ ] §7 全部用例通过。
- [ ] `AGENTS.md` 更新提交。

#### 提交

```bash
git add AGENTS.md doc/4claudelog?.md
git commit -m "doc(billing): document Stripe integration env, routes, webhook (PR7 of Phase 6)"
```

---

### 3.8 PR8 —— 生产 cutover

#### 目标

把测试模式切换到 live 模式，对外可收钱。**单独小 PR，仅改 env + Stripe 后台。**

#### 步骤

1. Stripe Dashboard live 模式建同名 Product / Price → 取 live `price_…`。
2. Vercel 环境变量（Production scope only）：
   - `STRIPE_SECRET_KEY=sk_live_…`
   - `STRIPE_WEBHOOK_SECRET=whsec_live_…`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_…`
   - `STRIPE_PRO_PRICE_ID=price_live_…`
3. Stripe Dashboard 后台 → Webhooks → 新建 Endpoint `https://<prod-domain>/api/webhooks/stripe`，订阅 4 类事件；复制 signing secret。
4. **保留 staging/preview 环境的 test key**（Vercel scope 设 "Preview" 与 "Development" 仍用 test key）。
5. 用真实卡（自己的卡）走一次最小金额（订阅一次 → 立即 Portal 取消，确认全链路无误后）。
6. 法律前置：**确保已上线 / 已更新**：Terms of Service、Privacy Policy（提及 Stripe 处理付款）、退款政策（即便 v1 不自动化退款，也要写明手工退款流程的联系方式）。本步骤不写代码，但必须存在。

#### 风险与缓解

| 风险 | 缓解 |
|---|---|
| 把 live key 误填到 Development scope | Vercel scope 分明配置；本地 `.env.local` 仍只接受 `sk_test_` 前缀（PR1 的 assert） |
| Webhook secret 写错 → 所有事件 400 | 上线后 5 分钟内手动 trigger 一笔最小金额验证 |
| 法律条款缺失 | 列入"产品上线门禁清单"，未完成不发推广 |

#### 提交

```bash
# 代码层无变更；仅 Vercel env + Stripe Dashboard 配置
# Git 层只追加一条 changelog
git add doc/4claudelog?.md
git commit -m "release(billing): production cutover to Stripe live mode (PR8 of Phase 6)"
```

---

## 4. 数据库迁移

### 4.1 `profiles` 加列

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS plan_renews_at         timestamptz,
  ADD COLUMN IF NOT EXISTS plan_status            text NOT NULL DEFAULT 'inactive';

-- 唯一索引：一个 Stripe customer 对应一个 profile
CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_key
  ON profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- 回填现有用户
UPDATE profiles SET plan_status = 'inactive' WHERE plan_status IS NULL;
```

### 4.2 RLS 政策（关键安全边界）

```sql
-- 假设 profiles 已开启 RLS（按 1improve.md §15 模板）
-- 关键：anon role 不应能读到 stripe_* / plan_status
-- 现有 "Users own data" policy 若是 SELECT *，则用户能读自己的 stripe_customer_id —— 可接受（不是秘密）
-- 但绝不允许 anon 跨用户读：
DROP POLICY IF EXISTS "Users own data" ON profiles;
CREATE POLICY "profiles_self_read" ON profiles
  FOR SELECT USING (auth.uid()::text = id);

-- service role（webhook 用）绕过 RLS — Supabase 默认行为，无需额外 policy
-- 客户端写 plan 必须被拒：
CREATE POLICY "profiles_self_update_language_only" ON profiles
  FOR UPDATE USING (auth.uid()::text = id)
  WITH CHECK (
    -- 只允许更新 language；其它字段（plan, stripe_*, plan_status）必须由 service role 写
    auth.uid()::text = id
  );
-- 注：Supabase 不直接支持"列级"WITH CHECK，下方落到 server route 层做白名单过滤
```

> **简化策略**：客户端永远不直接写 profiles；所有写都过 server route（service role）。RLS 仅保护读。这是 v1 最简方案。

### 4.3 `stripe_events` 表（幂等）

```sql
CREATE TABLE IF NOT EXISTS stripe_events (
  id          text PRIMARY KEY,            -- Stripe event.id（unique constraint 即幂等门）
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
-- 不为 anon / authenticated 加 policy → 默认全拒；只有 service role 能写

CREATE INDEX IF NOT EXISTS stripe_events_received_at_idx
  ON stripe_events(received_at DESC);
-- 用途：未来按时间窗口清理（30 天前可删）
```

---

## 5. Webhook 幂等性方案

### 5.1 设计选择

> [`doc/2gptimprove.md`](2gptimprove.md) §8 验收标准明确"Webhook 可重复调用且幂等"。两种方案对比：

| 方案 | 优点 | 缺点 | 本计划选择 |
|---|---|---|---|
| **A. event_id 去重表**（`stripe_events`） | 显式、可观测、可审计 | 多一次 DB 写 | ✅ **选这个** |
| B. upsert + 状态比较（如 "若 profiles.stripe_subscription_id 已等于本 event 的值则跳过"） | 少一张表 | 难以处理 `subscription.updated` 这种"同 sub_id 但状态变化"的事件；不可审计 | ❌ |

### 5.2 实施模式

```js
// app/api/webhooks/stripe/route.js 关键片段
const event = stripe.webhooks.constructEvent(rawBody, sig, secret)

const db = createServerClient()

// 1. 处理业务（UPDATE profiles）
try {
  await dispatch(event, db)  // 内部 switch 4 类事件
} catch (e) {
  console.error('webhook handler error', { eventId: event.id, type: event.type, err: e.message })
  return new Response('handler error', { status: 500 })  // Stripe 自动重试
}

// 2. 业务成功后才标记已处理
const { error: dupErr } = await db
  .from('stripe_events')
  .insert({ id: event.id })

if (dupErr && dupErr.code !== '23505') {
  // 23505 = unique violation = 这条事件之前已处理；忽略
  console.error('event dedup insert failed', { eventId: event.id, err: dupErr.message })
  // 不返 500：业务已成功，重试只会再走一遍幂等的 UPDATE
}

return new Response('OK', { status: 200 })
```

### 5.3 顺序权衡

- **业务先 → 去重表后**：极小概率重复处理（UPDATE 幂等可吸收）。
- **去重表先 → 业务后**：若业务失败而 Stripe 重试，会被去重表挡掉 → 永远处理不了。**严格禁止**。

---

## 6. 权限拦截（服务端 only）

### 6.1 三层防御

| 层 | 文件 | 职责 |
|---|---|---|
| L1（边界） | [`middleware.js`](../middleware.js) | 拦截未授权访问 PRO 路由 → 302 |
| L2（页面） | [`app/drive/page.js`](../app/drive/page.js) 顶部 `await auth()` + `getPlan()` + `redirect()` | middleware 失效兜底 |
| L3（API） | 任何 PRO 特有 API 端点（v1 无）的顶部检查 | v1 无 PRO 独占 API；未来若有需照此模式 |

### 6.2 反模式（明确禁止）

- ❌ 在 client component 里用 `useUser()` 然后 fetch `/api/me/plan` 来决定是否渲染 `/drive`。**这是体验装饰，不是边界。**
- ❌ 把 `profiles.plan` 通过 `NEXT_PUBLIC_` 环境变量或 cookie 暴露到 client。
- ❌ 用 `useEffect` 在客户端 redirect —— 用户已加载到 PRO 页面 JS。
- ❌ 在客户端缓存 plan 决策超过 60 秒 —— 取消订阅后用户能继续用直到缓存过期。

### 6.3 误伤付费用户的 grace period

- Stripe webhook 通常在 100ms 内送达，但偶有延迟。
- `/billing/success` 页文案明示"几秒后请刷新"。
- middleware 拦截到 `/drive` 且 query 含 `from=drive` 且 referer 是 `/billing/success` 时，pricing 页可显示"如刚支付完成，请刷新后重试"。
- 不实现自动轮询（避免新代码路径）；等用户主动刷新即可。

---

## 7. 测试方案

### 7.1 本地 Stripe CLI 配置

```bash
# 一次性
brew install stripe/stripe-cli/stripe
stripe login

# 每次开发
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# → 输出 whsec_... 复制到 .env.local 的 STRIPE_WEBHOOK_SECRET
```

### 7.2 Stripe 测试卡矩阵

| 卡号 | 用途 | 期望结果 |
|---|---|---|
| `4242 4242 4242 4242` | 通用成功 | `checkout.session.completed` → plan='pro' |
| `4000 0000 0000 9995` | 卡余额不足 | Checkout 直接拒绝；无 webhook |
| `4000 0000 0000 0341` | 第一次扣款失败 | `invoice.payment_failed` → `plan_status='past_due'` |
| `4000 0000 0000 0259` | 争议（chargeback） | v1 不处理 |
| `4000 0027 6000 3184` | 3D Secure 验证 | 测试 PSD2 流程；Checkout 自动处理 |

### 7.3 端到端用例（PR7 一次性跑）

| # | 场景 | 步骤 | 期望 |
|---|---|---|---|
| T1 | 完整购买 | 注册新用户 → /pricing → 4242 → success | plan='pro' / plan_status='active' / 可进 /drive |
| T2 | 取消（用户主动） | T1 完成后 → Portal → Cancel | plan='free' / 不能进 /drive |
| T3 | 失败扣款 | 用 0341 → success（Checkout 视为成功） → 立即触发 `invoice.payment_failed` | plan_status='past_due' / 仍可进 /drive |
| T4 | 重复 webhook | Stripe CLI `--load-from-cache` 重发 T1 事件 | 第二次 200 + 无副作用 |
| T5 | 未登录拦截 | 登出 → /pricing | 302 /sign-in |
| T6 | 免费用户拦截 | 未付费 → /drive | 302 /pricing?from=drive |
| T7 | 已付费免拦截 | T1 状态 → /drive | 正常进入 |
| T8 | webhook 签名错误 | curl POST /api/webhooks/stripe 带错的 stripe-signature | 400 |
| T9 | webhook secret 缺失 | unset STRIPE_WEBHOOK_SECRET 重启 | 500（启动失败或 webhook 拒绝） |
| T10 | client 不能直查 plan | DevTools → fetch('/api/me/plan') | 该端点不存在 / 404 |

### 7.4 不在测试范围（明确排除）

- 真实银行卡的 PSD2 全流程（用 3DS 测试卡足够）
- 跨币种 / 跨国家
- 不同税率
- 长期重试（Stripe 默认 72 小时重试，本地难以模拟）

---

## 8. 风险预警表

| 类别 | 风险 | 出现概率 | 影响 | 缓解动作 |
|---|---|---|---|---|
| **安全** | Webhook 签名未验证 → 攻击者伪造升级 | 低（编码错误） | 极高（白嫖 PRO） | `stripe.webhooks.constructEvent` 强制；`security-review` skill 跑 PR5 |
| **安全** | 服务端 secret 进 client bundle | 低 | 极高（账号被洗） | 仅 server route 用；PR1 assert 前缀；不用 `NEXT_PUBLIC_` 标记 secret |
| **安全** | RLS 配错让 anon 读他人 `stripe_customer_id` | 中 | 中（信息泄露） | §4.2 自审 policy；PR2 验收用 anon key 试读 |
| **安全** | PCI-DSS 范围扩大 | 低（使用 Checkout） | 高（合规成本） | 严格使用 Stripe Checkout（托管）；绝不引入 Stripe.js Elements |
| **安全** | webhook 端点被卷入 Clerk auth → 永远 401 | 中（配置漂移） | 高（升级失败） | PR5 中 `isProtected` 排除显式注释；提交前 grep 验证 |
| **安全** | 日志中泄露持卡人信息 | 低 | 高 | 仅日志 `event.id / event.type / clerk_user_id`；绝不 `JSON.stringify(event.data)` |
| **产品** | 退款流程未自动化 | 高 | 中（人工成本） | v1 明示手工退款（ToS 写明 24h 内回邮）；PR8 上线前 ToS 必备 |
| **产品** | 法律条款（ToS / Privacy / 退款政策）缺失 | 中 | 高（合规 / 信任） | PR8 前置门禁 |
| **产品** | 用户取消订阅后立即失去访问 → 投诉 | 中 | 中 | 当前实现：取消立即降级（Stripe `cancel_at_period_end=false` 模式）；若投诉，改为 `cancel_at_period_end=true`（单独小 PR） |
| **运维** | Stripe key 轮换流程未文档化 | 中 | 中 | PR7 文档列轮换 SOP：先添加新 key 到 env → 部署 → 撤销旧 key |
| **运维** | webhook URL 变化（域名迁移）未同步 Stripe Dashboard | 低 | 高（事件丢失） | 域名迁移 runbook 加一行；Stripe 后台启用"Failed events"告警 |
| **运维** | 误伤付费用户（webhook 延迟） | 中（首次购买） | 中 | grace period（§6.3） |
| **运维** | live mode env 被同步到 preview 环境 | 中 | 极高（真扣钱） | Vercel scope 严格区分 Production / Preview / Development |
| **工程** | 客户端误读 plan 字段 | 中 | 中（绕过失败但增加表面） | PR4 明确"plan 永不进 client API"；security-review 把关 |
| **工程** | middleware 抛错全站 500 | 低 | 极高 | `getPlan` 内 try/catch；DB 不可达时默认 `isPro=false` |
| **工程** | Edge runtime 偶发回归 | 低（已锁 Node） | 高 | 提交前 `grep -rn "runtime" middleware.js app/api/webhooks/stripe/` 复查 |

---

## 9. 不在范围内（明确排除，按 CLAUDE.md §2 极简原则）

> 以下功能均**不在三份源文档明确要求中**，本计划一律不做。任一项被产品要求，单独立项。

| 功能 | 不做的原因 |
|---|---|
| 自动化退款 webhook (`charge.refunded`) | 2gptimprove.md §8.5 标为待决策；v1 明示手工流程 |
| 欠费追讨（dunning）邮件 | 不在源文档；Stripe 后台内置基础 dunning 邮件可启用，无需代码 |
| 销售税 / VAT 自动计算 | 不在源文档；Stripe Tax 可后续启用，纯配置 |
| 多币种 | 不在源文档；A1 锁定 USD |
| 月付 / 年付切换 UI | 不在源文档；A1 锁定月付 |
| 家庭计划 / 多席位 | 不在源文档 |
| 礼品卡 / 推荐码 / 邀请奖励 | 不在源文档 |
| 优惠券码 | Q5 待决策；默认 A3 关闭 |
| 试用期 | Q5 待决策；默认 A3 关闭 |
| 配额限额（mock 次数 / AI 调用） | Q4 待决策；默认 A4 关闭 |
| 管理后台收入统计 / 退款工单 | 属 [`1improve.md`](1improve.md) §14.3 `/admin` 路由，独立项 |
| Stripe Tax 启用 | 配置项，不写代码 |
| 实时升级提示（WebSocket / SSE） | 用 grace period + 用户主动刷新替代 |
| i18n 支付页文案 | 等 #16 i18n 集中化完成；v1 全英文硬编码 + `// TODO: i18n in #16` |
| Stripe Apple Pay / Google Pay 按钮 | Checkout 自动支持，无需额外代码 |
| 发票自定义 PDF logo | Stripe 后台配置，不写代码 |

---

## 10. Github 提交命令（按 PR 顺序，复制即用）

> ⚠️ **未经用户明确同意之前不要 `git push`。** 参见 [`CLAUDE.md`](../CLAUDE.md) / [`AGENTS.md`](../AGENTS.md) 关于"shared state"和"hard-to-reverse operations"的提醒。

```bash
# ============================================================
# PR1：Stripe SDK 接入 + 环境骨架
# ============================================================
git add package.json package-lock.json lib/stripe.js .env.example AGENTS.md
git commit -m "feat(billing): add stripe SDK singleton and env scaffold (PR1 of Phase 6)"

# ============================================================
# PR2：Supabase 迁移
# ============================================================
git add supabase/migrations/2026*_add_stripe_fields.sql \
        app/api/webhooks/clerk/route.js
git commit -m "feat(billing): add stripe_customer_id/subscription_id/plan_status to profiles + stripe_events table (PR2 of Phase 6)"

# ============================================================
# PR3：/pricing 页 + Checkout 端点
# ============================================================
git add app/pricing app/billing app/api/billing \
        components/AppShell.js app/layout.js
git commit -m "feat(billing): add /pricing page and Stripe Checkout session endpoint (PR3 of Phase 6)"

# ============================================================
# PR4：middleware 拦截
# ============================================================
git add lib/billing.js middleware.js app/drive/page.js
git commit -m "feat(billing): gate /drive on profiles.plan via middleware + server-side guard (PR4 of Phase 6)"

# ============================================================
# PR5：Stripe webhook + 幂等
# ============================================================
git add app/api/webhooks/stripe/route.js middleware.js
git commit -m "feat(billing): add Stripe webhook with idempotency and plan sync (PR5 of Phase 6)"

# ============================================================
# PR6：Customer Portal
# ============================================================
git add app/api/billing/portal/route.js components/AppShell.js
git commit -m "feat(billing): add Customer Portal self-serve subscription management (PR6 of Phase 6)"

# ============================================================
# PR7：QA + 文档
# ============================================================
git add AGENTS.md doc/4claudelog*.md
git commit -m "doc(billing): document Stripe integration env, routes, webhook (PR7 of Phase 6)"

# ============================================================
# PR8：生产 cutover（仅 changelog）
# ============================================================
git add doc/4claudelog*.md
git commit -m "release(billing): production cutover to Stripe live mode (PR8 of Phase 6)"

# ============================================================
# 把本规划文件入库
# ============================================================
git add doc/33cimplanexec.md doc/4claudelog7.md
git commit -m "doc: add doc/33cimplanexec.md — Phase 6 (Stripe monetization) PR-by-PR plan"

# ============================================================
# 推送（用户明确同意后）
# ============================================================
git push origin main
```

---

## 11. 一句话总结

**阶段六按 8 个 PR 串行推进（合计约 4.75 天工时）：PR1 接 SDK、PR2 改库、PR3 出 `/pricing` + Checkout、PR4 服务端拦截 `/drive`、PR5 幂等 webhook 回写 plan、PR6 Customer Portal、PR7 端到端 QA、PR8 生产 cutover；全程使用 Stripe 官方资源（5 ⭐ `@stripe/mcp` / `mcp.stripe.com`），明确弃用 `wrsmith108/stripe-mcp-skill`（1 ⭐）；严格 server-side gating、强幂等、Stripe Checkout 托管页规避 PCI-DSS、纯 JS 无 TypeScript、新增唯一生产依赖 `stripe` npm 包；§0.2 的 8 个产品待决策问题任一未答都不开始 PR1。**

---

## 附录：关键文件速查（来自 Plan agent）

- [`middleware.js`](../middleware.js) — PR4 / PR5 修改
- [`app/api/webhooks/clerk/route.js`](../app/api/webhooks/clerk/route.js) — PR2 修改
- [`lib/supabase/server.js`](../lib/supabase/server.js) — PR2 / PR4 / PR5 复用
- [`components/AppShell.js`](../components/AppShell.js) — PR3 / PR6 修改
- [`app/layout.js`](../app/layout.js) — PR3 修改
