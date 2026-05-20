---
type: sop
category: workflow
status: active
created: 2026-05-20
updated: 2026-05-20
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于标准化在 Windows 环境中部署 claude-obsidian 知识库、建立多 AI 客户端 skills 引用，并配置 SOP 自动检查与生成机制，确保知识沉淀、流程复用和 SOP 更新可持续运行。

---

## 2. 适用场景

- 需要在 Windows 本地搭建可被多个 AI 客户端复用的知识库
- 希望将 AI 对话、笔记与资料自动沉淀到 Obsidian Vault
- 需要把可复用流程资料转化为 SOP
- 希望在资料更新后及时发现并更新已有 SOP
- 需要为 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 提供统一的知识引用入口

---

## 3. 前置条件

- Windows 环境，具备 PowerShell 执行权限
- 已安装 Git
- 已确定 Vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 本机已安装至少一个 AI 客户端（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf）
- 具备创建目录、写入配置文件、建立 Junction 链接的权限
- 可访问项目仓库：`https://github.com/AgriciDaniel/claude-obsidian.git`

---

## 4. 标准操作步骤

### Step 1. 克隆项目并确认 Vault 根目录

在 PowerShell 中进入目标目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

若克隆后出现多层嵌套目录，手动整理，确保后续所有配置均指向同一个 Vault 根目录。建议设置变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且已确认唯一 Vault 路径用于后续所有配置。

---

### Step 2. 创建标准目录结构

执行以下命令创建标准目录：

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

目录用途建议：

- `.raw`：原始输入
- `wiki/sources`：处理后的来源笔记
- `wiki/sop`：SOP 文档
- `_templates`：模板文件

**预期结果：** Vault 内已具备统一的知识沉淀和 SOP 生成目录结构。

---

### Step 3. 写入基础 Obsidian 配置

在 `.obsidian` 目录中创建并写入以下配置：

1. `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 类内容标记为黄色
2. `.obsidian/app.json`：排除 AI 工作文件
3. `.obsidian/appearance.json`：启用 CSS 片段

如果这些文件已存在，采用补充或合并方式更新，不要直接覆盖已有有效配置。

**预期结果：** Obsidian 已具备适合知识库和 SOP 管理的基础显示与过滤配置。

---

### Step 4. 为多 AI 客户端建立 skills Junction 链接

将项目 skills 目录映射到各 AI 客户端的 skills 目录。建议目标如下：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

如果父目录不存在，先创建父目录。按需对每个客户端重复执行。

**预期结果：** 目标 AI 客户端可通过其 skills 机制访问同一套 claude-obsidian 技能与知识库逻辑。

---

### Step 5. 创建 SOP 自动机制技能文件

在 `skills/wiki-sop/` 下创建 `SKILL.md`，至少定义以下内容：

- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题时生成 SOP
- 更新模式：当 source 比 SOP 更新时提示重新整理
- 质量检查：验证步骤可执行性、检查清单完整性、来源回链完整性

编写原则：

- SOP 必须从多个来源归纳
- 步骤必须标准化、可执行
- 必须保留回链和更新依据

**预期结果：** 项目内已存在清晰定义 SOP 生成与维护规则的技能文件，AI 客户端可据此执行 SOP 整理。

---

### Step 6. 配置 hooks 自动检查 SOP 触发逻辑

修改 `hooks/hooks.json`，在 `SessionStart` 中加入以下规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持更多 hooks（例如 Claude Code 的 `PostToolUse`），可继续配置自动提交或后处理动作。

**预期结果：** 支持 hooks 的 AI 客户端在会话开始时会自动检查 SOP 生成或更新需求。

---

### Step 7. 建立 source 状态流转规范

统一资料状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 包含分步骤操作流程的资料 → `status: sop-ready`
- 最佳实践或经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

建议在 source 元数据中明确：

- `status`
- `topic`
- `updated_at`
- `sop-priority`

**预期结果：** 资料进入知识库后具备统一状态字段，AI 可据此识别 SOP 候选资料和更新条件。

---

### Step 8. 根据客户端能力选择自动或手动触发方式

按客户端能力使用：

- **Claude Code**：支持 skills 与 hooks，可自动检查 SOP
- **Kimi Code**：支持 skills，通常需手动触发
- **Codex CLI**：支持 skills，通常需手动触发
- **Gemini CLI**：支持 skills，通常需手动触发
- **Cursor**：通常需手动触发
- **Windsurf**：通常需手动触发

对于不支持 hooks 的工具，建议建立固定操作口令，例如“整理SOP”或“根据 sop-ready sources 生成 SOP”。

**预期结果：** 每个已接入的 AI 客户端都有明确的 SOP 使用方式，不会因能力差异导致流程失效。

---

### Step 9. 执行一次端到端验证

执行完整验证流程：

1. 使用 `ingest` 或等效方式写入一条 source
2. 将至少 1 条测试资料设置为 `status: sop-ready`
3. 准备同主题资料达到 3 条，或设置 `sop-priority: high`
4. 启动支持 hooks 的客户端，观察会话开始是否出现 SOP 提示
5. 若客户端不支持 hooks，则手动触发“整理SOP”
6. 确认生成的 SOP 保存到 `wiki/sop/`
7. 用 `query:` 或检索命令验证 SOP 与 source 的引用关系
8. 更新某条 source 后，再次检查是否出现 SOP 更新提示

**预期结果：** 已验证从资料入库、状态标记、SOP 触发、SOP 生成到更新提醒的完整链路可正常工作。

---

## 5. 检查清单

- [ ] 已成功克隆 claude-obsidian 项目并确认唯一 Vault 根目录
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已配置 `graph.json`、`app.json`、`appearance.json`
- [ ] 已至少为一个 AI 客户端建立 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md` 并写入 SOP 自动机制定义
- [ ] 已在 `hooks/hooks.json` 中配置 SessionStart 的 SOP 自动检查逻辑
- [ ] 已建立并执行 source 的状态标记规范：processed / sop-ready / synthesized 等
- [ ] 已明确当前使用的 AI 客户端是否支持 hooks
- [ ] 已完成一次 SOP 生成测试
- [ ] 已验证 source 更新后能够触发 SOP 更新提示或手动更新流程

---

## 6. 常见问题

### Q1. 为什么有些 AI 客户端不会自动提示生成 SOP？

因为并非所有客户端都支持 hooks。Claude Code 支持 `hooks.json`，可在 SessionStart 自动检查；Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 通常需要手动触发。

### Q2. 什么样的资料应该标记为 `sop-ready`？

凡是包含可重复执行的分步骤流程、操作经验、最佳实践总结的资料，都应标记为 `status: sop-ready`。如复用价值高，可同时设置 `sop-priority: high`。

### Q3. 什么时候应该新建 SOP，而不是继续积累 sources？

当同主题 `sop-ready` 资料达到 3 条及以上，或单条资料被标记为 `sop-priority: high` 时，应提示生成 SOP。

### Q4. 如果已有 SOP，但 sources 更新了怎么办？

应比较 source 与 SOP 的更新时间；如果 source 更新更晚，则提示更新 SOP。

### Q5. skills Junction 链接的目标应该指向哪里？

应指向项目中统一维护的 skills 目录，使多个 AI 客户端共享同一套技能定义，而不是分别复制多份配置。

### Q6. 如果目录结构或配置文件已经存在，还需要重新创建吗？

不需要重复创建，但应检查是否与本 SOP 的标准结构一致。已有配置应以补充和合并为主，避免覆盖有效设置。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
