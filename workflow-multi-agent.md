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

# SOP: 在 Windows 部署 claude-obsidian 并配置多 AI 客户端的 SOP 自动生成机制

## 1. 目的

标准化在 Windows 环境中部署 claude-obsidian 知识库、接入多个 AI 客户端，并启用基于 source 状态与 hooks 的 SOP 自动检查与生成机制，确保知识沉淀、流程复用和跨工具引用一致可用。

## 2. 适用场景

- 需要在 Windows 上搭建可供 AI 自动记笔记与知识整理的 Obsidian 知识库
- 需要将分散的资料自动归档为 concepts、entities、sources、sop 等结构
- 需要为 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 配置统一的 skills 引用
- 需要建立 source 到 SOP 的自动触发与更新机制
- 需要让多个 AI 客户端复用同一套 SOP 与知识库

## 3. 前置条件

- Windows 环境，具备 PowerShell 权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定知识库根目录路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 本机已安装至少一个目标 AI 客户端
- 了解或可编辑 Obsidian 配置文件、skills 目录和 hooks 配置文件

## 4. 标准操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录

在 PowerShell 中进入目标工作目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后存在额外嵌套目录，手动整理为单一 Vault 根目录。建议统一使用：

```text
D:\dolan_env\temp\project\personal\claude-obsidian
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，并确认后续所有配置都以该目录作为 Vault。

---

### 步骤 2：创建标准目录结构

执行以下 PowerShell 命令：

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

**预期结果：** 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等标准目录。

---

### 步骤 3：写入 Obsidian 基础配置

创建或更新以下文件：

1. `.obsidian/graph.json`：配置知识图谱颜色分组，并将 `sop` 分组设置为黄色。
2. `.obsidian/app.json`：排除 AI 工作文件，避免中间文件干扰。
3. `.obsidian/appearance.json`：启用 CSS snippets。

如团队已有标准模板，优先沿用统一版本。

**预期结果：** Obsidian 可以正确识别 Vault，基础显示、图谱与排除策略已生效。

---

### 步骤 4：为多 AI 客户端创建 skills 链接

通过 Windows Junction 将 skills 接入各客户端：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

使用 `New-Item -ItemType Junction` 创建链接，并将源路径指向项目中的 skills 目录。

**预期结果：** 各 AI 客户端可以共享同一套 skills，而无需复制多份配置。

---

### 步骤 5：创建 wiki-sop skill

创建文件：

```text
skills/wiki-sop/SKILL.md
```

文件中至少定义以下能力：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：当 sources 更新而 SOP 过旧时提示更新
- 质量检查：步骤可执行性、检查清单、回链完整性

建议补充统一输出结构：标题、目的、适用场景、前置条件、步骤、清单、FAQ、关联来源。

**预期结果：** AI 客户端能够依据 skill 判断何时生成、更新和校验 SOP。

---

### 步骤 6：配置 hooks 自动检查机制

编辑：

```text
hooks/hooks.json
```

在 `SessionStart` 钩子中加入规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如果使用 Claude Code，可利用该 hooks 在每次会话开始时自动执行检查。

**预期结果：** Claude Code 可在会话启动时自动发现 SOP 生成或更新机会。

---

### 步骤 7：建立 Source 状态流转规则

统一采用以下状态流：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则如下：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

建议在 source frontmatter 中写入统一字段，便于 hooks 和 skills 读取。

**预期结果：** 所有 source 都能进入明确的状态流，并支持 AI 自动识别 SOP 候选资料。

---

### 步骤 8：执行资料导入、整理与维护

按项目原生能力运行：

- 使用 `ingest` 导入资料
- 自动分类到 `concepts`、`entities`、`sources`
- 使用 `query:` 进行知识查询
- 定期执行 `lint the wiki` 维护知识库

重点检查导入后的 source 是否被正确分类，以及是否需要标记为 `sop-ready`。

**预期结果：** 知识库能够持续吸收新资料，并为 SOP 机制提供结构化输入。

---

### 步骤 9：生成或更新 SOP

根据客户端能力执行：

- **Claude Code**：依赖 `SessionStart` 自动检查提示生成或更新 SOP
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通过手动指令触发，例如“整理SOP”

生成后的 SOP 应保存至：

```text
wiki/sop/
```

内容必须包含：

- 可执行步骤
- 检查清单
- FAQ
- 关联 source 回链

如果已有旧版 SOP 且 source 更新，应优先更新旧文档，不要重复创建新版本。

**预期结果：** `wiki/sop/` 中存在结构化、可执行、可追溯来源的 SOP 文档。

---

### 步骤 10：验证跨客户端可用性并持续维护

分别在至少两个客户端中测试：

1. 是否能读取同一 Vault
2. 是否能读取同一套 skills
3. 是否能访问 `wiki/sop/` 中的 SOP
4. Claude Code 是否会自动检查 SOP 机会
5. 手动客户端是否能通过明确指令生成或更新 SOP

后续按周期执行 `lint the wiki`，并在新增高价值资料后检查是否需要标记为 `sop-ready`。

**预期结果：** 多客户端可稳定复用同一知识库和 SOP 机制，自动与手动工作流都可运行。

## 5. 检查清单

- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已配置 Obsidian 基础文件
- [ ] 已创建各 AI 客户端的 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 配置 `SessionStart` 自动检查规则
- [ ] 已统一 source 的 `status` 与 `sop-priority` 字段规则
- [ ] 已验证 `ingest`、`query:`、`lint the wiki` 可用
- [ ] 已成功生成或更新至少 1 份 SOP
- [ ] 已验证至少两个 AI 客户端可以复用同一知识库与 SOP 机制

## 6. 常见问题（FAQ）

### Q1：为什么 Claude Code 可以自动检查 SOP，而其他客户端不行？

因为 Claude Code 支持 `hooks.json`，可在 `SessionStart` 自动扫描 `sop-ready` source；其他客户端主要支持 skills，但通常不支持同级别 hooks 自动化，因此多为手动触发。

### Q2：什么样的 source 应该标记为 `status: sop-ready`？

凡是包含明确分步骤流程、最佳实践、经验总结，且具备可重复执行价值的资料，都应标记为 `sop-ready`。高价值内容建议再加 `sop-priority: high`。

### Q3：什么时候该新建 SOP，什么时候更新 SOP？

当同主题下有至少 3 个 `sop-ready` source，或存在 `sop-priority: high` 时，应新建 SOP；当 source 文档更新晚于现有 SOP 时，应更新旧 SOP。

### Q4：为什么要用 Junction 共享 skills？

因为这样可以让多个 AI 客户端共享同一套规则与模板。仓库中的 skill 一旦更新，各客户端可同步受益，无需重复维护。

### Q5：如果资料导入后没有进入 SOP 流程，应该检查什么？

先检查 source 是否正确标记了 `status: sop-ready` 或 `sop-priority: high`，再检查 `skills/wiki-sop/SKILL.md` 是否存在，以及 `hooks/hooks.json` 是否已加入并生效。

## 7. 关联来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]