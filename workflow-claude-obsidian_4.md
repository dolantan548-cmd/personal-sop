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
用于在 Windows 环境中完成 claude-obsidian 知识库部署、启用知识整理与 SOP 自动检查机制，并将同一套 skills 能力链接到多个 AI 客户端，以支持统一的知识沉淀与 SOP 引用流程。

## 适用场景
- 需要在 Windows 上部署 claude-obsidian 知识库
- 需要让 AI 自动写入笔记并按 concepts/entities/sources 分类整理
- 需要基于来源笔记自动识别可 SOP 化内容并提示生成或更新 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 中复用同一套 skills
- 需要建立 source 到 SOP 的标准状态流转机制

## 前置条件
- Windows 环境，具备 PowerShell
- 已安装 Git，并可访问 claude-obsidian 仓库
- 本地已确定知识库目录，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 具备各 AI 客户端本地配置目录的写权限
- 了解基础目录结构与 Obsidian vault 用法
- 若需自动钩子能力，优先使用支持 hooks 的 Claude Code

## 标准步骤

### 步骤 1：克隆 claude-obsidian 仓库并确认 Vault 根目录
在 PowerShell 中进入目标父目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后出现多层嵌套目录，手动整理，确保 Vault 根目录就是后续配置路径，例如：

`D:\dolan_env\temp\project\personal\claude-obsidian`

**预期结果：** 本地已存在可用的 claude-obsidian 目录，并明确唯一的 Vault 根路径。

### 步骤 2：创建标准 Vault 目录结构
设置 Vault 变量，并创建基础目录：

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

**预期结果：** Vault 内存在标准目录结构，可承载原始资料、知识整理和 SOP 文档。

### 步骤 3：写入 Obsidian 基础配置
在 `.obsidian` 目录中准备以下配置文件：

1. `.obsidian/graph.json`：配置知识图谱颜色分组，其中 `sop` 建议标为黄色。
2. `.obsidian/app.json`：排除 AI 工作文件。
3. `.obsidian/appearance.json`：启用 CSS snippets。

如团队已有统一模板，直接复用；否则至少保证这些配置文件已建立并可被 Obsidian 正常识别。

**预期结果：** Obsidian 可正常打开 Vault，并识别图谱、外观及排除规则。

### 步骤 4：建立多 AI 客户端 skills 链接
通过 Windows Junction 把同一套 skills 暴露给多个 AI 客户端。典型目标包括：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/`
- `.windsurf/skills/`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "D:\dolan_env\temp\project\personal\claude-obsidian\skills"
```

如果目标父目录不存在，先创建父目录再执行 Junction。

**预期结果：** 多个 AI 客户端可共享同一套 claude-obsidian skills。

### 步骤 5：配置 SOP 专用 skill
创建或补充 `skills/wiki-sop/SKILL.md`，至少包含以下能力：

- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查：验证步骤可执行性、检查清单和回链完整性

建议在该文件中补充统一输出路径 `wiki/sop/` 与 SOP 模板结构。

**预期结果：** AI 客户端可识别 SOP 相关技能，并按统一规则执行生成或更新。

### 步骤 6：在 hooks 中启用 SOP 自动检查逻辑
修改 `hooks/hooks.json`，在 `SessionStart` 中加入 SOP 自动检查规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持更多钩子，可加入自动提交等附加动作；若不支持 hooks，则保留 skill 并改为手动触发。

**预期结果：** 支持 hooks 的客户端可在会话开始时自动发现待生成或待更新的 SOP。

### 步骤 7：建立 Source 状态流转规范
统一 source 生命周期：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

推荐规则：
- 包含分步骤操作流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`
- 汇总进正式 SOP 后：`status: synthesized`
- 过时资料：`status: archived`

**预期结果：** AI 能稳定识别哪些 source 应进入 SOP 流程，哪些仅保留为知识资料。

### 步骤 8：按客户端能力执行 SOP 生成与维护
按客户端差异使用：

- **Claude Code**：支持 hooks，可自动检查 SOP 候选
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常需手动触发，如输入“整理SOP”

推荐统一流程：
1. ingest 来源资料
2. 整理并标注 source 状态
3. 触发 SOP 检查或手动生成
4. 保存到 `wiki/sop/`
5. 校验内容完整性
6. source 更新后重新触发 SOP 更新

**预期结果：** 不同客户端都能产出结构一致的 SOP 文档。

### 步骤 9：执行质量检查并验证引用链路
对 SOP 进行最终复核，重点检查：

- 步骤是否可执行
- 是否包含 checklist
- 是否覆盖 FAQ 或常见问题
- 是否保留对相关 source 的回链
- 是否与 source 最新内容一致
- 是否能在图谱中清晰识别

**预期结果：** SOP 完整、可追溯、可维护，并可被多个 AI 客户端稳定引用。

## 检查清单
- [ ] 已克隆 claude-obsidian 仓库并确认唯一 Vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已配置 `.obsidian/graph.json`、`.obsidian/app.json`、`.obsidian/appearance.json`
- [ ] 已建立至少一个 AI 客户端的 skills 链接
- [ ] 已创建或补全 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查规则
- [ ] 已定义并启用 source 状态流转规范
- [ ] 已验证自动或手动 SOP 触发流程可用
- [ ] 已将 SOP 保存到 `wiki/sop/`
- [ ] 已完成质量检查与来源回链校验

## 最佳实践
- 优先将 SOP 候选来源统一标记为 `sop-ready`，避免依赖临时记忆
- 对高价值经验直接加 `sop-priority: high`，提高沉淀效率
- 使用同一套 skills Junction，减少多客户端重复配置
- 在 Claude Code 中优先启用 hooks，提高自动化程度
- 每次 source 更新后，检查是否需要同步更新对应 SOP
- 避免将纯参考资料误标为 SOP 候选，降低噪声

## 常见问题

### 1. 为什么 Claude Code 可以自动检查 SOP，而其他客户端不行？
因为 Claude Code 支持 `hooks.json`，可以在 `SessionStart` 自动执行检查逻辑；其他客户端多数仅支持 skills，因此通常只能手动触发。

### 2. 什么时候应该把 source 标记为 `sop-ready`？
当资料中已经包含可复用的分步骤流程，或形成稳定最佳实践时，应标记为 `status: sop-ready`。

### 3. 多少份相关资料才值得生成 SOP？
推荐阈值为同主题至少 3 份 source；如果某份资料具有高价值，也可以通过 `sop-priority: high` 直接触发优先生成。

### 4. sources 更新后如何判断 SOP 要不要更新？
如果 source 的更新时间晚于 SOP，或 source 增加了关键步骤、约束条件、经验总结，则应更新 SOP。

### 5. Windows 上为什么推荐使用 Junction？
Junction 适合在 Windows 中把同一套 skills 目录映射到多个客户端，避免重复维护副本。

### 6. 纯参考资料是否要强制做成 SOP？
不需要。纯参考资料保持 `processed` 即可，只有具备执行流程和复用价值的内容才进入 SOP 沉淀。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]