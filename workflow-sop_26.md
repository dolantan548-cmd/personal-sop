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

# 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
标准化在 Windows 环境中部署 claude-obsidian 知识库、启用 SOP 自动识别与生成机制，并为多个 AI 客户端建立统一引用入口，确保知识沉淀、流程复用与 SOP 维护可持续运行。

## 适用场景
- 需要在 Windows 上搭建可供 AI 协同使用的 Obsidian 知识库
- 希望将 AI 生成或整理的资料自动分类到 wiki 目录结构
- 希望将可复用经验、操作流程和最佳实践定期转化为 SOP
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 共享同一套知识库能力
- 需要建立 source 状态流转与 SOP 更新提醒机制

## 前置条件
- Windows 环境，具备 PowerShell 权限
- 已安装 Git
- 可访问 claude-obsidian 项目仓库
- 已确定 vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 本机已安装至少一个支持 skills 的 AI 客户端
- 对 Obsidian vault 目录结构和本地文件系统链接有基本了解

## 标准操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录
在 PowerShell 中进入目标目录并克隆项目仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后出现多层嵌套目录，整理到最终 Vault 根目录。建议统一设置变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 项目代码已下载到本地，且已确认唯一、可用的 Vault 根目录路径。

### 步骤 2：创建标准目录结构
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

目录用途：
- `.raw`：原始输入资料
- `wiki/concepts`：概念性知识
- `wiki/entities`：实体知识
- `wiki/sources`：来源资料与摘要
- `wiki/sop`：标准操作流程
- `_templates`：模板文件

**预期结果：** Vault 目录结构完整，具备后续自动整理和 SOP 生成条件。

### 步骤 3：写入 Obsidian 基础配置
在 `.obsidian` 下配置以下文件：
- `graph.json`：设置知识图谱颜色分组，建议将 `sop` 标为黄色
- `app.json`：排除 AI 工作文件或临时文件
- `appearance.json`：启用 CSS snippets

配置目标是确保 `sources`、`concepts`、`entities`、`sop` 在视图和图谱中可区分。

**预期结果：** Obsidian 可正常识别并展示 Vault，SOP 分类可视化清晰。

### 步骤 4：为多个 AI 客户端创建 skills 链接
根据已安装客户端，为对应 skills 目录创建 Junction。常见目标目录：
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

**预期结果：** 目标 AI 客户端可访问同一套 claude-obsidian skills 能力。

### 步骤 5：创建 wiki-sop 技能定义
在 `skills/wiki-sop/SKILL.md` 中定义 SOP 专用技能，至少包括：
- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：source 比 SOP 新时提示更新
- 质量检查：验证步骤可执行性、检查清单和回链完整性

建议在技能中明确：
- 输入来源
- 触发条件
- 输出目录 `wiki/sop/`
- SOP 必备结构

**预期结果：** AI 客户端可以依据统一规则生成或更新 SOP。

### 步骤 6：配置自动触发 Hook
修改 `hooks/hooks.json`，在 `SessionStart` 中加入 SOP 自动检查规则：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题达到 3 篇及以上时提示生成 SOP
- `sop-priority: high` 时优先提示
- sources 比 SOP 新时提示更新 SOP

如客户端支持，可增加 `PostToolUse` 自动提交或后处理逻辑，但应防止误提交未审核内容。

**预期结果：** 支持 hooks 的客户端在会话启动时会自动发现 SOP 候选与更新机会。

### 步骤 7：建立 Source 状态流转规范
推荐状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：
- 分步骤操作流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`
- 已提炼进入 SOP：`synthesized`

建议统一 frontmatter 字段：`status`、`topic`、`updated`、`sop-priority`。

**预期结果：** 系统可自动识别哪些 source 应进入 SOP 候选池。

### 步骤 8：执行知识摄取与分类整理
使用项目原生能力处理资料：
- 用 `ingest` 导入原始资料
- 自动分类到 `concepts`、`entities`、`sources`
- 用 `lint the wiki` 定期维护
- 用 `query:` 执行检索与追溯

导入后及时补充 source 元数据，并判断是否具备 SOP 价值。

**预期结果：** 原始资料已标准化入库，SOP 候选资料已明确标记。

### 步骤 9：生成或更新 SOP 文档
当触发条件满足时，在 `wiki/sop/` 中创建或更新 SOP。要求：
- 步骤可执行
- 每一步有可验证结果
- 包含前置条件、适用场景、检查清单
- 回链相关 source

若客户端不支持 hooks，则手动触发，例如要求 AI “整理SOP” 或按主题生成 SOP。

**预期结果：** `wiki/sop/` 下存在结构完整、可执行、可追溯的 SOP 文档。

### 步骤 10：验证客户端支持差异并定义操作方式
按客户端能力定义使用规则：
- **Claude Code**：支持自动检查与 hooks
- **Kimi Code**：支持 skills，通常需手动触发
- **Codex CLI**：支持 skills，通常需手动触发
- **Gemini CLI**：支持 skills，通常需手动触发
- **Cursor / Windsurf**：若仅支持 skills，则采用人工触发

团队应明确约定哪些客户端负责自动扫描，哪些客户端只执行手动生成或查询。

**预期结果：** 各客户端职责清晰，SOP 机制可稳定运行。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 根目录
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已完成 `graph.json`、`app.json`、`appearance.json` 基础配置
- [ ] 已为所需 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 `SessionStart` 的 SOP 自动检查规则
- [ ] 已定义并执行 source 状态流转规范
- [ ] 已通过 `ingest` 导入资料并完成基础分类
- [ ] 已将可复用流程类资料标记为 `status: sop-ready`
- [ ] 已成功生成或更新至少 1 篇 `wiki/sop/` 下的 SOP 文档
- [ ] 已验证目标 AI 客户端的自动/手动触发方式

## 常见问题

### 1. 这个项目是否原生支持 AI 自动写笔记和知识整理？
支持。可通过 `ingest` 导入资料，并自动分配到 `concepts`、`entities`、`sources` 等目录。定期可用 `lint the wiki` 维护结构一致性。

### 2. SOP 自动生成是不是开箱即用？
不是完全开箱即用。项目具备模板和知识组织能力，但需要额外配置 `skills/wiki-sop/SKILL.md` 以及 `hooks/hooks.json` 才能形成自动检查和生成机制。

### 3. 为什么同样的 Vault，在不同 AI 客户端表现不一样？
因为不同客户端对 hooks 的支持不同。Claude Code 支持自动 hook 检查；Kimi Code、Codex CLI、Gemini CLI 等通常只能通过 skills 手动触发。

### 4. 什么样的 source 应该标记为 `sop-ready`？
凡是包含可复用的分步骤操作、稳定执行方法、最佳实践总结的资料，都应标记为 `status: sop-ready`。若价值高、复用频率高，可再加 `sop-priority: high`。

### 5. 什么时候应该更新已有 SOP？
当相关 sources 的更新时间晚于现有 SOP，或新增了关键操作步骤、风险点、最佳实践时，就应更新 SOP，而不是继续依赖旧版本。

### 6. 如果客户端不支持 hooks，是否还能使用 SOP 机制？
可以。即使没有自动检查，也可以通过 skills 手动触发，例如要求 AI 按某个主题整理 SOP，或定期人工执行扫描与更新。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]