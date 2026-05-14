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

## 目的
标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制，确保知识沉淀、流程复用和跨客户端引用一致可用。

## 适用场景
- 需要在 Windows 上搭建可供 AI 自动记笔记的 Obsidian 知识库
- 需要把资料自动分类到 concepts、entities、sources、sop 目录
- 需要为知识库增加 SOP 自动检查、手动生成和更新提醒机制
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套知识库 skills
- 需要将可复用的操作经验从 sources 沉淀为 SOP 文档

## 前置条件
- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定知识库根目录路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 本机已安装一个或多个 AI 客户端（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf）
- 具备创建目录、写入配置文件、创建 Junction 链接的权限
- 了解基础 Obsidian Vault 目录结构

## 标准操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录
在 PowerShell 中进入目标父目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果仓库目录存在嵌套或层级不符合你的预期，先整理目录，确保最终 Vault 根目录可统一用一个变量表示，例如：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 目录，且已明确唯一的 Vault 根路径供后续脚本与链接复用。

### 步骤 2：创建 Vault 标准目录结构
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

目录建议用途：
- `.raw`：原始输入
- `wiki/sources`：处理后的来源笔记
- `wiki/sop`：SOP 成果
- `wiki/concepts`：概念整理
- `wiki/entities`：实体整理
- `_templates`：模板文件

**预期结果：** Vault 中已具备可运行的最小标准目录结构。

### 步骤 3：写入 Obsidian 基础配置
在 Vault 中补齐以下配置文件：

1. `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 设为黄色。
2. `.obsidian/app.json`：排除 AI 工作文件，避免临时文件干扰检索。
3. `.obsidian/appearance.json`：启用 CSS snippets。

如已有文件，则在保留已有有效内容的前提下合并配置；如无，则新建文件并保证 JSON 语法正确。

**预期结果：** Obsidian 可正确识别该 Vault，图谱分组、文件排除和外观片段策略已就绪。

### 步骤 4：为多 AI 客户端创建 skills Junction 链接
根据实际安装的客户端，在对应目录创建 Junction，使不同 AI 共用同一份 skills。

常见目标路径：
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

对其他客户端按相同模式替换路径。若父目录不存在，先创建父目录。

**预期结果：** 已安装的 AI 客户端都能通过各自 skills 目录访问同一份 claude-obsidian 技能配置。

### 步骤 5：创建 wiki-sop 技能定义
在 `skills/wiki-sop/SKILL.md` 创建 SOP 技能说明，至少包括以下能力：

- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题时生成 SOP
- 更新模式：当 sources 比现有 SOP 更新时提示刷新
- 质量检查：验证步骤可执行性、检查清单完整性、回链完整性

建议在 `SKILL.md` 中明确输入输出规范：
- 输入：主题、来源集合或用户指令
- 输出：标准 SOP 文档
- 必含内容：目的、适用场景、前置条件、步骤、检查清单、FAQ、来源回链

**预期结果：** 知识库中已存在专门用于 SOP 生成与维护的 skills 定义。

### 步骤 6：配置 hooks 自动检查 SOP 机会
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入 SOP 自动检查逻辑，建议规则如下：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持其他钩子，可增加收尾动作，例如自动提交或状态同步。

**预期结果：** 支持 hooks 的客户端可在会话开始时自动判断是否有可生成或需更新的 SOP。

### 步骤 7：建立 Source 状态流转与自动标记规则
统一来源笔记状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 包含分步骤操作流程的资料：`status: sop-ready`
- 包含最佳实践或经验总结的资料：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

建议将这些字段写入 source 文档 frontmatter。

**预期结果：** sources 具备统一状态字段，AI 可准确筛选 SOP 候选资料。

### 步骤 8：执行首轮知识摄入与分类验证
使用项目原生能力完成首轮验证：

- 使用 `ingest` 命令导入资料
- 确认资料自动分类到 `concepts/`、`entities/`、`sources/`
- 使用 `query:` 命令验证知识可检索
- 使用 `lint the wiki` 检查并维护结构一致性

同时为 source 补齐或修正：
- `status`
- `sop-priority`
- 主题标签
- 必要元数据

**预期结果：** 知识已成功导入、可查询，且可被 SOP 自动机制识别。

### 步骤 9：按客户端能力启用自动或手动 SOP 生成
根据客户端支持能力执行：

- **Claude Code**：优先使用自动模式，依赖 `hooks.json` 在 SessionStart 自动检查；如支持其他钩子，可扩展自动提交流程。
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常仅支持 skills，不支持 hooks，需要手动触发，例如输入“整理SOP”或指定主题生成。

无论自动还是手动，SOP 输出都应包含：
- 目的
- 适用场景
- 前置条件
- 步骤
- 检查清单
- FAQ
- 来源回链

**预期结果：** 在至少一个 AI 客户端中成功触发 SOP 生成或更新流程。

### 步骤 10：验证 SOP 质量并建立持续维护机制
对生成后的 SOP 执行质量检查：

- 每个步骤必须可执行
- 必须包含必要命令或明确动作
- 每步必须有预期结果
- 必须包含 checklist
- 必须覆盖常见问题 FAQ
- 必须包含来源回链
- 当 sources 更新时，必须能够识别并刷新 SOP

建议将通过检查的 SOP 存放到 `wiki/sop/`，并定期执行 `lint the wiki` 与知识查询，保持内容、链接与状态一致。

**预期结果：** SOP 已正式落库，可追溯、可维护、可复用。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 根目录
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已写入或更新 `.obsidian/graph.json`、`app.json`、`appearance.json`
- [ ] 已为需要的 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SessionStart 的 SOP 自动检查规则
- [ ] 已定义 source 的 `status` 与 `sop-priority` 标记规则
- [ ] 已完成至少一次 `ingest` 并验证 sources 分类与查询有效
- [ ] 已在至少一个客户端成功触发 SOP 生成或更新
- [ ] 已将通过校验的 SOP 保存到 `wiki/sop` 并附带来源回链

## 最佳实践
- 使用统一的 `$VAULT` 变量管理路径，避免多处硬编码。
- 所有客户端尽量共用同一份 `skills`，减少维护成本。
- 优先使用 `status`、`sop-priority`、主题标签等元数据驱动自动化。
- 当同主题 source 达到 3 份以上时，及时沉淀为 SOP，避免知识分散。
- SOP 不仅要能读，更要能执行；每一步都应可验证。
- 持续比较 source 与 SOP 的更新时间，保持 SOP 新鲜度。

## 常见问题

### 为什么有些客户端不会自动检查或生成 SOP？
因为并非所有客户端都支持 hooks。根据来源信息，Claude Code 支持 `hooks.json`，可在 SessionStart 自动检查；Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 通常只支持 skills，需要手动触发。

### 什么样的 source 应该标记为 `sop-ready`？
凡是包含明确分步骤操作流程、可重复执行的经验、最佳实践总结的资料，都应标记为 `sop-ready`。如果复用价值高，额外加上 `sop-priority: high`。纯参考资料则保留为 `processed`。

### 什么时候应该新建 SOP，而不是继续积累 source？
当同主题 source 达到 3 份及以上、存在高优先级最佳实践、或用户明确要求沉淀标准流程时，应生成 SOP。

### 如果 source 更新了，如何知道 SOP 需要同步更新？
应在 hooks 或人工检查中比较 source 与对应 SOP 的更新时间。若 sources 比 SOP 更新，则提示刷新 SOP 内容。

### skills Junction 创建失败怎么办？
先确认父目录已存在，其次确认 PowerShell 具备创建 Junction 的权限，并检查目标路径是否正确指向 Vault 中的 skills 目录。必要时以管理员权限运行 PowerShell。

### SOP 生成后最重要的质量标准是什么？
最重要的是可执行性。每个步骤都必须具体、可操作，并附带预期结果；同时还要有 checklist、FAQ 和来源回链。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]