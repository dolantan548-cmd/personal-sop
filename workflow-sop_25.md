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

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于标准化在 Windows 环境中部署 `claude-obsidian` 知识库，并配置 SOP 自动检查与生成机制，使多个 AI 客户端能够共享同一套知识结构、来源资料和流程文档。

---

## 2. 适用场景

- 需要在 Windows 上搭建 AI 可协作的知识库
- 需要自动沉淀 AI 笔记并分类整理
- 需要将可复用经验和操作流程转化为 SOP
- 需要跨多个 AI 客户端共享同一 vault 和 skills
- 需要根据资料状态自动提示 SOP 生成或更新

---

## 3. 前置条件

- Windows 环境，具备 PowerShell 权限
- 已安装 Git
- 可访问仓库：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 已确定 vault 路径，例如：`D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个 AI 客户端（Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等）
- 有权限在用户目录中创建 Junction 链接

---

## 4. 标准步骤

### 步骤 1：克隆项目并确认 vault 根目录

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

如出现嵌套目录，先整理为单一根目录后再继续。

**预期结果：** 已存在统一的 vault 根目录，后续所有配置均使用该路径。

---

### 步骤 2：创建标准目录结构

执行：

```powershell
New-Item -ItemType Directory -Path "$VAULT\.obsidian\snippets" -Force
New-Item -ItemType Directory -Path "$VAULT\.raw" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\concepts" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\entities" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sources" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sop" -Force
New-Item -ItemType Directory -Path "$VAULT\_templates" -Force
```

**预期结果：** vault 具备 Obsidian 配置目录、原始资料目录、知识分类目录和 SOP 目录。

---

### 步骤 3：写入基础 Obsidian 配置

在 `.obsidian` 中创建或更新以下配置：

- `graph.json`：配置知识图谱颜色分组，建议 `sop` 为黄色
- `app.json`：排除 AI 工作文件
- `appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 能正常识别和展示知识结构，SOP 节点可被清晰区分。

---

### 步骤 4：为多 AI 客户端创建 skills Junction 链接

按实际客户端创建链接，例如：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

常见目标目录：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/`
- `.windsurf/skills/`

**预期结果：** 多个 AI 客户端均可共享同一套 skills 能力定义。

---

### 步骤 5：建立 SOP 专用 skill

创建文件：`skills/wiki-sop/SKILL.md`

至少定义以下模式：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：sources 更新后提示更新 SOP
- 质量检查：检查步骤可执行性、清单完整性、回链完整性

建议要求输出统一结构：用途、场景、前置条件、步骤、检查清单、FAQ、来源。

**预期结果：** AI 客户端可依据 skill 执行 SOP 生成、更新与质量审查。

---

### 步骤 6：配置 hooks 自动检查 SOP 机会

编辑 `hooks/hooks.json`，在 `SessionStart` 中加入类似逻辑：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如使用 Claude Code，可结合 `PostToolUse` 扩展自动维护动作。

**预期结果：** 支持 hooks 的客户端在会话开始时即可自动识别 SOP 生成/更新机会。

---

### 步骤 7：实施 source 状态流转与自动标记规则

统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** 所有 sources 都有明确状态，AI 能稳定识别 SOP 候选资料。

---

### 步骤 8：根据客户端能力执行 SOP 生成与更新

执行原则：

- **Claude Code**：依赖 hooks 自动检查
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常手动触发，如“整理SOP”“生成 SOP”“检查 sop-ready 资料”

满足以下任一条件时生成或更新 SOP：

1. 同主题存在至少 3 份 `sop-ready` 资料
2. 某 source 带有 `sop-priority: high`
3. source 比现有 SOP 更新

生成后的文档保存到：`wiki/sop/`

**预期结果：** SOP 能根据资料成熟度被及时生成或更新，并统一沉淀到知识库中。

---

### 步骤 9：执行质量检查并完成沉淀

检查生成的 SOP：

- 步骤是否可直接执行
- 是否包含命令、路径、触发条件等关键信息
- 是否有前置条件、适用场景、检查清单和 FAQ
- 是否包含来源回链
- 是否避免只是机械摘录 source

必要时执行知识库维护动作，如 `lint the wiki`。

**预期结果：** SOP 质量稳定，可复用、可追溯、可维护。

---

## 5. 检查清单

- [ ] 已克隆仓库并确认 vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已写入基础 Obsidian 配置
- [ ] 已为目标 AI 客户端建立 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SOP 自动检查规则
- [ ] 已落实 source 状态流转和自动标记规则
- [ ] 已验证至少一个客户端能触发 SOP 检查或生成
- [ ] 已将 SOP 保存到 `wiki/sop/`
- [ ] 已完成 SOP 质量检查与来源回链

---

## 6. 常见问题（FAQ）

**Q1：该项目是否原生支持 AI 自动记笔记？**  
A：支持，资料中明确说明可通过 `ingest` 命令实现自动记笔记，并自动分类整理。

**Q2：SOP 是否开箱即用自动生成？**  
A：不是完全开箱即用。项目本身有模板和组织基础，但需要补充 SOP skill 和自动检查触发机制。

**Q3：哪些客户端支持自动检查？**  
A：Claude Code 支持 `hooks.json`，可自动检查；其他客户端大多依赖 skills 手动触发。

**Q4：什么样的资料应该标记为 `sop-ready`？**  
A：任何包含明确步骤、可重复操作、最佳实践或经验总结的资料都适合标记为 `sop-ready`。

**Q5：如果 source 更新后 SOP 没同步怎么办？**  
A：应在 hooks 或手动巡检中比较更新时间，source 更新较新时应提示或执行 SOP 更新。

**Q6：为什么推荐用 Junction 链接 skills？**  
A：可让多个客户端共享同一套 skill，减少重复配置和版本漂移。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
