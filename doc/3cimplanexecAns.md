# 3cimplanexecAns.md — 是否遵循 2implan.md 建议顺序的核对答复

> **生成日期：** 2026-05-27
> **回答对象：** 用户提问 "are we following doc/2implan.md suggest sequence"
> **结论先行：** ⚠️ **部分遵循但有一处明显偏离** —— PR 选型完全正确，但**今日执行的先后顺序与 2implan.md §9.1 建议的顺序相反**。

---

## 1. 直接答案

**否（不完全遵循）。**

3cimplanexec.md 把 **#8（语言持久化）放在上午（T1）**，**#14 + #9（进度加载）放在下午（T2）**。

但 [`doc/2implan.md`](2implan.md) §9.1 明确写的官方顺序是：

| 官方顺序 | 内容 | 性质 |
|---|---|---|
| **PR 1** | **#14 + #9 bundled**（useProgress + GET-on-mount） | "Critical-path user-visible win" |
| **PR 2** | **#8**（LanguageProvider 语言持久化） | "Small surface but touches many files; isolate" |
| PR 3 | #10 toast | — |
| PR 4a–4e | #16 i18n × 5 | — |
| PR 5 | #12 useRecorder | — |
| PR 6 | #13 useScoring | — |
| PR 7.1–7.5 | #15 组件库 | — |

3cimplanexec.md 的执行顺序：**T1 = PR2，T2 = PR1** —— 与官方顺序**对调**了。

---

## 2. 偏离的具体表现

| 维度 | 2implan.md §9.1 建议 | 3cimplanexec.md 实际 | 是否一致 |
|---|---|---|---|
| 选哪两个 PR | PR 1 = #14+#9，PR 2 = #8 | 同样是 #14+#9 和 #8 | ✅ 一致 |
| 是否 bundle #14 + #9 | 是（§9.1 "Bundle #14 + #9"） | 是 | ✅ 一致 |
| 是否绕过 #12 / #13 / #15 / #16 等高风险项 | 没明说"绕过"，但建议每 PR 单独 1 天 | 今日明确排除（§8） | ✅ 一致（合理简化） |
| **执行先后顺序** | **先 PR1（#14+#9），再 PR2（#8）** | **先 PR2（#8），再 PR1（#14+#9）** | ❌ **对调** |
| 是否独立 commit / 可独立回滚 | §9.3 要求 | 3cimplanexec.md §2.5 和 §3.5 已分两个 commit | ✅ 一致 |
| 验证关卡 | §9.2 6 条 | 3cimplanexec.md §6 验收清单覆盖 | ✅ 一致 |

---

## 3. 为什么 3cimplanexec.md 当初对调了顺序

3cimplanexec.md §1 时间表的隐含理由：

- **PR2（#8）耗时 0.5 天**，作为"上午快赢热身"
- **PR1（#14+#9）耗时 1 天**，留给精力较集中的下午
- 两个 PR 在代码层面**互不依赖**，技术上对调没有副作用

但这只是"个人工作节奏"考虑，**没有引用 2implan.md 的任何条款**，也没有声明这是有意偏离。

---

## 4. 偏离的影响评估

### 4.1 技术影响：无

- PR1 和 PR2 **没有任何文件交集**（PR1 改 `hooks/useProgress.js` + `app/practice/page.js` + `app/signs/page.js`；PR2 改 `lib/lang-context.js` + `app/layout.js` + 6 个页面的 `useState('zh')` 行）。
- 两个 PR 没有共享 Provider / 共享 hook / 共享 state。
- 互相可独立 `git revert`。

### 4.2 流程影响：轻微

- 2implan.md §9.1 用 **"Critical-path user-visible win"** 标记 PR1，暗示它的优先级高于 PR2。
- 如果今天只能完成一个 PR（例如下午突发任务被打断），按 2implan.md 顺序应该是 PR1 先做掉；按 3cimplanexec.md 顺序则会先完成"次重要"的 PR2，"主线" PR1 可能延期。

### 4.3 沟通影响：中

- 用户读 2implan.md 看到 "PR 1 → #14+#9, PR 2 → #8"，再读 3cimplanexec.md 看到 "T1=PR2, T2=PR1"，会产生认知摩擦。
- CLAUDE.md §1 "Surface tradeoffs" 要求："不要静默选择"。当初应在 3cimplanexec.md §1 注明"已与 §9.1 顺序对调，原因 X"。

---

## 5. 修正建议（两选一）

### 方案 A（推荐）：按 2implan.md §9.1 重排顺序

把 3cimplanexec.md 的时间表对调为：

| 时段 | 任务 |
|---|---|
| 09:00–09:30 | 基线确认 |
| **09:30–13:00** | **T1 改为 PR1 — #14 + #9 进度加载**（核心路径、用户立即可见） |
| 13:00–14:00 | 午餐 + `verify` PR1 |
| **14:00–17:00** | **T2 改为 PR2 — #8 语言持久化** |
| 17:00–17:30 | T3 toast 侦察 |
| 17:30 | 提交 + 日志 |

**优点：**
- 完全遵循 2implan.md §9.1
- 即便下午被打断，已交付"最高用户可见价值"的 PR1
- 跟用户已经看到的 2implan.md 顺序保持一致，降低沟通摩擦

**缺点：**
- 上午精力投入到耗时 1 天的较重任务，没有"短跑热身"
- 若 PR1 因为乐观更新细节卡住，可能挤压 PR2 时间

---

### 方案 B：保留当前顺序（PR2 → PR1），但在 3cimplanexec.md 明确标注偏离

在 3cimplanexec.md §1 加入一段说明：

```
> ⚠️ 顺序说明：本日把 2implan.md §9.1 的 PR1 / PR2 顺序对调，原因是
> PR2（#8）耗时 0.5 天、风险更低、改动模式简单（替换 6 个 useState），
> 适合作为上午预热；PR1（#14+#9）涉及自定义 hook 设计与乐观更新
> 守则，留给注意力高峰时段。两个 PR 互无文件依赖，任何顺序都可
> 独立交付与回滚。
```

**优点：**
- 利用"快赢上午 + 深度下午"的人体节奏
- 任何中途中断都至少能交付一个完整 PR

**缺点：**
- 与 2implan.md 顺序不一致，需要每次解释一次
- 若用户严格审计"是否按计划执行"，此处会被标红

---

## 6. 我的推荐

**推荐方案 A（按 2implan.md §9.1 重排）。**

理由：

1. **2implan.md §9.1 是经过 Plan agent 形成的正式方案**，不是随手的优先级清单。"Critical-path user-visible win" 这个标签是有意义的：它意味着如果只有半天产出，PR1 比 PR2 更值得保住。
2. **CLAUDE.md §1 "Don't pick silently"** —— 当初对调顺序时没有 surface 这个 tradeoff，是一次小小的程序违规。
3. **沟通成本 < 节奏便利** —— 让用户、未来的我自己（读 4claudelog 时）都不需要在两份文档之间做对照。
4. **风险不对称** —— PR1 卡住的概率（乐观更新细节）比 PR2 卡住的概率（替换 useState）高；先做难的，留时间收尾，比留难的到下午更稳健。

**实施动作：** 如果用户同意方案 A，我会编辑 3cimplanexec.md 的 §0 概览表、§1 时间表、§2 和 §3 的标题，把 T1 / T2 标签与 PR 编号重新对齐。代码内容不变（步骤、风险、提交命令都还在），仅排列顺序换一下。

---

## 7. 一句话总结

**没有完全遵循。** 3cimplanexec.md 选对了两个 PR（#14+#9 和 #8）、也按建议把 #14+#9 bundle 了，但**今日执行的先后顺序与 2implan.md §9.1 相反**。建议立刻按方案 A 重排，把更高优先级的 PR1（#14+#9）放到上午，让 3cimplanexec.md 与 2implan.md 完全对齐。
