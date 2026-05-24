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

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于在 Windows 环境中标准化部署 `claude-obsidian` 知识库，并完成以下目标：

- 初始化 Obsidian vault 目录结构
- 配置多 AI 客户端共享同一套 skills
- 启用 SOP 自动检查、手动生成与更新提醒机制
- 建立 source 到 SOP 的统一状态流转
- 确保 SOP 可被 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等工具复用

---

## 2. 适用场景

- 首次部署 `claude-obsidian`
- 在 Windows 上搭建个人或团队知识库
- 希望通过 AI 自动沉淀 SOP
- 希望多个 AI 客户端访问同一个 vault 与同一套 skills
- 需要把零散 source 资料转为可执行 SOP

---

## 3. 前置条件

- Windows 系统
- 已安装 Git
- 可使用 PowerShell
- 已确定 vault 路径
- 已安装至少一个目标 AI 客户端
- 有权限写入本机客户端配置目录

---

## 4. 标准步骤

### 步骤 1：克隆仓库并确认 vault 根目录

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在嵌套目录，手动整理，确保最终只有一个明确的 vault 根目录。

**预期结果：** 已获得可用的 `claude-obsidian` 本地目录，并明确其为后续唯一 vault 路径。

---

### 步骤 2：初始化目录结构

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

**预期结果：** vault 内已具备知识库工作所需的标准目录。

---

### 步骤 3：配置 Obsidian 基础文件

创建或更新以下文件：

- `.obsidian/graph.json`：设置图谱分组颜色，建议 `wiki/sop` 为黄色
- `.obsidian/app.json`：排除 AI 中间工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

配置原则：

- SOP 节点在图谱中应明显可见
- 临时文件不应影响检索与可视化
- 外观设置保持一致

**预期结果：** Obsidian 图谱、显示与排除规则符合知识库管理需求。

---

### 步骤 4：创建多 AI 客户端 skills 链接

使用 `New-Item -ItemType Junction`，将各客户端的 `claude-obsidian` skills 入口指向同一套源目录。

目标位置包括：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

如果父目录不存在，先创建父目录再建立 Junction。

**预期结果：** 多个 AI 客户端都能访问同一套 skills，且后续只需维护一份内容。

---

### 步骤 5：创建 `wiki-sop` skill

在 `skills/wiki-sop/SKILL.md` 中定义 SOP 机制，至少包括：

- 自动检查模式：扫描 `status: sop-ready` 的 source
- 手动生成模式：按用户主题生成 SOP
- 更新模式：source 比 SOP 更新时触发提醒
- 质量检查模式：检查步骤、清单、回链是否完整

建议补充规则：

- 输出目录固定为 `wiki/sop/`
- SOP 必须包含目的、场景、前置条件、步骤、检查清单、相关来源
- SOP 必须能回链到 source

**预期结果：** AI 客户端已具备统一的 SOP 检查、生成与更新规则。

---

### 步骤 6：配置 hooks 自动检查 SOP 机会

修改 `hooks/hooks.json`，在 `SessionStart` 中加入检查逻辑：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题数量 `≥ 3` 时提示生成 SOP
- `sop-priority: high` 时优先提示生成 SOP
- source 比 SOP 更新时提示更新 SOP

对于支持 hooks 的客户端，可在会话开始时自动执行；如支持 `PostToolUse`，可追加自动提交等动作。

**预期结果：** 支持 hooks 的客户端可在启动会话时自动发现 SOP 生成或更新机会。

---

### 步骤 7：建立 source 状态流转规则

统一采用如下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 含明确分步骤流程：`status: sop-ready`
- 最佳实践或经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

建议所有 source 至少具备 `status` frontmatter。

**预期结果：** source 可按统一标准进入 SOP 流程，避免随意生成低质量 SOP。

---

### 步骤 8：按客户端能力执行触发方式

客户端差异处理如下：

- **Claude Code**：支持 hooks，可自动检查 SOP
- **Kimi Code**：支持 skills，通常需手动输入“整理SOP”触发
- **Codex CLI**：支持 skills，需手动触发
- **Gemini CLI**：支持 skills，需手动触发
- **Cursor / Windsurf**：如无 hooks，采用手动触发

统一要求：最终 SOP 文件必须输出到 `wiki/sop/` 并带来源回链。

**预期结果：** 所有已接入客户端都能以适配方式使用 SOP 机制。

---

### 步骤 9：执行端到端验证

验证方法：

1. 准备 3 篇以上同主题 source，或 1 篇 `sop-priority: high` source
2. 确保这些文件位于 `wiki/sources/` 且 frontmatter 正确
3. 在 Claude Code 启动新会话，检查是否自动提示
4. 在其他客户端手动调用 skill，要求按主题生成 SOP
5. 检查 `wiki/sop/` 中是否成功生成文件
6. 检查 SOP 是否包含步骤、清单、来源回链
7. 如支持，执行 `lint the wiki` 检查结构一致性

**预期结果：** SOP 能被成功提示、生成或更新，并符合结构要求。

---

## 5. 检查清单

- [ ] 已克隆仓库并确认 vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已配置 Obsidian 基础文件
- [ ] 已创建多客户端 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已建立 source 状态流转规则
- [ ] 已确认各客户端 hooks/skills 能力差异
- [ ] 已完成端到端测试
- [ ] 已验证生成的 SOP 质量与回链完整性

---

## 6. 最佳实践

- 始终只维护一份 skills 源目录，其他客户端全部通过链接共享
- source 在进入 SOP 生成前必须补齐 `status`
- 有高复用价值的流程优先标记 `sop-priority: high`
- SOP 输出文件统一存放到 `wiki/sop/`
- 生成 SOP 后检查是否具备可执行性，而不是仅有概念性总结
- 当 source 更新后，应及时触发 SOP 更新，避免流程过期

---

## 7. 常见问题（FAQ）

### Q1：为什么 skills 已配置，但没有自动提示？
因为自动提示依赖 hooks，而不是仅依赖 skills。多数客户端只支持 skills，不支持 hooks，因此只能手动触发。

### Q2：什么资料适合标记为 `sop-ready`？
包含稳定、重复可执行、步骤明确的操作流程资料，都适合标记为 `sop-ready`。

### Q3：什么资料不应生成 SOP？
纯背景介绍、概念说明、零散参考资料通常不应直接生成 SOP，应保留为 `processed`。

### Q4：为什么要把 SOP 单独放在 `wiki/sop/`？
这样便于检索、图谱展示、生命周期管理以及跨客户端统一引用。

### Q5：如何判断需要更新 SOP？
当相关 source 更新日期晚于现有 SOP，或者新增了关键步骤、异常处理、最佳实践时，就应更新 SOP。

---

## 8. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
