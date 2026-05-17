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
规范化在 Windows 环境中部署 claude-obsidian 知识库、启用 SOP 自动生成/检查机制，并完成多 AI 客户端 skills 引用配置，确保知识摄取、分类整理、SOP 产出与跨工具复用可稳定执行。

## 适用场景
- 需要在 Windows 上搭建 claude-obsidian 知识库
- 需要将 AI 自动记笔记、分类整理与 SOP 生成串联为统一流程
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等客户端复用同一套 skills
- 需要建立 source 状态流转与 SOP 自动检查规则
- 需要为知识库启用 SOP 模板、自动提示与更新机制

## 前置条件
- Windows 环境可用，并已安装 PowerShell
- 已安装 Git，且可执行 `git clone`
- 具备目标目录读写权限
- 已获取仓库地址：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 明确各 AI 客户端的本地配置目录
- 明确 Vault 根目录

## 标准步骤

### 步骤 1：克隆仓库并确认知识库根目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在嵌套目录，整理为统一根目录，例如：
`D:\dolan_env\temp\project\personal\claude-obsidian`

**预期结果：** 本地已存在可访问的 Vault 根目录。

### 步骤 2：创建 Vault 标准目录结构
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

**预期结果：** 标准目录均已创建完成。

### 步骤 3：写入 Obsidian 基础配置
创建或更新以下文件：
- `.obsidian/graph.json`：配置知识图谱颜色分组，`sop` 使用黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

如有现有配置，采用合并方式保留用户已有设置。

**预期结果：** Obsidian 可正常识别 Vault 并应用基础显示配置。

### 步骤 4：为多 AI 客户端创建 skills 链接
使用 `New-Item -ItemType Junction` 将仓库 skills 目录链接到客户端 skills 目录。

目标包括：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

**预期结果：** 多个 AI 客户端可以复用同一套 skills。

### 步骤 5：创建 wiki-sop 技能说明文件
在 `skills/wiki-sop/` 下创建 `SKILL.md`，要求覆盖：
- 自动检查模式
- 手动生成模式
- 更新模式
- 质量检查模式

至少应说明：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 用户指定主题时如何生成 SOP
- source 更新后如何提示更新 SOP
- 如何检查步骤可执行性、清单完整性、回链是否齐全

**预期结果：** SOP 技能职责清晰，客户端可据此执行一致行为。

### 步骤 6：配置 hooks 触发 SOP 自动检查
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持，可在其他 hooks 中增加自动提交、记录或状态同步。

**预期结果：** 支持 hooks 的客户端会在会话开始时自动检查 SOP 候选项。

### 步骤 7：建立 Source 状态流转规则
统一使用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

标记规则：
- 分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`
- 已整合进 SOP → `status: synthesized`

**预期结果：** 所有 source 均具有可判断的状态字段。

### 步骤 8：执行知识摄取与分类整理
使用原生能力：
- `ingest`：导入资料并自动记笔记
- 自动分类到 `concepts`、`entities`、`sources`
- `lint the wiki`：定期维护结构
- `query:`：执行知识查询

导入后为 source 补充状态标记，以便 SOP 自动机制识别。

**预期结果：** 新知识已进入标准目录并具备后续处理状态。

### 步骤 9：生成或更新 SOP 文档
按触发条件执行：
- 同主题 `sop-ready` 资料达到 3 份及以上
- source 含 `sop-priority: high`
- source 更新日期晚于当前 SOP
- 或用户手动发出“整理SOP”指令

输出位置统一为 `wiki/sop/`，并确保文档包含：
- 目的
- 适用场景
- 前置条件
- 标准步骤
- 检查清单
- FAQ
- 来源回链

**预期结果：** 生成的 SOP 可直接执行、可追溯、可维护。

### 步骤 10：按客户端差异验证触发方式
逐个验证：
- **Claude Code**：支持 skills + hooks，可自动检查 SOP
- **Kimi Code**：支持 skills，不支持 hooks，需手动触发
- **Codex CLI**：支持 skills，不支持 hooks，需手动触发
- **Gemini CLI**：支持 skills，不支持 hooks，需手动触发
- **Cursor / Windsurf**：可接入 skills，但通常依赖手动触发或本地引用方式

**预期结果：** 已明确每个客户端的工作模式，并至少完成一次成功验证。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已配置 graph.json、app.json、appearance.json
- [ ] 已为所需客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP AUTO-CHECK
- [ ] 已建立 source 状态流转规则
- [ ] 已完成至少一次知识 ingest 与分类整理
- [ ] 已成功生成或更新至少一份 SOP
- [ ] 已验证客户端的自动或手动触发方式

## 最佳实践
- 使用统一 Vault 路径，避免多客户端引用不同目录
- 所有 source frontmatter 使用一致的 `status`、`sop-priority` 字段
- 优先在 Claude Code 中验证自动化，再扩展到其他客户端
- 同主题资料达到一定数量后再自动合成为 SOP，以提升稳定性
- SOP 更新优先覆盖既有文档，避免产生重复版本
- 定期运行 `lint the wiki` 保持结构与回链质量

## 常见问题

### 1. 项目是否原生支持 SOP 自动生成？
支持基础能力，但需配置触发机制、技能说明和客户端引用后，才能形成完整自动流程。

### 2. Windows 下必须跑 setup 吗？
不必须。可通过 PowerShell 手动创建目录、写配置、建 Junction，达到等效部署效果。

### 3. 为什么某些客户端不会自动检查 SOP？
因为并非所有客户端都支持 hooks。通常只有支持 hooks 的客户端才能在 `SessionStart` 自动触发检查。

### 4. 哪些资料应标记为 `sop-ready`？
包含明确步骤、最佳实践、经验总结、可复用流程的资料都适合标记为 `sop-ready`。

### 5. 什么时候更新已有 SOP？
当 source 比现有 SOP 更新，或新增高质量同主题资料时，应执行更新。

### 6. 资料数量不足时能否生成 SOP？
可以手动生成，但自动提示建议在同主题资料达到 3 份及以上时触发；如 `sop-priority: high`，可提前处理。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
