---
type: sop
category: workflow
status: active
created: 2026-05-24
updated: 2026-05-24
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
用于在 Windows 环境中标准化部署 claude-obsidian 知识库，配置多 AI 客户端共享的 skills 链接，并建立 SOP 自动识别、生成与更新机制，确保知识沉淀与流程文档生产可以长期稳定运行。

## 适用场景
- 需要在 Windows 上部署 claude-obsidian 知识库
- 需要 AI 自动写笔记、分类整理与知识查询
- 需要将可复用流程沉淀为 SOP
- 需要在多个 AI 客户端中复用同一套知识库能力
- 需要建立 source → SOP 的统一流转和维护机制

## 前置条件
- Windows 环境，支持 PowerShell
- 已安装 Git
- 已准备本地项目目录
- 已获取仓库地址：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 已安装至少一个目标 AI 客户端
- 具备创建目录、配置文件和 Junction 的权限
- 已确定唯一 Vault 根目录

## 标准步骤

### 步骤 1：克隆仓库并确认 Vault 根目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

克隆完成后，确认实际 Vault 根目录，例如：

```text
D:\dolan_env\temp\project\personal\claude-obsidian
```

如存在嵌套目录，先整理为单一根目录结构。

**预期结果：** 本地已存在可用 Vault，且根目录清晰唯一。

### 步骤 2：创建知识库标准目录结构
执行：

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

该结构用于支持原始资料、知识分类和 SOP 输出。

**预期结果：** 标准目录已全部存在。

### 步骤 3：写入 Obsidian 基础配置
补齐或更新以下文件：
- `.obsidian/graph.json`：知识图谱颜色分组，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

目标是提升图谱可视化、减少噪音文件干扰，并确保样式配置生效。

**预期结果：** Obsidian 配置满足知识库管理需求。

### 步骤 4：为多 AI 客户端创建统一 skills 链接
按客户端创建 Junction，使多个工具共享同一套 skills：
- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/`
- Windsurf → `.windsurf/skills/`

原则：统一引用，不复制多份。

**预期结果：** 多个 AI 客户端均可访问同一套 skills 配置。

### 步骤 5：创建 SOP 专用 skill 定义
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：
- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：指定主题生成 SOP
- 更新模式：sources 更新后提示刷新 SOP
- 质量检查：验证步骤、checklist、来源回链

建议同时说明输入目录、输出目录、触发条件、生成格式和更新规则。

**预期结果：** SOP skill 已可被不同客户端统一调用。

### 步骤 6：配置 hooks 自动检查机制
编辑 `hooks/hooks.json`，在 `SessionStart` 加入自动检查规则：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料 `>= 3` 时提示生成 SOP
- 若 `sop-priority: high`，优先提示生成 SOP
- 若 source 比既有 SOP 更新，则提示更新 SOP

支持 hooks 的客户端优先启用自动检查；不支持的客户端保留手动触发方案。

**预期结果：** 会话开始时可自动发现 SOP 生成或更新机会。

### 步骤 7：建立 Source 状态流转规范
统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：
- 分步骤流程资料 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

可由 AI 在整理时自动标记，也可由人工复核修正。

**预期结果：** Sources 已具备统一状态语义，可支撑 SOP 自动化判断。

### 步骤 8：执行笔记摄取、分类与维护
按原生能力维护知识库：
- 用 `ingest` 导入资料
- 自动分类到 `concepts`、`entities`、`sources`
- 用 `lint the wiki` 定期维护
- 用 `query:` 进行查询

在整理过程中同步检查哪些 source 应进入 `sop-ready`。

**预期结果：** 知识库持续积累结构化资料，并为 SOP 提供稳定输入。

### 步骤 9：按客户端能力触发 SOP 生成或更新
执行策略：
- Claude Code：通过 hooks 自动检查，再调用 skill 完成生成/更新
- Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf：通过手动指令触发，例如“整理SOP”

标准输出位置为 `wiki/sop/`，并要求补齐来源回链。

**预期结果：** SOP 能被成功生成或更新，并纳入知识库。

### 步骤 10：验收 SOP 质量并完成回链
重点检查：
- 步骤是否可执行
- 命令、路径、判断条件是否明确
- checklist 是否完整
- 来源回链是否完整
- 是否正确存放到 `wiki/sop/`
- source 更新后内容是否同步

不符合要求时必须修订后再使用。

**预期结果：** SOP 完整、可靠、可追溯。

## 检查清单
- [ ] 已克隆仓库并确认 Vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 配置
- [ ] 已创建多客户端 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已建立 source 状态流转规则
- [ ] 已验证 ingest、lint、query 可用
- [ ] 已成功触发至少一次 SOP 生成或更新
- [ ] 已完成 SOP 质量检查与来源回链

## 最佳实践
- 所有客户端统一链接到同一份 skills 配置，避免配置漂移
- 在 source 整理阶段尽早补齐 `status` 和 `sop-priority`
- 对高价值经验总结优先标记 `sop-priority: high`
- 定期执行 `lint the wiki`，降低知识库结构失真风险
- SOP 生成后必须做人审，特别是步骤可执行性与回链完整性
- 优先使用自动检查，手动触发作为兜底方案

## 常见问题

### 1. 为什么有些客户端不会自动提示 SOP？
因为并非所有客户端支持 hooks。Claude Code 支持 `hooks.json`，可以在 `SessionStart` 自动检查；其他客户端多数需要手动触发 skill。

### 2. 什么样的资料适合标记为 `sop-ready`？
凡是包含明确操作步骤、可重复执行流程、最佳实践或经验总结的资料，都适合标记为 `sop-ready`。其中高复用、高价值内容建议加 `sop-priority: high`。

### 3. 自动触发的核心判定条件是什么？
同主题 `sop-ready` 资料达到 3 份及以上，或存在 `sop-priority: high`，或 source 比现有 SOP 更新，均应触发生成或更新提醒。

### 4. 为什么要用 Junction 而不是复制目录？
Junction 能让多个客户端共享同一份配置，减少重复维护和版本不一致问题。

### 5. SOP 自动生成后是否可以直接发布？
不建议直接发布。应先检查步骤、命令、路径、checklist 和来源回链是否完整准确。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]