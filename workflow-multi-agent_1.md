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

# SOP: 在 Windows 部署 claude-obsidian 并配置多 AI 客户端的 SOP 自动生成机制

## 目的
用于在 Windows 环境中部署 claude-obsidian 知识库，建立标准目录与配置文件，连接多个 AI 客户端的 skills，并启用基于 source 状态的 SOP 自动检查与更新机制，实现知识沉淀、流程抽取与跨客户端复用。

## 适用场景
- 需要在 Windows 上搭建可被多个 AI 客户端共用的知识库
- 希望将原始对话、资料和操作经验自动整理为结构化笔记
- 希望基于 sources 自动识别可复用流程并生成 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套知识与 SOP
- 需要建立 source 从 ingest 到 sop-ready 再到 synthesized 的标准流转机制

## 前置条件
- Windows 环境，具备 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定 vault 存放路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 目标 AI 客户端已安装，且支持 skills 或等效目录链接
- 具备编辑文本文件的能力，用于修改 `hooks.json`、`SKILL.md` 和 Obsidian 配置文件

## 标准步骤

### 步骤 1：克隆项目并确认 Vault 根目录
打开 PowerShell，进入目标目录后克隆项目，并确认最终 vault 根目录可用于后续配置。

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后出现额外嵌套目录，整理为单一 vault 根目录，确保后续路径统一。建议将 vault 路径保存为变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 目录，且已明确唯一的 vault 根路径。

### 步骤 2：创建标准目录结构
在 vault 下创建 Obsidian 配置目录、原始资料目录、知识库分类目录、SOP 目录与模板目录，保持后续 ingest、分类与 SOP 生成的一致性。

```powershell
New-Item -ItemType Directory -Path "$VAULT\.obsidian\snippets" -Force
New-Item -ItemType Directory -Path "$VAULT\.raw" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\concepts" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\entities" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sources" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sop" -Force
New-Item -ItemType Directory -Path "$VAULT\_templates" -Force
```

**预期结果：** Vault 内已具备 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop` 和 `_templates` 等标准目录。

### 步骤 3：写入基础 Obsidian 配置
在 `.obsidian` 目录下创建或更新配置文件，确保图谱、界面显示与 AI 工作文件过滤符合知识库使用方式。

至少完成以下配置：
1. `.obsidian/graph.json`：配置知识图谱颜色分组，并为 `sop` 类内容设置醒目标识，例如黄色。
2. `.obsidian/app.json`：排除 AI 生成过程中的工作文件，避免噪音进入日常视图。
3. `.obsidian/appearance.json`：启用 CSS snippets，以支持自定义样式。

如团队已有标准模板，应优先复用团队模板，确保不同客户端看到一致的结构与样式。

**预期结果：** Obsidian 能正确识别知识图谱分组、隐藏无关工作文件，并启用样式片段。

### 步骤 4：为多个 AI 客户端创建 skills 链接
将 claude-obsidian 项目或其 skills 目录通过 Windows Junction 链接到各 AI 客户端要求的位置，使多个客户端共享同一套技能与知识工作流。

按需为以下客户端建立链接：
- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/`
- Windsurf → `.windsurf/skills/`

在 Windows 中使用 `New-Item -ItemType Junction` 建立目录连接。示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT"
```

对其他客户端按其目标路径重复执行，并确保父目录已存在。

**预期结果：** 目标 AI 客户端的 skills 目录中已出现指向 claude-obsidian 的链接，并可被客户端识别。

### 步骤 5：创建 wiki-sop 技能说明文件
在项目的 skills 体系中新增 `skills/wiki-sop/SKILL.md`，定义 SOP 自动机制的触发方式、生成模式和质量要求。该文件至少应覆盖以下内容：
- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料。
- 手动生成模式：当用户指定某主题时，基于相关资料生成 SOP。
- 更新模式：当 source 更新且时间或内容晚于现有 SOP 时，提示更新 SOP。
- 质量检查：检查步骤是否可执行、是否有检查清单、是否包含来源回链。

建议在 `SKILL.md` 中补充统一输出规范：
1. SOP 标题明确；
2. 步骤使用编号；
3. 每步包含输入、操作、输出；
4. 末尾包含 checklist 与 source backlinks。

**预期结果：** 存在可被 AI 客户端调用的 `skills/wiki-sop/SKILL.md`，且已清楚定义 SOP 的自动检查、生成、更新与质检规则。

### 步骤 6：配置 hooks 以启用自动 SOP 检查
修改 `hooks/hooks.json`，在 `SessionStart` 阶段加入 SOP 自动检查逻辑。配置中应包含以下规则：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记；
- 同主题资料数量大于等于 3 时，提示生成 SOP；
- `sop-priority: high` 时，优先提示生成 SOP；
- 当 sources 比既有 SOP 更新时，提示更新 SOP。

可将检查说明写入 hook 的提示文本中，例如：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如果使用 Claude Code，可进一步利用其 hooks 能力在会话启动时自动触发检查，并在工具使用后执行附加动作。

**预期结果：** 会话启动时，系统能够自动检查 sources 中的 SOP 候选资料，并在满足条件时提示生成或更新 SOP。

### 步骤 7：建立 source 状态流转与自动标记规则
统一 source 的状态流转，保证资料从采集到 SOP 抽取过程可追踪。推荐状态流转如下：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

执行规范：
1. 新资料导入后，先进入 raw 或 processed 流程。
2. 若资料包含明确的分步骤操作流程，则标记 `status: sop-ready`。
3. 若资料包含最佳实践或经验总结，同时具有较高复用价值，则标记 `status: sop-ready` 与 `sop-priority: high`。
4. 若资料仅供参考、无明确流程，则保留 `status: processed`。
5. SOP 生成后，将对应 source 或聚合结果标记为 `synthesized`，并保留回链关系。

**预期结果：** 所有 source 均可依据内容类型被统一分类，SOP 候选资料能够被明确识别并进入后续自动检查流程。

### 步骤 8：按客户端能力选择自动或手动 SOP 工作流
根据不同 AI 客户端的能力差异，确定 SOP 的触发方式：
- **Claude Code**：支持 hooks，可在 `SessionStart` 自动检查 SOP 候选。
- **Kimi Code**：支持 skills，但通常需手动触发，例如输入“整理SOP”。
- **Codex CLI**：支持 skills，通常需手动触发。
- **Gemini CLI**：支持 skills，通常需手动触发。
- **Cursor / Windsurf**：若仅支持 skills 链接而不支持 hooks，则采用手动触发方式。

标准做法：
1. 优先在 Claude Code 中启用自动检查机制。
2. 其他客户端统一保留手动指令入口，例如“整理SOP”“为某主题生成 SOP”“检查是否需要更新 SOP”。
3. 无论自动还是手动触发，均输出到统一的 `wiki/sop/` 目录。

**预期结果：** 每个客户端都有明确的 SOP 使用方式；支持 hooks 的客户端可自动检查，不支持 hooks 的客户端也可通过手动指令完成同样流程。

### 步骤 9：验证知识采集、分类与 SOP 生成链路
完成部署后，执行一次端到端验证：
1. 通过 `ingest` 命令或等效方式导入一份资料。
2. 确认资料被归类到 `wiki/concepts`、`wiki/entities` 或 `wiki/sources`。
3. 为包含流程的 source 添加 `status: sop-ready`。
4. 准备至少 3 条同主题资料，或为某一资料设置 `sop-priority: high`。
5. 启动 Claude Code 会话，或在其他客户端手动输入触发命令，例如“整理SOP”。
6. 检查 `wiki/sop/` 中是否生成对应 SOP。
7. 对 source 做更新，验证系统是否提示更新既有 SOP。
8. 执行 `lint the wiki`，检查知识库结构和引用一致性。

**预期结果：** 资料可被成功导入和分类；满足条件时可生成 SOP；source 更新后系统能提示 SOP 更新；知识库维护命令能正常运行。

## 检查清单
- [ ] 已在 Windows 上成功克隆 claude-obsidian 仓库
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已写入 `graph.json`、`app.json`、`appearance.json` 基础配置
- [ ] 已为至少一个 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md` 并定义自动检查、手动生成、更新与质检规则
- [ ] 已在 `hooks/hooks.json` 中加入 `SessionStart` 的 SOP AUTO-CHECK 逻辑
- [ ] 已建立 source 状态流转规则：raw / processed / sop-ready / synthesized / archived
- [ ] 已配置 `status: sop-ready` 与 `sop-priority: high` 的自动标记原则
- [ ] 已确认 Claude Code 可自动检查，其他客户端可手动触发 SOP 整理
- [ ] 已完成一次从 source 到 `wiki/sop/` 的端到端验证

## 常见问题

### 1. 为什么知识库原生支持笔记整理，但 SOP 不能直接自动生成？
因为知识采集、分类、查询和维护是项目原生能力，而 SOP 生成依赖模板、触发条件和工作流约束，需要通过 `SKILL.md` 与 hooks 进行额外配置。

### 2. 哪些客户端支持自动检查 SOP？
根据现有资料，Claude Code 支持 hooks，因此可在 `SessionStart` 自动检查。Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 主要依赖 skills，通常需要手动触发。

### 3. 什么时候应该把 source 标记为 `sop-ready`？
当资料包含明确的分步骤操作流程，或沉淀了可复用的最佳实践、经验总结时，应标记为 `sop-ready`。若复用价值高，建议同时加上 `sop-priority: high`。

### 4. 系统在什么条件下应提示生成 SOP？
常见触发条件有三类：同主题 `sop-ready` 资料达到 3 条及以上；某资料标记为 `sop-priority: high`；或 source 内容已更新且晚于当前 SOP。

### 5. 如果没有 hooks 支持，还能使用这套 SOP 机制吗？
可以。没有 hooks 的客户端仍可通过 skills + 手动指令触发，例如“整理SOP”“根据某主题生成 SOP”“检查是否需要更新 SOP”。

### 6. SOP 生成后应放在哪里？
统一放在 `wiki/sop/` 目录，确保不同客户端使用同一份 SOP，并便于图谱展示、维护和回链管理。

### 7. 如何判断 SOP 是否需要更新？
当相关 source 的内容或时间戳晚于当前 SOP，或新增了足以改变流程的最佳实践时，应提示并执行 SOP 更新。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]