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

## 目的
标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用基于 source 状态流转的 SOP 自动检查与生成机制，确保知识沉淀、流程复用和跨工具调用一致。

## 适用场景
- 需要在 Windows 上搭建可供 AI 自动写笔记与知识整理的 Obsidian 知识库
- 需要把零散资料自动整理为 concepts、entities、sources 与 SOP
- 需要为 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等客户端提供统一 skills 入口
- 需要根据 source 状态自动识别可 SOP 化资料并触发生成或更新提醒
- 需要让多个 AI 客户端能够引用同一 vault 中的 SOP 文档

## 前置条件
- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 已安装或可访问 Obsidian
- 确定 vault 存放路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 目标 AI 客户端已安装，且其 skills 目录可访问
- 可从 GitHub 拉取仓库 `https://github.com/AgriciDaniel/claude-obsidian.git`

## 操作步骤

### 1. 克隆仓库并确认 vault 根目录
在 PowerShell 中进入目标父目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如仓库存在额外嵌套目录，先整理到统一 vault 根目录。设置变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且 `$VAULT` 指向正确路径。

### 2. 创建 vault 所需目录结构
执行以下命令：

```powershell
New-Item -ItemType Directory -Path "$VAULT\.obsidian\snippets" -Force
New-Item -ItemType Directory -Path "$VAULT\.raw" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\concepts" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\entities" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sources" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sop" -Force
New-Item -ItemType Directory -Path "$VAULT\_templates" -Force
```

**预期结果：** vault 下已生成标准目录结构。

### 3. 写入 Obsidian 基础配置
补齐或更新以下文件：

1. `.obsidian/graph.json`：配置图谱颜色分组，建议将 `sop` 设置为黄色
2. `.obsidian/app.json`：排除 AI 工作文件
3. `.obsidian/appearance.json`：启用 CSS 片段

若已有配置，按需合并，不要盲目覆盖。

**预期结果：** Obsidian 可按预期显示图谱、外观与排除项。

### 4. 为多 AI 客户端创建 skills 链接
将项目 skills 目录以 Junction 方式链接到各 AI 客户端。常见目标：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

必要时先创建父目录。

**预期结果：** 目标客户端已能访问到项目 skills。

### 5. 创建 wiki-sop 技能定义
在 `skills/wiki-sop/SKILL.md` 中定义 SOP 专用能力，至少包括：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按主题生成 SOP
- 更新模式：当 source 比 SOP 新时提示更新
- 质量检查：检查步骤可执行性、清单完整性、回链完整性

**预期结果：** `skills/wiki-sop/SKILL.md` 已可被 AI 客户端识别和使用。

### 6. 配置 hooks 自动检查 SOP 机会
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入规则：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数 ≥ 3 时提示生成 SOP
- `sop-priority: high` 时优先提示生成 SOP
- sources 比 SOP 新时提示更新 SOP

如环境支持，可在 Claude Code 中进一步配置 `PostToolUse` 自动 commit。

**预期结果：** 支持 hooks 的客户端在会话开始时会自动检查 SOP 生成或更新机会。

### 7. 落实 source 状态流转标准
统一 source 生命周期：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

在 `wiki/sources/` 的 frontmatter 中维护这些字段。

**预期结果：** sources 状态一致，系统可识别哪些资料可转 SOP。

### 8. 验证各客户端触发方式
分别测试：

- **Claude Code**：验证 `SessionStart` 自动检查是否生效
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：验证 skills 是否可见，并通过手动指令触发，例如“整理SOP”

若某客户端不支持 hooks，必须在流程说明中标明“手动触发”。

**预期结果：** 各客户端的自动/手动边界清晰，使用者知道如何触发 SOP 相关流程。

### 9. 执行首次 SOP 生成与质量检查
从 `wiki/sources/` 中选择已标记为 `status: sop-ready` 的主题进行生成，输出到 `wiki/sop/`。完成后检查：

- 步骤是否可执行
- 顺序是否正确
- 是否包含适用场景、前置条件、检查清单、FAQ
- 是否回链到相关 source
- source 更新后是否会触发 SOP 更新

必要时运行维护命令（如 `lint the wiki`）并使用查询命令验证可检索性。

**预期结果：** 已产出至少一份完整、可执行、可回溯的 SOP。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 vault 路径
- [ ] 已创建标准目录结构
- [ ] 已配置 `.obsidian/graph.json`、`.obsidian/app.json`、`.obsidian/appearance.json`
- [ ] 已至少为一个 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SessionStart 的 SOP 自动检查规则
- [ ] 已建立 `status` 与 `sop-priority` 标记规范
- [ ] 已确认 Claude Code 为自动检查，其他不支持 hooks 的客户端改为手动触发
- [ ] 已生成至少一份 SOP 并完成质量检查
- [ ] 已验证 source 更新后的 SOP 更新机制

## 常见问题

### Q1：为什么有些客户端不会自动检查 SOP？
因为不是所有客户端都支持 hooks。Claude Code 支持 `hooks.json` 自动执行，而 Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 主要通过 skills 手动触发。

### Q2：什么样的 source 应该标记为 `sop-ready`？
当资料中包含可重复执行的分步骤操作流程，或已经沉淀为最佳实践、经验总结时，应标记为 `status: sop-ready`。高优先级再补充 `sop-priority: high`。

### Q3：什么时候应该生成新的 SOP？
当同主题 `sop-ready` 资料达到 3 份及以上，或资料被标记为 `sop-priority: high`，或某流程已稳定可复用时，应生成新的 SOP。

### Q4：什么时候需要更新已有 SOP？
当 source 更新时间晚于 SOP，或流程、命令、路径、工具支持差异发生变化时，应更新 SOP。

### Q5：skills 链接应该指向哪里？
应确保客户端能访问到项目的 skills 内容。通常将客户端中的 `claude-obsidian` 链接目标设为 vault 内的 `skills` 目录。

### Q6：已有 Obsidian 配置是否可以直接覆盖？
不建议。应按要求合并配置，避免影响用户原有设置。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]