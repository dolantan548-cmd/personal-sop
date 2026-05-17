---
type: sop
category: workflow
status: active
created: 2026-05-17
updated: 2026-05-17
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
本 SOP 用于标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 共享能力，并建立 SOP 自动检查、生成与更新机制，确保知识沉淀流程可重复、可维护、可跨工具复用。

## 2. 适用场景
- 需要在 Windows 本地部署 claude-obsidian
- 需要 AI 自动写笔记、分类整理和知识查询
- 需要从来源资料中识别可沉淀 SOP 的内容
- 需要在多个 AI 客户端中共用同一知识库和 SOP 能力
- 需要建立 SOP 的自动触发与持续更新机制

## 3. 前置条件
- Windows 环境，可使用 PowerShell
- 已安装 Git
- 具备本地目录读写权限
- 已确认 vault 部署路径
- 已安装或准备使用至少一个 AI 客户端
- 可编辑项目目录中的 skills 与 hooks 配置文件

## 4. 标准流程

### 步骤 1：克隆项目并确认目标目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果存在嵌套目录，先整理为单一 vault 根目录。

**预期结果：** 本地已存在可访问的 claude-obsidian 项目目录，且已确定唯一的 vault 根路径。

### 步骤 2：初始化知识库目录结构
执行以下命令创建标准目录：

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

目录职责：
- `.raw`：原始输入
- `wiki/sources`：来源资料
- `wiki/sop`：SOP 输出
- `wiki/concepts`、`wiki/entities`：知识结构化内容

**预期结果：** 知识库所需目录完整可用。

### 步骤 3：写入 Obsidian 基础配置
创建或更新以下文件：
- `.obsidian/graph.json`：设置知识图谱颜色分组，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS 片段

建议采用统一模板，避免多环境配置差异。

**预期结果：** Obsidian 可以正确显示分类并减少噪音文件。

### 步骤 4：为多 AI 客户端建立 skills 链接
将 `claude-obsidian` skills 通过 Junction 链接到各客户端：
- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/`
- Windsurf：`.windsurf/skills/`

使用 `New-Item -ItemType Junction` 创建链接，并确保目标父目录存在。

**预期结果：** 多个 AI 客户端可复用同一套 skills。

### 步骤 5：创建 SOP 专用 skill
创建文件：

`skills/wiki-sop/SKILL.md`

该 skill 至少应支持以下模式：
- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：source 更新时提示更新 SOP
- 质量检查模式：检查步骤可执行性、checklist、来源回链

建议在文档中明确输入、输出、命名规范和判断规则。

**预期结果：** 项目已具备 SOP 专用 skill，可指导 AI 执行 SOP 相关任务。

### 步骤 6：配置 hooks 自动检查 SOP 候选资料
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持 hooks，应在每次会话开始时自动运行该逻辑。

**预期结果：** 新会话开始时，系统能自动识别待生成或待更新的 SOP。

### 步骤 7：建立 Source 状态流转与自动标记规则
采用统一状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 包含分步骤操作流程：`status: sop-ready`
- 包含最佳实践或经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

要求 AI 在 ingest 或整理阶段就进行初步标记。

**预期结果：** 来源资料状态一致，便于自动筛选 SOP 候选主题。

### 步骤 8：按客户端能力执行自动或手动 SOP 生成
按客户端差异执行：
- Claude Code：使用 hooks 自动检查并提醒生成/更新
- Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf：手动触发，例如“整理 SOP”

生成内容统一输出到 `wiki/sop/`，并包含：
- 标题
- 适用场景
- 前置条件
- 步骤
- checklist
- FAQ
- 来源回链

**预期结果：** 当前主题的 SOP 已生成，或系统已明确给出生成/更新提示。

### 步骤 9：执行质量检查与持续维护
对已生成 SOP 做质量检查：
- 步骤是否可执行
- 是否包含明确命令或动作
- 是否有预期结果
- 是否有 checklist
- 是否保留来源回链
- source 更新后是否会触发 SOP 更新提醒

同时定期进行知识库维护，例如：
- 使用 `ingest` 写入资料
- 使用 `query:` 查询知识
- 使用 `lint the wiki` 进行整理与校验

**预期结果：** SOP 结构完整、可执行、可追溯，并能持续更新。

## 5. 检查清单
- [ ] 已在 Windows 上成功克隆 claude-obsidian 仓库
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已完成 `.obsidian/graph.json`、`.obsidian/app.json`、`.obsidian/appearance.json` 配置
- [ ] 已为所需 AI 客户端创建 `claude-obsidian` skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查逻辑
- [ ] 已统一 source 状态流转与 auto-marking 规则
- [ ] 已确认当前客户端是自动触发还是手动触发 SOP
- [ ] 已在 `wiki/sop/` 成功生成至少一份 SOP
- [ ] 已完成 SOP 的可执行性、清单完整性和来源回链检查

## 6. 最佳实践
- 优先复用单一 vault 路径，避免多个副本分叉
- 使用 Junction 共享 skills，避免重复维护
- 在 source 整理早期就标记 `sop-ready`，减少后续筛选成本
- 对高价值流程添加 `sop-priority: high`
- 保持 SOP 与 source 的回链关系，确保可追溯
- 将 SOP 更新纳入常规知识库维护流程

## 7. 常见问题

**Q1：为什么项目原生支持记笔记和整理，但 SOP 不能直接自动产出？**  
A：因为 SOP 生成依赖明确的触发规则、模板和质量校验逻辑，所以需要额外配置 `wiki-sop` skill 和 hooks。

**Q2：哪些客户端可以自动检查 SOP 候选内容？**  
A：Claude Code 支持 hooks，可自动检查；其他多数客户端主要依赖 skills，需要手动触发。

**Q3：什么样的 source 应该标记为 `sop-ready`？**  
A：包含分步骤流程、最佳实践、可重复执行操作的资料都应标记为 `sop-ready`。

**Q4：什么时候应该提示生成 SOP？**  
A：当同主题 `sop-ready` 来源达到 3 份及以上、某条 source 被标记为 `sop-priority: high`，或 source 比已有 SOP 更新时，都应提示生成或更新。

**Q5：为什么要用 Junction 链接 skills？**  
A：这样多个 AI 客户端可共享同一份能力配置，避免复制造成版本不一致。

**Q6：生成 SOP 后还需要维护什么？**  
A：需要持续检查 source 更新、SOP 可执行性、清单完整性和来源回链，并定期运行知识库维护命令。

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]