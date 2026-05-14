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

# SOP: 在 Windows 部署 claude-obsidian 并配置多 AI 的 SOP 自动生成机制

## 1. 目的
规范化在 Windows 环境中部署 claude-obsidian 知识库、配置 SOP 自动触发机制，并将同一套知识库能力通过 skills 链接复用到多个 AI 客户端，以实现资料采集、分类整理、SOP 生成与更新提醒的标准流程。

## 2. 适用场景
- 需要在 Windows 上初始化 claude-obsidian 知识库
- 需要配置知识库的 SOP 自动检查与生成机制
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 共享同一套 skills
- 需要将原始资料转化为可复用的 SOP 并持续维护

## 3. 前置条件
- Windows 环境，具备 PowerShell 执行能力
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定 vault 根目录路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 具备目标 AI 客户端的本地配置目录访问权限
- 了解基础 Obsidian vault 目录结构与 YAML 状态字段写法

## 4. 标准操作步骤

### 步骤 1：克隆仓库并确认 Vault 根目录
在 PowerShell 中进入目标父目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如克隆后存在额外嵌套目录，手动整理为单一 vault 根目录。

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且目录结构未发生多层嵌套。

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

**预期结果：** Vault 内已具备标准目录。

### 步骤 3：写入 Obsidian 基础配置
在 `.obsidian` 下准备以下文件：
- `graph.json`：设置知识图谱颜色分组，建议将 `sop` 标记为黄色
- `app.json`：排除 AI 工作文件
- `appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 可正常加载配置并展示预期效果。

### 步骤 4：为多 AI 客户端创建 skills 链接
为以下客户端创建目录联接：
- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

使用 `New-Item -ItemType Junction`，并在必要时改用绝对路径。

**预期结果：** 多个 AI 客户端均可复用同一套 skills。

### 步骤 5：创建 wiki-sop skill
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：
- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：source 更新时提示 SOP 更新
- 质量检查：检查可执行性、清单和回链

**预期结果：** 已具备统一的 SOP 生成 skill。

### 步骤 6：配置 hooks 自动检查 SOP 触发机制
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 ≥ 3 时提示生成 SOP
- `sop-priority: high` 时优先提示生成 SOP
- source 比 SOP 新时提示更新 SOP

**预期结果：** 支持 hooks 的客户端可在会话开始时自动检查 SOP 候选。

### 步骤 7：执行资料状态流转与自动标记
采用以下状态流：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** source 可被自动识别为 SOP 候选或普通资料。

### 步骤 8：生成并存放 SOP 文档
当触发条件满足时，将 SOP 输出到 `wiki/sop/`。内容必须包含：
- 目的
- 适用场景
- 前置条件
- 分步操作
- 预期结果
- 检查清单
- FAQ
- 相关来源回链

对于不支持 hooks 的客户端，需手动输入“整理SOP”等指令。

**预期结果：** `wiki/sop/` 中已有标准化 SOP 文档。

### 步骤 9：执行质量检查与回链验证
检查以下内容：
- 每一步是否可执行
- 是否包含检查清单
- 是否说明场景与前置条件
- 是否有 source 回链
- 是否与最新 source 一致

必要时执行知识库 lint 维护。

**预期结果：** SOP 可落地执行且结构完整。

### 步骤 10：按客户端能力选择运行方式
- **Claude Code**：支持 hooks，推荐作为自动检查主客户端
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：支持 skills，但一般需手动触发

确保所有客户端指向同一 vault 和同一套 skills。

**预期结果：** 在不同 AI 客户端中都能一致访问和维护 SOP。

## 5. 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已写入或合并 Obsidian 配置文件
- [ ] 已为目标 AI 客户端创建 skills 联接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SOP 自动检查
- [ ] 已建立 source 状态流转与自动标记规则
- [ ] 已能生成并保存 SOP 到 `wiki/sop/`
- [ ] 已完成质量检查与回链验证
- [ ] 已根据不同客户端能力确定自动或手动触发方式

## 6. 常见问题

### Q1：为什么 Claude Code 能自动检查 SOP，而其他客户端不行？
因为 Claude Code 支持 `hooks.json`，可在 `SessionStart` 自动执行检查逻辑；其他客户端通常只支持 skills，不支持 hooks。

### Q2：什么样的 source 应该标记为 `status: sop-ready`？
包含可复用的分步骤流程、最佳实践或经验总结的资料都应标记为 `sop-ready`。

### Q3：什么时候应该生成新的 SOP？
当同主题 `sop-ready` 资料达到 3 份及以上，或存在 `sop-priority: high` 的资料时。

### Q4：什么时候应该更新已有 SOP？
当 source 新于已有 SOP，或 source 内容发生关键变化时。

### Q5：Windows 下 `~` 路径不生效怎么办？
改用实际用户主目录绝对路径，如 `C:\Users\用户名\.claude\skills\claude-obsidian`。

### Q6：为什么要统一 skills，而不是每个客户端单独复制？
统一链接可避免配置漂移、版本不一致和重复维护。

## 7. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]