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

# 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
规范在 Windows 环境中部署 claude-obsidian 知识库、启用 SOP 自动生成与更新提示机制，并完成多 AI 客户端复用同一技能目录与知识库的标准流程。

## 适用场景
- 需要在 Windows 上搭建可被 AI 持续写入的 Obsidian 知识库
- 希望将 ingest 后的资料自动分类、维护并进一步沉淀为 SOP
- 希望在 Claude Code 中自动检查 SOP 生成时机
- 希望在 Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等工具中复用同一套 skills
- 需要建立 source 从原始资料到 SOP 的标准状态流转机制

## 前置条件
- Windows 环境，且可使用 PowerShell
- 已安装 Git
- 可访问仓库 `https://github.com/AgriciDaniel/claude-obsidian.git`
- 本地已安装或准备使用 Obsidian
- 已确定知识库路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已具备创建目录联接（Junction）的权限
- 能够编辑 JSON 与 Markdown 文件

## 标准步骤

### 1. 克隆 claude-obsidian 仓库并确认目标路径
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在嵌套目录，整理为单一 vault 根目录，确保后续所有配置都指向同一路径。

**预期结果：** 本地存在可直接作为 Obsidian vault 使用的 `claude-obsidian` 根目录。

### 2. 初始化 Vault 目录结构
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

**预期结果：** 目录结构完整，满足知识输入、分类、SOP 输出与模板管理要求。

### 3. 写入 Obsidian 基础配置
创建或更新以下文件：

- `.obsidian/graph.json`：配置知识图谱颜色分组，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件或临时文件
- `.obsidian/appearance.json`：启用 CSS snippets

建议将这些配置纳入版本管理，避免不同设备配置不一致。

**预期结果：** Obsidian 可正确展示知识图谱、外观配置和过滤规则。

### 4. 建立多 AI 客户端 skills 目录联接
为不同 AI 客户端创建到同一目录的 Junction。典型目标包括：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT"
```

按需对其他客户端重复执行。

**预期结果：** 多个 AI 客户端均可访问同一套技能目录与知识库结构。

### 5. 配置 SOP 技能说明文件
创建 `skills/wiki-sop/SKILL.md`，明确以下行为：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按用户指定主题生成 SOP
- 更新模式：当 sources 更新时提示刷新 SOP
- 质量检查：校验步骤可执行性、检查清单完整性、来源回链完整性

建议在文件中写清：输入目录、输出目录、文件命名规范、触发条件、更新规则。

**预期结果：** AI 客户端可据此理解 SOP 的生成、更新与校验流程。

### 6. 配置 Hooks 自动检查 SOP 触发逻辑
修改 `hooks/hooks.json`，在 `SessionStart` 中加入 SOP 自动检查逻辑。推荐规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

Claude Code 支持 hooks，因此可在会话开始时自动执行此检查。

**预期结果：** 当资料达到条件时，系统能自动提示生成或更新 SOP。

### 7. 建立 source 状态流转规则
统一采用以下状态流：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

规则如下：

- 含分步骤操作流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`
- 已被沉淀进 SOP 的资料：可标记为 `synthesized`

**预期结果：** source 状态清晰，AI 与人工都能按统一标准处理资料。

### 8. 执行 ingest、分类与维护流程
使用项目原生能力：

- `ingest`：自动写入笔记
- 自动分类到 `concepts`、`entities`、`sources`
- `query:`：执行知识查询
- `lint the wiki`：定期维护知识库结构

在 ingest 后补充必要 frontmatter，尤其是 `status` 与 `sop-priority`。

**预期结果：** 新资料被稳定导入、归类、检索和维护，并可进入 SOP 判断流程。

### 9. 按客户端能力执行 SOP 生成或手动触发
客户端差异如下：

- **Claude Code**：支持 hooks，可自动检查 SOP 候选
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：一般支持 skills，但需要手动触发，例如输入“整理SOP”

手动触发时，应要求 AI：

1. 读取 `wiki/sources/` 中同主题且 `status: sop-ready` 的资料
2. 合并重复步骤与冲突表述
3. 输出到 `wiki/sop/` 目录
4. 补充来源回链、FAQ 与检查清单

**预期结果：** 不同客户端都能产出格式统一、可执行、可追溯的 SOP。

### 10. 校验 SOP 质量并完成收尾
生成或更新 SOP 后，检查以下内容：

- 步骤是否具体可执行
- 每一步是否包含预期结果
- 是否包含检查清单
- 是否包含 FAQ
- 是否包含相关 source 回链
- 是否放置在 `wiki/sop/` 且命名规范一致

如启用版本管理，应提交变更；在 Claude Code 中可进一步结合自动提交流程。

**预期结果：** SOP 满足统一质量标准，并已正式纳入知识库。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 vault 根目录
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已写入或更新 `graph.json`、`app.json`、`appearance.json`
- [ ] 已为目标 AI 客户端创建 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SessionStart 的 SOP 自动检查逻辑
- [ ] 已定义并统一使用 source 状态流转规则
- [ ] 已验证 `ingest`、`query:`、`lint the wiki` 可用
- [ ] 已验证 Claude Code 自动提示或其他客户端手动触发 SOP 生成功能
- [ ] 已完成至少一次 SOP 生成与质量检查

## 最佳实践
- 优先使用 Claude Code 作为自动检查入口，其他客户端作为补充操作入口
- 统一维护单一 skills 源目录，避免多处副本分叉
- source 在写入时就补全 `status`，减少后期批量返工
- 当同主题资料达到 3 条以上时，尽快沉淀 SOP，避免信息分散
- 将 SOP 生成标准写入 `SKILL.md`，确保不同 AI 输出风格一致
- 定期运行 `lint the wiki`，保持链接、分类和结构健康

## 常见问题

### Q1：为什么 SOP 没有自动生成？
通常是因为客户端不支持 hooks、`hooks/hooks.json` 未生效、source 未标记为 `status: sop-ready`，或同主题资料数量不足。Claude Code 更适合自动检查，其他客户端通常需要手动触发。

### Q2：哪些资料应该标记为 `sop-ready`？
凡是包含分步骤操作流程、最佳实践、经验总结的资料，都应标记为 `status: sop-ready`；高价值资料可加 `sop-priority: high`。

### Q3：纯参考资料需要转 SOP 吗？
不需要。纯参考资料通常保留为 `status: processed`，供查询和辅助引用即可。

### Q4：为什么要创建 Junction？
Junction 可以让多个 AI 客户端共享同一份 skills 或知识库目录，减少重复配置并降低维护成本。

### Q5：sources 更新后如何处理已有 SOP？
如果 source 比 SOP 新，应触发更新提示，并重新整合 SOP 内容，确保 SOP 与最新资料一致。

### Q6：SOP 文档最低标准是什么？
至少包含标题、目的、适用场景、前置条件、可执行步骤、每步预期结果、检查清单、FAQ、来源回链。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]