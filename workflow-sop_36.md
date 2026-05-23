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

# SOP: Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制，确保资料可被持续沉淀、整理和转化为可复用的标准操作流程。

## 适用场景
- 需要在 Windows 环境搭建可供 AI 协作的 Obsidian 知识库
- 希望将原始资料自动整理为 concepts、entities、sources、sop 等结构化内容
- 希望让 Claude Code 或其他 AI 客户端复用同一知识库
- 需要建立 SOP 自动检查、手动生成和更新提醒机制
- 需要为可复用流程资料设置统一状态流转规则

## 前置条件
- Windows 环境，且可使用 PowerShell
- 已安装 Git
- 已安装或可访问 Obsidian
- 可访问 GitHub 仓库 `https://github.com/AgriciDaniel/claude-obsidian.git`
- 本地有可写入的知识库目录，例如 `D:\dolan_env\temp\project\personal`
- 如需多客户端复用，已安装对应 AI 工具（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf）
- 具备创建目录联接（Junction）的权限

## 标准操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录
在 PowerShell 中进入目标目录并克隆仓库，随后确认最终知识库根目录（Vault）路径可用于后续统一配置。

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果仓库克隆后存在多层嵌套目录，请手动整理，确保 Vault 根目录明确，例如：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在 claude-obsidian 项目目录，且已明确唯一 Vault 根路径用于后续配置。

### 步骤 2：创建标准目录结构
在 Vault 中创建 Obsidian 配置目录、原始资料目录、知识库分类目录和模板目录，确保后续 ingest、整理和 SOP 生成有固定落点。

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

**预期结果：** Vault 中已生成 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等标准目录。

### 步骤 3：写入基础 Obsidian 配置
在 `.obsidian` 下补充基础配置文件，使图谱分组、文件显示和 CSS 片段行为适配该知识库。

至少完成以下配置：
1. `.obsidian/graph.json`：配置知识图谱颜色分组，其中 SOP 相关目录建议标记为黄色，便于识别流程资产。
2. `.obsidian/app.json`：排除 AI 工作文件，避免临时文件污染知识视图。
3. `.obsidian/appearance.json`：启用 CSS snippets，以支持可视化优化。

如果仓库已有默认配置，优先基于现有格式修改；如果没有，则创建对应 JSON 文件并保持合法 JSON 结构。

**预期结果：** Obsidian 能正确识别该 Vault，图谱、排除规则与外观片段配置已就绪。

### 步骤 4：为多 AI 客户端创建 skills 链接
将仓库中的 skills 目录通过 Junction 链接到各 AI 客户端的技能目录，使多个客户端可以复用同一套知识库操作能力和 SOP 机制。

根据实际工具执行类似命令：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target "$VAULT\skills"
```

如使用 Cursor 或 Windsurf，也可将 skills 链接到对应项目或用户目录下的 `.cursor/skills/`、`.windsurf/skills/`。

注意：若目标父目录不存在，请先创建父目录后再执行 Junction 命令。

**预期结果：** 对应 AI 客户端可读取同一套 claude-obsidian skills，后续可执行知识整理和 SOP 相关操作。

### 步骤 5：建立 SOP 专用 skill
在 `skills/wiki-sop/` 下创建 `SKILL.md`，将 SOP 相关工作标准化为单独技能。

该技能至少应覆盖以下能力：
- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题后生成 SOP
- 更新模式：当 source 更新且晚于现有 SOP 时，提示更新
- 质量检查：验证步骤是否可执行、检查清单是否完整、是否包含回链

建议在 `SKILL.md` 中明确输入、触发条件、输出位置（如 `wiki/sop/`）和生成质量要求，例如：
- SOP 必须包含前置条件、步骤、检查清单、FAQ
- SOP 必须链接来源 source
- SOP 必须可被其他 AI 客户端复用

**预期结果：** 知识库中已存在独立的 `wiki-sop` 技能说明，AI 客户端可据此执行 SOP 检查、生成和更新任务。

### 步骤 6：配置 hooks 自动检查 SOP 条件
编辑 `hooks/hooks.json`，在 `SessionStart` 钩子中加入 SOP 自动检查逻辑。建议包含以下规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如果客户端支持更多钩子（如 Claude Code 的 PostToolUse），可继续增加自动提交或整理动作。但最关键的是 `SessionStart` 的 SOP 检查，以便在会话开始时先判断是否需要生成或更新 SOP。

若某客户端不支持 hooks，则保留 skills 机制，改为人工触发。

**预期结果：** 支持 hooks 的客户端在启动会话时能自动检查 SOP 候选资料，并给出生成或更新提示。

### 步骤 7：统一 source 状态流转规则
为 `wiki/sources/` 中的资料建立统一状态机，避免 SOP 触发条件混乱。推荐使用以下流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

并按以下规则自动标记：
- 包含分步骤操作流程：标记为 `status: sop-ready`
- 属于最佳实践或经验总结：标记为 `status: sop-ready` 且 `sop-priority: high`
- 纯参考资料、不可直接操作复用：标记为 `status: processed`

执行 ingest 后，需在 source 元数据中补齐状态字段，确保后续自动扫描有统一依据。

**预期结果：** 所有 source 资料都有一致的状态定义，AI 可以准确识别哪些内容适合转化为 SOP。

### 步骤 8：执行资料导入与知识整理
使用项目原生能力完成资料导入、分类和维护：

- 使用 `ingest` 命令导入原始资料
- 将资料自动或手动整理到 `concepts`、`entities`、`sources` 等目录
- 定期执行 `lint the wiki` 以维护结构一致性
- 使用 `query:` 命令进行知识检索和交叉验证

整理过程中，应特别检查 source 是否具备流程性和复用价值，并及时补充 `status` 与 `sop-priority` 字段。

**预期结果：** 原始资料已进入知识库并完成基础结构化，source 可被后续 SOP 检查逻辑识别。

### 步骤 9：生成或更新 SOP 文档
根据触发方式执行 SOP 生成：

1. 自动触发：支持 hooks 的客户端在会话开始时发现满足条件的 source，并提示生成或更新 SOP。
2. 手动触发：在不支持 hooks 的工具中，明确发出指令，例如“整理SOP”或指定主题生成 SOP。

生成 SOP 时，应输出到 `wiki/sop/`，并保证内容至少包含：
- 适用场景
- 前置条件
- 明确步骤
- 检查清单
- FAQ
- 指向来源 source 的回链

若已有 SOP，但 source 更新日期更新或内容明显扩展，应执行更新而非重复新建。

**预期结果：** `wiki/sop/` 中已生成或更新对应主题的 SOP，且文档结构完整、可执行、可追溯来源。

### 步骤 10：验证跨客户端可用性与持续维护机制
分别在已连接的 AI 客户端中验证 skills 是否可见、Vault 路径是否正确、SOP 指令是否可执行。

验证重点包括：
- Claude Code：是否能在 SessionStart 自动检查 SOP，是否支持 hooks 工作流
- Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf：是否能手动调用 skills 执行 SOP 整理
- 各客户端是否访问同一 Vault 路径
- 新 source 加入后，是否能被正确标记为 `processed` 或 `sop-ready`

建议建立定期维护节奏，例如每周检查一次 `wiki/sources/` 与 `wiki/sop/` 的更新时间差异，及时补齐待生成或待更新 SOP。

**预期结果：** 至少一个支持 hooks 的客户端可自动提示 SOP 任务，其余客户端可手动复用同一技能链；知识库具备持续维护能力。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 根目录
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已完成 `graph.json`、`app.json`、`appearance.json` 基础配置
- [ ] 已为目标 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 `SessionStart` 的 SOP AUTO-CHECK 规则
- [ ] 已定义并执行 source 状态流转规则
- [ ] 已通过 ingest 导入资料并完成基础分类
- [ ] 已至少生成或更新一份 `wiki/sop/` 下的 SOP 文档
- [ ] 已验证至少一个客户端可用，且多客户端共享同一 Vault/skills 结构

## 最佳实践
- 优先维护单一 Vault 路径，避免多个客户端各自写入不同目录
- 将 SOP 生成条件写死在 hooks 与 skill 中，减少人工判断偏差
- 对高价值经验类资料统一加 `sop-priority: high`
- 只为可执行、可复用、可验证的流程建立 SOP，避免把纯参考资料强行 SOP 化
- SOP 必须保留回链到 source，确保可追溯和可更新
- 定期比较 source 与 SOP 的更新时间，优先更新已有 SOP，而不是重复创建新版本

## 常见问题

### 1. 这个项目是否原生支持 AI 自动记笔记和知识整理？
支持。可通过 `ingest` 导入资料，并自动整理到 `concepts`、`entities`、`sources` 等目录。

### 2. SOP 会自动生成吗？
项目具备模板和机制基础，但需要额外配置触发逻辑，例如在 `hooks/hooks.json` 中加入 `SessionStart` 自动检查规则，或通过 skills 手动触发生成。

### 3. 哪些客户端支持自动检查 SOP？
来源中明确指出 Claude Code 支持 hooks，因此可在 `SessionStart` 自动检查 SOP。Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 主要依赖 skills 手动触发。

### 4. 如果某个 AI 客户端不支持 hooks，怎么办？
继续使用 skills 方案即可。通过在该客户端中显式发出“整理SOP”或指定主题生成 SOP 的指令，仍可完成 SOP 工作流。

### 5. 什么样的 source 应标记为 `sop-ready`？
凡是包含明确分步骤操作流程的资料，或可沉淀为最佳实践、经验总结并适合复用的内容，都应标记为 `sop-ready`；高价值内容再加 `sop-priority: high`。

### 6. 何时应该更新已有 SOP，而不是新建一份？
当 source 比现有 SOP 更新、同主题资料新增较多，或已有流程发生明显变化时，应优先更新原 SOP，保持单一权威版本。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]