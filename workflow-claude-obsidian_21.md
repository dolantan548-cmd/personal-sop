---
type: sop
category: workflow
status: active
created: 2026-05-18
updated: 2026-05-18
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
用于在 Windows 环境中部署 claude-obsidian 知识库，完成基础目录与 Obsidian 配置，并为多 AI 客户端建立 skills 链接，同时配置 SOP 自动检测、手动生成与更新提醒机制。

## 适用场景
- 需要在 Windows 上搭建 claude-obsidian 知识库
- 需要让 AI 自动写入、整理和查询知识笔记
- 需要将来源资料自动识别为可转化 SOP 的内容
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套 skills
- 需要建立 SOP 的自动检查、手动生成和更新提示流程

## 前置条件
- Windows 环境，且可使用 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定 vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 本机已安装至少一个 AI 客户端（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf）
- 对 Obsidian vault 目录结构有基本读写权限

## 标准步骤

### 1. 克隆仓库并确认 vault 路径
在 PowerShell 中进入目标目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如仓库存在嵌套目录或历史残留结构，先整理为统一 vault 根目录，确保后续 `.obsidian/`、`wiki/`、`skills/` 等目录都位于同一根路径下。

**预期结果：** 本地已存在可用的 claude-obsidian 根目录，且已明确后续配置使用的 vault 路径。

### 2. 创建标准目录结构
使用 PowerShell 创建部署所需的标准目录：

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

如项目已有部分目录，可保留并用 `-Force` 补齐缺失目录。

**预期结果：** vault 中已具备标准目录结构。

### 3. 写入 Obsidian 基础配置
在 vault 下补充 Obsidian 所需配置文件，至少包括：

- `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 分类设置为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

如团队已有标准模板，应统一复用，避免不同机器的图谱和显示规则不一致。

**预期结果：** Obsidian 可以正常识别 vault，图谱分类清晰，AI 工作文件不会污染主视图。

### 4. 为多 AI 客户端建立 skills 链接
将项目 skills 目录通过 Junction 链接到各 AI 客户端的技能目录，确保不同客户端都能调用同一套工作流。

常见映射如下：
- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/`
- Windsurf → `.windsurf/skills/`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

针对每个客户端分别执行，并根据实际目录调整路径。

**预期结果：** 多个 AI 客户端均可访问同一套 claude-obsidian skills。

### 5. 配置 SOP 专用 skill
在 `skills/wiki-sop/SKILL.md` 中定义 SOP 工作机制，至少覆盖以下模式：

- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题后生成 SOP
- 更新模式：当 sources 比已存在 SOP 更新时，提示更新 SOP
- 质量检查模式：检查步骤可执行性、检查清单完整性、来源回链是否完整

编写时应明确触发条件、输入输出格式、命名规范、SOP 存放路径和质量门槛。

**预期结果：** 项目中已存在专用的 SOP skill，且其职责、触发方式和输出规则清晰可执行。

### 6. 配置 hooks 自动检查机制
修改 `hooks/hooks.json`，在 `SessionStart` 中加入 SOP 自动检查逻辑。建议规则包含：

- 扫描 `wiki/sources/` 下 `status: sop-ready` 的笔记
- 若同主题资料数量 `≥ 3`，提示生成 SOP
- 若存在 `sop-priority: high`，优先提示生成 SOP
- 若 source 更新时间晚于现有 SOP，提示更新 SOP

如果客户端支持，还可在 `PostToolUse` 中加入自动 commit 等收尾动作。

**预期结果：** 支持 hooks 的客户端在会话启动时会自动检查 SOP 候选资料，并给出生成或更新提示。

### 7. 落实 Source 状态流转规则
统一资料状态流转，推荐采用以下路径：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 包含明确分步骤操作流程 → `status: sop-ready`
- 属于最佳实践或经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料、不可直接执行内容 → `status: processed`

**预期结果：** sources 中的资料被统一分类，AI 可以准确识别哪些内容适合转为 SOP。

### 8. 执行一次端到端验证
完成部署后进行验证：

1. 使用 `ingest` 写入一条测试资料，确认能进入知识库。
2. 检查资料是否被整理到 `concepts`、`entities` 或 `sources`。
3. 手动将至少 1 条测试资料标记为 `status: sop-ready`。
4. 在支持 hooks 的客户端启动新会话，确认是否收到 SOP 自动检查提示。
5. 在不支持 hooks 的客户端手动输入如“整理SOP”之类指令，确认 skill 可被调用。
6. 生成一个测试 SOP，检查其是否写入 `wiki/sop/`，且包含步骤、检查清单和来源回链。

如发现未触发，优先检查 skills 链接、hooks 配置路径、source frontmatter 和客户端兼容性。

**预期结果：** 从资料导入、状态标记、自动或手动触发，到 SOP 生成的完整链路均可正常运行。

### 9. 按客户端能力制定使用方式
根据客户端差异选择合适的工作方式：

- **Claude Code**：优先使用自动模式，利用 `hooks.json` 在 `SessionStart` 自动检查 SOP 候选
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：采用手动触发模式，通过 skills 主动发出“整理SOP”“生成某主题SOP”等指令

不要假设所有客户端都支持 hooks；在文档和团队培训中应明确区分“自动触发”和“手动触发”两类用法。

**预期结果：** 不同客户端都能以各自支持的方式使用同一知识库与 SOP 流程。

### 10. 建立持续维护与质量检查习惯
将知识库维护纳入日常流程：

- 定期执行 `lint the wiki`
- 定期检查 `wiki/sources/` 中 `sop-ready` 资料是否已被转化
- 当 source 更新快于现有 SOP 时，及时重生成或更新 SOP
- 审核 SOP 是否满足可执行、可复用、可追溯三项标准

建议将 SOP 更新作为知识库维护的固定动作，而不是一次性部署后的附属任务。

**预期结果：** 知识库与 SOP 长期保持一致，新增经验能够稳定沉淀为可复用流程。

## 检查清单
- [ ] 已在 Windows 上成功克隆 claude-obsidian 仓库
- [ ] 已创建标准目录结构
- [ ] 已写入 Obsidian 基础配置
- [ ] 已为目标 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中配置 SOP 自动检查逻辑
- [ ] 已统一 source 状态流转和 auto-marking 规则
- [ ] 已完成至少一次 `sop-ready` 资料的测试生成
- [ ] 已验证目标客户端属于自动触发还是手动触发模式
- [ ] 已建立定期维护机制

## 常见问题

### Q1. 这个项目是否原生支持 AI 自动写笔记和知识整理？
支持。该项目原生支持 AI 自动写笔记、分类整理、定期维护和知识查询，其中自动记笔记可通过 `ingest` 命令实现。

### Q2. SOP 自动生成是开箱即用的吗？
不是完全开箱即用。需要额外配置 `skills/wiki-sop/SKILL.md` 和 `hooks/hooks.json` 才能实现自动检查、生成和更新提醒。

### Q3. 为什么 Claude Code 能自动检查 SOP，而其他客户端不行？
因为 Claude Code 支持 `hooks.json`，可在 `SessionStart` 自动检查；其他客户端主要支持 skills，但不支持同等级别 hooks 自动执行，因此通常只能手动触发。

### Q4. 什么样的 source 应该标记为 `status: sop-ready`？
凡是包含明确分步骤操作流程、可重复执行经验、最佳实践总结的资料，都应标记为 `status: sop-ready`；如果优先级高，可再加 `sop-priority: high`。

### Q5. 什么时候应该提示生成 SOP？
推荐条件包括：同主题 `sop-ready` 资料达到 3 条及以上、资料标记了 `sop-priority: high`、或者 source 内容更新晚于现有 SOP。

### Q6. 如果 skills 链接创建后客户端仍然识别不到怎么办？
优先检查 Junction 目标是否正确、客户端 skills 根目录是否存在、路径权限是否正常，以及客户端是否需要重启后重新加载 skills。

### Q7. SOP 生成后如何保证质量？
至少检查四项：步骤是否可直接执行、是否有明确预期结果、是否包含检查清单、是否保留来源回链。必要时结合 `lint the wiki` 和人工审核进行修正。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]