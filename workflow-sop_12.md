---
type: sop
category: workflow
status: active
created: 2026-05-16
updated: 2026-05-16
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
规范在 Windows 环境中部署 claude-obsidian 知识库、建立多 AI 客户端 skills 链接，并配置 SOP 自动检查与生成机制，确保知识沉淀、流程复用和跨工具引用的一致性。

## 适用场景
- 需要在 Windows 本地部署 claude-obsidian 知识库
- 希望将 AI 生成的笔记自动整理为结构化知识
- 需要把可复用操作经验转化为 SOP
- 希望在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套知识库
- 需要建立 SOP 自动检查、提示生成和更新机制

## 前置条件
- Windows 环境，且可使用 PowerShell
- 已安装 Git
- 具有本地目录读写权限
- 明确知识库存放路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个支持 skills 的 AI 客户端，如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf
- 了解目标仓库地址：`https://github.com/AgriciDaniel/claude-obsidian.git`

## 标准操作步骤

### 1. 克隆仓库并确认知识库存放路径
打开 PowerShell，进入目标父目录后执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后存在多层嵌套目录，整理为统一根目录，例如：
`D:\dolan_env\temp\project\personal\claude-obsidian`

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且路径清晰、无多余嵌套。

### 2. 创建 Vault 所需目录结构
在 PowerShell 中定义 Vault 路径并创建标准目录：

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

**预期结果：** Vault 内已具备标准目录结构，满足知识导入、分类和 SOP 存放需求。

### 3. 写入基础 Obsidian 配置
在 Vault 中补充或更新以下配置文件：

1. `.obsidian/graph.json`：配置知识图谱分组颜色，建议将 `sop` 设为黄色。
2. `.obsidian/app.json`：排除 AI 工作文件，减少干扰。
3. `.obsidian/appearance.json`：启用 CSS snippets。

如已有配置，优先合并，不要直接破坏原有设置。

**预期结果：** Obsidian 可正确显示知识图谱分组、隐藏无关工作文件并启用样式片段。

### 4. 为多 AI 客户端创建 skills 链接
根据实际使用的工具，在其 skills 目录中创建指向 Vault 的 Junction 链接。示例：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/claude-obsidian`
- Windsurf：`.windsurf/skills/claude-obsidian`

PowerShell 示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT"
```

对其他客户端按实际路径重复执行。

**预期结果：** 所需 AI 客户端均能访问同一知识库与 skills 结构。

### 5. 建立 SOP 专用 skill
创建文件：`skills/wiki-sop/SKILL.md`

该 skill 至少应定义以下能力：
- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按用户指定主题生成 SOP
- 更新模式：当 sources 更新时提示更新 SOP
- 质量检查：校验步骤可执行性、检查清单、来源回链完整性

建议写清：输入格式、输出目录、触发条件、命名规范。

**预期结果：** 项目中已存在可复用的 SOP 生成 skill，AI 客户端可按统一规则调用。

### 6. 配置 hooks 自动检查 SOP 条件
修改或创建 `hooks/hooks.json`，在 `SessionStart` 中加入 SOP 自动检查逻辑。核心规则：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 `≥ 3` 时，提示生成 SOP
- 若存在 `sop-priority: high`，优先提示生成 SOP
- 若 source 更新时间晚于对应 SOP，提示更新 SOP

**预期结果：** 支持 hooks 的客户端可在会话启动时自动发现待生成或待更新的 SOP。

### 7. 统一 Source 状态流转规则
标准状态流转如下：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 含明确分步骤操作流程：`status: sop-ready`
- 含最佳实践或经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

要求在 ingest 后或整理阶段补充 frontmatter，保证后续自动筛选准确。

**预期结果：** source 文档状态统一、可检索，SOP 触发条件明确。

### 8. 按客户端能力选择自动或手动触发方式
根据工具能力实施：

- **Claude Code**：支持 hooks，可在 `SessionStart` 自动检查 SOP；如已配置，也可在 `PostToolUse` 自动提交。
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常不支持 hooks，仅支持 skills，需要手动输入如“整理SOP”进行触发。

团队内应明确每种工具的调用方式，避免误以为所有客户端都支持自动运行。

**预期结果：** 每个客户端都有清晰、可执行的 SOP 触发流程。

### 9. 执行知识导入、整理与 SOP 生成
建议的日常流程：

1. 使用 `ingest` 导入资料
2. 检查分类结果是否进入 `concepts`、`entities`、`sources`
3. 校正 source 的 `status` 和 `sop-priority`
4. 使用 `query:` 查询同主题资料是否满足 SOP 条件
5. 调用 `wiki-sop` skill 自动或手动生成 SOP，输出到 `wiki/sop/`
6. 使用 `lint the wiki` 维护一致性

**预期结果：** 新知识被持续沉淀，可复用流程被稳定转化为 SOP。

### 10. 审核生成结果并持续更新 SOP
生成后重点检查：
- 步骤是否可直接执行
- 是否包含明确前置条件
- 是否有检查清单
- 是否具备来源回链
- source 更新后是否已同步更新 SOP

若 source 更新，应优先更新既有 SOP，而不是重复新建多个版本。

**预期结果：** SOP 长期保持可执行、可追溯、可维护。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库到本地 Windows 目录
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已为所用 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SOP 自动检查逻辑
- [ ] 已统一 source 状态流转与标记规则
- [ ] 已明确不同客户端的自动/手动触发方式
- [ ] 已完成一次完整的 ingest、整理、SOP 生成与检查
- [ ] 已验证 source 更新后可以提示 SOP 更新

## 最佳实践
- 使用统一 Vault 路径，避免多客户端引用不同目录
- 所有可复用流程资料统一使用 frontmatter 状态字段标记
- 将 SOP 文档集中保存在 `wiki/sop/` 中，便于维护与检索
- 同主题 source 达到一定数量时再综合生成 SOP，减少碎片化
- 对高价值经验类资料设置 `sop-priority: high`
- 任何 source 更新后优先更新已有 SOP，避免文档分叉
- 定期执行 `lint the wiki` 保持结构一致

## 常见问题 FAQ

**Q1：为什么 SOP 不会自动生成？**  
A：通常是因为客户端不支持 hooks、source 未标记为 `status: sop-ready`、同主题资料不足，或 `hooks.json` 未正确配置。

**Q2：哪些客户端支持自动检查 SOP？**  
A：来源资料显示 Claude Code 支持通过 hooks 自动检查；其他客户端通常只能手动触发 skill。

**Q3：什么时候应把 source 标记为 `sop-ready`？**  
A：当资料中包含明确步骤流程，或沉淀出可复用最佳实践时，就应标记为 `sop-ready`；高价值资料再加 `sop-priority: high`。

**Q4：source 更新后该怎么处理？**  
A：应更新原有 SOP，而不是重复新建。可通过比较 source 与 SOP 时间戳来触发更新模式。

**Q5：skills 链接的核心价值是什么？**  
A：让多个 AI 客户端共享同一知识库与技能目录，避免重复维护和内容不一致。

**Q6：知识库维护常用命令有哪些？**  
A：`ingest` 用于导入资料，`query:` 用于知识查询，`lint the wiki` 用于定期维护。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]