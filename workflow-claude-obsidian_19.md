---
type: sop
category: workflow
status: active
created: 2026-05-18
updated: 2026-05-18
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制，确保知识沉淀、流程复用与跨客户端引用一致可用。

## 适用场景
- 需要在 Windows 本地搭建 claude-obsidian 知识库
- 需要让 AI 自动写入、整理和查询笔记
- 需要把可复用流程自动识别并转化为 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套 skills
- 需要建立 source 到 SOP 的状态流转与维护机制

## 前置条件
- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 claude-obsidian 项目仓库
- 已确定 vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 目标 AI 客户端已安装（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf）
- 具备在用户目录下创建 Junction 链接的权限

## 标准步骤

### 1. 克隆 claude-obsidian 仓库到本地
打开 PowerShell，进入工作目录后执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如仓库内容出现多层嵌套目录，手动整理到统一 vault 根目录，确保后续 `.obsidian`、`wiki`、`_templates`、`skills`、`hooks` 等目录都位于同一根路径下。

**预期结果：** 本地存在可用的 claude-obsidian 根目录，且目录结构清晰，无多余嵌套影响后续配置。

### 2. 创建 vault 基础目录结构
在 PowerShell 中定义 vault 路径并创建目录：

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

如果目录已存在，可保留并跳过重复创建。

**预期结果：** vault 中已具备 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop` 和 `_templates` 等标准目录。

### 3. 写入 Obsidian 配置文件
在 vault 下创建或更新以下配置文件：

1. `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 分组设置为黄色，便于识别流程类文档。
2. `.obsidian/app.json`：排除 AI 工作文件，避免临时文件干扰知识库视图。
3. `.obsidian/appearance.json`：启用 CSS snippets，确保样式片段生效。

如已有配置，合并时保留现有个性化设置，但需确保 SOP 分类与排除规则生效。

**预期结果：** Obsidian 打开 vault 后，图谱分组、文件排除和外观片段均按预期工作。

### 4. 为多 AI 客户端创建 skills Junction 链接
将 vault 中的 skills 目录链接到各 AI 客户端使用的 skills 路径。使用 `New-Item -ItemType Junction` 创建目录联接。按需执行以下目标：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/claude-obsidian`
- Windsurf：`.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

若父目录不存在，先创建父目录再创建 Junction。

**预期结果：** 各 AI 客户端都能通过其约定的 skills 路径访问同一套 claude-obsidian skills 内容。

### 5. 创建 wiki-sop skill 以支持 SOP 自动检查与手动生成
在 `skills/wiki-sop/SKILL.md` 中定义 SOP 机制说明，至少覆盖以下能力：

- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 手动生成模式：根据用户指定主题生成 SOP
- 更新模式：当 source 比已有 SOP 更新时提示重建或更新 SOP
- 质量检查：检查步骤可执行性、检查清单完整性、回链完整性

建议在该 skill 中明确 SOP 输出结构、命名规范、引用规则和生成触发条件，以保证不同 AI 客户端执行结果一致。

**预期结果：** `skills/wiki-sop/SKILL.md` 已存在，并可作为统一 SOP 行为规范供 AI 客户端调用。

### 6. 配置 hooks 实现 SessionStart 自动检查
编辑 `hooks/hooks.json`，在 `SessionStart` 钩子中加入 SOP 自动检查逻辑，内容至少应覆盖：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数 `≥ 3` 时提示生成 SOP
- 存在 `sop-priority: high` 时提示优先生成 SOP
- 当 source 更新日期比对应 SOP 更新时提示更新 SOP

若使用 Claude Code，可进一步配置 `PostToolUse` 自动 commit 等机制；其他多数客户端通常不支持 hooks，仅保留手动触发能力。

**预期结果：** 支持 hooks 的客户端在新会话启动时会自动检查 SOP 候选资料，并给出生成或更新提示。

### 7. 建立 source 状态流转与自动标记规则
在知识库维护规范中明确 source 状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

同时定义自动标记规则：

- 包含分步骤操作流程：标记为 `status: sop-ready`
- 最佳实践或经验总结：标记为 `status: sop-ready` 且 `sop-priority: high`
- 纯参考资料：标记为 `status: processed`

将这些规则写入模板、skill 或团队约定中，确保 ingest 后的资料能一致分类。

**预期结果：** 新进入知识库的资料可以按照统一规则在 `processed`、`sop-ready`、`synthesized` 等状态间流转。

### 8. 按客户端差异执行 SOP 触发与使用
根据客户端能力使用 SOP 机制：

- **Claude Code**：支持自动检查，可在 `SessionStart` 自动发现 SOP 候选并提示；如已配置，还可在 `PostToolUse` 自动 commit。
- **Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf**：通常支持 skills，但不支持 hooks，需要手动输入如“整理SOP”之类指令触发。

使用时统一要求 AI：优先扫描 `wiki/sources/`，根据状态、主题聚类和更新时间判断是否生成或更新 `wiki/sop/` 中的 SOP 文档。

**预期结果：** 不同客户端均可使用同一套知识库和 SOP skill，只是触发方式根据客户端能力不同而有所区别。

### 9. 验证 ingest、查询、维护与 SOP 生成链路
完成配置后，逐项验证：

1. 使用 `ingest` 命令写入新资料，确认其进入知识库。
2. 检查资料是否被正确归类到 `concepts`、`entities`、`sources`。
3. 执行 `query:` 相关查询，确认知识可检索。
4. 执行 `lint the wiki`，确认定期维护机制可用。
5. 准备至少 3 篇同主题或 1 篇高优先级 source，测试 SOP 提示或手动生成。
6. 修改 source 后再次启动会话或手动触发，确认系统会提示更新 SOP。

**预期结果：** 从资料导入、整理、查询、维护到 SOP 生成/更新的全链路均验证通过。

### 10. 固化日常维护最佳实践
将以下动作纳入日常使用规范：

- 新资料先 ingest，再根据内容补充状态字段
- 对可复用流程优先标记 `sop-ready`
- 当资料达到同主题聚合阈值时及时生成 SOP
- source 更新后同步检查对应 SOP 是否过期
- 定期执行 `lint the wiki` 清理与校验知识库
- 确保 SOP 文档保留对 source 的回链，便于追溯依据
- 多客户端共用同一 vault 时，避免各端写入不同路径导致知识分裂

**预期结果：** 团队或个人在持续使用中能够稳定沉淀知识，并保持 SOP 的时效性、可执行性与可追溯性。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库到本地
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已完成 `.obsidian/graph.json`、`.obsidian/app.json`、`.obsidian/appearance.json` 配置
- [ ] 已为目标 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SessionStart 的 SOP 自动检查规则
- [ ] 已定义 source 状态流转与自动标记规则
- [ ] 已确认 Claude Code 可自动检查，其他客户端可手动触发
- [ ] 已测试 ingest、query、lint 和 SOP 生成/更新流程
- [ ] 已确认 SOP 文档能够回链到对应 source

## 常见问题

### 1. claude-obsidian 是否原生支持 AI 自动记笔记和分类整理？
支持。可通过 `ingest` 命令自动写入笔记，并原生分类到 `concepts`、`entities`、`sources` 等目录。

### 2. SOP 自动生成是原生功能还是需要额外配置？
SOP 生成依赖现有模板与 skills 机制，但自动触发需要额外配置，例如 `skills/wiki-sop/SKILL.md` 和 `hooks/hooks.json`。

### 3. 为什么只有 Claude Code 能自动检查 SOP？
因为 Claude Code 支持 `hooks.json`，可以在 `SessionStart` 自动执行检查逻辑。其他客户端通常只支持 skills，不支持 hooks，因此需要手动触发。

### 4. 哪些 source 应该标记为 `sop-ready`？
凡是包含可复用的分步骤操作流程，或可沉淀为最佳实践/经验总结的资料，都应标记为 `sop-ready`；高价值内容可额外加 `sop-priority: high`。

### 5. 何时应该生成 SOP？
当同主题的 `sop-ready` source 达到 3 篇及以上，或某条 source 带有 `sop-priority: high` 时，应优先生成 SOP。

### 6. 如果 source 更新了，已有 SOP 怎么处理？
应比较 source 与 SOP 的更新时间；如果 source 更新更晚，则提示重新生成或更新 SOP，确保 SOP 与最新实践一致。

### 7. 多 AI 客户端如何共用同一套知识库与 skills？
通过在各客户端的 skills 目录下创建指向同一 vault skills 目录的 Junction 链接，即可共用一套能力定义与知识路径。

### 8. Windows 下为什么使用 Junction 而不是复制 skills 文件？
Junction 可以确保多个客户端引用同一份 skills 源，避免复制后出现版本不一致、重复维护和内容漂移。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]