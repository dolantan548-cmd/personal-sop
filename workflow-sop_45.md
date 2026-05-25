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
本 SOP 用于标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制。目标是让知识采集、流程沉淀、SOP 更新和跨客户端复用形成统一工作流。

## 2. 适用场景
- 需要在 Windows 上初始化 claude-obsidian 知识库
- 需要让 AI 自动写入、分类和维护知识笔记
- 需要基于已有资料自动发现可 SOP 化主题
- 需要在多个 AI 客户端共享同一套知识库与 SOP 能力
- 需要为 Claude Code 配置 SessionStart 自动 SOP 检查机制

## 3. 前置条件
- Windows 环境，可使用 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定知识库目录路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 本机已安装至少一个 AI 客户端（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf）
- 具有在用户目录和项目目录创建 Junction/目录的权限
- 了解 vault、wiki、sources、sop、skills、hooks 的基本概念

## 4. 标准操作步骤

### 步骤 1：克隆仓库并确认 Vault 根目录
在 PowerShell 中进入目标目录后克隆仓库，并确认最终 vault 根目录不包含多余嵌套层级。

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如仓库解压或克隆后出现重复目录嵌套，需手动整理，确保后续 `.obsidian`、`wiki`、`_templates`、`skills`、`hooks` 等目录均位于同一 vault 根目录下。

**预期结果：** 本地已存在可用的 claude-obsidian 根目录，且目录结构清晰，无多余嵌套。

### 步骤 2：创建标准目录结构
为 vault 创建 Obsidian 配置目录、原始资料目录、知识分类目录和 SOP 目录。

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

如项目中已有 `skills`、`hooks` 目录，也一并保留并纳入统一管理。

**预期结果：** Vault 中已包含 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等标准目录。

### 步骤 3：写入基础 Obsidian 配置
创建或更新以下配置文件：
1. `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 分类设为黄色，便于在图谱中识别流程资产。
2. `.obsidian/app.json`：排除 AI 工作文件，避免临时文件污染视图。
3. `.obsidian/appearance.json`：启用 CSS snippets，确保自定义显示规则生效。

执行要求：
- 若文件已存在，合并配置而不是盲目覆盖。
- 确认 Obsidian 打开 vault 时能正确识别这些配置。
- 变更后建议重新打开 Obsidian 或刷新配置。

**预期结果：** Obsidian 能正常加载 vault，图谱与外观配置已生效，AI 工作文件不干扰日常知识管理。

### 步骤 4：创建多 AI 客户端 skills 链接
将 vault 中的 skills 能力通过 Windows Junction 链接到各 AI 客户端，使不同工具可共享同一套知识处理与 SOP 能力。

适配目标包括：
- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/`
- Windsurf：`.windsurf/skills/`

执行原则：
- 先确认目标父目录存在，不存在则先创建。
- 使用 `New-Item -ItemType Junction` 创建链接。
- 链接源应指向 vault 内实际 skills 目录或对应技能包目录。
- 对每个客户端分别验证是否能读取 skill。

示例：
```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 所需 AI 客户端已能访问同一套 claude-obsidian skills，跨工具知识能力保持一致。

### 步骤 5：创建 SOP Skill 定义文件
在 `skills/wiki-sop/SKILL.md` 中定义 SOP 相关能力，至少覆盖以下四类功能：
- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：当 sources 更新时提示更新 SOP
- 质量检查：检查步骤可执行性、清单完整性、回链完整性

编写要求：
- 明确输入位置：`wiki/sources/` 与 `wiki/sop/`
- 明确输出格式：标准 SOP 文档
- 明确判定规则：同主题资料数量、优先级、是否已有 SOP、source 是否比 SOP 更新
- 明确质量要求：步骤必须可执行、包含 expected result、可追溯到来源

建议补充固定触发短语，例如“整理SOP”“生成SOP”“检查待合成 SOP”。

**预期结果：** `skills/wiki-sop/SKILL.md` 已存在，且定义了 SOP 自动检查、生成、更新与质检规则。

### 步骤 6：配置 hooks 自动检查规则
修改 `hooks/hooks.json`，在 `SessionStart` 钩子中加入 SOP 自动检查逻辑。应包含以下规则：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 ≥ 3 时，提示生成 SOP
- `sop-priority: high` 时，优先提示生成 SOP
- 若 source 内容比现有 SOP 更新，则提示更新 SOP

参考提示文案：
```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如当前客户端支持，也可在 PostToolUse 中补充自动 commit 或维护动作，但需与现有流程兼容。

**预期结果：** 在支持 hooks 的客户端中，启动会话时会自动检查待生成或待更新的 SOP。

### 步骤 7：建立 Source 状态流转规范
统一 source 笔记的生命周期，按以下流转执行：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

状态使用规范：
- `raw`：原始资料，尚未结构化
- `processed`：已整理，但未确认适合沉淀为 SOP
- `sop-ready`：包含可复用操作步骤或最佳实践，可用于 SOP 合成
- `synthesized`：已完成 SOP 生成并回链
- `archived`：历史资料归档

Auto-marking 规则：
- 包含分步骤操作流程 → 标记 `status: sop-ready`
- 最佳实践或经验总结 → 标记 `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → 标记 `status: processed`

要求在 source 元数据中保持状态字段一致，避免同义词混用。

**预期结果：** 所有 source 笔记均可按统一状态流转管理，系统能够准确识别可 SOP 化资料。

### 步骤 8：执行知识导入与分类验证
使用项目原生能力导入资料并验证分类行为：
- 使用 `ingest` 命令让 AI 自动写入笔记
- 检查资料是否被自动分类到 `concepts/`、`entities/`、`sources/`
- 使用 `query:` 验证知识可检索
- 使用 `lint the wiki` 执行定期维护

操作建议：
- 先导入少量样本资料进行验证
- 人工抽查 source 元数据是否正确
- 对 AI 自动标记为 `sop-ready` 的内容进行一次人工复核，避免误标

**预期结果：** 资料可被正常导入、分类、检索和维护，且 SOP 候选 source 能被识别出来。

### 步骤 9：生成或更新 SOP 文档
当触发条件满足后，执行 SOP 合成：
- 自动模式：由支持 hooks 的客户端在 SessionStart 提示生成或更新 SOP
- 手动模式：在不支持 hooks 的客户端中明确输入“整理SOP”或指定主题生成 SOP

生成标准：
- 从同主题 sources 中抽取共通流程
- 合并重复步骤，删除仅适用于单次场景的噪声内容
- 输出到 `wiki/sop/`
- 为 SOP 添加对来源 notes 的回链
- 对已存在 SOP，比较 source 更新时间和内容差异后执行更新

质量要求：
- 每一步必须可执行
- 包含前置条件、步骤、检查清单、常见问题
- 确保 SOP 可被其他 AI 客户端直接引用

**预期结果：** `wiki/sop/` 中已生成或更新标准化 SOP，且与 source 建立了完整关联。

### 步骤 10：按客户端差异执行最终验收
根据客户端能力差异进行验收：
- Claude Code：验证 `hooks.json` 是否生效，SessionStart 是否自动检查 SOP，必要时验证 PostToolUse 自动维护行为
- Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf：验证 skill 可访问，并通过手动指令触发 SOP 整理

验收重点：
- 是否都能引用同一 vault 路径
- 支持 hooks 的客户端是否具备自动检查能力
- 不支持 hooks 的客户端是否能通过手动命令完成同等流程
- 生成结果是否写回统一 `wiki/sop/` 目录

**预期结果：** 各客户端均可在各自能力范围内完成 SOP 检查、生成或更新，并共享同一知识库输出。

## 5. 检查清单
- [ ] 已在 Windows 上成功克隆 claude-obsidian 仓库
- [ ] 已确认 vault 根目录无重复嵌套
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已完成 `.obsidian/graph.json`、`.obsidian/app.json`、`.obsidian/appearance.json` 配置
- [ ] 已为所需 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SessionStart SOP 自动检查规则
- [ ] 已建立 source 状态流转与 auto-marking 规则
- [ ] 已验证 `ingest`、`query:`、`lint the wiki` 可正常工作
- [ ] 已成功生成或更新至少一个 `wiki/sop/` 中的 SOP 文档
- [ ] 已验证 Claude Code 自动检查或其他客户端手动触发流程可用
- [ ] 已确认 SOP 与 source 之间存在回链关系

## 6. 最佳实践
- 优先使用统一 vault 路径，避免不同客户端引用不同副本
- 对 `sop-ready` 的自动标记结果进行人工抽查，提高 SOP 质量
- 当同主题 source 达到 3 个以上时再合成 SOP，通常更利于提炼稳定流程
- 对高价值经验直接标记 `sop-priority: high`，缩短沉淀周期
- 每次更新 sources 后检查是否需要同步更新已有 SOP
- 在 SOP 中保留来源回链，确保内容可追溯、可校验

## 7. 常见问题

### Q1：这个项目是否原生支持 AI 自动写笔记和 SOP 生成？
A：AI 自动写笔记、分类整理、定期维护和知识查询是原生支持的；SOP 生成能力依赖模板与机制配置，本身可实现，但需要额外配置触发规则和技能定义。

### Q2：为什么有些客户端不能自动检查 SOP？
A：因为并非所有客户端都支持 hooks。Claude Code 支持 `hooks.json`，可在 SessionStart 自动检查；Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 主要依赖 skills，通常需要手动触发。

### Q3：什么时候应把 source 标记为 `sop-ready`？
A：当资料包含可复用的分步骤操作流程，或属于可沉淀的最佳实践/经验总结时，应标记为 `status: sop-ready`；其中高价值经验可额外标记 `sop-priority: high`。纯参考资料则保留为 `processed`。

### Q4：自动提示生成 SOP 的条件是什么？
A：标准条件包括：同主题 `sop-ready` source 数量达到 3 个及以上、source 标记了 `sop-priority: high`、或 source 内容比现有 SOP 更新。

### Q5：如果已经有 SOP，但 source 更新了怎么办？
A：应触发 SOP 更新流程：比较 source 与现有 SOP 的更新时间和内容差异，重新合并变化并更新 `wiki/sop/` 中的文档，同时保持来源回链完整。

### Q6：多个 AI 客户端如何共享同一套 SOP 能力？
A：通过在各客户端的 skills 目录下创建指向同一 vault 或技能目录的 Junction 链接，使它们共享同一套 skills、sources 和 SOP 输出。

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]