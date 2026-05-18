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

## 1. 目的

本 SOP 用于在 Windows 环境中完成 claude-obsidian 知识库部署，并建立一套可跨多个 AI 客户端复用的 SOP 自动生成与维护机制。目标包括：

- 搭建标准化知识库目录结构
- 启用 AI 自动写笔记、分类整理、查询与维护能力
- 建立 `source → sop-ready → synthesized` 的状态流转
- 配置 hooks 与 skills，实现 SOP 的自动检查、手动生成与持续更新

---

## 2. 适用场景

适用于以下情况：

- 需要在 Windows 本地搭建 claude-obsidian 知识库
- 希望让 AI 自动整理资料并沉淀 SOP
- 希望多个 AI 客户端共享同一套知识库与 SOP 能力
- 需要建立可持续维护的资料到 SOP 转化流程

---

## 3. 前置条件

- Windows 环境
- 已安装 Git
- 可使用 PowerShell
- 可访问 claude-obsidian 仓库
- 已确定 Vault 根目录
- 已安装至少一个 AI 客户端
- 对客户端的 skills 目录有写入权限

---

## 4. 标准步骤

### 步骤 1：克隆 claude-obsidian 仓库并确认 Vault 路径

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

确认 Vault 路径，例如：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

如存在嵌套目录，先整理为单一知识库根目录。

**预期结果：** 本地已存在统一可用的 Vault 根目录。

---

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

目录用途：

- `.raw`：原始资料
- `wiki/concepts`：概念知识
- `wiki/entities`：实体知识
- `wiki/sources`：来源笔记
- `wiki/sop`：SOP 文档
- `_templates`：模板

**预期结果：** 知识库具备完整目录结构。

---

### 步骤 3：写入 Obsidian 基础配置

补齐以下文件：

- `.obsidian/graph.json`：配置图谱颜色分组，建议 `wiki/sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

若团队已有标准模板，直接复用；否则至少保证文件存在且格式可被 Obsidian 识别。

**预期结果：** Obsidian 可正常打开并清晰区分 SOP 内容。

---

### 步骤 4：为多 AI 客户端创建 skills 链接

将 skills 链接到各客户端。示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

可按需配置：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/`
- `.windsurf/skills/`

**预期结果：** 多个 AI 客户端可共享同一套 claude-obsidian skills。

---

### 步骤 5：建立 SOP 专用 skill

创建文件：`skills/wiki-sop/SKILL.md`

至少包含以下能力定义：

- 自动检查：扫描 `status: sop-ready` 的资料
- 手动生成：按主题生成 SOP
- 更新模式：source 更新后提示更新 SOP
- 质量检查：检查步骤是否可执行、清单是否完整、来源是否回链

建议统一要求：

- SOP 必须有标题、适用场景、前置条件、步骤、检查清单、来源
- 步骤必须编号，且每步都可直接执行
- 资料不足时不强行生成，先提示补充 source

**预期结果：** AI 具备明确的 SOP 生成规则与质量标准。

---

### 步骤 6：配置 hooks 自动检查 SOP 机会

修改 `hooks/hooks.json`，在 `SessionStart` 加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持，可在 `PostToolUse` 加入自动提交或状态同步逻辑。

**预期结果：** 会话启动时自动识别可生成或待更新的 SOP。

---

### 步骤 7：执行标准资料状态流转

采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：

- 有明确操作步骤：`status: sop-ready`
- 最佳实践/高复用经验：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`
- 已完成 SOP 提炼：可关联 `synthesized`

建议在 frontmatter 中维护：

- `status`
- `topic`
- `updated`
- `sop-priority`

**预期结果：** 所有 source 都能按统一标准进入后续整理或 SOP 转化流程。

---

### 步骤 8：按客户端能力执行 SOP 生成与维护

客户端差异处理：

- **Claude Code**：支持 hooks，优先用于自动检查与自动维护
- **Kimi Code**：支持 skills，通常需手动说“整理SOP”
- **Codex CLI**：支持 skills，通常手动触发
- **Gemini CLI**：支持 skills，通常手动触发
- **Cursor / Windsurf**：多为手动触发 SOP 检查与生成

手动触发建议：

- “扫描可生成 SOP 的主题”
- “根据 topic=xxx 的 sources 生成 SOP”
- “检查 SOP 是否需要根据最新 source 更新”

**预期结果：** 不同客户端下都能一致执行 SOP 工作流。

---

### 步骤 9：验证知识库核心能力

逐项验证：

- `ingest`：能否自动写入笔记
- 分类整理：能否进入 `concepts` / `entities` / `sources`
- `lint the wiki`：能否执行维护
- `query:`：能否检索知识
- SOP 生成：至少 3 条同主题 `sop-ready` source 是否可触发生成
- SOP 更新：更新 source 后是否提示更新 SOP

若失败，优先检查：

- Vault 路径
- skills 链接
- hooks 配置
- source frontmatter 字段

**预期结果：** 系统已可稳定支持日常知识沉淀与 SOP 维护。

---

## 5. 检查清单

- [ ] 已克隆仓库并确认 Vault 路径
- [ ] 已创建全部标准目录
- [ ] 已写入基础 Obsidian 配置
- [ ] 已创建至少一个 AI 客户端的 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SOP 自动检查
- [ ] 已定义 source 状态流转标准
- [ ] 已验证 ingest、query、lint 功能
- [ ] 已验证 SOP 生成
- [ ] 已验证 SOP 更新提示或更新流程

---

## 6. 常见问题（FAQ）

### Q1：claude-obsidian 是否原生支持 SOP 生成？
支持模板化和 AI 笔记能力，但 SOP 的自动检查、自动触发和跨客户端调用通常需要自行配置 skills、hooks 和 Vault 路径。

### Q2：为什么 Claude Code 更适合自动化？
因为其支持 `hooks.json`，可以在 `SessionStart` 自动扫描 SOP 候选，在 `PostToolUse` 执行后续动作。其他客户端通常只有 skills，没有同等级 hooks 自动化。

### Q3：什么资料应该标记为 `sop-ready`？
只要资料中包含明确步骤、可复用执行流程或最佳实践，就应考虑标记为 `sop-ready`。若复用价值高，再加 `sop-priority: high`。

### Q4：什么时候应该生成 SOP？
同主题下至少有 3 条 `sop-ready` source，或某条 source 被标记为高优先级时，应生成 SOP。

### Q5：什么时候应该更新 SOP？
当 source 更新日期晚于已有 SOP，或新增了关键步骤、例外条件、最佳实践时，应更新 SOP。

### Q6：skills 链接失败怎么办？
检查目标父目录是否存在、PowerShell 权限是否足够、路径是否正确。必要时先创建父目录，再执行 Junction 命令。

### Q7：没有 hooks 还能用吗？
可以。没有 hooks 时，使用 skills 手动触发即可，例如“整理SOP”或“根据 topic=xxx 生成 SOP”。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]