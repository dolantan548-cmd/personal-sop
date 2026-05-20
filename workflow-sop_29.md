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

## 目的
规范在 Windows 环境中部署 claude-obsidian 知识库、建立多 AI 客户端 skills 链接，并配置 SOP 自动检查与生成机制，确保知识沉淀、流程复用与跨工具引用的一致性。

## 适用场景
- 需要在 Windows 上搭建本地知识库并接入 AI 自动记笔记
- 需要将零散资料自动整理为 concepts/entities/sources/sop 结构
- 需要为 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等工具共享同一套 skills
- 需要建立 source 到 SOP 的自动流转与更新提醒机制
- 需要让 AI 在会话开始时自动检查可生成或需更新的 SOP

## 前置条件
- Windows 环境，支持 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 项目仓库
- 具备本地文件夹创建与 Junction 链接权限
- 已安装至少一个 AI 客户端（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf）
- 明确知识库目标路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`

## 标准步骤

### 步骤 1：克隆项目并确定 Vault 路径
打开 PowerShell，进入目标父目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如仓库解压或克隆后存在嵌套目录，整理为统一 Vault 根目录，并记录路径到变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且 Vault 路径已明确。

### 步骤 2：创建标准目录结构
在 Vault 下创建标准目录：

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

**预期结果：** Vault 内已具备 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等标准目录。

### 步骤 3：写入基础 Obsidian 配置
在 `.obsidian` 下补充基础配置文件，至少包括：

1. `graph.json`：配置知识图谱颜色分组，并为 `sop` 设置醒目标识（如黄色）
2. `app.json`：排除 AI 工作文件，避免无关内容污染视图或索引
3. `appearance.json`：启用 CSS snippets，便于后续样式统一

如项目已有模板配置，优先沿用仓库默认值；如无，则按上述目标补齐。

**预期结果：** Obsidian 打开 Vault 后可正常识别知识图谱分组、隐藏不必要工作文件，并启用样式片段机制。

### 步骤 4：建立多 AI 客户端 skills 链接
将项目 skills 目录通过 Junction 链接到各 AI 客户端的 skills 目录，确保多个工具复用同一套能力定义。

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target "$VAULT\skills"
```

对于 Cursor、Windsurf，在各自工作区或用户目录下的 `.cursor/skills/`、`.windsurf/skills/` 中建立同类 Junction。若父目录不存在，先创建父目录后再执行链接。

**预期结果：** 目标 AI 客户端均能读取同一份 claude-obsidian skills 配置，减少重复维护。

### 步骤 5：创建 wiki-sop Skill 定义
在 `skills/wiki-sop/` 下创建 `SKILL.md`，定义 SOP 相关工作模式。内容至少覆盖以下四类能力：

- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题后生成 SOP
- 更新模式：当 sources 比现有 SOP 更新时提示维护
- 质量检查：检查步骤可执行性、检查清单完整性、来源回链完整性

该 Skill 应明确输入、触发条件、输出格式和更新规则，便于各 AI 客户端一致调用。

**预期结果：** `skills/wiki-sop/SKILL.md` 已存在，且能描述 SOP 生成、更新与质检逻辑。

### 步骤 6：配置 Hooks 自动检查机制
修改 `hooks/hooks.json`，在 `SessionStart` 钩子中加入 SOP 自动检查规则。核心逻辑如下：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持更多 hook（如 PostToolUse），可额外配置自动提交或同步逻辑。但应以 `SessionStart` 自动巡检为最低标准。

**预期结果：** 支持 hooks 的客户端在新会话开始时，会自动检查 SOP 候选资料并给出生成或更新提示。

### 步骤 7：标准化 Source 状态流转规则
统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 包含分步骤操作流程的资料：标记 `status: sop-ready`
- 最佳实践或经验总结：标记 `status: sop-ready` 且 `sop-priority: high`
- 纯参考资料：标记 `status: processed`

建议将这些规则写入 source 模板或 ingest 后处理流程，避免人工判断标准不一致。

**预期结果：** 新增资料可按统一状态分类，SOP 候选内容能被稳定识别。

### 步骤 8：执行知识摄入与分类验证
使用项目原生能力进行知识摄入，并确认资料被正确归档到 `concepts`、`entities`、`sources``。可结合以下能力：

- `ingest`：导入资料并生成初始笔记
- 分类整理：自动分配到 `concepts/entities/sources`
- `lint the wiki`：执行定期维护检查
- `query:`：验证知识库是否可查询

导入后，抽样检查 source 文件是否包含状态字段，并确认具备流程性的内容已被标记为 `sop-ready`。

**预期结果：** 知识库已能完成导入、分类、维护与查询，且 SOP 候选资料可被识别。

### 步骤 9：按客户端能力启用自动或手动 SOP 生成
根据客户端支持差异选择使用方式：

- **Claude Code**：支持 `hooks.json`，可在 `SessionStart` 自动检查 SOP 候选；如支持 PostToolUse，可附加自动 commit
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常支持 skills，但不支持自动 hooks，需要手动触发，例如输入“整理SOP”或指定主题生成 SOP

统一要求：无论自动还是手动，最终 SOP 应保存到 `wiki/sop/`，并包含可执行步骤、检查清单、FAQ、来源回链。

**预期结果：** 所选 AI 客户端已能按其能力边界触发 SOP 生成或更新。

### 步骤 10：验证 SOP 生成与更新闭环
创建或挑选至少 3 份同主题且已标记 `status: sop-ready` 的 source，或给单条高价值资料设置 `sop-priority: high`，然后触发检查机制。验证以下结果：

1. 系统能提示生成 SOP
2. 生成的 SOP 存储在 `wiki/sop/`
3. 当 source 内容更新后，系统能提示 SOP 需更新
4. SOP 内容包含步骤、检查清单、FAQ 和来源引用

若任一项缺失，回到 Skill 或 Hook 配置处修正。

**预期结果：** SOP 从候选识别、生成、存储到后续更新提醒的闭环已验证通过。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 路径
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已写入 `graph.json`、`app.json`、`appearance.json` 等基础配置
- [ ] 已为至少一个 AI 客户端创建指向项目 skills 的 Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中配置 `SessionStart` 的 SOP AUTO-CHECK
- [ ] 已定义并采用 source 状态流转规则
- [ ] 已验证 `ingest`、分类、`lint the wiki`、`query:` 等基础能力可用
- [ ] 已根据客户端差异配置自动或手动 SOP 触发方式
- [ ] 已验证 SOP 的生成、落盘与更新提醒闭环

## 最佳实践
- 优先使用统一 Vault 路径，避免不同客户端引用不同知识库副本
- 将 SOP 候选识别规则前置到 source 处理流程，减少后续手工筛选成本
- 对高价值经验类资料统一添加 `sop-priority: high`
- 统一将 SOP 输出到 `wiki/sop/`，并保留来源回链
- 在支持 hooks 的环境优先启用自动检查，在不支持 hooks 的环境提供清晰的手动触发口令
- 定期执行 `lint the wiki`，确保分类、链接和状态字段不漂移

## FAQ

### 1. 为什么有些客户端不会自动检查或生成 SOP？
因为并非所有客户端都支持 hooks。来源中明确指出 Claude Code 支持 hooks.json，可在 SessionStart 自动检查；Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 通常需要依赖 skills 手动触发。

### 2. 什么样的 source 应该标记为 sop-ready？
凡是包含分步骤操作流程、可复用执行方法、最佳实践或经验总结的资料，都应标记为 `status: sop-ready`。其中高价值内容建议再增加 `sop-priority: high`。

### 3. 触发生成 SOP 的最低条件是什么？
可采用三类触发条件：同主题 `sop-ready` source 数量达到 3 篇及以上；单篇资料具有 `sop-priority: high`；source 内容比现有 SOP 更新，需要触发维护。

### 4. 如果 Junction 创建失败怎么办？
先确认父目录存在，再以具备权限的 PowerShell 执行命令；同时检查目标路径和源路径是否正确。必要时手动创建 `.kimi/skills`、`.claude/skills` 等父目录后重试。

### 5. SOP 最终应该保存在哪里？
统一保存到 Vault 的 `wiki/sop/` 目录，便于知识图谱分类、跨工具引用和后续维护。

### 6. 如何判断 SOP 需要更新？
当相关 source 的更新时间晚于现有 SOP，或新增了高价值 `sop-ready` 资料时，应提示更新 SOP，以保证内容与来源同步。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]