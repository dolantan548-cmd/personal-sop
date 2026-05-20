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

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查、提示生成与更新机制。目标是让知识导入、分类、维护、SOP 生成和跨客户端复用形成统一流程。

## 2. 适用场景

- 需要在 Windows 上初始化 claude-obsidian 知识库
- 需要自动识别可复用流程并转化为 SOP
- 需要多个 AI 客户端共用同一知识库与 skills
- 需要把零散来源资料沉淀为标准操作流程

## 3. 前置条件

- Windows 环境，具备 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 项目仓库
- 已确定知识库根目录
- 对 AI 客户端配置目录有写入权限
- 了解基础 Obsidian 目录结构与 Markdown 管理方式

## 4. 标准操作步骤

### 步骤 1：克隆项目并确认知识库根目录

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果仓库出现嵌套目录，整理到统一根目录，例如：

`D:\dolan_env\temp\project\personal\claude-obsidian`

**预期结果：** 本地已存在可访问的知识库根目录，后续配置路径明确。

### 步骤 2：创建标准目录结构

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

**预期结果：** 必需目录全部创建完成。

### 步骤 3：写入基础 Obsidian 配置

补齐以下配置文件：

- `.obsidian/graph.json`：配置知识图谱颜色分组，`sop` 使用黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS 片段

如已有配置，采用合并方式，不覆盖现有有效设置。

**预期结果：** Obsidian 可正常展示知识图谱、样式和文件过滤规则。

### 步骤 4：为多 AI 客户端创建 skills 链接

将知识库 skills 目录链接到目标客户端：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/claude-obsidian`
- Windsurf：`.windsurf/skills/claude-obsidian`

使用 `New-Item -ItemType Junction` 创建链接。

**预期结果：** 各客户端可访问同一套 skills。

### 步骤 5：创建 SOP 技能说明文件

创建文件：

`skills/wiki-sop/SKILL.md`

内容应至少包含：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：source 更新后提示 SOP 更新
- 质量检查：检查可执行性、清单和回链

**预期结果：** AI 客户端可以根据技能说明执行 SOP 相关任务。

### 步骤 6：配置 hooks 自动检查 SOP

修改：

`hooks/hooks.json`

在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持，可加入 `PostToolUse` 后处理。

**预期结果：** 支持 hooks 的客户端可在会话开始时自动执行 SOP 检查。

### 步骤 7：建立 Source 状态流转规则

统一使用以下状态流：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践或经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** source 资料具备统一状态字段，能被自动机制识别。

### 步骤 8：执行知识导入与分类整理

使用以下原生能力：

- `ingest`：导入资料
- 自动分类到 `concepts`、`entities`、`sources`
- `lint the wiki`：定期维护
- `query:`：知识查询与验证

整理时及时补全 frontmatter 状态。

**预期结果：** 资料已进入知识库并可检索、可维护、可继续转 SOP。

### 步骤 9：生成或更新 SOP

在以下情况生成或更新 SOP：

- 同主题 `sop-ready` 资料达到 3 份及以上
- `sop-priority: high`
- source 晚于已有 SOP

输出到：

`wiki/sop/`

生成时确保：

1. 步骤清晰且可执行
2. 含前置条件、检查清单、FAQ
3. 建立来源回链
4. 使用统一模板

不支持 hooks 的客户端可通过手动命令触发，例如“整理SOP”。

**预期结果：** `wiki/sop/` 中存在结构标准、可追踪来源的 SOP 文件。

### 步骤 10：按客户端能力验证运行方式

验证方式：

- Claude Code：检查 `SessionStart` 自动扫描是否生效
- Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf：检查是否可通过 skills 手动触发

注意：不支持 hooks 不代表配置失败，只要可手动复用同一套技能即可。

**预期结果：** 自动与手动两种 SOP 使用路径都已可用。

## 5. 检查清单

- [ ] 已克隆项目并确认知识库根目录
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已创建多客户端 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已建立 source 状态流转规则
- [ ] 已验证 `ingest`、`lint the wiki`、`query:` 可用
- [ ] 已生成至少一份 SOP
- [ ] 已验证客户端触发方式

## 6. 常见问题

### Q1：为什么 SOP 不会自动生成？

通常因为两类原因：

1. 客户端不支持 hooks
2. source 没有正确标记为 `status: sop-ready`

应先检查 `hooks/hooks.json`，再检查 frontmatter。

### Q2：哪些客户端支持自动 SOP 检查？

当前明确支持自动检查的是 Claude Code。其他客户端主要通过 skills 手动触发。

### Q3：什么资料应该标记为 `sop-ready`？

凡是包含可复用步骤、最佳实践或经验总结的资料，都应标记为 `sop-ready`；高价值内容再增加 `sop-priority: high`。

### Q4：source 更新后 SOP 怎么处理？

若 source 比 SOP 更新，应提示重新综合并更新 SOP，避免知识过时。

### Q5：纯参考资料需要转成 SOP 吗？

不需要。纯参考资料应保留为 `processed`，仅在具备明确流程时再转为 SOP。

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]