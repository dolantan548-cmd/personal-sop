---
type: sop
category: workflow
status: active
created: 2026-05-15
updated: 2026-05-15
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
规范化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接、启用 SOP 自动检查与生成机制的完整流程，确保知识摄取、整理、查询与 SOP 转化可持续运行。

## 适用场景
- 需要在 Windows 环境搭建 claude-obsidian 知识库
- 需要让 AI 自动写入、整理和维护知识笔记
- 需要基于 sources 自动识别可复用流程并生成 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等客户端复用同一套技能与知识库
- 需要建立 source 到 SOP 的状态流转和更新提醒机制

## 前置条件
- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 本地已确定知识库路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 了解目标 AI 客户端的本地配置目录，如 `~/.claude`、`~/.codex`、`~/.kimi`、`~/.gemini`、`.cursor`、`.windsurf`
- 具备创建 Junction（目录联接）的权限
- 明确需要保存的知识类型：sources、concepts、entities、sop

## 标准步骤

### 1. 克隆 claude-obsidian 仓库到本地
打开 PowerShell，进入目标父目录并执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果仓库内容出现额外嵌套目录，手动整理，确保 vault 根目录直接包含项目所需结构。

**预期结果：** 本地存在可用的 claude-obsidian 根目录，且目录结构清晰，无多余嵌套。

### 2. 创建标准 Vault 目录结构
在 PowerShell 中执行：

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

目录用途：
- `.raw`：原始输入
- `wiki/sources`：处理后的资料
- `wiki/concepts`：概念类知识
- `wiki/entities`：实体类知识
- `wiki/sop`：标准作业流程
- `_templates`：模板文件

**预期结果：** Vault 内部形成统一目录结构，可支持摄取、分类、SOP 生成与后续维护。

### 3. 写入 Obsidian 配置文件
在 `.obsidian` 下创建或修改：
- `graph.json`：配置知识图谱颜色分组，建议将 `sop` 设置为黄色
- `app.json`：排除 AI 工作文件和不需展示的中间文件
- `appearance.json`：启用 CSS snippets

若已有默认配置，以保留现有结构并补充必要字段为原则。

**预期结果：** Obsidian 能正确识别 Vault，图谱和外观配置生效。

### 4. 为多 AI 客户端创建 skills 目录联接
将项目中的技能目录通过 Junction 链接到各客户端：
- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills\claude-obsidian"
```

如果目标父目录不存在，先创建父目录。

**预期结果：** 各 AI 客户端能够引用同一套 claude-obsidian skills。

### 5. 配置 SOP 专用技能说明文件
在 `skills/wiki-sop/SKILL.md` 中定义 SOP 机制，至少包含：
- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：指定主题生成 SOP
- 更新模式：sources 更新后提示更新 SOP
- 质量检查：验证步骤、清单和来源回链

建议统一 SOP 输出结构：标题、适用场景、前置条件、步骤、检查清单、FAQ、相关来源。

**预期结果：** SOP 生成逻辑被明确固化在 skill 中。

### 6. 在 hooks 中启用 SOP 自动检查机制
修改 `hooks/hooks.json`，在 `SessionStart` 中加入规则：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 ≥ 3 时提示生成 SOP
- 存在 `sop-priority: high` 时优先提示
- sources 比 SOP 新时提示更新 SOP

如环境支持，可进一步在 `PostToolUse` 中加入自动 commit 或维护动作。

**预期结果：** 会话启动时能够自动发现可生成或需更新的 SOP 候选项。

### 7. 建立 source 到 SOP 的状态流转规则
采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

建议将这些字段写入 source 的 frontmatter。

**预期结果：** sources 可按统一状态管理，AI 能准确识别 SOP 候选内容。

### 8. 验证不同 AI 客户端的 SOP 使用方式
逐一验证客户端行为：
- **Claude Code**：支持 hooks，自动检查 SOP
- **Kimi Code**：支持 skills，但需手动触发
- **Codex CLI**：支持 skills，但需手动触发
- **Gemini CLI**：支持 skills，但需手动触发
- **Cursor / Windsurf**：通常不支持 hooks，需人工触发

建议准备：
- 1 条 `status: sop-ready` 测试 source
- 1 组同主题不少于 3 条资料

**预期结果：** 已明确每个客户端的自动化边界，并验证至少一种自动触发和一种手动触发方式可用。

### 9. 执行一次端到端测试
按顺序测试：
1. 使用 `ingest` 或等效方式导入资料
2. 将资料整理进 `wiki/sources/`
3. 为可流程化资料添加 `status: sop-ready`
4. 启动支持 hooks 的客户端，观察是否出现 SOP 提示
5. 生成 SOP 到 `wiki/sop/`
6. 使用 `query:` 验证 SOP 可检索
7. 运行 `lint the wiki` 检查结构与链接完整性

**预期结果：** 知识摄取、状态标记、SOP 触发、生成、检索与维护全链路可正常运行。

### 10. 建立日常维护与更新规范
建议纳入常规维护：
- 定期运行 `lint the wiki`
- 新增 sources 时优先判断是否满足 `sop-ready`
- 同主题 source 增加时，定期回顾是否应合并为 SOP
- source 更新后检查 SOP 是否过期
- 新增 AI 客户端时，统一通过 Junction 复用 skills
- 在 SOP 中保留对 sources 的回链

建议按周或双周执行一次系统性复盘。

**预期结果：** 知识库与 SOP 体系持续演进，结构清晰、可追溯且易于跨客户端复用。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库到本地 Windows 路径
- [ ] Vault 已包含 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已配置 `graph.json`、`app.json`、`appearance.json`
- [ ] 至少一个 AI 客户端已成功链接 claude-obsidian skills
- [ ] 已创建 `skills/wiki-sop/SKILL.md` 并写入 SOP 规则
- [ ] `hooks/hooks.json` 已包含 SessionStart 的 SOP 自动检查逻辑
- [ ] source frontmatter 已启用 `status` 与 `sop-priority` 字段
- [ ] 已验证 Claude Code 自动检查或其他客户端手动触发可用
- [ ] 已完成一次从 source 到 SOP 的端到端测试
- [ ] 已运行 `lint the wiki` 并确认知识库结构正常

## FAQ

### 这个项目是否原生支持 AI 自动记笔记和 SOP 生成？
AI 自动记笔记、分类整理、定期维护和知识查询属于原生支持能力；SOP 生成有模板与机制基础，但需要额外配置触发规则和 skills。

### 为什么只有 Claude Code 可以自动检查 SOP？
因为来源说明中仅 Claude Code 明确支持 `hooks.json`，可在 `SessionStart` 自动执行检查。其他客户端虽然可复用 skills，但通常需要手动输入指令触发。

### 什么样的 source 应该标记为 sop-ready？
凡是包含明确步骤、可重复执行流程、最佳实践、经验总结的资料，都应标记为 `status: sop-ready`；若重要性高，可再加 `sop-priority: high`。纯参考资料通常只标记为 `processed`。

### 什么时候应该提示生成新的 SOP？
当同主题 `sop-ready` 资料达到 3 条及以上、某条资料标记了 `sop-priority: high`，或 sources 更新晚于对应 SOP 时，都应提示生成或更新 SOP。

### 如果某个 AI 客户端不支持 hooks，该怎么办？
保留相同的 skills 链接，在该客户端中使用手动触发方式，例如输入“整理SOP”或等效命令，让 AI 按 `SKILL.md` 中的规则执行。

### 如何确认 SOP 生成后的质量是否达标？
至少检查四点：步骤是否可执行、顺序是否清晰、检查清单是否完整、是否保留到 sources 的回链。必要时再用 `query:` 和 `lint the wiki` 验证可检索性和结构完整性。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]