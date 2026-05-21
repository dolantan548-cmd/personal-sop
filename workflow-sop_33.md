---
type: sop
category: workflow
status: active
created: 2026-05-21
updated: 2026-05-21
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
在 Windows 环境中标准化部署 claude-obsidian 知识库，启用笔记摄取、分类整理、SOP 自动检查与多 AI 客户端复用能力，确保知识能够从原始资料稳定沉淀为可执行 SOP。

## 适用场景
- 需要在 Windows 上搭建本地知识库与 SOP 生成体系时
- 需要让 AI 自动写入、整理和维护 Obsidian 知识库时
- 需要基于 sources/concepts/entities 的资料沉淀标准 SOP 时
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等工具中共用同一套 skills 时
- 需要通过状态流转识别哪些资料可进一步转为 SOP 时

## 前置条件
- Windows 环境
- 已安装 Git
- 可使用 PowerShell
- 可访问 claude-obsidian 仓库
- 已明确本地 vault 存放路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个 AI 客户端（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf）
- 具备创建目录、写入配置文件和建立 Junction 链接的权限

## 标准步骤

### 步骤 1：克隆仓库并确认 Vault 根目录
在 PowerShell 中进入目标工作目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如仓库存在多层嵌套目录，整理为单一 vault 根目录，并记录统一变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且后续操作统一使用 `$VAULT`。

### 步骤 2：创建标准目录结构
执行以下命令：

```powershell
New-Item -ItemType Directory -Path "$VAULT\.obsidian\snippets" -Force
New-Item -ItemType Directory -Path "$VAULT\.raw" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\concepts" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\entities" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sources" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sop" -Force
New-Item -ItemType Directory -Path "$VAULT\_templates" -Force
```

如项目内缺少 `skills`、`hooks` 目录，应一并创建。

**预期结果：** Vault 目录结构完整，可承载知识整理与 SOP 生成。

### 步骤 3：写入 Obsidian 基础配置
补充以下配置文件：
- `.obsidian/graph.json`：知识图谱颜色分组，`sop` 建议标记为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS 片段

如团队已有模板，优先复用统一配置。

**预期结果：** Obsidian 能正确识别 vault，图谱与基础显示配置可用。

### 步骤 4：为多 AI 客户端创建 skills Junction 链接
根据实际使用的 AI 客户端创建 skills 链接，避免重复维护。常见目标包括：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

PowerShell 示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

按各客户端实际路径分别执行。

**预期结果：** 各客户端可共用同一套 claude-obsidian skills。

### 步骤 5：创建 SOP 专用 skill
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：
- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按用户指定主题生成 SOP
- 更新模式：当 source 新于 SOP 时提示更新
- 质量检查：检查步骤可执行性、检查清单、来源回链

应明确输入、触发条件、输出路径、命名规范与更新策略。

**预期结果：** 系统已具备专门的 SOP 生成与维护 skill。

### 步骤 6：配置 hooks 自动检查机制
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入 SOP 自动检查规则：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 `>= 3` 时提示生成 SOP
- 若存在 `sop-priority: high`，优先提示生成 SOP
- 若 source 比 SOP 更新，提示更新 SOP

如客户端支持额外 hook，可扩展到 `PostToolUse` 等节点。

**预期结果：** 支持 hooks 的客户端可在会话开始时自动发现 SOP 生成或更新机会。

### 步骤 7：建立 Source 状态流转标准
统一采用以下状态流：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 含明确步骤的流程资料：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

所有 source 文件均需在元数据中显式记录状态。

**预期结果：** 系统可稳定识别可转 SOP 的资料与普通参考资料。

### 步骤 8：执行首次资料摄取与分类验证
执行知识库基本操作：
- 使用 `ingest` 命令导入资料
- 检查是否自动归类到 `concepts/`、`entities/`、`sources/`
- 使用 `lint the wiki` 维护结构
- 使用 `query:` 验证检索能力
- 对具备流程性的资料补齐 `sop-ready` 状态

**预期结果：** 至少已有一批可被 SOP 机制扫描的 source 条目。

### 步骤 9：触发 SOP 生成或更新
按客户端能力执行：
- **Claude Code**：依赖 hooks 自动检查并提示生成/更新 SOP
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：手动触发，例如输入“整理SOP”或指定主题

生成结果应写入 `wiki/sop/`，并包括：
- 标题
- 适用场景
- 前置条件
- 可执行步骤
- 检查清单
- 来源回链

如 source 新于现有 SOP，应执行更新而不是重复创建。

**预期结果：** `wiki/sop/` 中已有对应主题的 SOP 文档，且内容可追溯到 source。

### 步骤 10：进行质量检查与持续维护
每次生成或更新 SOP 后，执行以下检查：
- 步骤是否具体、可执行
- 是否列出前置条件
- 是否包含检查清单
- 是否具备来源回链
- 是否与最新 source 保持一致

同时建立持续维护习惯：
- 定期运行 `lint the wiki`
- 新资料进入后及时维护状态字段
- 高优先级资料及时转 SOP
- source 更新后重新检查对应 SOP 是否需要同步更新

**预期结果：** SOP 长期保持可执行、可维护、可追溯。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确定统一的 Vault 路径
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已写入或补齐 `.obsidian/graph.json`、`.obsidian/app.json`、`.obsidian/appearance.json`
- [ ] 已为所需 AI 客户端创建指向项目 skills 的 Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md` 并定义 SOP 自动检查、手动生成、更新与质检规则
- [ ] 已在 `hooks/hooks.json` 的 `SessionStart` 中加入 SOP 自动检查逻辑
- [ ] 已建立 source 状态流转：`ingest/raw/processed/sop-ready/synthesized/archived`
- [ ] 已完成至少一次 ingest、分类、query 与 lint 验证
- [ ] 已成功生成或更新至少一份 `wiki/sop/` 下的 SOP 文档
- [ ] 已完成 SOP 的可执行性、检查清单和来源回链校验

## 常见问题

### 1. 为什么 SOP 不会自动生成？
常见原因包括：
- 当前客户端不支持 hooks，只支持 skills，因此必须手动触发
- `hooks/hooks.json` 未正确配置 `SessionStart`
- source 未标记为 `status: sop-ready`

### 2. 哪些客户端支持自动检查 SOP？
根据现有资料，Claude Code 支持 `hooks.json`，可自动检查；Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 主要依赖 skills，通常需要手动触发。

### 3. 什么样的资料应该标记为 `sop-ready`？
包含明确步骤、可重复执行流程、最佳实践总结或经验沉淀的资料，都应标记为 `status: sop-ready`。高复用价值内容建议增加 `sop-priority: high`。

### 4. 什么时候应该更新 SOP？
当 source 更新时间晚于现有 SOP，或 source 新增了关键步骤、例外条件、最佳实践时，应更新已有 SOP。

### 5. 为什么要共用同一套 skills？
因为这样可以统一不同 AI 客户端的知识组织与 SOP 生成规则，减少重复维护与行为偏差。

### 6. 纯参考资料需要转 SOP 吗？
不需要。纯参考资料应保持 `status: processed`，只有具备可执行流程特征的资料才应进入 `sop-ready` 并合成为 SOP。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]