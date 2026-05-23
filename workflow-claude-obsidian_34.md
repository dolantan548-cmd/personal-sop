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

本 SOP 用于在 Windows 环境中部署 `claude-obsidian` 知识库，建立标准目录与 Obsidian 配置，接入多个 AI 客户端的 skills 链接，并启用基于 source 状态的 SOP 自动检查与生成机制。

---

## 2. 适用场景

- 需要在 Windows 上搭建可被多个 AI 客户端复用的 Obsidian 知识库
- 需要将 AI 对话、资料与流程经验自动沉淀为结构化笔记
- 需要基于 source 状态自动识别可 SOP 化内容并提示生成或更新 SOP
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 共享同一套 skills 和知识库

---

## 3. 前置条件

- Windows 环境，具备 PowerShell
- 已安装 Git
- 可访问 `claude-obsidian` 仓库
- 已确定 vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 本机已安装至少一个目标 AI 客户端
- 具备在用户目录创建 Junction 链接的权限
- 了解 Obsidian vault 的基本结构

---

## 4. 操作步骤

### 步骤 1：克隆项目并确认 Vault 路径

在 PowerShell 中进入工作目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如有嵌套目录，整理为单一 vault 根目录。设置统一变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在唯一且可用的 vault 根目录。

---

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

目录职责：

- `.raw`：原始输入资料
- `wiki/concepts`：概念类笔记
- `wiki/entities`：实体类笔记
- `wiki/sources`：来源资料
- `wiki/sop`：SOP 文档
- `_templates`：模板文件

**预期结果：** 目录结构完整并符合知识库标准。

---

### 步骤 3：写入 Obsidian 基础配置

至少创建并维护以下配置：

1. `.obsidian/graph.json`：知识图谱颜色分组，建议将 `sop` 设置为黄色。
2. `.obsidian/app.json`：排除 AI 工作文件。
3. `.obsidian/appearance.json`：启用 CSS snippets。

如团队已有标准模板，优先复用模板。

**预期结果：** Obsidian 能正常识别图谱分组、忽略无关文件并加载样式片段。

---

### 步骤 4：为多 AI 客户端创建 skills Junction 链接

根据实际安装的客户端，创建对应的 Junction：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/claude-obsidian`
- Windsurf：`.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

按需对其他客户端重复执行。

**预期结果：** 各客户端可以读取同一套 skills 定义。

---

### 步骤 5：创建 `skills/wiki-sop/SKILL.md`

在 `skills/wiki-sop/SKILL.md` 中定义以下能力：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：source 更新后提示更新 SOP
- 质量检查模式：检查可执行性、checklist、回链完整性

建议在该文件中写明：输入、触发条件、输出位置、命名规则。

**预期结果：** `wiki-sop` 技能定义统一，便于不同 AI 客户端一致执行。

---

### 步骤 6：配置 hooks 自动检查 SOP

修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如环境支持，可增加 `PostToolUse` 等自动动作。

**预期结果：** 支持 hooks 的客户端会在会话开始时自动检查 SOP 候选。

---

### 步骤 7：落实 Source 状态流转与自动标记规则

统一采用以下状态流：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

标记规范：

- 分步骤操作流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`
- 已提炼完成：`synthesized`

**预期结果：** AI 可稳定识别哪些 source 应转化为 SOP。

---

### 步骤 8：执行知识摄取、分类与基础维护

使用项目原生能力：

- `ingest`：导入资料并自动记笔记
- 自动分类：归档到 `concepts`、`entities`、`sources`
- `lint the wiki`：定期维护知识库
- `query:`：查询知识

先完成摄取与分类，再进行 SOP 生成。

**预期结果：** 知识库内容结构稳定、可维护、可检索。

---

### 步骤 9：按客户端差异执行自动或手动 SOP 生成

客户端差异：

- **Claude Code**：支持 `hooks.json` 自动检查，可自动提示生成/更新 SOP
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常支持 skills，但需手动触发，例如输入“整理SOP”

统一要求：

- 输出目录为 `wiki/sop/`
- SOP 必须回链相关 source
- 命名和格式遵循 `wiki-sop` skill 规范

**预期结果：** 不同客户端可按统一规范完成 SOP 生成。

---

### 步骤 10：验证结果并执行质量检查

检查以下项目：

- 步骤是否可执行
- 前置条件是否齐全
- 命令、路径是否明确
- 是否包含 checklist
- 是否回链 source
- 是否反映最新 source 更新

必要时重新生成或补充 SOP。

**预期结果：** 产出的 SOP 完整、可执行、可追溯。

---

## 5. 检查清单

- [ ] 已克隆 `claude-obsidian` 仓库
- [ ] 已创建标准目录结构
- [ ] 已写入 Obsidian 基础配置
- [ ] 已为所需 AI 客户端创建 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SOP 自动检查规则
- [ ] 已建立 source 状态流转与标记规范
- [ ] 已验证 `ingest`、`lint the wiki`、`query:` 可用
- [ ] 已确认所用客户端的触发方式
- [ ] 已验证 SOP 输出到 `wiki/sop/` 且带回链

---

## 6. 常见问题

### Q1：为什么只有 Claude Code 可以自动检查 SOP？
因为来源显示 Claude Code 支持 `hooks.json`，可在 `SessionStart` 自动执行检查；其他客户端多为 skills 支持，通常不具备同等 hooks 自动化能力。

### Q2：什么样的资料应标记为 `sop-ready`？
包含操作步骤、可复用流程、最佳实践或经验总结的资料都应标记为 `sop-ready`；高价值内容再加 `sop-priority: high`。

### Q3：如果 source 更新了但 SOP 没更新怎么办？
在 hooks 规则中加入“sources 比 SOP 新 → 提示更新 SOP”。触发后重新生成或更新对应 SOP，并保留 source 回链。

### Q4：skills 链接应该如何指向？
应确保 AI 客户端能读取项目内 skills 内容。通常将客户端的 `.../skills/claude-obsidian` 链接到 vault 中实际存放技能定义的目录即可。

### Q5：为什么不能直接从 raw 资料生成 SOP？
因为 raw 资料尚未结构化，AI 难以稳定识别主题、优先级与引用关系，容易导致 SOP 不完整或不可执行。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]