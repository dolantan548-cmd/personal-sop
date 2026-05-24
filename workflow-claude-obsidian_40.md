---
type: sop
category: workflow
status: active
created: 2026-05-25
updated: 2026-05-25
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
用于在 Windows 环境中部署 claude-obsidian 知识库，配置多 AI 客户端 skills 链接，并建立 SOP 自动检查、生成与更新机制，使知识采集、整理、查询与 SOP 沉淀流程标准化。

## 2. 适用场景
- 需要在 Windows 上搭建 claude-obsidian 知识库
- 需要将原始资料自动整理到 wiki 结构中
- 需要基于资料自动识别可沉淀流程并生成 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等客户端复用同一套知识库能力
- 需要建立 source 到 SOP 的状态流转与维护机制

## 3. 前置条件
- Windows 环境，具备 PowerShell 权限
- 已安装 Git
- 可访问 claude-obsidian GitHub 仓库
- 已确定知识库目录，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个支持 skills 的 AI 客户端
- 具备 Obsidian 基础使用能力
- 能够编辑 `hooks/hooks.json` 与 `skills` 目录文件

## 4. 标准操作步骤

### 步骤 1：克隆 claude-obsidian 仓库到本地
打开 PowerShell，进入目标父目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果仓库解压后出现多层嵌套目录，整理为单一 vault 根目录，确保后续 `.obsidian`、`wiki`、`skills`、`hooks` 等目录都位于同一项目根路径下。

**预期结果：** 本地存在可用的 claude-obsidian 根目录，且目录结构清晰，无多余嵌套。

### 步骤 2：初始化知识库目录结构
在 PowerShell 中设置 vault 路径并创建必需目录：

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

目录用途标准化如下：
- `.raw`：原始输入资料
- `wiki/concepts`：概念类知识
- `wiki/entities`：实体类知识
- `wiki/sources`：来源资料与整理后的 source 笔记
- `wiki/sop`：最终 SOP 文档
- `_templates`：模板文件
- `.obsidian/snippets`：Obsidian CSS 片段

**预期结果：** Vault 内已创建知识采集、整理、SOP 输出与 Obsidian 配置所需的基础目录。

### 步骤 3：写入 Obsidian 基础配置
在 vault 中补齐或编辑以下配置文件：
- `.obsidian/graph.json`：配置知识图谱分组颜色，建议将 `sop` 设为黄色以便在图谱中快速识别 SOP 资产
- `.obsidian/app.json`：排除 AI 工作中间文件，避免噪音文件污染浏览体验
- `.obsidian/appearance.json`：启用 CSS snippets，保证展示一致性

如果团队已有标准模板，应统一使用同一版本配置，避免不同客户端显示差异。

**预期结果：** Obsidian 打开该 vault 后，图谱、外观与文件过滤规则可正常生效，SOP 文件在图谱中可被清晰识别。

### 步骤 4：为多 AI 客户端创建 skills 链接
将本项目 skills 目录以 Junction 方式链接到各 AI 客户端默认 skills 路径。按需执行以下命令，确保目标父目录已存在。

示例命令：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

目标客户端包括：
- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/`
- Windsurf：`.windsurf/skills/`

对其他客户端重复相同操作，仅修改目标路径。

**预期结果：** 各 AI 客户端均可访问同一套 claude-obsidian skills，避免重复维护多份配置。

### 步骤 5：配置 SOP skill 能力文件
在 `skills/wiki-sop/SKILL.md` 中创建或补充 SOP 规则，至少覆盖以下模式：
- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按用户指定主题生成 SOP
- 更新模式：当 source 更新后提示同步更新 SOP
- 质量检查模式：检查步骤可执行性、检查清单完整性、回链是否完整

建议在 `SKILL.md` 中明确输入、输出、命名规范、SOP 存放路径 `wiki/sop/`、以及 source 与 SOP 的双向链接规范。

**预期结果：** AI 客户端可通过统一 skill 理解何时生成 SOP、如何生成 SOP、以及如何检查 SOP 质量。

### 步骤 6：在 hooks 中加入 SOP 自动检查逻辑
编辑 `hooks/hooks.json`，在 `SessionStart` 钩子中加入 SOP 自动检查规则。建议规则包含：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持，可同时在 `PostToolUse` 等钩子中加入自动提交或状态更新逻辑。根据现有支持情况，Claude Code 对 hooks 支持最好；其他客户端通常仅支持手动触发。

**预期结果：** 支持 hooks 的客户端在会话开始时可自动扫描 source 状态，并主动提示生成或更新 SOP。

### 步骤 7：建立 source 状态流转标准
统一 source 生命周期，使用以下标准流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

状态解释与规则：
- `raw`：刚导入、未整理的原始资料
- `processed`：已整理、可检索，但未确认是否可沉淀 SOP
- `sop-ready`：已识别为可复用流程资料，适合生成 SOP
- `synthesized`：已被纳入 SOP 沉淀
- `archived`：历史资料，保留但不作为近期维护重点

自动标记建议：
- 包含分步骤操作流程 → 标记 `status: sop-ready`
- 最佳实践/经验总结 → 标记 `status: sop-ready` 且 `sop-priority: high`
- 纯参考资料 → 标记 `status: processed`

**预期结果：** 所有 source 笔记具备统一状态字段，AI 与人工都能依据状态判断是否需要生成或更新 SOP。

### 步骤 8：执行知识采集、整理与查询流程
日常使用时按以下标准操作：
1. 使用 `ingest` 将新资料导入系统，进入 `.raw` 或 source 整理流程。
2. 将资料分类整理至 `wiki/concepts/`、`wiki/entities/`、`wiki/sources/`。
3. 使用 `query:` 命令进行知识查询与复用。
4. 定期执行 `lint the wiki` 维护知识库质量。
5. 对符合条件的 source 设置 `status: sop-ready`，为后续 SOP 自动化做准备。

若使用不支持 hooks 的客户端，如 Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf，应在会话中手动输入类似“整理SOP”或“基于 sop-ready 资料生成 SOP”的指令触发生成。

**预期结果：** 知识库中的资料被持续导入、整理、查询与维护，且可稳定沉淀为 SOP。

### 步骤 9：生成或更新 SOP 文档
当满足以下任一条件时，生成或更新 `wiki/sop/` 中的 SOP：
- 同主题 `sop-ready` source 数量达到 3 个及以上
- source 标记了 `sop-priority: high`
- source 更新时间晚于现有 SOP

生成时应遵循统一要求：
- 标题明确，面向执行
- 步骤按顺序排列，内容可直接操作
- 包含检查清单
- 保留与 source 的回链
- 明确适用场景与前置条件

更新时应核对旧 SOP 中的失效步骤、命令与路径，确保与最新 source 保持一致。

**预期结果：** 在 `wiki/sop/` 下形成可执行、可维护、可追溯的 SOP 文档，且与 source 保持同步。

### 步骤 10：验证跨客户端可用性与自动化效果
分别在已接入的 AI 客户端中测试以下能力：
- 是否能识别 claude-obsidian skill
- 是否能访问同一 vault 路径
- 是否能读取 `wiki/sources/` 与 `wiki/sop/`
- Claude Code 是否会在 SessionStart 自动提示 SOP 检查
- 非 hooks 客户端是否可通过手动命令触发 SOP 生成

必要时统一修正 skills 链接、权限、路径映射与客户端配置差异。

**预期结果：** 至少一个客户端可自动执行 SOP 检查，其他客户端可稳定手动触发；所有客户端共享同一套知识与 SOP 资产。

## 5. 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库到本地
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已完成 Obsidian 的 graph、app、appearance 配置
- [ ] 已为目标 AI 客户端创建 skills Junction 链接
- [ ] 已创建或更新 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP AUTO-CHECK 规则
- [ ] 已统一 source 状态字段与自动标记规则
- [ ] 已验证 `ingest`、`query:`、`lint the wiki` 可用
- [ ] 已能基于 `sop-ready` source 生成 SOP
- [ ] 已验证 Claude Code 自动检查或其他客户端手动触发机制可用

## 6. 常见问题

### Q1：哪些客户端支持 SOP 自动检查？
A：根据来源信息，Claude Code 对 hooks 支持最好，可在 SessionStart 自动检查 SOP，并可在 PostToolUse 等场景扩展自动动作。Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 通常只能通过 skills 手动触发。

### Q2：什么时候应该把 source 标记为 `sop-ready`？
A：当资料中包含明确分步骤操作流程，或包含可复用的最佳实践、经验总结时，应标记为 `status: sop-ready`。如果复用价值高，建议再加 `sop-priority: high`。纯参考资料通常只标记为 `processed`。

### Q3：什么时候应该生成或更新 SOP？
A：当同主题已有 3 个及以上 `sop-ready` source、某 source 被标记为 `sop-priority: high`、或 source 的更新时间晚于现有 SOP 时，应生成或更新 SOP。

### Q4：如果某个客户端无法自动触发 hooks 怎么办？
A：保留相同的 skills 配置，并通过手动指令触发，例如“整理SOP”或“扫描 sop-ready 资料生成 SOP”。这样仍可复用同一 vault 和同一套 SOP 规则。

### Q5：为什么要用 Junction 链接 skills，而不是复制目录？
A：Junction 可以让多个客户端共享同一份 skills 配置，避免重复维护、版本不一致和后续修改无法同步的问题。

### Q6：SOP 文档应该放在哪里？
A：标准位置是 `wiki/sop/`。这样可以在图谱、查询和维护流程中与 concepts、entities、sources 保持一致结构。

## 7. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
