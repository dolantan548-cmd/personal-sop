---
type: sop
category: workflow
status: active
created: 2026-05-24
updated: 2026-05-24
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制的流程，确保知识沉淀、流程复用和跨客户端调用一致。

## 适用场景
- 需要在 Windows 上搭建 claude-obsidian 知识库环境
- 希望将 AI 对话内容自动沉淀为笔记并分类管理
- 需要将可复用流程自动识别并整理为 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等多个 AI 客户端中复用同一套知识库能力
- 需要建立 source 到 SOP 的状态流转和维护机制

## 前置条件
- Windows 环境，且可使用 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定知识库根目录，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 目标 AI 客户端已安装（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf）
- 具备在用户目录和项目目录创建 Junction/目录链接的权限
- 了解 Obsidian 基本目录结构与 markdown 文件编辑方法

## 标准步骤

### 1. 克隆仓库并确认知识库根目录
打开 PowerShell，进入目标工作目录后克隆项目：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如仓库存在额外嵌套目录，整理为单一 vault 根目录，并记录该路径，例如：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 项目目录，并已明确唯一的 vault 根路径。

### 2. 初始化 Obsidian 与知识库目录结构
在 PowerShell 中创建标准目录结构：

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

确保目录名称与后续自动化逻辑一致，不要随意更改路径命名。

**预期结果：** vault 中已包含 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等标准目录。

### 3. 写入基础配置文件
在 vault 中补充 Obsidian 配置文件，至少包括：

1. `.obsidian/graph.json`：配置知识图谱颜色分组，并将 `sop` 相关内容设为黄色，便于识别。
2. `.obsidian/app.json`：排除 AI 工作文件，避免噪声文件干扰浏览与索引。
3. `.obsidian/appearance.json`：启用 CSS snippets，以支持后续展示增强。

如果已有配置文件，按现有结构补充，不要覆盖用户已有关键配置。

**预期结果：** Obsidian 配置文件已存在且可用，知识图谱、文件排除和样式片段启用策略已完成。

### 4. 创建多 AI 客户端 skills 链接
为各 AI 客户端创建指向 claude-obsidian skills 的 Junction，使多个客户端复用同一能力目录。根据各客户端目录执行 `New-Item -ItemType Junction`。示例目标如下：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/claude-obsidian`
- Windsurf：`.windsurf/skills/claude-obsidian`

实际命令示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT"
```

如客户端要求 skills 指向具体 skills 目录，则按客户端约定修正 Target，但必须保证引用路径一致且可访问。

**预期结果：** 目标 AI 客户端均能通过各自 skills 目录访问 claude-obsidian 能力，不需要为每个客户端重复维护一份知识库。

### 5. 配置 SOP skill 文档
创建 `skills/wiki-sop/SKILL.md`，明确该 skill 的触发与处理规则。文档至少应覆盖以下能力：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题后生成 SOP
- 更新模式：当 source 更新而 SOP 过旧时提示更新
- 质量检查：检查步骤可执行性、检查清单完整性、回链完整性

在文档中写明 SOP 输出标准：必须有标题、适用场景、前置条件、步骤、检查清单、FAQ、来源回链。

**预期结果：** SOP 相关 skill 已定义完成，AI 客户端在调用该 skill 时有统一的行为准则。

### 6. 配置 hooks 自动检查逻辑
修改 `hooks/hooks.json`，在 `SessionStart` 钩子中加入 SOP 自动检查逻辑。应包含以下规则：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同一主题来源数量 ≥ 3 时，提示生成 SOP
- 若 `sop-priority: high`，优先提示生成 SOP
- 若 source 的更新时间晚于对应 SOP，提示更新 SOP

对于支持 hooks 的客户端（尤其 Claude Code），启用开机会话检查；对于不支持 hooks 的客户端，保留相同规则供手动触发使用。

**预期结果：** 支持 hooks 的客户端在会话启动时会自动检查 SOP 候选资料，并给出生成或更新提示。

### 7. 建立 source 状态流转规则
在团队或个人知识管理规范中明确 source 的状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

并设置自动标记规则：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践或经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

要求在 source 元数据中统一使用这些状态字段，避免自由命名造成后续自动化失效。

**预期结果：** 所有 source 都能按统一状态管理，系统可稳定识别哪些内容适合沉淀为 SOP。

### 8. 验证知识库核心能力是否可用
逐项验证项目支持的核心能力：

- 使用 `ingest` 验证 AI 自动写笔记
- 检查内容是否自动分类到 `concepts/entities/sources/`
- 使用 `query:` 验证知识查询
- 使用 `lint the wiki` 验证定期维护能力
- 对 `status: sop-ready` 的 source 执行手动或自动 SOP 检查

如果某客户端不支持 hooks，则直接手动输入类似“整理 SOP”之类的指令进行验证。

**预期结果：** 笔记摄取、分类、查询、维护、SOP 检查流程全部至少成功执行一次。

### 9. 按客户端能力差异制定使用方式
根据客户端支持情况执行标准化使用：

- **Claude Code**：启用自动检查，使用 hooks 在 `SessionStart` 自动扫描 SOP 候选资料，并可在 `PostToolUse` 执行自动提交等后续动作。
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：由于缺少 hooks，采用手动触发方式，明确统一口令，例如“整理 SOP”或“根据 sop-ready 资料生成 SOP”。

在团队文档中记录：哪些客户端自动、哪些客户端手动，避免误判系统失效。

**预期结果：** 不同 AI 客户端都有明确的 SOP 使用路径，用户知道何时自动触发、何时手动触发。

### 10. 执行持续维护与 SOP 更新
将以下动作纳入日常维护：

- 定期运行 `lint the wiki`
- 定期检查 `wiki/sources/` 中新增的 `sop-ready` 条目
- 当同主题 source 增加到 3 份及以上时，合并生成 SOP
- 当 source 更新晚于 SOP 时，重新生成或修订 SOP
- 保持 SOP 对 source 的回链完整，确保可追溯

建议在每次知识库整理后检查 `wiki/sop/` 是否存在过期或重复 SOP。

**预期结果：** SOP 库保持最新、可执行、可追溯，知识库不会因 source 增长而失控。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 vault 根目录
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已写入 `graph.json`、`app.json`、`appearance.json` 等基础配置
- [ ] 已为目标 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md` 并定义自动检查、手动生成、更新与质检规则
- [ ] 已在 `hooks/hooks.json` 中加入 `SessionStart` 的 SOP 自动检查逻辑
- [ ] 已定义 source 状态流转与自动标记规则
- [ ] 已验证 `ingest`、`query:`、`lint the wiki` 与 SOP 生成流程至少各执行一次
- [ ] 已明确各客户端是自动触发还是手动触发
- [ ] 已建立 SOP 定期更新与回链检查机制

## FAQ

### 为什么 SOP 没有自动生成？
常见原因有三类：一是当前客户端不支持 hooks，只能手动触发；二是 source 没有标记为 `status: sop-ready`；三是同主题资料不足，未达到自动提示条件。优先检查 hooks 支持情况、元数据状态和来源数量。

### 哪些客户端支持自动 SOP 检查？
来源中明确支持自动检查的是 Claude Code，因为它支持 `hooks.json`。Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 主要通过 skills 使用，但通常需要手动触发。

### 什么样的 source 应该标记为 `sop-ready`？
凡是包含分步骤操作流程、可重复执行的方法、最佳实践或经验总结的资料，都应标记为 `sop-ready`。其中最佳实践或高复用内容还应增加 `sop-priority: high`。

### 如果 source 更新了，已有 SOP 怎么处理？
当 source 的更新时间晚于对应 SOP 时，应触发 SOP 更新提示。更新时需重新核对步骤、检查清单和回链，确保 SOP 与最新资料一致。

### skills Junction 应该指向哪里？
原则上应指向 claude-obsidian 的统一能力目录或项目目录，关键是让多个客户端访问同一套 skills 和知识库逻辑。实际 Target 可根据客户端目录规范微调，但必须保持唯一真实来源。

### 如何判断部署是否成功？
成功标准包括：目录结构完整、Obsidian 能正常读取配置、客户端可识别 skills、`ingest`/`query:`/`lint the wiki` 可执行、并且 SOP 检查或生成流程能够正常运行。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
