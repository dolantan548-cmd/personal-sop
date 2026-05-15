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

# SOP: claude-obsidian Windows 部署与 SOP 自动生成机制配置

> **分类**: workflow  
> **适用环境**: Windows 10/11 + PowerShell + 多 AI CLI 工具  
> **关联来源**: [[2026-05-11-claude-obsidian部署与SOP机制配置]]

## 目的

在 Windows 环境下完整部署 claude-obsidian 知识库，配置 SOP 自动生成触发机制，并通过 skills Junction 链接实现跨 Claude Code / Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf 等多个 AI 客户端共享同一份知识库与 SOP。

## 适用场景

- 首次在 Windows 工作站部署个人 AI 知识库
- 希望 AI 在对话中自动记笔记并定期沉淀为可复用 SOP
- 需要在多个 AI CLI/IDE 工具之间共享同一份 SOP 与笔记
- 已有 claude-obsidian 仓库但缺少 SOP 自动触发机制

## 前置条件

- Windows 10/11 系统（PowerShell 5.1+）
- 已安装 Git 并能访问 GitHub
- 至少一个支持 skills 机制的 AI CLI 工具
- 对目标路径 `D:\dolan_env\temp\project\personal` 可读写
- 可选：本地 Obsidian 客户端

## 操作步骤

### 步骤 1：克隆仓库并整理目录结构

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
cd claude-obsidian
# 若存在嵌套目录，将内层内容上移并删除空目录
```

**预期结果**：根目录下直接可见 `wiki`、`skills`、`hooks` 子目录，无多余嵌套层。

### 步骤 2：创建标准目录骨架

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

**预期结果**：7 个目录全部创建成功，可通过 `Get-ChildItem $VAULT -Recurse -Directory` 验证。

### 步骤 3：写入 Obsidian 配置文件

在 `.obsidian/` 下写入三个关键配置：

| 文件 | 作用 |
|------|------|
| `graph.json` | 知识图谱颜色分组，sop 为黄色 |
| `app.json` | 排除 AI 工作文件 (`.raw/`、`.watchdog/` 等) |
| `appearance.json` | 启用 `.obsidian/snippets/` 中的 CSS 片段 |

**预期结果**：Obsidian 打开 vault 时图谱按颜色分组显示，搜索不出现 `.raw/` 临时文件。

### 步骤 4：创建多 AI 客户端 skills Junction 链接

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian"   -Target $VAULT
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian"  -Target $VAULT
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target $VAULT
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target $VAULT
# Cursor / Windsurf 在项目级 .cursor\skills\ 与 .windsurf\skills\ 下同理
```

按需创建，不必全部链接。

**预期结果**：每个目标工具的 skills 目录下出现 `<JUNCTION>` 类型条目，内容与源 vault 一致。

### 步骤 5：配置 wiki-sop skill 实现 SOP 自动生成

在 `skills/wiki-sop/SKILL.md` 中定义四种工作模式：

1. **自动检查模式** — 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
2. **手动生成模式** — 根据用户指定主题合成 SOP
3. **更新模式** — sources 比 SOP 新时提示更新
4. **质量检查模式** — 检查步骤可执行性、checklist、回链完整性

输出统一落到 `wiki/sop/`，模板取自 `_templates/`。

**预期结果**：任意挂载该 vault 的 AI 工具调用 wiki-sop skill 都能识别四种模式。

### 步骤 6：修改 hooks.json 加入 SOP 自动检查（仅 Claude Code）

在 `hooks/hooks.json` 的 `SessionStart` 钩子中加入：

```
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

并确认 `PostToolUse` 钩子已含自动 commit。

**预期结果**：下次启动 Claude Code 会话时自动输出 SOP 候选列表。

### 步骤 7：定义 Source 状态流转与 Auto-marking 规则

状态机：

```
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

Auto-marking 规则：

| 笔记特征 | 标记 |
|---------|------|
| 含分步骤操作流程 | `status: sop-ready` |
| 最佳实践 / 经验总结 | `status: sop-ready` + `sop-priority: high` |
| 纯参考资料 | `status: processed` |

**预期结果**：AI ingest 时自动写入正确 frontmatter，可被 SOP 自动检查识别。

### 步骤 8：验证部署与跨工具一致性

1. Claude Code：启动新会话，确认 SessionStart 输出 SOP 候选列表
2. Kimi/Codex/Gemini：执行 `query: SOP 部署`，确认能读到本 SOP
3. 触发一次 `ingest`，确认 frontmatter 字段被正确填充
4. 手动说「整理 SOP」，确认 wiki-sop skill 被调用且生成新文件

**预期结果**：所有挂载工具读取同一份库；核心动作 ingest/query/SOP 生成均跑通。

## 验收清单

- [ ] 已克隆 claude-obsidian 仓库且无嵌套目录
- [ ] 已创建 `.obsidian` / `.raw` / `wiki/{concepts,entities,sources,sop}` / `_templates` 骨架
- [ ] 已写入 `graph.json` / `app.json` / `appearance.json`
- [ ] 已为目标 AI 工具创建 skills Junction 链接
- [ ] 已编写 `skills/wiki-sop/SKILL.md` 并覆盖四种工作模式
- [ ] 已在 `hooks/hooks.json` 的 SessionStart 中加入 SOP AUTO-CHECK
- [ ] 已确认 source 状态流转与 Auto-marking 规则文档化
- [ ] 已在 Claude Code 中验证自动 SOP 提示
- [ ] 已在至少一个手动触发型工具中验证 query 与 SOP 生成
- [ ] 已确认 `wiki/sop/` 能正常产出新 SOP 文件

## 常见问题

**Q1：为什么必须用 Junction 而不是普通快捷方式或符号链接？**  
Junction 是 Windows 目录级硬链接，AI 工具读取时把它当成真实目录，能完整识别 skills 内容；普通快捷方式 (.lnk) 不会被解析，符号链接需要管理员权限或开发者模式。

**Q2：为什么只有 Claude Code 能自动检查 SOP？**  
目前只有 Claude Code 原生支持 hooks.json 中的 SessionStart / PostToolUse 钩子。Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 均支持 skills 但不支持 hooks，因此需要用户主动触发。

**Q3：什么样的笔记会被 AI 自动标记为 `sop-ready`？**  
符合任一条件即可：(1) 含分步骤操作流程；(2) 属于最佳实践或经验总结（附加 `sop-priority: high`）；(3) 同一主题已积累 ≥3 篇 processed 笔记。

**Q4：已有 claude-obsidian 仓库但没有 wiki-sop skill 怎么办？**  
按步骤 5、6、7 单独补齐，无需重新克隆。

**Q5：多 AI 客户端会不会同时写入产生冲突？**  
底层是同一份目录，存在并发写风险。建议：(1) 同一时间只让一个工具长时间挂起会话；(2) 启用 PostToolUse 自动 commit；(3) 批量整理 SOP 时优先用 Claude Code 串行处理。

## 关联来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
