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

## 目的

用于在 Windows 环境中部署 claude-obsidian 知识库，启用 AI 自动记笔记、分类整理、SOP 自动触发检查，并将该能力通过 skills 链接复用于多个 AI 客户端。

## 适用场景

- 需要在 Windows 本地搭建可持续维护的知识库与 SOP 体系
- 需要将原始资料自动整理到 Obsidian vault 中
- 需要根据可复用流程资料自动提示生成 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等多个 AI 工具中共享同一套技能与知识库

## 前置条件

- Windows 环境，具备 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 项目仓库
- 已确定 vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 具备目标 AI 客户端本地配置目录的写入权限
- 了解 Obsidian vault 基本目录结构

## 标准操作步骤

### 步骤 1：克隆项目并确认部署路径

在 PowerShell 中进入目标父目录后克隆仓库，并确认最终 vault 路径无多层错误嵌套。

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如克隆后出现多余嵌套目录，手动整理为单一 vault 根目录，例如：`D:\dolan_env\temp\project\personal\claude-obsidian`。

**预期结果：** 本地存在可用的 claude-obsidian 项目目录，并明确唯一 vault 根路径。

### 步骤 2：创建标准目录结构

在 PowerShell 中为 vault 创建 Obsidian 配置目录、原始资料目录、wiki 分类目录与模板目录。

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

**预期结果：** vault 中已存在 `.obsidian/snippets`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等标准目录。

### 步骤 3：写入 Obsidian 基础配置

在 `.obsidian` 目录下创建或更新以下配置文件：

- `.obsidian/graph.json`：设置知识图谱颜色分组，其中 SOP 类笔记使用黄色以便识别
- `.obsidian/app.json`：排除 AI 工作文件，避免无关文件污染工作区
- `.obsidian/appearance.json`：启用 CSS snippets

如团队已有标准模板，应统一使用同一份配置内容；如暂无模板，至少确保 graph、app、appearance 三类配置存在且可被 Obsidian 识别。

**预期结果：** Obsidian 能正常打开该 vault，且图谱分组、文件排除、外观片段功能已具备启用条件。

### 步骤 4：为多个 AI 客户端创建 skills 链接

将 claude-obsidian 项目中的 skills 能力通过 Junction 链接到各 AI 客户端的 skills 目录，使多个工具可复用同一套知识与操作能力。

建议目标包括：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/`
- Windsurf：`.windsurf/skills/`

在 Windows 下使用 `New-Item -ItemType Junction` 创建链接。执行前确认目标父目录已存在；如不存在先创建目录。

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 目标 AI 客户端的 skills 目录中已出现指向 claude-obsidian 的 Junction 链接，并可访问其技能内容。

### 步骤 5：配置 SOP 技能说明文件

在项目中创建 `skills/wiki-sop/SKILL.md`，定义 SOP 自动机制的行为。该技能说明至少应覆盖以下模式：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题后生成 SOP
- 更新模式：sources 更新时提示更新既有 SOP
- 质量检查：验证步骤可执行性、检查清单、回链完整性

编写要求：

1. 明确 SOP 产出目录为 `wiki/sop/`
2. 明确输入资料优先来自 `wiki/sources/`
3. 要求生成结果包含步骤、检查清单、常见问题与来源回链
4. 要求在同主题资料足够时优先建议综合而非重复生成

**预期结果：** `skills/wiki-sop/SKILL.md` 已存在，且 AI 客户端可据此执行 SOP 相关检查、生成与更新操作。

### 步骤 6：配置 hooks 自动检查机制

修改或创建 `hooks/hooks.json`，在 `SessionStart` 钩子中加入 SOP 自动检查逻辑。规则应至少包含：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量大于等于 3 时，提示生成 SOP
- `sop-priority: high` 时，提示优先生成 SOP
- sources 的更新时间晚于 SOP 时，提示更新 SOP

推荐将提示文案标准化，例如：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记；若 ≥3 个同主题、或 sop-priority: high、或 source 比 SOP 新，则提示生成或更新 SOP。
```

如工具支持，可同时配置 PostToolUse 自动 commit；如不支持 hooks，则保留手动触发方案。

**预期结果：** 在支持 hooks 的客户端中，启动会话时会自动检查是否应生成或更新 SOP。

### 步骤 7：建立 Source 状态流转规则

在知识库中统一 source 状态流转，确保 AI 与人工都按同一标准标注资料状态。标准流转如下：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

自动标记规则：

- 包含分步骤操作流程：标记为 `status: sop-ready`
- 最佳实践或经验总结：标记为 `status: sop-ready` 且 `sop-priority: high`
- 纯参考资料：标记为 `status: processed`

应在 source 笔记 frontmatter 或统一元数据位置维护这些字段，避免状态遗漏。

**预期结果：** 新进入知识库的资料都能被归入明确状态，SOP 候选资料可被自动或人工识别。

### 步骤 8：执行资料导入与分类整理

使用项目原生能力导入资料，并让系统自动分类到 `concepts`、`entities`、`sources` 等目录。导入后检查 source 元数据，按状态流转规则补齐 `status` 和可选 `sop-priority`。

操作要点：

- 使用 `ingest` 命令导入资料
- 对纯参考内容保持 `processed`
- 对具有复用价值的操作流程改为 `sop-ready`
- 对高价值经验沉淀追加 `sop-priority: high`
- 定期执行 `lint the wiki` 保持结构整洁
- 需要查询知识时使用 `query:` 命令

**预期结果：** 资料已进入标准目录并带有可用于 SOP 判断的状态字段，知识库可被正常查询与维护。

### 步骤 9：按客户端能力执行 SOP 生成或更新

根据不同 AI 客户端的能力选择自动或手动方式：

- Claude Code：支持 hooks，可在 SessionStart 自动检查是否需要生成 SOP，并在适用时提示或执行后续流程
- Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf：通常仅支持 skills，不支持 hooks，需手动输入如“整理SOP”或指定主题来触发生成

生成 SOP 时应遵循统一输出标准：

1. 标题明确对应主题
2. 步骤可直接执行
3. 包含检查清单
4. 包含 FAQ
5. 保留来源回链
6. 写入 `wiki/sop/`

**预期结果：** 目标主题的 SOP 已在 `wiki/sop/` 下生成或更新，且结构一致、可执行、可追溯。

### 步骤 10：验证结果并纳入持续维护

完成部署后进行端到端验证：

1. 打开 Obsidian，确认 vault 正常加载
2. 检查 `wiki/sources/` 中存在 `sop-ready` 样本
3. 在 Claude Code 中启动新会话，验证 SessionStart 是否出现 SOP 自动检查提示
4. 在不支持 hooks 的客户端中手动触发一次 SOP 整理
5. 检查生成的 SOP 是否包含步骤、清单、FAQ、来源回链
6. 定期运行 `lint the wiki`
7. 当 source 有新增或更新时，重新触发 SOP 更新检查

建议将此验证流程作为每次迁移环境、升级工具或新增客户端后的回归检查。

**预期结果：** 整套流程在至少一个自动客户端和一个手动客户端中均验证通过，知识库与 SOP 机制进入可持续运行状态。

## 检查清单

- [ ] 已成功克隆 claude-obsidian 仓库并确认唯一 vault 路径
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/sources`、`wiki/sop`、`_templates` 等标准目录
- [ ] 已写入或更新 `.obsidian/graph.json`、`.obsidian/app.json`、`.obsidian/appearance.json`
- [ ] 已为至少一个 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md` 并定义自动检查、手动生成、更新、质量检查机制
- [ ] 已在 `hooks/hooks.json` 中配置 `SessionStart` 的 SOP 自动检查逻辑
- [ ] 已统一 source 状态流转规则并能标记 `sop-ready`
- [ ] 已通过 `ingest` 导入资料并完成状态标注
- [ ] 已成功生成或更新至少一个 `wiki/sop/` 下的 SOP 文档
- [ ] 已完成自动触发或手动触发的端到端验证

## FAQ

### 1. 为什么 SOP 不会自动生成？

最常见原因是所用客户端不支持 hooks，或 `hooks/hooks.json` 未正确配置。Claude Code 支持 SessionStart 自动检查；Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 通常需要手动触发。

### 2. 什么样的 source 应该标记为 `sop-ready`？

凡是包含清晰分步骤操作流程、可重复执行方法、最佳实践、经验总结的资料，都应标记为 `sop-ready`；若价值高且适合优先沉淀，可再加 `sop-priority: high`。

### 3. 什么情况下应该提示生成 SOP？

当同主题 `sop-ready` 资料达到 3 份及以上、某资料带有 `sop-priority: high`、或 source 的更新时间晚于已有 SOP 时，都应提示生成或更新 SOP。

### 4. 纯参考资料也要进入 SOP 流程吗？

不需要。纯参考资料通常标记为 `processed`，保留在知识库中供查询，但不作为优先 SOP 候选。

### 5. 多个 AI 客户端如何共享同一套能力？

通过在各客户端的 skills 目录下创建指向 claude-obsidian 项目的 Junction 链接，可复用同一套 skills、模板和知识组织方式。

### 6. 如果 source 更新了，如何处理旧 SOP？

应通过 hooks 或手动检查 sources 与 SOP 的时间差；若 source 比 SOP 新，则提示更新该 SOP，并确保更新后仍包含步骤、清单、FAQ 与来源回链。

## 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]