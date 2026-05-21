---
type: sop
category: workflow
status: active
created: 2026-05-22
updated: 2026-05-22
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP：在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于在 Windows 环境中部署 claude-obsidian 知识库，建立统一目录结构、Obsidian 配置、多 AI 客户端 skills 接入方式，以及 SOP 自动发现、生成与更新机制。

通过本流程，可以实现：
- AI 自动写入和整理知识
- 将可复用流程识别为 SOP 候选
- 在支持 hooks 的环境中自动提示 SOP 生成或更新
- 在多个 AI 客户端中共享同一套知识库与技能配置

---

## 2. 适用场景

- 需要在 Windows 上初始化 claude-obsidian 知识库
- 需要构建可持续维护的个人或团队知识库
- 需要将资料逐步沉淀成可执行 SOP
- 需要跨 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等工具复用同一知识体系

---

## 3. 前置条件

- Windows 环境，可使用 PowerShell
- 已安装 Git
- 可访问仓库：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 已确定本地 vault 路径，例如：`D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个 AI 客户端
- 拥有创建目录、写配置文件、建立 Junction 的权限

---

## 4. 标准操作步骤

### 步骤 1：克隆仓库并确认知识库根目录

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如目录层级异常或有嵌套，请手动整理，确保最终 vault 根路径唯一且明确。

**预期结果：** 本地已存在 `claude-obsidian` 根目录，后续配置均可统一引用。

---

### 步骤 2：创建标准目录结构

执行以下命令：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
New-Item -ItemType Directory -Path "$VAULT\.obsidian\snippets" -Force
New-Item -ItemType Directory -Path "$VAULT\.raw" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\concepts" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\entities" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sources" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sop" -Force
New-Item -ItemType Directory -Path "$VAULT\_templates" -Force
```

**预期结果：** 标准知识库目录已创建完成。

---

### 步骤 3：写入 Obsidian 基础配置

创建或更新以下文件：

- `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 设置为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS 片段

如已有配置，采用增量更新方式，避免覆盖现有有效设置。

**预期结果：** Obsidian 可正确显示知识图谱、排除噪声文件并启用界面片段。

---

### 步骤 4：建立多 AI 客户端 skills 链接

使用 Junction 将项目中的 skills 目录接入各客户端。典型目标包括：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Directory -Path "$HOME\.claude\skills" -Force
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

对其他客户端按相同方式创建。

**预期结果：** 多个 AI 客户端均可读取同一套 skills 定义。

---

### 步骤 5：创建 SOP skill 定义

创建文件：`skills/wiki-sop/SKILL.md`

至少覆盖以下能力：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：sources 更新时提示同步更新 SOP
- 质量检查：步骤可执行性、检查清单、来源回链完整性

建议在 skill 中明确：
- 输入来源
- 触发条件
- 输出结构
- 更新策略

**预期结果：** 项目内具备统一的 SOP 生成规则。

---

### 步骤 6：配置 hooks 自动检查机制

编辑：`hooks/hooks.json`

在 `SessionStart` 中加入 SOP 自动检查逻辑：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料 `≥ 3` 时提示生成 SOP
- 存在 `sop-priority: high` 时优先提示
- 若 sources 比 SOP 更新，则提示更新 SOP

如环境支持，也可在 `PostToolUse` 加入自动提交或维护动作。

**预期结果：** 会话启动时可自动发现 SOP 候选主题和过期 SOP。

---

### 步骤 7：建立 source 状态流转规范

采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：

- 含分步骤流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

在资料进入知识库后尽快完成状态标记。

**预期结果：** SOP 候选资料可被自动机制稳定识别。

---

### 步骤 8：按客户端能力选择触发方式

推荐使用策略：

- **Claude Code**：支持 hooks，适合自动检查与提醒
- **Kimi Code**：支持 skills，通常手动输入“整理SOP”触发
- **Codex CLI**：支持 skills，通常手动触发
- **Gemini CLI**：支持 skills，通常手动触发
- **Cursor / Windsurf**：多通过 skills 或项目规范手动触发

结论：
- 追求自动化：优先 Claude Code
- 追求跨工具复用：统一 skills + 接受手动触发

**预期结果：** 每个客户端都采用与其能力匹配的 SOP 运行方式。

---

### 步骤 9：执行端到端验证

完成一次完整测试：

1. 使用 `ingest` 导入一条新资料
2. 确认资料进入正确目录
3. 将流程型资料标记为 `status: sop-ready`
4. 满足条件后，验证自动提示或手动触发“整理SOP”
5. 生成 SOP 到 `wiki/sop/`
6. 更新 source 后再次验证是否提示更新 SOP
7. 运行 `lint the wiki`

**预期结果：** 资料进入、状态标记、SOP 生成、SOP 更新、知识库校验全链路通过。

---

### 步骤 10：固化维护机制

日常维护要求：

- 定期执行 `lint the wiki`
- 新资料进入后尽快标记状态
- SOP 必须保留来源回链
- source 更新后优先复查 SOP
- 高价值主题加 `sop-priority: high`
- 所有客户端尽量共享同一 vault 与同一 skills 源
- AI 自动产出的 SOP 必须人工复核

**预期结果：** 知识库与 SOP 长期可维护、可追溯、可持续演化。

---

## 5. 检查清单

- [ ] 已成功克隆 claude-obsidian 仓库并确认唯一 vault 路径
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已为至少一个 AI 客户端建立 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 中的 SessionStart SOP 检查逻辑
- [ ] 已启用 source 状态流转规则
- [ ] 已成功生成至少一份 SOP
- [ ] 已验证 source 更新会触发 SOP 更新提示
- [ ] 已执行 `lint the wiki`

---

## 6. 常见问题

### Q1：为什么没有自动生成 SOP？
因为 SOP 自动机制需要额外配置，并且并非所有客户端都支持 hooks。通常需要完成 `SKILL.md` 和 `hooks.json` 配置后，才会在支持的客户端中自动检查。

### Q2：哪些资料适合标记为 `sop-ready`？
凡是有清晰操作步骤、可重复执行、属于经验沉淀或最佳实践的资料，都适合标记为 `sop-ready`。

### Q3：为什么建议至少 3 条同主题资料再生成 SOP？
这样可以降低单一来源偏差，使 SOP 更稳定、更可复用。

### Q4：sources 更新后怎样避免 SOP 过期？
通过 hooks 或手动检查 source 与 SOP 的更新时间；若 source 更新更晚，应立即提示或执行 SOP 更新。

### Q5：所有客户端都能自动执行 SOP 检查吗？
不能。Claude Code 支持度最高，其他工具大多需要手动触发 skills。

### Q6：为什么推荐 Junction 而不是复制文件？
因为 Junction 可以让多个客户端共享同一套 skills，维护成本更低，配置不易分叉。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
