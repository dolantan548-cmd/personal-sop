---
type: sop
category: workflow
status: active
created: 2026-05-14
updated: 2026-05-14
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于在 Windows 环境中部署 claude-obsidian 知识库，启用 AI 自动记笔记与知识分类能力，并配置 SOP 自动检查、提示生成、更新维护机制。同时通过 skills 链接让多个 AI 客户端复用同一套知识库工作流。

## 2. 适用场景

- 需要在 Windows 本地搭建可复用的 Obsidian + AI 知识库
- 需要将资料统一 ingest 到 wiki 并按类型分类
- 需要将流程型资料沉淀为 SOP
- 需要多个 AI 客户端访问同一套 skills 和 SOP 规范
- 需要建立 source 到 SOP 的标准状态流转与持续维护机制

## 3. 前置条件

- Windows 环境，具备 PowerShell 权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定 vault 存放路径
- 已安装至少一个 AI 客户端（Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等）
- 了解本地客户端配置目录与 Obsidian vault 基本结构

## 4. 操作步骤

### 步骤 1：克隆 claude-obsidian 仓库到本地

打开 PowerShell，执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在嵌套目录，整理到统一 vault 根目录。

**预期结果：** 已获得本地 claude-obsidian 根目录，并确定唯一 vault 路径。

---

### 步骤 2：创建标准化 vault 目录结构

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

**预期结果：** 标准目录结构创建完成。

---

### 步骤 3：写入 Obsidian 基础配置

配置以下文件：

1. `.obsidian/graph.json`：设置知识图谱颜色与分组，建议 `sop` 为黄色。
2. `.obsidian/app.json`：排除 AI 工作文件。
3. `.obsidian/appearance.json`：启用 CSS snippets。

**预期结果：** Obsidian 能正确加载图谱、外观和排除规则。

---

### 步骤 4：为多 AI 客户端创建 skills 链接

为各客户端创建到统一 skills 目录的 Junction。示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

可按需为以下客户端创建：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

**预期结果：** 多个客户端共用同一套 skills 定义。

---

### 步骤 5：创建 wiki-sop skill

在 `skills/wiki-sop/SKILL.md` 中定义以下能力：

- 自动检查 `status: sop-ready` 的 source
- 手动指定主题生成 SOP
- sources 更新时提示更新 SOP
- 检查 SOP 的步骤可执行性、检查清单和回链完整性

建议明确输入目录、输出目录、命名规范和引用规则。

**预期结果：** AI 可基于该 skill 执行 SOP 相关任务。

---

### 步骤 6：配置 hooks 实现自动检查

编辑 `hooks/hooks.json`，在 `SessionStart` 中加入规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持，也可配置 `PostToolUse` 做提交或维护动作。

**预期结果：** 支持 hooks 的客户端启动会话时会自动进行 SOP 候选检查。

---

### 步骤 7：建立 source 状态流转规则

统一采用：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

标记规则：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** source 状态清晰，SOP 候选可被稳定识别。

---

### 步骤 8：执行 ingest 与知识整理验证

使用系统原生命令：

- `ingest`：导入并自动写笔记
- `query:`：执行知识查询
- `lint the wiki`：执行维护与一致性检查

检查内容是否正确分配至：

- `wiki/concepts/`
- `wiki/entities/`
- `wiki/sources/`

对流程类资料，确认其已被标记为 `sop-ready`。

**预期结果：** 知识库导入、查询、分类和维护均正常。

---

### 步骤 9：按客户端能力生成或更新 SOP

- **Claude Code**：支持 hooks，可自动检查并提示生成/更新 SOP
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：支持 skills，但通常不支持 hooks，需要手动触发，例如“整理SOP”

生成结果统一写入 `wiki/sop/`，并引用对应 source。

**预期结果：** 已生成或更新目标 SOP 文档，且来源清晰可追溯。

---

### 步骤 10：执行质量检查与持续维护

检查以下内容：

- SOP 步骤是否明确、可执行
- 是否包含前置条件、步骤、预期结果、检查清单
- 是否包含 source 回链
- 当 source 更新时，是否能提示 SOP 更新

建议定期运行 `lint the wiki` 并复查 source 的状态字段。

**预期结果：** SOP 文档持续保持可执行、可追溯、可维护。

## 5. 检查清单

- [ ] 已克隆仓库并确定统一 vault 路径
- [ ] 已创建所有标准目录
- [ ] 已完成 Obsidian 基础配置
- [ ] 已为目标 AI 客户端创建 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查逻辑
- [ ] 已建立 source 状态流转规则
- [ ] 已验证 ingest、query:、lint the wiki 可用
- [ ] 已确认流程类资料可标记为 `sop-ready`
- [ ] 已在 `wiki/sop/` 中生成或更新 SOP
- [ ] 已完成 SOP 质量检查

## 6. 常见问题

### Q1：claude-obsidian 是否原生支持 SOP 自动生成？
A：具备模板和知识处理能力，但需要额外配置触发机制、skills 与客户端路径，才能形成自动检查与生成 SOP 的完整工作流。

### Q2：为什么只有 Claude Code 可以自动检查 SOP？
A：因为 Claude Code 支持 `hooks.json`，可在会话启动时自动执行检查逻辑。其他客户端通常只支持 skills，不支持 hooks 自动运行。

### Q3：哪些资料应标记为 `sop-ready`？
A：凡是有明确步骤、可复用流程、最佳实践或经验总结的资料，都应标记为 `sop-ready`。高优先级内容还应加 `sop-priority: high`。

### Q4：纯参考资料如何处理？
A：标记为 `status: processed`，保留在知识库中供查询，但不进入 SOP 自动生成候选。

### Q5：什么时候应该提示生成 SOP？
A：当同主题 `sop-ready` 资料达到 3 篇及以上、存在 `sop-priority: high`、或 source 比现有 SOP 更新时，应提示生成或更新 SOP。

### Q6：skills 链接为什么要统一？
A：统一链接到同一 skills 目录可避免多个客户端各自维护一套重复配置，降低分叉和维护成本。

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]