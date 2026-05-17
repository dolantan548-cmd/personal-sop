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

# 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于规范在 Windows 环境中部署 `claude-obsidian` 知识库，并为其增加 SOP 自动检查、生成与更新机制。同时统一多 AI 客户端的接入方式，确保知识采集、整理、提炼和复用形成闭环。

---

## 2. 适用场景

- 需要在本地建立可被 AI 读写的 Obsidian 知识库
- 需要将资料自动整理进 `concepts`、`entities`、`sources`、`sop` 等目录
- 需要从资料中自动发现可 SOP 化的主题
- 需要多个 AI 客户端共享同一套知识库技能

---

## 3. 前置条件

- Windows 环境
- 可使用 PowerShell
- 已安装 Git
- 可访问 `https://github.com/AgriciDaniel/claude-obsidian.git`
- 已规划 Vault 根目录
- 已安装至少一个支持 skills 的 AI 客户端
- 具备创建目录与 Junction 的权限
- 如需图形界面管理，已安装 Obsidian

---

## 4. 标准操作步骤

### 步骤 1：克隆仓库并确认 Vault 根目录

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如有嵌套目录或路径不一致，先完成整理，并确定最终 Vault 根目录：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 已成功克隆项目，并确认唯一 Vault 根目录。

---

### 步骤 2：创建标准目录结构

执行以下命令：

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

---

### 步骤 3：写入或补齐 Obsidian 配置文件

需要确认以下配置：

- `.obsidian/graph.json`：配置图谱颜色分组，`sop` 节点建议标黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

如已有配置文件，则按现有结构增量修改；如无，则新建。

**预期结果：** Obsidian 可正确识别和展示知识库结构。

---

### 步骤 4：为多 AI 客户端创建 skills Junction 链接

根据客户端创建链接：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/claude-obsidian`
- Windsurf：`.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

如父目录不存在，先创建父目录后再创建 Junction。

**预期结果：** 多个 AI 客户端可共享同一套 skills。

---

### 步骤 5：建立 SOP 专用 skill

创建文件：

`skills/wiki-sop/SKILL.md`

该文件至少应定义：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：source 更新时提示更新 SOP
- 质量检查：验证步骤可执行性、检查清单、回链完整性

建议同时明确输入、输出、触发条件与校验标准。

**预期结果：** 已具备专门的 SOP skill，AI 可据此执行 SOP 相关任务。

---

### 步骤 6：配置 hooks 自动检查 SOP 机会

修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如果客户端支持更多 hooks，可继续扩展自动提交或变更记录机制。

**预期结果：** 支持 hooks 的客户端会在启动会话时自动检查 SOP 机会。

---

### 步骤 7：执行 Source 状态流转规范

统一使用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** source 能被统一分类，系统可识别 SOP 候选资料。

---

### 步骤 8：按客户端能力选择自动或手动触发方式

客户端能力差异如下：

- **Claude Code**：支持自动 hooks 检查
- **Kimi Code**：支持 skills，通常需手动触发
- **Codex CLI**：支持 skills，通常需手动触发
- **Gemini CLI**：支持 skills，通常需手动触发
- **Cursor / Windsurf**：通常以手动 skills 触发为主

建议为不支持 hooks 的客户端统一约定触发语，如“整理SOP”。

**预期结果：** 当前使用的客户端具备明确触发 SOP 的方式。

---

### 步骤 9：生成并存放标准化 SOP 文档

当满足以下任一条件时生成 SOP：

- 同主题 `sop-ready` 资料 ≥ 3
- 某资料 `sop-priority: high`
- 已具备清晰完整的可执行流程

输出文档应存放在：

`wiki/sop/`

要求：

- 标题清晰
- 步骤可执行
- 包含检查清单
- 保留 source 回链
- source 更新后及时修订 SOP

**预期结果：** 已生成可复用的 SOP 文档，且可回溯来源。

---

### 步骤 10：进行质量检查与持续维护

定期执行：

- `lint the wiki`
- 检查积压的 `sop-ready` 资料
- 检查过期 SOP
- 验证 SOP 是否具备步骤、清单、回链
- 检查 skills 链接与 hooks 配置是否失效

建议建立固定周期，例如每周处理 `sop-ready`，每月校验配置完整性。

**预期结果：** 知识库和 SOP 机制长期稳定、可维护、可复用。

---

## 5. 检查清单

- [ ] 已克隆仓库并确认 Vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 配置文件校验
- [ ] 已创建所需 AI 客户端的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 中的 SOP 自动检查规则
- [ ] 已统一 source 状态流转规则
- [ ] 已确定当前客户端的 SOP 触发方式
- [ ] 已生成至少一个 SOP 到 `wiki/sop/`
- [ ] 已安排定期维护机制

---

## 6. 常见问题

### Q1：这个项目是否原生支持 AI 自动写笔记？
支持。`ingest`、分类整理、知识查询、维护等能力是原生提供的。

### Q2：为什么 SOP 没有自动生成？
因为 SOP 自动生成需要补充 skill 和 hooks 配置；如果客户端不支持 hooks，还需要手动触发。

### Q3：什么资料应该进入 `sop-ready`？
所有包含明确步骤、可复用流程、最佳实践、经验总结的资料都应进入 `sop-ready`。

### Q4：什么时候应该提示生成 SOP？
当同主题资料达到 3 份以上、存在高优先级资料，或 source 已足够形成完整流程时，应提示生成。

### Q5：已有 SOP 什么时候要更新？
当 source 比 SOP 更新，且更新影响步骤、条件、风险或最佳实践时，应立即修订。

### Q6：多个 AI 客户端如何避免重复维护？
通过 Junction 将多个客户端的 `skills/claude-obsidian` 指向同一个 skills 源目录即可。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
