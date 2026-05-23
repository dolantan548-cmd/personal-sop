---
type: sop
category: workflow
status: active
created: 2026-05-23
updated: 2026-05-23
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
本 SOP 用于标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端共享 skills，并启用 SOP 自动检查、生成与更新机制。执行后，可实现知识沉淀、流程复用和跨 AI 客户端协同引用。

## 2. 适用场景
- 需要在 Windows 上搭建可被多个 AI 客户端共用的知识库
- 需要将 AI 整理内容自动沉淀到结构化 wiki 目录
- 需要从 source 自动识别可 SOP 化内容
- 需要在 Claude Code 中启用自动检查，在其他客户端手动复用同一套 SOP skill
- 需要建立 source 到 SOP 的统一流转规范

## 3. 前置条件
- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定本地 Vault 路径
- 已安装至少一个 AI 客户端
- 具备创建 Junction 链接和写入本地配置文件的权限

## 4. 标准操作步骤

### 步骤 1：克隆项目并确认 Vault 路径
打开 PowerShell，进入目标工作目录后执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如有嵌套目录，先整理后再继续。建议统一设置：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录。

### 步骤 2：创建标准目录结构
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

**预期结果：** 已建立完整的知识库与 SOP 存储目录。

### 步骤 3：写入 Obsidian 基础配置
补齐以下文件：
- `.obsidian/graph.json`：配置图谱颜色分组，建议将 `sop` 设为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

如仓库已有模板配置，则直接复用。

**预期结果：** Obsidian 可按预期显示与管理知识库内容。

### 步骤 4：为多 AI 客户端创建 skills Junction 链接
按已安装客户端执行类似命令：

```powershell
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target "$VAULT\skills"
```

Cursor、Windsurf 也应链接到同一 skills 源。

**预期结果：** 各客户端共用同一套 skills，无需重复维护。

### 步骤 5：创建 SOP 专用 skill
新增 `skills/wiki-sop/SKILL.md`，至少包含以下能力：
- 自动检查 `status: sop-ready` 的 source
- 手动按主题生成 SOP
- 当 source 更新时提示更新 SOP
- 检查步骤可执行性、清单完整性、来源回链完整性

**预期结果：** 存在可被各客户端调用的 SOP 生成 skill。

### 步骤 6：配置 hooks 自动检查 SOP
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 `>= 3` 时提示生成 SOP
- `sop-priority: high` 时优先提示生成 SOP
- sources 比 SOP 新时提示更新 SOP

**预期结果：** 支持 hooks 的客户端会在会话启动时自动检查 SOP 机会。

### 步骤 7：建立 Source 状态流转规范
采用以下流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 分步骤操作流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

**预期结果：** 所有 source 都能被一致识别和管理。

### 步骤 8：按客户端能力验证触发方式
- Claude Code：验证 SessionStart 是否自动检查 SOP
- Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf：验证 skills 是否可见，并手动输入“整理SOP”或指定主题

**预期结果：** 已确认每个客户端的可用触发方式。

### 步骤 9：执行一次端到端 SOP 生成测试
准备至少 3 份同主题 `sop-ready` source，或 1 份 `sop-priority: high` source。然后：
- 在 Claude Code 中启动新会话，观察自动提示；或
- 在其他客户端手动调用 SOP skill

生成后的 SOP 应保存在 `wiki/sop/`，并包含标题、适用场景、前置条件、步骤、检查清单、FAQ、来源回链。

**预期结果：** 成功生成一份结构完整的 SOP 文档。

### 步骤 10：建立日常维护机制
执行以下例行维护：
- 使用 `ingest` 导入新资料
- 定期执行 `lint the wiki`
- 检查 `sop-ready` source 是否已生成 SOP
- 当 source 更新后，评估是否需更新 SOP
- 保持 SOP 与 source 的双向回链

**预期结果：** 知识库与 SOP 长期保持同步、可维护、可复用。

## 5. 检查清单
- [ ] 已克隆仓库并确认 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已写入 Obsidian 基础配置
- [ ] 已创建至少一个 AI 客户端 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SOP 自动检查规则
- [ ] 已建立 source 状态流转规范
- [ ] 已验证客户端触发方式
- [ ] 已完成端到端 SOP 生成测试
- [ ] 已建立定期维护机制

## 6. 常见问题

### Q1：Windows 上必须运行 setup 脚本吗？
不必须。可通过 PowerShell 手动创建目录和配置文件，达到等效效果。

### Q2：哪些客户端支持自动检查 SOP？
Claude Code 支持 hooks，可在 SessionStart 自动检查。其他客户端通常通过 skills 手动触发。

### Q3：什么资料应该标记为 `sop-ready`？
凡是可复用的分步骤流程、操作经验、最佳实践总结，都应标记为 `sop-ready`。

### Q4：何时应生成 SOP？
同主题 `sop-ready` source 达到 3 份及以上，或有 `sop-priority: high` 的资料时，应生成 SOP。

### Q5：何时应更新 SOP？
当 source 比现有 SOP 更新，或流程本身发生变化时，应更新 SOP。

### Q6：为什么多个 AI 客户端要共享同一套 skills？
这样可以减少重复维护，确保不同客户端执行相同的知识整理与 SOP 规则。

## 7. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]