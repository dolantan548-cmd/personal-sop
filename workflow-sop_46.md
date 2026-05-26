---
type: sop
category: workflow
status: active
created: 2026-05-26
updated: 2026-05-26
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
标准化在 Windows 环境中部署 claude-obsidian 知识库、启用 SOP 自动生成与更新提示机制，并为多个 AI 客户端建立统一引用入口，确保知识沉淀、分类整理和 SOP 复用流程可持续运行。

## 适用场景
- 需要在 Windows 上搭建可被 AI 客户端共同访问的 Obsidian 知识库
- 需要将 AI 生成或整理的资料自动归档到 `wiki/concepts`、`wiki/entities`、`wiki/sources` 等目录
- 需要根据 `sources` 中的可复用流程资料生成 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等工具中复用同一套 skills
- 需要建立 source 从 `ingest` 到 `sop-ready` 再到 `synthesized` 的标准状态流转

## 前置条件
- Windows 环境，支持 PowerShell
- 已安装 Git
- 可访问 `claude-obsidian` 项目仓库
- 已确定知识库路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 需要接入的 AI 客户端本地配置目录权限，例如 `~/.claude`、`~/.codex`、`~/.kimi`、`~/.gemini`
- 对 Obsidian vault 基本结构有最低限度了解

## 标准操作步骤

### 1. 克隆项目并确认 Vault 根目录
在 PowerShell 中进入目标工作目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后存在多层嵌套目录，手动整理，确保最终 Vault 根目录为后续配置统一使用的路径，例如：

`D:\dolan_env\temp\project\personal\claude-obsidian`

**预期结果：** 本地已存在可访问的 claude-obsidian 项目目录，且已明确唯一 Vault 根路径。

### 2. 初始化 Vault 目录结构
设置 Vault 变量并创建标准目录：

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

目录用途建议如下：
- `.raw`：原始输入
- `wiki/sources`：资料沉淀
- `wiki/sop`：SOP 输出
- `_templates`：模板管理

**预期结果：** Vault 内已具备 SOP 运行所需的基础目录结构，无缺失关键目录。

### 3. 写入 Obsidian 配置文件
在 Vault 的 `.obsidian` 目录中配置以下文件：

1. `graph.json`：设置知识图谱颜色分组，其中 `sop` 节点建议标记为黄色。
2. `app.json`：排除 AI 工作文件，避免中间文件干扰浏览和检索。
3. `appearance.json`：启用 CSS snippets。

如已有配置，优先合并而非覆盖，避免破坏现有 Obsidian 设置。

**预期结果：** Obsidian 可正确识别知识图谱分组、忽略无关工作文件，并加载样式片段。

### 4. 为多 AI 客户端创建 skills 链接
通过 Junction 将同一套 `claude-obsidian` skills 链接到各 AI 客户端目录。示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target "$VAULT"
```

如使用 Cursor 或 Windsurf，也在其对应的 `.cursor/skills/`、`.windsurf/skills/` 中建立链接。若父目录不存在，先创建父目录。

**预期结果：** 目标 AI 客户端可通过各自 skills 目录访问同一 Vault/skills 资源，不需要重复维护多份配置。

### 5. 创建 wiki-sop 技能定义
在 `skills/wiki-sop/SKILL.md` 中定义 SOP 工作技能，至少覆盖：

- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：当 source 更新而 SOP 落后时提示更新
- 质量检查：检查步骤可执行性、检查清单完整性、回链完整性

要求在技能文档中明确触发条件、输入来源、输出目录、命名规则和质量标准。

**预期结果：** 存在可被 AI 客户端调用的 `skills/wiki-sop/SKILL.md`，且其职责清晰覆盖 SOP 生成、更新与质检。

### 6. 配置 hooks 自动检查 SOP 条件
编辑 `hooks/hooks.json`，在 `SessionStart` 钩子中加入以下逻辑：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量大于等于 3 时，提示生成 SOP
- 若存在 `sop-priority: high`，优先提示生成 SOP
- 若 sources 的更新时间晚于 SOP，提示更新 SOP

如使用 Claude Code，可进一步在 `PostToolUse` 中结合自动 commit 机制记录变更。其他不支持 hooks 的客户端，则保留手动触发方案。

**预期结果：** 支持 hooks 的客户端在会话开始时可自动发现 SOP 候选主题或已过期 SOP。

### 7. 建立 source 状态流转与自动标记规则
统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 包含分步骤操作流程：标记 `status: sop-ready`
- 包含最佳实践或经验总结：标记 `status: sop-ready` 且增加 `sop-priority: high`
- 纯参考资料：标记 `status: processed`

要求 AI 或人工在 source frontmatter 中显式写入状态。

**预期结果：** 新资料进入知识库后可被一致分类，并能被后续 SOP 自动检查规则准确识别。

### 8. 按客户端能力执行 SOP 生成与维护
根据不同工具能力执行：

- **Claude Code**：优先使用自动检查，依赖 `hooks.json` 在 `SessionStart` 识别 SOP 候选，并在需要时触发生成或更新
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通过 skills 手动触发，例如输入“整理SOP”或指定主题生成 SOP

无论自动还是手动，输出统一写入 `wiki/sop/`，并确保 SOP 引用对应 source。

**预期结果：** 所使用的 AI 客户端能够按其能力边界正常执行 SOP 生成或更新，不出现流程混乱。

### 9. 执行 SOP 质量检查并完成回链
生成 SOP 后，执行以下质检：

1. 每个步骤都必须是可执行动作，而非泛泛描述
2. 必须包含检查清单，便于复核
3. 必须与来源文档建立完整回链
4. 当 source 更新后，SOP 应能被识别为待更新对象

必要时补充主题说明、适用场景、前置条件和维护要求。

**预期结果：** 产出的 SOP 结构完整、可执行、可追溯，并具备后续维护基础。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认唯一 Vault 路径
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等目录
- [ ] 已完成 `graph.json`、`app.json`、`appearance.json` 的配置或合并
- [ ] 已为目标 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 `SessionStart` 的 SOP 自动检查逻辑
- [ ] 已定义并使用 source 状态：`raw`、`processed`、`sop-ready`、`synthesized`、`archived`
- [ ] 已配置 `sop-priority: high` 的优先规则
- [ ] 已验证至少一个客户端可以生成或提示生成 SOP
- [ ] 已完成 SOP 与 source 的回链和质量检查

## 常见问题

### Q1：哪些客户端支持自动检查 SOP？
A：根据来源信息，Claude Code 支持通过 `hooks.json` 在 `SessionStart` 自动检查 SOP 候选；Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 主要依赖 skills 手动触发。

### Q2：什么样的 source 应该标记为 sop-ready？
A：凡是包含分步骤操作流程、可复用执行方法、最佳实践或经验总结的资料，都应标记为 `status: sop-ready`。如果复用价值高，可同时添加 `sop-priority: high`。

### Q3：什么时候应该提示生成 SOP？
A：当同主题 `sop-ready` 资料达到 3 篇及以上、资料被标记为 `sop-priority: high`、或 sources 已更新而现有 SOP 已过期时，应提示生成或更新 SOP。

### Q4：如果某个客户端不支持 hooks，该怎么办？
A：保留 `skills/wiki-sop/SKILL.md` 作为统一能力入口，在该客户端中手动输入触发指令，例如“整理SOP”或指定主题生成 SOP。

### Q5：为什么需要创建 Junction 链接而不是复制多份 skills？
A：使用 Junction 可以让多个 AI 客户端共享同一份配置和知识结构，避免多处重复维护、版本不一致和更新遗漏。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]