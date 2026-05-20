---
type: sop
category: workflow
status: active
created: 2026-05-20
updated: 2026-05-20
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
用于在 Windows 环境中部署 claude-obsidian 知识库，完成基础目录与配置初始化，并为多 AI 客户端接入 skills 链接，同时配置 SOP 自动检查、手动生成与更新提示机制。

## 适用场景
- 需要在 Windows 上初始化 claude-obsidian 知识库
- 希望实现 AI 自动写笔记、分类整理与知识查询
- 希望将 sources 中可复用流程自动转化为 SOP
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 共享同一套知识库技能配置
- 需要建立 source 到 SOP 的标准化状态流转机制

## 前置条件
- Windows 环境
- 已安装 Git
- 已可使用 PowerShell
- 有权限在本地目录及用户目录下创建文件夹与 Junction 链接
- 已确定 vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 可访问 claude-obsidian 项目仓库
- 至少一种支持 skills 的 AI 客户端

## 标准操作步骤

### 步骤 1：克隆项目并确认 Vault 路径
打开 PowerShell，进入目标目录后克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如克隆后存在嵌套目录，整理为统一 vault 根目录，并设置变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且已明确唯一的 Vault 路径。

### 步骤 2：创建标准目录结构
执行以下命令创建所需目录：

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

**预期结果：** Vault 中已具备标准目录结构。

### 步骤 3：初始化 Obsidian 配置文件
创建或补充以下文件：

1. `.obsidian/graph.json`：为知识图谱配置颜色分组，建议 `sop` 使用黄色。
2. `.obsidian/app.json`：排除 AI 工作文件。
3. `.obsidian/appearance.json`：启用 CSS snippets。

**预期结果：** Obsidian 基础配置可用，图谱、文件排除与外观扩展已启用。

### 步骤 4：为多 AI 客户端创建 skills Junction 链接
将项目 skills 链接到各客户端目录。示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

建议覆盖以下客户端路径：
- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

**预期结果：** 多个 AI 客户端共享同一套 skills 配置。

### 步骤 5：创建 SOP 自动化技能定义
创建文件 `skills/wiki-sop/SKILL.md`，至少包括：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：source 更新时提示更新 SOP
- 质量检查：验证步骤可执行性、检查清单完整性、回链完整性

**预期结果：** SOP 技能已可被客户端调用。

### 步骤 6：配置 hooks 自动检查 SOP 机会
修改或创建 `hooks/hooks.json`，在 `SessionStart` 中加入以下逻辑：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数 `≥ 3` 时提示生成 SOP
- `sop-priority: high` 时优先提示生成 SOP
- source 比 SOP 新时提示更新 SOP

**预期结果：** 支持 hooks 的客户端可在会话开始自动发现 SOP 机会。

### 步骤 7：建立 source 状态流转与自动标记规则
统一采用以下流转模型：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** 所有 source 具备统一状态定义，便于自动扫描和后续综合。

### 步骤 8：验证基础知识库能力是否可用
在客户端中验证：
- `ingest`
- 自动分类到 `concepts/`、`entities/`、`sources/`
- `query:`
- `lint the wiki`

同时确认 `wiki/sop/` 可被检索与引用。

**预期结果：** 知识库基础能力与 SOP 目录均正常工作。

### 步骤 9：按客户端能力执行 SOP 生成与更新
执行原则：
- Claude Code：优先使用 hooks 自动检查并提示生成
- Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf：通过 skills 手动触发，例如输入“整理SOP”

优先处理：
- `status: sop-ready`
- 同主题资料较多
- `sop-priority: high`

输出位置建议统一为 `wiki/sop/`。

**预期结果：** 至少完成一次 SOP 生成或更新。

### 步骤 10：执行 SOP 质量检查并回链来源
每次生成或更新 SOP 后检查：
- 步骤是否可执行
- 命令、路径、输出位置是否明确
- 是否带有检查清单
- 是否正确回链 source
- 是否已根据最新 source 更新

**预期结果：** SOP 可执行、可追溯，并与 source 保持同步。

## 检查清单
- [ ] 已克隆 claude-obsidian 仓库并确认 Vault 根路径
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已为目标 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查规则
- [ ] 已定义并统一使用 source 状态流转规则
- [ ] 已验证 ingest、query、lint the wiki 功能可用
- [ ] 已完成一次 SOP 生成或更新
- [ ] 已执行质量检查并补充回链

## 常见问题 FAQ

**Q1：哪些客户端支持自动检查 SOP？**  
A：Claude Code 支持 hooks，可在 `SessionStart` 自动检查。Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 通常只能手动触发。

**Q2：什么时候应标记为 `sop-ready`？**  
A：当资料包含清晰步骤流程，或属于可复用最佳实践、经验总结时，应标记为 `sop-ready`。

**Q3：什么情况下应生成或更新 SOP？**  
A：同主题 `sop-ready` 资料达到 3 条及以上、存在 `sop-priority: high`、或 source 比现有 SOP 更新时，应生成或更新。

**Q4：不支持 hooks 的客户端怎么使用？**  
A：通过 skills 手动触发，例如输入“整理SOP”或明确指定主题。

**Q5：为什么要做 Junction 链接？**  
A：为了让多个 AI 客户端共享同一套 skills，避免重复维护，并保持生成逻辑一致。

**Q6：AI 生成 SOP 后还需要人工检查吗？**  
A：需要，重点检查可执行性、命令路径准确性、检查清单完整性及来源回链是否完整。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]