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

# SOP: Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
本 SOP 用于标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制，确保知识沉淀、流程复用与跨客户端引用的一致性。

## 2. 适用场景
- 需要在 Windows 上初始化 claude-obsidian 知识库
- 需要让 AI 自动写入笔记、分类整理并支持后续 SOP 生成
- 需要为 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 配置统一 skills 引用
- 需要建立 source 到 SOP 的标准流转机制
- 需要在 Claude Code 中启用 SessionStart 自动检查 SOP 机会

## 3. 前置条件
- Windows 环境
- 已安装 Git
- 可使用 PowerShell
- 可访问 claude-obsidian 仓库
- 已确定知识库根目录路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 目标 AI 客户端已安装（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf）
- 对 Obsidian Vault 目录结构有基本了解

## 4. 操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录
在 PowerShell 中进入目标目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如克隆后出现嵌套目录，整理为单一 Vault 根目录，并记录：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地存在可访问的 claude-obsidian 根目录，且已明确后续统一使用的 `$VAULT` 路径。

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

**预期结果：** Vault 中已包含 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等标准目录。

### 步骤 3：写入 Obsidian 基础配置
补齐或更新以下配置文件：

1. `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 分类设为黄色。
2. `.obsidian/app.json`：排除 AI 工作文件或不希望被干扰的目录/文件。
3. `.obsidian/appearance.json`：启用 CSS snippets。

如团队已有标准模板，应优先使用团队统一版本。

**预期结果：** Obsidian 可以正常识别 Vault，且图谱、界面、排除规则已满足知识库与 SOP 维护需求。

### 步骤 4：为多 AI 客户端创建 skills 链接
通过 Junction 将项目能力链接到各客户端：

```powershell
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target "$VAULT"
```

对于 Cursor 与 Windsurf，按其本地 skills 目录创建 Junction，例如：
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

如果父目录不存在，先创建父目录再执行 Junction。

**预期结果：** 多个 AI 客户端均可通过各自 skills 目录访问同一份 claude-obsidian 能力与 Vault 内容。

### 步骤 5：创建 SOP 技能说明文件
创建 `skills/wiki-sop/SKILL.md`，至少定义以下模式：

- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题后生成 SOP
- 更新模式：当 source 更新且比已有 SOP 更新时提示刷新 SOP
- 质量检查模式：验证步骤可执行性、检查清单完整性、来源回链完整性

建议统一 SOP 结构为：标题、适用场景、前置条件、步骤、检查清单、FAQ、相关来源。

**预期结果：** 项目内已存在可复用的 SOP 技能定义，AI 客户端可以依据该技能执行自动检查、生成与更新 SOP。

### 步骤 6：配置 Hooks 自动检查逻辑
修改 `hooks/hooks.json`，在 `SessionStart` 中加入 SOP 自动检查规则：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 ≥ 3 时，提示生成 SOP
- `sop-priority: high` 时，提示优先生成 SOP
- sources 更新时间晚于现有 SOP 时，提示更新 SOP

如使用 Claude Code，可结合 `PostToolUse` 增强自动维护；其他客户端通常保留手动触发方案。

**预期结果：** 在支持 hooks 的客户端中，启动会话后会自动检查 SOP 生成或更新机会。

### 步骤 7：建立 Source 状态流转规则
统一采用以下生命周期：

```text
ingest → raw → processed → archived
              │
              └─→ sop-ready → synthesized
```

自动标记规则：
- 包含明确分步骤操作流程：`status: sop-ready`
- 包含最佳实践或经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料、不可执行资料：`status: processed`

确保每份 source 在 frontmatter 或等效元数据中体现状态。

**预期结果：** 知识库中的 sources 具备统一状态标记，AI 能据此识别哪些内容适合沉淀为 SOP。

### 步骤 8：验证各客户端的触发方式
按客户端差异验证：

- **Claude Code**：验证 `SessionStart` 是否自动检查 SOP，验证 hooks 是否生效
- **Kimi Code**：通过手动指令如“整理SOP”测试 skills 是否可调用
- **Codex CLI**：手动触发 SOP 整理或生成任务
- **Gemini CLI**：手动调用相关 skills 验证
- **Cursor / Windsurf**：确认是否能访问 skills，并通过手动提示测试

记录每个客户端的支持状态。

**预期结果：** 已明确每个客户端是自动检查还是手动触发，并完成至少一次成功测试。

### 步骤 9：执行首次知识导入与 SOP 生成测试
执行完整链路测试：

1. 使用 `ingest` 写入资料
2. 确认资料被分类到 `concepts`、`entities`、`sources` 等目录
3. 手动或自动将符合条件的 source 标记为 `sop-ready`
4. 触发 SOP 检查机制
5. 生成一份测试 SOP 到 `wiki/sop/`
6. 检查 SOP 是否包含可执行步骤、检查清单和来源回链
7. 必要时执行 `lint the wiki`

**预期结果：** 知识从导入、分类、标记到 SOP 生成的完整流程跑通，`wiki/sop/` 中成功生成至少一份可用 SOP。

## 5. 检查清单
- [ ] 已克隆 claude-obsidian 仓库并确认 Vault 根目录
- [ ] 已创建 `.obsidian`、`.raw`、`wiki`、`_templates` 等标准目录
- [ ] 已配置 `graph.json`、`app.json`、`appearance.json`
- [ ] 已为所需 AI 客户端创建 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SessionStart 的 SOP 检查逻辑
- [ ] 已定义并使用 source 状态流转：`raw`、`processed`、`sop-ready`、`synthesized`、`archived`
- [ ] 已完成至少一个支持 hooks 的客户端验证
- [ ] 已完成至少一个不支持 hooks 的客户端手动触发验证
- [ ] 已成功生成并检查一份测试 SOP

## 6. 最佳实践
- 优先使用统一的 Vault 根目录，避免多客户端各自维护副本
- 让 `wiki/sources/` 的元数据规范化，确保自动扫描有效
- 将高价值经验尽早标记为 `sop-ready`，避免只沉淀为零散笔记
- 生成 SOP 后保留来源回链，便于后续追溯与更新
- 定期运行维护动作，如 `lint the wiki`，确保结构整洁
- 不要假设所有客户端都支持 hooks；应分别设计自动与手动触发路径

## 7. 常见问题（FAQ）

**Q1：为什么只有 Claude Code 能自动检查 SOP，而其他客户端不能？**  
A：因为来源显示 Claude Code 支持 `hooks.json`，可在 `SessionStart` 自动执行检查逻辑；Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 主要是支持 skills 链接，通常需要手动触发。

**Q2：什么样的 source 应该标记为 `sop-ready`？**  
A：凡是包含明确步骤、可重复执行的方法、最佳实践总结或经验沉淀的资料，都应标记为 `sop-ready`；若优先级高，可再加 `sop-priority: high`。纯参考资料一般保留为 `processed`。

**Q3：什么时候应该生成新的 SOP，而不是继续积累 sources？**  
A：当同主题资料达到 3 份及以上、某条资料标记了 `sop-priority: high`、或团队已明确需要复用该流程时，就应生成 SOP。

**Q4：如果 source 更新了，已有 SOP 需要怎么处理？**  
A：应通过 hooks 或手动检查 sources 与 SOP 的更新时间。如果 source 比 SOP 更新，应提示并执行 SOP 更新，避免流程文档过期。

**Q5：skills 链接是指向整个 Vault 还是某个子目录？**  
A：根据来源中的示例，skills 链接目标统一指向 claude-obsidian 项目根目录，从而让客户端访问其中的 skills、hooks、wiki 等完整结构。

**Q6：如果 Junction 创建失败怎么办？**  
A：先确认父目录存在、PowerShell 权限足够、目标路径正确且未被占用；必要时删除已有同名错误链接后重新创建。

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]