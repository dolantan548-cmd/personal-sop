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
本 SOP 用于在 Windows 环境中部署 claude-obsidian 知识库，并完成 SOP 自动生成机制配置。完成后，可实现：
- AI 自动写笔记
- 分类整理到 `concepts / entities / sources`
- 知识查询
- SOP 自动检查、手动生成与更新提示
- 多 AI 客户端共享同一套 skills 与知识库引用

## 2. 适用场景
- 需要在 Windows 上初始化 claude-obsidian
- 需要建立 SOP 自动化沉淀机制
- 需要让多个 AI 客户端共用同一知识库与 skills
- 需要统一来源资料状态流转与 SOP 生成规则

## 3. 前置条件
- Windows + PowerShell
- 已安装 Git
- 可访问仓库：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 已确定 vault 根目录
- 已安装至少一个支持 skills 的 AI 客户端
- 对本地目录具有读写权限

## 4. 标准操作步骤

### 步骤 1：克隆仓库并确认知识库根目录
打开 PowerShell，执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

确认最终知识库根目录，例如：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录。

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

**预期结果：** 标准 vault 目录结构创建完成。

### 步骤 3：写入 Obsidian 基础配置
补齐或更新以下配置：
- `.obsidian/graph.json`：配置知识图谱颜色分组，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 可正确加载并区分 SOP 与其他知识类型。

### 步骤 4：为多 AI 客户端创建 skills 链接
按客户端建立 Junction：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT"
```

**预期结果：** 多客户端共享同一套 skills 和知识库配置。

### 步骤 5：创建 `skills/wiki-sop/SKILL.md`
在该文件中定义以下能力：
- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查：校验步骤、清单、回链完整性

**预期结果：** AI 客户端具备明确一致的 SOP 生成规则。

### 步骤 6：修改 `hooks/hooks.json`
在 `SessionStart` 中加入如下检查逻辑：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- `>= 3` 个同主题资料时提示生成 SOP
- 若 `sop-priority: high`，优先提示生成 SOP
- 若 sources 比 SOP 更新，提示刷新 SOP

**预期结果：** 支持 hooks 的客户端能在会话开始时自动检查 SOP 候选资料。

### 步骤 7：建立 source 状态流转规范
统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

自动标记规则：
- 分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** 来源资料可以被 AI 正确识别并进入 SOP 沉淀流程。

### 步骤 8：按客户端差异执行 SOP 生成策略
- **Claude Code**：使用 hooks 自动检查
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通过 skills 手动触发，输入“整理SOP”或指定主题

统一要求：
- 输出目录为 `wiki/sop/`
- SOP 必须回链相关 sources
- SOP 内容必须可执行

**预期结果：** 不同客户端均能按统一规范生成 SOP。

### 步骤 9：执行验证与首次试运行
验证流程：
1. 在 `wiki/sources/` 中准备 3 条同主题 `sop-ready` 资料，或 1 条 `sop-priority: high` 资料
2. 启动 Claude Code 会话，观察是否自动提示
3. 在其他客户端手动输入“整理SOP”测试
4. 检查生成结果是否落到 `wiki/sop/`
5. 检查步骤、清单、来源回链是否完整
6. 修改 source 后验证是否提示更新 SOP

**预期结果：** 至少一个客户端成功生成或提示生成 SOP，且结果符合质量要求。

## 5. 检查清单
- [ ] 已克隆仓库并确认 vault 路径
- [ ] 已创建标准目录结构
- [ ] 已配置 Obsidian 基础文件
- [ ] 已建立目标客户端 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已统一 source 状态流转规则
- [ ] 已区分自动触发与手动触发客户端
- [ ] 已完成首次试运行
- [ ] 已确认 SOP 包含步骤、清单和来源回链

## 6. 最佳实践
- 使用 Junction 共享 skills，避免多份副本不一致
- 在 source frontmatter 中统一维护 `status`、`topic`、`updated`、`sop-priority`
- 高价值经验类资料优先标记 `sop-priority: high`
- 所有 SOP 必须包含来源回链，便于追溯更新
- 每次 sources 有更新时，优先检查 SOP 是否需要刷新

## 7. 常见问题

### Q1：为什么只有 Claude Code 支持自动检查？
因为其支持 `hooks.json`，可在 `SessionStart` 自动运行规则；其他客户端通常只支持 skills，需要手动触发。

### Q2：什么资料适合变成 SOP？
包含重复性流程、操作步骤、最佳实践、经验总结的资料最适合；纯资料摘录通常不直接转 SOP。

### Q3：最小触发条件是什么？
同主题 `sop-ready` 资料不少于 3 条，或存在 `sop-priority: high`，或 sources 晚于 SOP 需要更新。

### Q4：如果没生成 SOP，先查什么？
先查 Junction、vault 路径、`SKILL.md`、`hooks/hooks.json`、以及 source frontmatter 的 `status` 字段是否正确。

### Q5：生成后是否还需要人工复核？
需要。至少要复核步骤可执行性、检查清单是否完整，以及来源回链是否正确。

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]