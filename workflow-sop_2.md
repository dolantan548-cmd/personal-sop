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

## 目的
规范化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并建立 SOP 自动检查与生成机制，确保知识可沉淀、可检索、可复用、可持续转化为标准操作流程。

## 适用场景
- 需要在 Windows 上搭建本地知识库并接入 AI 自动记笔记能力
- 希望将整理后的资料自动识别为可 SOP 化内容
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等客户端复用同一套知识库能力
- 需要建立 SOP 的生成、更新提醒与质量检查机制
- 需要将 sources 中的经验、流程、最佳实践沉淀为标准 SOP

## 前置条件
- Windows 环境，且可使用 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 项目仓库
- 本地具备一个用于存放 vault 的目录，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 了解各 AI 客户端本地配置目录，如 `~/.claude`、`~/.kimi`、`~/.codex`、`~/.gemini`、`.cursor`、`.windsurf`
- 具备创建目录、写入配置文件、创建 Junction 链接的权限

## 标准操作步骤

### 步骤 1：克隆项目并确认 vault 根目录
在 PowerShell 中进入目标工作目录，执行项目克隆：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如仓库存在嵌套目录或历史残留结构，先整理为单一 vault 根目录。建议将后续所有目录与配置统一放在该仓库根目录下，并定义变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且后续操作统一指向同一个 `$VAULT` 路径。

### 步骤 2：创建知识库标准目录结构
使用 PowerShell 创建 vault 所需的核心目录：

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
- `wiki/sources`：处理后的来源资料
- `wiki/concepts`：概念类知识
- `wiki/entities`：实体类知识
- `wiki/sop`：沉淀后的 SOP
- `_templates`：SOP 与笔记模板

**预期结果：** vault 目录结构完整，包含 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等目录。

### 步骤 3：写入 Obsidian 基础配置
在 `.obsidian` 下建立基础配置文件，至少包括以下内容：

1. `graph.json`：配置知识图谱颜色分组，建议为 `sop` 设置单独颜色（如黄色），以便与 sources、concepts、entities 区分。
2. `app.json`：排除 AI 工作中间文件，避免干扰浏览与检索。
3. `appearance.json`：启用 CSS snippets，便于后续增强显示效果。

如果团队已有统一模板，应直接复用；若暂无模板，至少保证以上三个文件存在且语义正确。

**预期结果：** Obsidian 启动后可识别 vault，图谱中能区分 SOP，且 AI 工作文件不会污染主视图。

### 步骤 4：为多 AI 客户端建立 skills Junction 链接
将项目中的 skills 能力目录通过 Junction 链接暴露给各 AI 客户端，使其共享同一套知识库工作流。目标包括：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

示例命令：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

按各客户端实际路径逐一执行，若父目录不存在先创建父目录。

**预期结果：** 目标 AI 客户端的 skills 目录下已出现指向 vault skills 的 Junction，客户端可复用同一套技能定义。

### 步骤 5：创建 SOP skill 定义文件
在项目中创建 `skills/wiki-sop/SKILL.md`，明确 SOP 生成与维护的标准行为。该 skill 至少应覆盖以下模式：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题时生成 SOP
- 更新模式：当 sources 更新且比现有 SOP 新时，提示更新 SOP
- 质量检查：检查步骤可执行性、检查清单完整性、回链完整性

建议在 `SKILL.md` 中写明触发条件、输入来源、输出路径（如 `wiki/sop/`）和生成格式规范，避免不同 AI 客户端输出风格不一致。

**预期结果：** 项目内存在可被 AI 客户端读取的 `skills/wiki-sop/SKILL.md`，且其职责覆盖 SOP 生成、更新提醒和质量校验。

### 步骤 6：配置 hooks 自动检查 SOP 机会
在 `hooks/hooks.json` 中加入 SessionStart 触发逻辑，用于在会话开始时自动检查是否存在可生成或应更新的 SOP。核心规则应包括：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持更多事件，也可增加如 PostToolUse 自动提交、生成后校验等行为。但最低要求是 SessionStart 自动检查，以减少人工漏检。

**预期结果：** 支持 hooks 的客户端在会话开始时会主动检查 SOP 生成或更新机会，并给出明确提示。

### 步骤 7：建立 Source 状态流转标准
统一资料状态流转，确保 AI 能正确识别哪些资料可沉淀为 SOP。推荐状态流如下：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

其中：
- `raw`：原始导入资料
- `processed`：已整理但尚未确认可 SOP 化
- `sop-ready`：已确认包含可复用流程，适合汇总成 SOP
- `synthesized`：已被提炼进 SOP
- `archived`：归档资料

自动标记规则：
- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` 且 `sop-priority: high`
- 纯参考资料 → `status: processed`

要求团队在整理 sources 时统一使用这些字段，避免后续自动检查失效。

**预期结果：** sources 笔记具备统一状态字段，AI 能依据状态自动判断哪些资料需要生成或更新 SOP。

### 步骤 8：执行知识导入、整理与查询闭环
使用项目原生命令完成知识库日常运行：

- 用 `ingest` 导入新资料，让 AI 自动写入笔记
- 由系统自动分类到 `concepts`、`entities`、`sources`
- 定期执行 `lint the wiki` 做结构维护与一致性检查
- 使用 `query:` 命令检索已有知识

在日常流程中，要求将含操作步骤的来源资料优先整理为结构化 notes，并补充状态字段，以便 SOP 自动机制识别。

**预期结果：** 知识库形成“导入—整理—维护—检索”的稳定闭环，sources 中的 SOP 候选资料持续累积。

### 步骤 9：按客户端能力选择自动或手动触发 SOP 生成
根据不同 AI 客户端支持情况执行 SOP 工作流：

- **Claude Code**：优先使用自动模式，依赖 `hooks.json` 在 SessionStart 自动检查，并可结合 PostToolUse 等机制增强自动化。
- **Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf**：通常不支持 hooks 自动化，需手动下达如“整理SOP”“根据 sop-ready 资料生成 SOP”的指令。

无论自动还是手动，生成 SOP 时都应优先汇总同主题 sources，并将输出统一保存到 `wiki/sop/`。

**预期结果：** 各 AI 客户端都能基于同一知识库执行 SOP 生成，只是触发方式因客户端能力不同而有所区别。

### 步骤 10：校验生成结果并持续更新 SOP
每次生成或更新 SOP 后，进行质量校验，至少检查以下内容：

- 步骤是否按顺序且可执行
- 每一步是否有明确输入、操作和预期结果
- 是否包含适用场景、前置条件和检查清单
- 是否建立到相关 sources 的回链
- 当 sources 更新后，是否重新比对并更新 SOP

建议将质量检查要求写入 SOP 模板和 `SKILL.md`，保证不同客户端输出的一致性。完成后，将最终 SOP 存放于 `wiki/sop/` 并在知识图谱中确认可见。

**预期结果：** 产出的 SOP 可直接复用，且与最新来源资料保持同步，具备完整回链和可执行性。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 项目并确认唯一 vault 根目录
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已写入 `graph.json`、`app.json`、`appearance.json` 等基础配置
- [ ] 已为目标 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md` 并定义 SOP 自动检查、手动生成、更新提醒、质量检查规则
- [ ] 已在 `hooks/hooks.json` 中配置 SessionStart 的 SOP AUTO-CHECK 逻辑
- [ ] 已为 sources 统一使用 `status` 与 `sop-priority` 等字段
- [ ] 已明确 `raw`、`processed`、`sop-ready`、`synthesized`、`archived` 状态流转
- [ ] 已在支持 hooks 的客户端验证自动提示可用
- [ ] 已在不支持 hooks 的客户端验证手动触发 SOP 生成可用
- [ ] 已将最终 SOP 输出到 `wiki/sop/` 并完成质量校验

## 常见问题

### 1. 为什么项目原生支持记笔记，但 SOP 仍需要额外配置？
因为资料导入、分类、查询属于项目的原生能力，而 SOP 生成属于“在已有知识上做进一步综合提炼”的过程，需要通过 skill、hooks 和状态字段来定义触发条件与输出规范。

### 2. 哪些资料应该标记为 `status: sop-ready`？
凡是包含明确操作步骤、可重复执行流程、最佳实践总结或经验沉淀的资料，都应标记为 `sop-ready`。其中最佳实践类内容建议再加 `sop-priority: high`。

### 3. 如果只有一两篇资料，是否需要立即生成 SOP？
不一定。推荐在同主题资料达到 3 篇及以上时优先生成，这样更容易形成稳定、完整、可复用的流程；但若资料被标记为 `sop-priority: high`，也可以提前生成。

### 4. 哪些客户端支持自动检查 SOP？
根据来源信息，Claude Code 支持通过 `hooks.json` 自动检查；Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 通常需要手动触发。

### 5. 如果 sources 更新了，已有 SOP 需要怎么处理？
应比对 sources 与 SOP 的更新时间。如果 sources 比 SOP 更新，则触发“提示更新 SOP”流程，重新综合相关来源并修订 SOP 内容。

### 6. 为什么要为多个 AI 客户端建立 Junction 链接？
这样可以让多个客户端共享同一套 skills 与知识库能力，避免在每个客户端分别维护一套配置，降低重复劳动与版本不一致风险。

### 7. SOP 生成后如何判断质量是否达标？
至少检查步骤是否可执行、是否有预期结果、是否附带检查清单、是否具备相关来源回链，以及是否与最新 sources 保持同步。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]