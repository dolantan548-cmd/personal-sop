---
type: sop
category: workflow
status: active
created: 2026-05-15
updated: 2026-05-15
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
规范在 Windows 环境中部署 claude-obsidian 知识库、启用 SOP 自动生成与更新机制，并将同一套知识库能力接入多个 AI 客户端，以支持自动记笔记、分类整理、SOP 生成和跨客户端复用。

## 适用场景
- 需要在 Windows 上搭建基于 Obsidian 的 AI 知识库工作流
- 需要将原始资料自动整理到 `wiki/concepts/`、`wiki/entities/`、`wiki/sources/` 等目录
- 需要基于积累的 sources 自动识别可 SOP 化内容并生成标准操作流程
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等工具复用同一套 skills
- 需要建立 source 状态流转与 SOP 更新提醒机制

## 前置条件
- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 已安装或可访问 Obsidian
- 本地有可写入的项目目录，例如 `D:\dolan_env\temp\project\personal`
- 具备创建目录、写入配置文件、创建 Junction 链接的权限
- 了解目标 AI 客户端的本地配置目录，如 `~/.claude`、`~/.codex`、`~/.kimi`、`~/.gemini`、`.cursor`、`.windsurf`
- 已获取 claude-obsidian 项目仓库地址

## 标准步骤

### 1. 克隆 claude-obsidian 项目到本地
在 PowerShell 中进入目标工作目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后出现多层嵌套目录，手动整理为单一项目根目录，确保后续 VAULT 路径明确可用。

**预期结果：** 本地存在可访问的 claude-obsidian 项目根目录，且路径清晰，无多余嵌套影响后续配置。

### 2. 初始化 Vault 目录结构
设置 Vault 根路径并创建 Obsidian 配置目录、原始资料目录、知识库目录及 SOP 目录：

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

如项目已有部分目录，保留并补齐缺失项即可。

**预期结果：** Vault 根目录下已具备 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等标准目录。

### 3. 写入 Obsidian 基础配置
在 Vault 中补充或更新以下配置文件：

1. `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 目录标识为黄色，便于与 sources、concepts、entities 区分。
2. `.obsidian/app.json`：排除 AI 工作文件与不需要展示的中间文件，避免干扰搜索和图谱。
3. `.obsidian/appearance.json`：启用 CSS snippets，以支持自定义视觉标识。

如果已有同名文件，优先合并配置而不是直接覆盖，避免破坏现有 Obsidian 设置。

**预期结果：** Obsidian 能正确识别 Vault，图谱中可区分 SOP 内容，且 AI 中间文件不会污染主视图。

### 4. 为多个 AI 客户端创建 skills 链接
将 claude-obsidian 的 skills 目录通过 Junction 方式链接到各 AI 客户端的 skills 目录，使多个工具共享同一套知识库能力。根据实际客户端逐项执行，例如：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

使用 PowerShell `New-Item -ItemType Junction` 创建链接，目标指向 claude-obsidian 项目中的 skills 目录。例如：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "D:\dolan_env\temp\project\personal\claude-obsidian\skills"
```

若父目录不存在，先创建父目录再建立链接。

**预期结果：** 目标 AI 客户端能够读取同一套 claude-obsidian skills，无需在每个客户端重复维护流程定义。

### 5. 创建 wiki-sop 技能定义
在 `skills/wiki-sop/SKILL.md` 中定义 SOP 相关技能，至少覆盖以下能力：

- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题后生成 SOP
- 更新模式：当 source 更新且比已有 SOP 更新时提示重写或增量更新
- 质量检查：检查步骤是否可执行、是否有 checklist、是否保留来源回链

技能文档应明确输入、触发条件、输出格式、命名约定、回链要求，以及 SOP 生成时的标准结构。

**预期结果：** `skills/wiki-sop/SKILL.md` 已存在，并能作为 AI 客户端统一的 SOP 生成与检查规则来源。

### 6. 配置 hooks 自动检查 SOP 机会
编辑 `hooks/hooks.json`，在 `SessionStart` 钩子中加入 SOP 自动检查逻辑，内容应覆盖以下规则：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 ≥ 3 时，提示生成 SOP
- 若 `sop-priority: high`，优先提示生成 SOP
- 若 source 比已存在 SOP 更新，提示更新 SOP

可在同一 hooks 配置中补充其他自动化动作，例如 Claude Code 的 `PostToolUse` 自动 commit，但不要影响 SOP 检查逻辑的清晰性。

**预期结果：** 支持 hooks 的客户端在会话开始时会自动识别 SOP 生成或更新机会，并给出明确提示。

### 7. 建立 source 状态流转规则
统一 source 的生命周期状态，推荐采用如下流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

并执行以下自动标记规则：

- 包含分步骤操作流程的资料：标记为 `status: sop-ready`
- 最佳实践或经验总结类资料：标记为 `status: sop-ready` 且 `sop-priority: high`
- 纯参考资料、无直接操作流程：标记为 `status: processed`

在 ingest 或后处理阶段，要求 AI 或人工补全 frontmatter，确保状态字段一致。

**预期结果：** sources 的状态可被统一识别，系统能稳定区分普通资料与可提炼为 SOP 的资料。

### 8. 执行知识导入与分类整理
使用项目原生能力进行知识导入与整理：

- 使用 `ingest` 命令导入原始资料并自动记笔记
- 检查内容是否已被正确分配到 `wiki/concepts/`、`wiki/entities/`、`wiki/sources/`
- 定期执行 `lint the wiki`，修复命名、链接、结构等问题
- 需要检索时使用 `query:` 命令定位知识内容

对新导入的 source，重点检查其 frontmatter 中的状态、主题、时间戳和来源链接是否完整。

**预期结果：** 原始资料成功进入知识库并完成基础分类，sources 可供后续 SOP 触发机制扫描。

### 9. 触发 SOP 生成或更新
根据客户端能力选择自动或手动方式生成 SOP：

- Claude Code：依赖 hooks，在 `SessionStart` 自动检查是否需要生成或更新 SOP
- Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf：通常需要手动触发，例如输入“整理SOP”或指定主题生成

生成 SOP 时，要求输出包含：适用场景、前置条件、可执行步骤、检查清单、常见问题、来源回链。若已有 SOP，则比对 source 时间与内容差异，执行更新而非重复创建。

**预期结果：** 对应主题的 SOP 被新建或更新到 `wiki/sop/`，内容结构一致且可直接复用。

### 10. 验证跨客户端可用性并持续维护
分别在已接入的 AI 客户端中测试以下能力：

- 能否识别 claude-obsidian skills
- 能否访问同一个 Vault 路径
- 能否读取 `wiki/sop/` 中的 SOP 文档
- 能否根据 `wiki/sources/` 中的状态提示生成或更新 SOP

建立定期维护习惯：

- 定期运行 `lint the wiki`
- 定期检查 `status: sop-ready` 但尚未合成的资料
- 定期比对 source 与 SOP 的更新时间
- 对失效链接、过时流程、重复 SOP 进行清理

**预期结果：** 多个 AI 客户端共享同一套知识库与 SOP 机制，且知识库持续保持可检索、可维护、可演进。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 项目到本地固定路径
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已配置 `graph.json`、`app.json`、`appearance.json`
- [ ] 已为目标 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 `SessionStart` 的 SOP 自动检查逻辑
- [ ] 已统一 source 状态流转与 frontmatter 标记规则
- [ ] 已完成至少一次 ingest 导入并确认 sources 分类正常
- [ ] 已测试至少一个客户端可以生成或更新 SOP
- [ ] 已确认 `wiki/sop/` 中的 SOP 包含步骤、checklist、FAQ 和来源回链

## 常见问题

### Q1. 为什么系统没有自动生成 SOP？
通常有三种原因：一是当前客户端不支持 hooks 自动触发；二是 source 没有被标记为 `status: sop-ready`；三是同主题资料数量不足，尚未达到自动提示阈值。可先检查 hooks 配置、frontmatter 状态以及主题聚合数量。

### Q2. 哪些客户端支持自动检查 SOP 机会？
根据来源信息，Claude Code 支持通过 `hooks.json` 在 `SessionStart` 自动检查。Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 主要依赖 skills，通常需要手动触发。

### Q3. source 应该什么时候标记为 `sop-ready`？
当资料包含明确的分步骤操作流程，或属于可复用的最佳实践、经验总结时，应标记为 `sop-ready`。若复用价值很高，可追加 `sop-priority: high`。纯背景参考资料一般保持 `processed`。

### Q4. 为什么要使用 Junction 而不是复制 skills？
使用 Junction 可以让多个 AI 客户端共享同一份 skills 定义，后续只需维护一处，避免多端配置漂移和重复更新。

### Q5. SOP 已存在时还需要重新生成吗？
不一定。应先比较 sources 与 SOP 的更新时间和内容差异。如果 source 更完整或更新，应执行 SOP 更新；如果无明显变化，只需保留现有 SOP 并继续维护。

### Q6. 如何判断一个 SOP 质量是否达标？
至少应满足四点：步骤可执行、输出结果明确、包含检查清单、保留来源回链。若缺少前置条件、更新说明或异常处理，建议补充完善。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]