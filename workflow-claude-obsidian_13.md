---
type: sop
category: workflow
status: active
created: 2026-05-16
updated: 2026-05-16
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的

标准化在 Windows 环境中部署 claude-obsidian 知识库、建立多 AI 客户端 skills 连接，并配置 SOP 自动检查与生成机制，以实现知识沉淀、流程复用和跨客户端统一引用。

## 适用场景

- 需要在 Windows 上搭建 claude-obsidian 本地知识库
- 需要让 AI 自动 ingest 笔记、分类整理和查询知识
- 需要基于 sources 自动识别可复用流程并生成 SOP
- 需要让多个 AI 客户端共用同一套知识库与 skills
- 需要在 Claude Code 中启用 SessionStart 自动检查 SOP 的机制

## 前置条件

- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定知识库目录，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 本机已安装至少一个 AI 客户端（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf）
- 了解本地用户目录中各 AI 客户端的 skills 路径
- 具备编辑 JSON、Markdown 和本地配置文件的权限

## 标准操作步骤

### 步骤 1：克隆 claude-obsidian 仓库并确认目标目录

打开 PowerShell，进入你的项目目录后执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果仓库结构存在额外嵌套目录，请整理为单一根目录。建议统一定义：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可用的 `claude-obsidian` vault 根目录。

### 步骤 2：创建 Obsidian 与知识库基础目录结构

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

**预期结果：** 已具备标准目录结构，满足知识库、原始资料和 SOP 管理需求。

### 步骤 3：写入 Obsidian 基础配置文件

在 `.obsidian` 目录中创建或更新：

- `graph.json`：配置知识图谱颜色分组，建议将 `sop` 分组设为黄色
- `app.json`：排除 AI 工作文件
- `appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 能正确加载图谱配置、排除工作文件并启用样式片段。

### 步骤 4：为多个 AI 客户端创建 skills 链接

为不同 AI 客户端创建指向仓库 `skills` 目录的 Junction。示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "D:\dolan_env\temp\project\personal\claude-obsidian\skills"
```

按需为以下客户端创建：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/claude-obsidian`
- Windsurf：`.windsurf/skills/claude-obsidian`

**预期结果：** 多个 AI 客户端共享同一套 skills，不需重复维护。

### 步骤 5：创建 wiki-sop 技能定义文件

在 `skills/wiki-sop/` 下创建 `SKILL.md`，至少定义：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查：检查步骤、清单、回链完整性

建议在文件中明确输入、输出、触发条件和 SOP 结构要求。

**预期结果：** AI 客户端能够调用 `wiki-sop` 技能执行 SOP 检查、生成和更新任务。

### 步骤 6：配置 hooks 以启用 Claude Code 自动检查

编辑 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如已启用 `PostToolUse` 自动提交逻辑，可继续保留。

**预期结果：** Claude Code 启动会话时可自动检查 SOP 候选项并提示操作。

### 步骤 7：建立 source 状态流转规范

采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

自动标记规则：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

建议在每条 source 笔记 frontmatter 中写入状态字段。

**预期结果：** source 资料状态统一，便于自动扫描与判断是否应转为 SOP。

### 步骤 8：执行知识导入、分类整理与查询验证

验证基础能力：

- 使用 `ingest` 命令导入资料
- 检查是否自动分类到 `concepts`、`entities`、`sources`
- 执行 `lint the wiki`
- 使用 `query:` 命令测试知识查询

重点确认：流程型资料是否进入 `wiki/sources/` 并带有合适状态。

**预期结果：** ingest、分类、维护、查询流程全部可用，SOP 输入资料齐备。

### 步骤 9：触发 SOP 生成并输出到 wiki/sop

根据客户端能力选择触发方式：

- Claude Code：通过 SessionStart 自动检查后提示生成或更新
- Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf：手动输入“整理SOP”或指定主题调用 `wiki-sop`

生成的 SOP 应至少包含：

- 目的
- 适用场景
- 前置条件
- 操作步骤
- 预期结果
- 检查清单
- FAQ
- 来源回链

输出路径统一为 `wiki/sop/`。

**预期结果：** `wiki/sop/` 中已有标准化、可执行的 SOP 文档。

### 步骤 10：执行 SOP 质量检查与持续维护

检查新生成或更新的 SOP：

- 步骤是否可执行
- 每步是否包含预期结果
- 是否包含检查清单与 FAQ
- 是否附带来源回链
- source 更新后是否可触发 SOP 更新提醒

建议将 `lint the wiki` 纳入定期维护。

**预期结果：** SOP 内容长期保持结构统一、可执行、可追溯并与 sources 同步。

## 检查清单

- [ ] 已成功克隆 claude-obsidian 仓库并确认 vault 根路径
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置文件设置
- [ ] 已为所需 AI 客户端创建 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查逻辑
- [ ] 已建立 source 状态字段与流转规则
- [ ] 已验证 ingest、query 和 lint 工作正常
- [ ] 已生成或更新至少一个 SOP 文档
- [ ] 已完成 SOP 质量检查

## 常见问题

### 1. claude-obsidian 是否原生支持自动写笔记和知识整理？
支持。`ingest` 可用于 AI 自动写笔记，分类整理也为原生能力。

### 2. SOP 自动生成是否开箱即用？
不是。需要额外配置 `wiki-sop` 技能和 hooks 自动检查逻辑。

### 3. 哪些客户端支持自动检查 SOP？
Claude Code 支持最完整；其他客户端通常只能通过 skills 手动触发。

### 4. 什么时候应把 source 标记为 `sop-ready`？
当资料中出现可复用、可执行的分步骤流程时，应标记为 `sop-ready`。

### 5. sources 更新后是否应该重建 SOP？
不一定。优先更新现有 SOP，避免生成重复文档。

### 6. 为什么要用 Junction 共享 skills？
因为 Junction 可以保持多客户端共用同一份技能定义，减少重复维护和版本不一致。

## 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]