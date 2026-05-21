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

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的

用于在 Windows 环境中部署 claude-obsidian 知识库，启用 AI 自动记笔记与分类整理能力，并标准化配置 SOP 自动检测、生成、更新以及跨 AI 客户端引用机制。

## 适用场景

- 需要在 Windows 上搭建本地知识库并接入 AI 自动整理流程时
- 需要将来源资料自动沉淀为可复用 SOP 时
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套 skills 时
- 需要建立 source → SOP 的标准化状态流转与维护机制时

## 前置条件

- Windows 环境，具备 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 本地有可用的知识库目录，例如 `D:\dolan_env\temp\project\personal`
- 具备目标 AI 客户端的本地配置目录写权限
- 理解 Obsidian Vault 的基本目录结构

## 标准步骤

### 1. 克隆 claude-obsidian 仓库并确认 Vault 路径

在 PowerShell 中进入你的工作目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如仓库存在嵌套目录或放置位置不符合你的规划，先整理到最终 Vault 路径。建议统一设置：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已成功获取项目，并确定唯一、稳定的 Vault 根目录路径。

### 2. 创建标准目录结构

执行以下命令创建基础目录：

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

**预期结果：** Vault 中已包含 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等标准目录。

### 3. 写入基础 Obsidian 配置

在 `.obsidian` 目录中补齐基础配置文件：

- `.obsidian/graph.json`：知识图谱颜色分组，建议将 `sop` 设为黄色。
- `.obsidian/app.json`：排除 AI 工作文件。
- `.obsidian/appearance.json`：启用 CSS snippets。

如果已有同名文件，请基于现有配置合并修改，而不是盲目覆盖。

**预期结果：** Obsidian 已具备基础可视化与排除配置，SOP 类内容可被清晰识别。

### 4. 建立多 AI 客户端 skills 链接

将项目 skills 目录通过 Windows Junction 链接到各 AI 客户端的 skills 目录。需覆盖的客户端包括：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/`
- Windsurf → `.windsurf/skills/`

使用 `New-Item -ItemType Junction` 创建链接。若目标父目录不存在，请先创建。

**预期结果：** 多个 AI 客户端可共享同一套 claude-obsidian skills。

### 5. 配置 SOP 专用 skill

在 `skills/wiki-sop/SKILL.md` 中创建或补充 SOP 生成规则，至少覆盖：

1. 自动检查模式：扫描 `status: sop-ready` 的资料。
2. 手动生成模式：允许用户按主题指定生成 SOP。
3. 更新模式：当 sources 晚于现有 SOP 时提示更新。
4. 质量检查：校验步骤可执行性、检查清单和来源回链完整性。

建议明确输入格式、触发条件、输出位置和命名规则。

**预期结果：** 已存在可复用的 SOP 生成 skill，支持自动检测、手动生成、更新提醒与质量检查。

### 6. 在 hooks 中启用 SOP 自动检查

修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

Claude Code 可使用该机制自动检查；不支持 hooks 的客户端保留手动触发方式。

**预期结果：** 支持 hooks 的客户端会在会话开始时自动检查是否需要生成或更新 SOP。

### 7. 建立 source 状态流转标准

统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

自动标记规则：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践或经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** 来源资料具备统一状态字段，可明确识别是否适合沉淀为 SOP。

### 8. 执行知识导入与分类整理

使用项目原生能力进行知识处理：

- 使用 `ingest` 命令自动记笔记
- 自动分类到 `concepts`、`entities`、`sources`
- 定期运行 `lint the wiki`
- 使用 `query:` 进行知识检索

导入时尽量补齐 metadata，包括主题、状态、优先级和回链。

**预期结果：** 新资料已被导入、归类并可检索。

### 9. 生成或更新 SOP

按以下方式产出 SOP：

- 自动触发：支持 hooks 的客户端在 SessionStart 检测后提示生成或更新 SOP
- 手动触发：在不支持 hooks 的客户端中主动输入“整理SOP”或指定主题

生成输出建议统一写入 `wiki/sop/`，并确保 SOP 至少包含：

- 适用场景
- 前置条件
- 操作步骤
- 检查清单
- FAQ
- 相关来源回链

如果 sources 晚于现有 SOP，应执行更新而不是重复创建。

**预期结果：** 目标主题已形成标准化、可执行、可追溯的 SOP。

### 10. 验证跨客户端可用性与持续维护机制

分别验证主要客户端：

- Claude Code：验证 hooks 自动检查是否生效
- Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf：验证 skills 是否可见，并确认可通过手动指令触发

建立持续维护习惯：

- 定期运行 `lint the wiki`
- 清理长期未处理的 `sop-ready`
- 检查 source 是否晚于对应 SOP
- 保持 SOP 的来源回链完整

**预期结果：** 各客户端均可正常使用知识库与 SOP 机制，知识库具备长期维护能力。

## 检查清单

- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 根路径
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已完成 `graph.json`、`app.json`、`appearance.json` 基础配置
- [ ] 已为目标 AI 客户端创建 skills Junction 链接
- [ ] 已创建或更新 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 `SessionStart` 的 SOP 自动检查逻辑
- [ ] 已建立 source 的状态流转与自动标记规则
- [ ] 已验证 `ingest`、`query` 和 `lint the wiki` 可正常使用
- [ ] 已至少生成或更新一份 `wiki/sop/` 下的 SOP 文档
- [ ] 已验证各客户端的自动或手动 SOP 触发方式

## FAQ

### 为什么 SOP 不会自动生成？

最常见原因是当前客户端不支持 hooks，或者 `hooks/hooks.json` 中未正确加入 SessionStart 检查逻辑。对于 Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf，通常需要手动触发，例如输入“整理SOP”。

### 哪些资料应该标记为 `status: sop-ready`？

凡是包含可复用的分步骤操作流程、最佳实践、经验总结的资料，都应标记为 `status: sop-ready`。如果复用价值高或优先级高，可额外加上 `sop-priority: high`。

### 什么时候应该更新已有 SOP，而不是新建一份？

当来源资料的更新时间晚于现有 SOP，或者同主题 sources 已明显补充了新步骤、新约束、新最佳实践时，应更新原 SOP，避免同主题重复文档。

### Claude Code 与其他客户端的差异是什么？

Claude Code 支持 hooks，因此可以在 SessionStart 自动检查 SOP，并在部分流程中自动执行后续维护动作。其他客户端主要依赖 skills，通常只能手动触发 SOP 整理。

### 为什么要把 skills 通过 Junction 链接到多个客户端？

这样可以确保所有客户端共享同一份能力定义，避免为每个工具分别维护一套 skills，降低配置漂移和维护成本。

### 知识库长期维护时最重要的动作是什么？

关键是定期运行 `lint the wiki`、持续清理和标记 `wiki/sources/` 中的资料状态、及时更新过时 SOP，并保持来源回链完整。

## 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]