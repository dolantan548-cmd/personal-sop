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

# SOP: Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
用于在 Windows 环境中标准化部署 claude-obsidian 知识库，启用笔记摄取、知识分类、SOP 自动检查与多 AI 客户端复用能力，确保知识沉淀与流程文档生成机制稳定可用。

## 适用场景
- 需要在 Windows 上部署 claude-obsidian 知识库
- 需要将 AI 对话、资料或经验自动沉淀为结构化知识
- 需要为知识库配置 SOP 自动发现、生成和更新机制
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 复用同一套 skills 与知识库
- 需要建立 source 到 SOP 的标准状态流转

## 前置条件
- Windows 环境，具备 PowerShell 执行能力
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 具备本地目录创建、Junction 链接创建权限
- 已确定知识库目录，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 至少一种支持 skills 的 AI 客户端已安装
- 了解 Obsidian 基本目录结构与 Markdown 文件管理方式

## 标准步骤

### 1. 克隆仓库并确认 Vault 根目录
在 PowerShell 中进入目标目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如克隆后存在多层嵌套目录，整理为单一 Vault 根目录，并将路径保存到变量中：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且后续命令统一使用 `$VAULT`。

### 2. 创建标准目录结构
执行以下命令创建标准目录：

```powershell
New-Item -ItemType Directory -Path "$VAULT\.obsidian\snippets" -Force
New-Item -ItemType Directory -Path "$VAULT\.raw" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\concepts" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\entities" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sources" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sop" -Force
New-Item -ItemType Directory -Path "$VAULT\_templates" -Force
```

**预期结果：** Vault 中已具备 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop` 与 `_templates` 等标准目录。

### 3. 写入基础 Obsidian 配置
创建或更新以下配置文件：

1. `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 类型标记为黄色。
2. `.obsidian/app.json`：排除 AI 工作文件或中间文件。
3. `.obsidian/appearance.json`：启用 CSS snippets。

如团队已有标准模板，按模板写入；若无模板，至少确保上述文件存在并可被 Obsidian 正常读取。

**预期结果：** Obsidian 能正常打开 Vault，图谱分组、文件排除和外观设置已生效。

### 4. 配置多 AI 客户端 skills 链接
将仓库中的 skills 目录通过 Junction 链接到各 AI 客户端。典型目标包括：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/`
- Windsurf：`.windsurf/skills/`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

对其他客户端重复执行，并确保父目录存在。

**预期结果：** 多个 AI 客户端可共享同一套 skills，无需重复维护。

### 5. 创建 SOP 专用 skill
在 `skills/wiki-sop/SKILL.md` 中定义 SOP 专用能力，至少包括：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按指定主题生成 SOP
- 更新模式：sources 更新后提示更新 SOP
- 质量检查模式：检查步骤可执行性、检查清单、来源回链完整性

应明确输入来源、触发条件、输出位置与质量标准。

**预期结果：** 已存在可被 AI 客户端调用的 SOP skill。

### 6. 在 hooks 中配置 SOP 自动检查机制
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入 SOP 自动检查逻辑，至少包含以下规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持，可在 `PostToolUse` 中扩展自动提交或维护动作。

**预期结果：** 支持 hooks 的客户端在会话启动时能自动发现 SOP 候选资料并提示生成或更新。

### 7. 建立 source 状态流转与自动标记规则
统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 包含分步骤操作流程：`status: sop-ready`
- 包含最佳实践或经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

要求在 ingest 或整理阶段补全 frontmatter。

**预期结果：** sources 可被系统稳定识别为普通资料或 SOP 候选资料。

### 8. 按客户端能力验证触发方式
按客户端差异执行验证：

- **Claude Code**：支持 skills 与 hooks，可自动在 SessionStart 扫描
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常仅支持 skills，需要手动输入如“整理SOP”触发

测试步骤：
1. 在 `wiki/sources/` 中放入至少 3 条同主题且标记为 `status: sop-ready` 的资料
2. 启动 Claude Code，确认是否收到自动提示
3. 在其他客户端中手动调用 SOP skill，确认是否可读取同一 Vault

**预期结果：** 每个客户端的自动化边界已明确，并完成至少一次成功验证。

### 9. 执行日常运行与维护
按以下方式持续运营知识库：

- 使用 `ingest` 摄取新资料
- 使用自动分类能力整理到 `concepts`、`entities`、`sources`
- 定期运行 `lint the wiki`
- 使用 `query:` 做知识检索
- 对识别出的 SOP 候选执行生成或更新

每次新增资料后，检查 `status`、`sop-priority`、回链和主题聚合情况。

**预期结果：** 知识库持续保持可检索、可维护、可生成 SOP 的状态。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 路径
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已完成 `graph.json`、`app.json`、`appearance.json` 基础配置
- [ ] 已为至少一个 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查逻辑
- [ ] 已定义并使用 source 状态流转：`raw`、`processed`、`sop-ready`、`synthesized`、`archived`
- [ ] 已验证至少一种客户端可以触发 SOP 生成或更新
- [ ] 已能通过 `ingest`、`query` 和 `lint the wiki` 执行日常操作

## 最佳实践
- 优先使用 Junction 共享 skills，避免多客户端重复维护
- 将 SOP 识别条件前移到 source 整理阶段，降低后续人工筛选成本
- 对高价值经验资料统一添加 `sop-priority: high`
- 将 SOP 结果集中存放在 `wiki/sop/`，便于图谱检索与引用
- 定期检查 sources 是否晚于对应 SOP，及时更新，避免流程失真
- 在 SOP 中保留来源回链，确保可追溯性与后续修订依据

## 常见问题

### 为什么 SOP 不会自动生成？
通常因为以下原因：
1. 客户端不支持 hooks，只能手动触发
2. source 未标记为 `status: sop-ready`
3. 同主题资料数量不足，未达到阈值
4. hooks 配置未生效或未被客户端读取

### 哪些客户端支持自动检查 SOP？
根据现有信息，Claude Code 支持 skills 和 hooks，可自动检查；其他客户端多为手动触发。

### 什么样的资料应标记为 `sop-ready`？
包含可复用分步骤流程、最佳实践、经验总结的资料应标记为 `sop-ready`；纯参考资料仅保留为 `processed`。

### SOP 何时需要更新？
当 source 比现有 SOP 更新，或新增了关键步骤、限制条件、检查项时，应及时更新 SOP。

### 为什么要为 SOP 单独建立 skill？
因为 SOP 生成涉及触发条件、质量控制、回链要求和更新判断，单独 skill 更便于跨客户端复用与维护。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]