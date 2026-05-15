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

用于在 Windows 环境中部署 claude-obsidian 知识库，完成 Obsidian 目录与配置初始化、为多个 AI 客户端建立 skills 链接，并配置 SOP 自动检查与生成机制，以支持 AI 自动记笔记、知识整理、SOP 生成与跨客户端复用。

## 适用场景

- 需要在 Windows 上搭建 claude-obsidian 知识库
- 需要把 AI 对话、资料或流程沉淀到 Obsidian vault
- 需要将 sources 中可复用流程自动转化为 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套 skills
- 需要建立 source 到 SOP 的标准化状态流转机制

## 前提条件

- Windows 环境，具备 PowerShell 权限
- 已安装 Git
- 可访问 claude-obsidian GitHub 仓库
- 已确定 vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个 AI 客户端（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf）
- 具备在用户目录创建 Junction（目录联接）的权限
- 了解 Obsidian vault 的基本目录结构

## 标准步骤

### 1. 克隆仓库并确认 vault 路径

在 PowerShell 中进入目标目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果仓库存在嵌套目录或非预期层级，手动整理到最终 vault 根目录。建议统一设置：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在 claude-obsidian 仓库目录，且已确定唯一的 vault 根路径。

---

### 2. 初始化 Obsidian 与知识库目录结构

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

**预期结果：** vault 中已具备 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop` 与 `_templates` 等标准目录。

---

### 3. 写入 Obsidian 基础配置

在 `.obsidian` 目录中创建或更新以下配置：

1. `graph.json`：知识图谱颜色分组，将 `sop` 设置为黄色。
2. `app.json`：排除 AI 工作中间文件。
3. `appearance.json`：启用 CSS snippets。

如团队已有统一模板，应优先使用团队模板。

**预期结果：** Obsidian 可正确识别 vault，图谱分类与外观配置可用，AI 工作文件不会影响主视图。

---

### 4. 为多 AI 客户端创建 skills Junction 链接

将本项目 skills 目录链接到各 AI 客户端：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

PowerShell 示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

对其他客户端重复执行同类操作，并确保父目录存在。

**预期结果：** 所需 AI 客户端均可访问同一套 claude-obsidian skills。

---

### 5. 创建 wiki-sop skill 以定义 SOP 生成规则

创建文件：

`skills/wiki-sop/SKILL.md`

至少覆盖以下能力：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查：步骤可执行性、检查清单、回链完整性

建议明确以下规则：

- 输入来源：`wiki/sources/`
- 输出目录：`wiki/sop/`
- 输出结构：标题、目的、适用场景、前提条件、步骤、检查清单、FAQ、相关来源
- 所有 SOP 必须可执行、可追溯

**预期结果：** 项目内已存在可复用的 SOP skill，且生成标准清晰。

---

### 6. 配置 hooks 以实现自动检查提醒

修改 `hooks/hooks.json`，在 `SessionStart` 中加入类似逻辑：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 ≥ 3 时提示生成 SOP
- 存在 `sop-priority: high` 时优先提示生成 SOP
- sources 比 SOP 更新时提示更新 SOP

如客户端支持，可增加 `PostToolUse` 自动 commit 或日志记录。

**预期结果：** 支持 hooks 的客户端在会话开始时自动发现 SOP 机会点。

---

### 7. 建立 source 状态流转与自动标记规则

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

在资料整理阶段补齐 frontmatter，确保状态字段一致。

**预期结果：** AI 能准确识别哪些资料应生成 SOP，哪些仅作参考。

---

### 8. 按客户端能力执行自动或手动 SOP 检查

根据客户端差异执行：

- **Claude Code**：支持 hooks，可自动检查
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常仅支持 skills，需手动触发

建议使用统一提示词：

- “扫描 wiki/sources 中可转 SOP 的资料”
- “根据主题 X 生成 SOP”
- “检查 SOP 是否需要根据最新 sources 更新”

**预期结果：** 不同客户端都能以统一方式完成 SOP 检查与生成。

---

### 9. 验证 ingest、分类、查询与 SOP 输出链路

按以下顺序验证：

1. 使用 `ingest` 导入资料
2. 确认资料被整理到 `wiki/concepts`、`wiki/entities` 或 `wiki/sources`
3. 对可复用流程资料标记 `status: sop-ready`
4. 触发自动检查或手动运行 wiki-sop skill
5. 检查 `wiki/sop/` 是否生成 SOP
6. 使用 `query:` 验证是否可检索来源与 SOP
7. 执行 `lint the wiki` 检查结构质量

**预期结果：** 从资料导入到 SOP 生成与查询引用的完整链路可用。

---

### 10. 执行日常维护与更新策略

建立以下日常维护动作：

- 定期执行 `lint the wiki`
- 新资料进入后优先判断是否应标记为 `sop-ready`
- 同主题 sources 达到 3 份及以上时安排生成或合并 SOP
- source 更新后检查 SOP 是否需要同步更新
- 保持每份 SOP 回链到来源 source
- 新增 AI 客户端时补充创建 Junction 链接

**预期结果：** 知识库结构稳定，SOP 可持续演进，多个客户端共享最新配置。

## 检查清单

- [ ] 已成功克隆 claude-obsidian 仓库并确认 vault 路径
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已完成 `graph.json`、`app.json`、`appearance.json` 的基础配置
- [ ] 已为所需 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md` 并写入 SOP 规则
- [ ] 已在 `hooks/hooks.json` 中配置 SessionStart SOP 自动检查逻辑
- [ ] 已定义 source 状态流转与 `sop-ready` 标记规则
- [ ] 已确认所用客户端的 hooks 支持情况与触发方式
- [ ] 已完成一次从 ingest 到 SOP 生成的端到端验证
- [ ] 已建立定期 lint、更新 SOP 与检查回链的维护习惯

## FAQ

### 1. 为什么 SOP 没有自动生成？

先检查客户端是否支持 hooks。Claude Code 支持自动检查；其他客户端通常需要手动触发。再检查 `status: sop-ready`、`skills/wiki-sop/SKILL.md`、`hooks/hooks.json` 是否配置正确。

### 2. 什么样的 source 应该标记为 sop-ready？

凡是包含分步骤流程、可复用操作方法、最佳实践或经验总结的资料，都应标记为 `status: sop-ready`。重要资料可增加 `sop-priority: high`。

### 3. 纯参考资料要不要生成 SOP？

通常不需要。纯背景说明或参考信息应保留为 `status: processed`。

### 4. 为什么要用 Junction 链接 skills？

因为可以让多个 AI 客户端共享同一套 skills，避免重复维护与版本不一致。

### 5. 什么时候应该更新已有 SOP？

当 source 内容更新、同主题新增关键资料、步骤过时，或检测到 source 比 SOP 更新时，应及时更新 SOP。

### 6. 如何验证部署是否成功？

执行一次完整链路测试：`ingest` → 分类 → 标记 `sop-ready` → 生成 SOP → `query:` 查询 → `lint the wiki`。

## 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]