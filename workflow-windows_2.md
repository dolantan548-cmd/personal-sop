---
type: sop
category: workflow
status: active
created: 2026-05-14
updated: 2026-05-14
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
规范化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制，确保知识沉淀、流程复用与跨客户端引用一致可用。

## 2. 适用场景
- 需要在 Windows 环境搭建可被多个 AI 客户端共用的知识库
- 希望通过 ingest、分类整理与查询能力管理资料
- 希望将可复用流程自动识别并转化为 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套技能与知识库
- 需要为知识库增加 SOP 自动检查、更新提醒与质量检查机制

## 3. 前置条件
- Windows 环境
- 已安装 Git
- 可使用 PowerShell
- 可访问 claude-obsidian 项目仓库
- 已确定 vault 根目录，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 本机已安装至少一个目标 AI 客户端（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf）
- 具备在用户目录下创建 Junction 链接的权限

## 4. 标准操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录
打开 PowerShell，进入目标工作目录后执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后存在多层嵌套目录或目录结构不符合预期，先整理为单一 vault 根目录。建议将后续所有配置均指向同一个固定路径，例如：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，并已明确统一的 Vault 路径。

### 步骤 2：创建标准目录结构
在 PowerShell 中执行以下命令，创建 Obsidian 配置目录、原始资料目录、知识库目录、SOP 目录与模板目录：

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

**预期结果：** Vault 中已包含 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop` 与 `_templates` 等标准目录。

### 步骤 3：写入基础 Obsidian 配置
在 Vault 中创建或更新以下配置文件：

1. `.obsidian/graph.json`：配置知识图谱颜色分组，确保 `sop` 类内容可被单独标识，建议使用黄色。
2. `.obsidian/app.json`：排除 AI 工作文件，避免临时文件或中间产物污染视图。
3. `.obsidian/appearance.json`：启用 CSS snippets，以便后续对知识类型或 SOP 视图进行增强。

如无现成模板，至少保证以上文件存在且命名正确，后续可按团队标准补充内容。

**预期结果：** Obsidian 能识别基础配置文件，知识图谱、文件排除与外观片段具备可配置基础。

### 步骤 4：为多 AI 客户端创建 skills Junction 链接
将同一套 claude-obsidian skills 通过 Junction 链接接入不同客户端，确保它们引用同一个技能目录。根据实际安装的客户端执行对应命令。

常见目标路径包括：
- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/claude-obsidian`
- Windsurf：`.windsurf/skills/claude-obsidian`

PowerShell 示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

对其他客户端重复执行，并确保目标父目录已存在。

**预期结果：** 所选 AI 客户端均可访问同一套 claude-obsidian skills，避免多份配置分叉。

### 步骤 5：创建 wiki-sop 技能说明文件
在 `skills/wiki-sop/SKILL.md` 中定义 SOP 相关行为，至少覆盖以下 4 类能力：
- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题时生成 SOP
- 更新模式：当 sources 更新且比现有 SOP 更新时，提示更新 SOP
- 质量检查：检查步骤可执行性、检查清单完整性、来源回链完整性

建议在文档中明确输入、触发条件、输出目录（如 `wiki/sop/`）以及 SOP 的标准结构，确保不同 AI 客户端在手动触发时也能生成一致格式。

**预期结果：** `skills/wiki-sop/SKILL.md` 已存在，并清晰定义 SOP 自动检查、生成、更新与质检规则。

### 步骤 6：配置 hooks 自动检查 SOP
编辑 `hooks/hooks.json`，在 `SessionStart` 钩子中加入 SOP 自动检查逻辑。核心规则应包括：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如果使用 Claude Code，可进一步利用其 hooks 能力在会话启动时自动扫描，并在工具执行后配合自动 commit 或记录变更。若客户端不支持 hooks，则保留此配置供 Claude Code 使用，并为其他客户端采用手动触发策略。

**预期结果：** 支持 hooks 的客户端在会话开始时可自动发现 SOP 候选主题、优先级高的资料和待更新 SOP。

### 步骤 7：建立 Source 状态流转与自动标记规则
统一 source 文档的状态流转，建议采用：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

同时执行以下自动标记规则：
- 包含分步骤操作流程的资料：标记为 `status: sop-ready`
- 最佳实践或经验总结：标记为 `status: sop-ready` 且 `sop-priority: high`
- 纯参考资料：标记为 `status: processed`

在 ingest 或整理过程中，要求每条 source 至少补齐主题、状态和是否具备流程复用价值等元数据，以便后续自动检查准确命中。

**预期结果：** source 文档具备统一状态管理规则，AI 能据此区分普通资料与 SOP 候选资料。

### 步骤 8：按客户端能力选择自动或手动触发方式
根据客户端差异落实 SOP 触发方式：
- **Claude Code**：支持自动检查，可通过 `hooks.json` 在 `SessionStart` 自动扫描，适合作为主自动化入口。
- **Kimi Code**：支持 skills，但不支持 hooks，需要手动输入如“整理SOP”之类的指令触发。
- **Codex CLI**：支持 skills，但不支持 hooks，需要手动触发。
- **Gemini CLI**：支持 skills，但不支持 hooks，需要手动触发。
- **Cursor / Windsurf**：按 skills 可用性进行手动触发，不依赖 hooks。

无论客户端是否支持 hooks，都应保证最终 SOP 输出位置一致，例如统一写入 `wiki/sop/`。

**预期结果：** 每个已接入客户端都具备明确的 SOP 使用方式，不会因客户端差异导致流程失效。

### 步骤 9：执行首轮验证：ingest、分类、查询与 SOP 生成
完成部署后，执行一次端到端验证：

1. 使用 `ingest` 导入一批资料。
2. 检查资料是否被正确整理到 `concepts`、`entities`、`sources` 等目录。
3. 使用 `query:` 命令验证知识检索是否可用。
4. 准备至少 3 条同主题且标记为 `status: sop-ready` 的 source，或设置 `sop-priority: high`。
5. 在 Claude Code 中重启会话观察是否出现自动提示；在其他客户端中手动触发 SOP 生成。
6. 检查是否在 `wiki/sop/` 生成 SOP 文档，并确认步骤、检查清单与来源回链完整。

**预期结果：** 知识库基础功能可用，SOP 候选资料能被发现，且 SOP 可成功生成或收到更新提示。

### 步骤 10：建立持续维护机制
将知识库维护纳入日常流程：
- 定期执行 `lint the wiki`，修复结构、链接和分类问题。
- 当 source 有新增或更新时，检查对应 SOP 是否需要同步更新。
- 对高价值流程优先设置 `sop-priority: high`。
- 保持 `wiki/sop/` 内 SOP 与 source 的双向回链，便于追溯。
- 定期检查 skills Junction 是否失效，避免客户端因路径变化无法读取技能。

**预期结果：** 知识库、SOP 与多客户端集成保持长期稳定，SOP 内容能够随 source 演进而持续更新。

## 5. 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 根目录
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已写入 `graph.json`、`app.json`、`appearance.json` 基础配置
- [ ] 已为至少一个 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 `SessionStart` 的 SOP AUTO-CHECK 规则
- [ ] 已定义 source 状态流转与 `sop-ready` 自动标记规则
- [ ] 已确认各客户端的自动触发或手动触发方式
- [ ] 已完成 ingest、query 与 SOP 生成的端到端验证
- [ ] 已建立 lint、更新检查与回链维护的日常机制

## 6. 常见问题

**Q1：这个项目是否原生支持 AI 自动记笔记和 SOP 生成？**  
A：AI 自动写笔记、分类整理、定期维护与知识查询属于原生支持能力；SOP 生成需要额外配置触发机制，但模板化与技能化能力本身是支持的。

**Q2：为什么在 Windows 上要使用 Junction 链接？**  
A：因为多个 AI 客户端通常各自维护独立的 skills 目录。使用 Junction 可以让它们共享同一套 claude-obsidian skills，避免重复拷贝和多处维护。

**Q3：哪些客户端支持自动检查 SOP？**  
A：Claude Code 支持 hooks，因此可以在 `SessionStart` 自动检查 SOP 候选项。Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 通常需要依赖 skills 手动触发。

**Q4：什么样的 source 应标记为 sop-ready？**  
A：凡是包含明确分步骤操作流程、可重复执行的方法、最佳实践或经验总结的资料，都应标记为 `status: sop-ready`；其中高价值内容可额外加上 `sop-priority: high`。

**Q5：何时应该提示生成或更新 SOP？**  
A：当同主题 `sop-ready` 资料达到 3 条及以上时、资料被标记为 `sop-priority: high` 时，或 sources 的更新时间晚于现有 SOP 时，都应提示生成或更新。

**Q6：如果某个客户端不支持 hooks，是否无法使用 SOP 机制？**  
A：不是。hooks 只影响自动检查能力。即使不支持 hooks，只要接入了 skills，仍可通过手动指令触发 SOP 生成、更新与整理。

## 7. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]