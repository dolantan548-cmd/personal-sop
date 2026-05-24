---
type: sop
category: workflow
status: active
created: 2026-05-24
updated: 2026-05-24
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于在 Windows 环境中部署 claude-obsidian 知识库，配置多 AI 客户端共享 skills，并建立 source 到 SOP 的自动检查、生成与更新机制。目标是实现知识沉淀、流程复用、SOP 标准化输出与跨工具统一调用。

---

## 2. 适用场景

- 需要在 Windows 上搭建 claude-obsidian 知识库
- 希望将 AI 对话、资料和经验自动沉淀为结构化笔记
- 需要把可复用流程自动识别并转化为 SOP
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等工具共享同一套知识库与 skills
- 需要建立 source → sop-ready → SOP 生成/更新 的标准化流程

---

## 3. 前置条件

- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 GitHub 仓库 `https://github.com/AgriciDaniel/claude-obsidian.git`
- 已确定知识库根目录，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 目标 AI 客户端已安装，并允许配置本地 skills 目录或工作区技能目录
- 对 Obsidian Vault 目录结构有基本理解

---

## 4. 标准步骤

### 步骤 1：克隆仓库并确认 Vault 根目录

打开 PowerShell，执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后目录出现嵌套，请整理为单一 Vault 根目录。建议统一设置：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在 claude-obsidian 根目录，并明确唯一 Vault 路径。

### 步骤 2：初始化 Vault 目录结构

执行以下命令创建标准目录：

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

**预期结果：** Vault 中具备 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等目录。

### 步骤 3：写入 Obsidian 基础配置

创建或更新以下文件：

1. `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 节点设为黄色。
2. `.obsidian/app.json`：排除 AI 工作文件，减少界面噪音。
3. `.obsidian/appearance.json`：启用 CSS snippets。

**预期结果：** Obsidian 能正确显示知识图谱、过滤无关文件并启用视觉增强配置。

### 步骤 4：为多 AI 客户端创建 skills 链接

使用 Junction 方式将项目 skills 链接到各客户端。示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

按需为以下工具建立链接：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/`
- Windsurf → `.windsurf/skills/`

**预期结果：** 多个 AI 客户端共享同一套 skills，无需重复维护。

### 步骤 5：创建 wiki-sop 技能定义

在 `skills/wiki-sop/` 下创建 `SKILL.md`，并定义以下能力：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：当 sources 更新且晚于 SOP 时提示更新
- 质量检查：步骤、清单、回链和可执行性校验

建议在技能中明确：

- SOP 输出目录为 `wiki/sop/`
- 必须引用相关 source
- 步骤必须可执行
- 必须包含 checklist、FAQ、适用场景和前置条件

**预期结果：** 系统具备统一的 SOP 识别、生成和更新能力。

### 步骤 6：配置 hooks 自动检查机制

编辑 `hooks/hooks.json`，在 `SessionStart` 中加入规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

**预期结果：** 支持 hooks 的客户端在会话启动时会自动检查是否需要生成或更新 SOP。

### 步骤 7：建立 source 状态流转与自动标记规则

采用以下标准状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：

- 包含分步骤流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

建议在 frontmatter 中维护：

- `status`
- `topic`
- `updated`
- `sop-priority`

**预期结果：** AI 能稳定识别可转 SOP 的资料与普通参考资料。

### 步骤 8：执行知识摄取、分类与维护

日常使用中按以下方式运作：

- 使用 `ingest` 导入资料
- 自动分类到 `concepts`、`entities`、`sources`
- 定期执行 `lint the wiki`
- 使用 `query:` 查询知识

处理新资料时，若具备可复用流程，应优先标记为 `sop-ready`。

**预期结果：** 知识库持续积累且结构稳定，为 SOP 自动化提供高质量输入。

### 步骤 9：按客户端能力选择自动或手动 SOP 生成方式

客户端差异如下：

- Claude Code：支持 hooks，可自动检查 SOP
- Kimi Code：支持 skills，通常手动触发
- Codex CLI：支持 skills，通常手动触发
- Gemini CLI：支持 skills，通常手动触发
- Cursor / Windsurf：可接技能目录，通常手动触发

手动触发建议使用固定指令，例如：

- “扫描 wiki/sources 中 sop-ready 的资料并生成 SOP”
- “检查 sources 是否比现有 SOP 更新，如有则更新对应 SOP”

**预期结果：** 无论客户端是否支持 hooks，均可稳定执行 SOP 生成与更新流程。

### 步骤 10：验证 SOP 输出质量并回链来源

每次生成或更新 SOP 后，确认以下内容：

- 标题明确且面向执行
- 步骤按顺序排列且可直接操作
- 包含 prerequisites、scenarios、checklist、FAQ
- 正确引用相关 source
- 文件保存至 `wiki/sop/`
- 若 sources 更新，SOP 已同步更新

**预期结果：** SOP 内容完整、可执行、可追溯，并与来源资料保持一致。

---

## 5. 检查清单

- [ ] 已完成 claude-obsidian 仓库克隆并确认唯一 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已写入或更新 Obsidian 基础配置文件
- [ ] 已为目标 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查逻辑
- [ ] 已建立 `sop-ready` 与 `sop-priority` 标记规则
- [ ] 已明确 source 状态流转
- [ ] 已能通过至少一个客户端触发 SOP 生成或更新
- [ ] 已验证 SOP 的完整性与来源回链

---

## 6. 常见问题（FAQ）

**Q1：claude-obsidian 是否原生支持自动写笔记和知识分类？**  
A：支持。可通过 `ingest` 导入资料，并自动分类到 `concepts`、`entities`、`sources` 等目录。

**Q2：SOP 会自动生成吗？**  
A：不是完全开箱即用。项目有模板和机制基础，但需要额外配置 `wiki-sop` 技能与 hooks 才能实现自动检查和提示生成。

**Q3：哪些客户端支持自动检查 SOP？**  
A：Claude Code 支持 `hooks.json` 自动检查；其他客户端通常依赖 skills 手动触发。

**Q4：什么时候应标记 `status: sop-ready`？**  
A：当资料包含分步骤流程、可重复执行方法或可沉淀为标准流程的最佳实践时，应标记为 `sop-ready`。

**Q5：source 更新后如何保证 SOP 不过期？**  
A：通过 hooks 或手动检查比较 sources 与 SOP 的更新时间；如果 sources 更新更晚，应提示并执行 SOP 更新。

**Q6：不支持 hooks 的客户端怎么办？**  
A：继续复用同一套 skills，并在会话中使用固定指令手动触发 SOP 扫描、生成和更新。

**Q7：为什么推荐用 Junction 链接 skills？**  
A：因为 Junction 能让多个客户端共享同一份技能源，避免复制多份文件导致配置漂移。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]