---
type: sop
category: workflow
status: active
created: 2026-05-25
updated: 2026-05-25
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
规范在 Windows 环境中部署 claude-obsidian 知识库、启用知识整理能力、配置 SOP 自动生成/更新机制，并完成多 AI 客户端技能链接，确保知识沉淀与 SOP 复用流程可持续运行。

## 2. 适用场景
- 需要在 Windows 上搭建本地 Obsidian 知识库并接入 AI 工作流
- 希望将 AI 生成或整理的资料自动沉淀为结构化笔记
- 需要把多份 sources 资料归纳为可执行 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套 skills
- 希望建立 SOP 自动检查、手动生成和更新提示机制

## 3. 前置条件
- Windows 环境
- 已安装 Git
- 可使用 PowerShell
- 本地可访问或克隆 claude-obsidian 项目仓库
- 已确定 Vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个支持 skills 或 hooks 的 AI 客户端
- 对 Obsidian Vault 基本目录结构有认知

## 4. 标准操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录
在 PowerShell 中进入目标工作目录并克隆项目仓库。若仓库解压或克隆后存在多层嵌套目录，先整理为单一 Vault 根目录。

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

确认最终 Vault 根目录，例如：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 目录，并已明确唯一 Vault 根路径。

### 步骤 2：初始化标准目录结构
在 Vault 根目录下创建 Obsidian 配置目录、原始资料目录、知识库目录和模板目录。

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

目录用途：
- `.raw`：原始输入资料
- `wiki/concepts`：概念类知识
- `wiki/entities`：实体类知识
- `wiki/sources`：来源资料与整理后的 source 笔记
- `wiki/sop`：最终 SOP 文档
- `_templates`：模板文件
- `.obsidian/snippets`：样式片段

**预期结果：** Vault 具备完整标准目录结构，后续可直接用于知识整理与 SOP 生成。

### 步骤 3：写入 Obsidian 基础配置
创建或更新以下配置文件：

1. `.obsidian/graph.json`
   - 配置知识图谱分组颜色
   - 建议将 `wiki/sop` 标记为黄色

2. `.obsidian/app.json`
   - 排除 AI 工作中间文件或不需展示的目录/文件

3. `.obsidian/appearance.json`
   - 启用 CSS snippets

如团队已有标准模板，应统一采用团队版本；若无，则至少保证以上 3 个文件存在并符合当前 Vault 使用规则。

**预期结果：** Obsidian 能正确识别 Vault，图谱分组、排除规则和外观片段已准备完成。

### 步骤 4：为多 AI 客户端建立 skills 链接
将项目 skills 目录通过 Windows Junction 链接到各 AI 客户端的 skills 目录。

标准目标如下：
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

若目标父目录不存在，请先创建父目录，再建立 Junction。

**预期结果：** 所需 AI 客户端均能访问同一套 claude-obsidian skills，避免重复维护。

### 步骤 5：创建 wiki-sop 技能定义
在 `skills/wiki-sop/SKILL.md` 中创建 SOP 技能说明，至少包含以下能力：
- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题时生成 SOP
- 更新模式：当 sources 晚于 SOP 时提示更新
- 质量检查：验证步骤可执行性、检查清单完整性、来源回链完整性

建议规则：
- 同主题 source 累积到 3 份及以上时，提示合成为 SOP
- 当 `sop-priority: high` 时，优先提示生成 SOP
- SOP 输出应包含用途、适用场景、前置条件、步骤、检查清单、FAQ、相关来源
- SOP 必须引用来源笔记

**预期结果：** Vault 中已存在可被 AI 客户端调用的 SOP 技能定义，支持自动检查与手动生成。

### 步骤 6：配置 hooks 自动检查机制
在 `hooks/hooks.json` 中加入 SessionStart 自动检查逻辑：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

推荐将该检查放入 `SessionStart`。若客户端支持 `PostToolUse`，可按团队规范追加自动 commit 或后处理动作。

**预期结果：** 支持 hooks 的客户端在会话开始时会自动执行 SOP 检查并给出生成/更新提示。

### 步骤 7：执行 Source 状态流转规范
采用以下状态流：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 包含分步骤操作流程 → `status: sop-ready`
- 属于最佳实践或经验总结 → `status: sop-ready` 且 `sop-priority: high`
- 仅为参考资料或背景说明 → `status: processed`

执行要求：
- 新导入资料先进入 `.raw` 或 raw 状态
- 整理后写入 `wiki/sources`
- 根据内容可执行性与复用价值补充状态字段
- 已合成为 SOP 的资料可标记为 `synthesized` 或保留回链

**预期结果：** 知识来源具备统一生命周期管理规则，AI 和人工都能判断是否应进入 SOP 生成流程。

### 步骤 8：按客户端能力运行 SOP 生成流程
根据不同 AI 客户端能力执行：

- Claude Code：支持自动检查与 hooks，可自动提示生成/更新 SOP
- Kimi Code：支持 skills，通常需手动输入“整理SOP”
- Codex CLI：支持 skills，通常需手动触发
- Gemini CLI：支持 skills，通常需手动触发
- Cursor / Windsurf：按其支持情况手动触发

统一操作方式：
1. 确认 `wiki/sources` 中已有同主题资料
2. 检查是否存在 `status: sop-ready`
3. 调用 wiki-sop 技能进行生成或更新
4. 将输出保存到 `wiki/sop`
5. 添加对来源笔记的回链

**预期结果：** 对应客户端已成功生成或更新 SOP，且 SOP 文件保存在 `wiki/sop` 中。

### 步骤 9：执行 SOP 质量检查与维护
在 SOP 生成后进行统一质检：
- 步骤是否可执行，是否包含明确动作、路径、命令或判断条件
- 是否包含检查清单
- 是否包含 FAQ
- 是否完整引用相关 source
- 是否存在“来源已更新但 SOP 未更新”的情况
- 是否可以被其他 AI 客户端直接引用和复用

同时定期执行知识库维护，如使用 `lint the wiki` 清理结构问题、检查链接一致性和分类质量。

**预期结果：** SOP 具备可执行性、可追溯性和可维护性，知识库整体结构保持健康。

## 5. 检查清单
- [ ] 已完成 claude-obsidian 仓库克隆并确认唯一 Vault 路径
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等目录
- [ ] 已写入 `graph.json`、`app.json`、`appearance.json` 基础配置
- [ ] 已为所需 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 `SessionStart` 的 SOP AUTO-CHECK 规则
- [ ] 已定义并执行 source 状态流转规则
- [ ] 已在至少一个客户端中完成 SOP 生成或更新测试
- [ ] 已检查 SOP 是否包含步骤、检查清单、FAQ 和来源回链
- [ ] 已建立后续定期维护与更新机制

## 6. 常见问题 FAQ

### Q1：Windows 上没有 setup 脚本怎么办？
A：可直接用 PowerShell 手动创建标准目录与配置文件，这就是 setup 的等效做法。关键是确保 Vault 结构、skills 和 hooks 配置完整。

### Q2：哪些客户端支持 SOP 自动检查？
A：资料显示 Claude Code 支持 hooks，因此可在 SessionStart 自动检查。Kimi Code、Codex CLI、Gemini CLI 等通常支持 skills，但多为手动触发。

### Q3：什么时候应把 source 标记为 sop-ready？
A：当资料中包含可复用的分步骤流程，或属于最佳实践、经验总结时，应标记为 `status: sop-ready`；若优先级高，再加 `sop-priority: high`。

### Q4：同一主题需要多少份资料才适合生成 SOP？
A：建议至少有 3 份同主题资料时提示生成 SOP；但如果某份资料已标记 `sop-priority: high`，可提前生成。

### Q5：如果 source 更新了，SOP 需要怎么处理？
A：应通过 hooks 或手动检查判断 source 是否比 SOP 更新；若是，则触发 SOP 更新流程，并重新校验步骤、清单和来源引用。

### Q6：为什么要给多个 AI 客户端建立同一个 skills 链接？
A：这样可以在不同客户端中复用同一套知识库技能与 SOP 规则，避免重复维护，并确保输出标准一致。

## 7. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]