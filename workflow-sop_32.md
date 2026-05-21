---
type: sop
category: workflow
status: active
created: 2026-05-21
updated: 2026-05-21
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
规范在 Windows 环境中部署 claude-obsidian 知识库、建立多 AI 客户端 skills 链接，并配置 SOP 自动检查与生成机制，以实现知识沉淀、流程复用和跨客户端引用。

## 适用场景
- 需要在 Windows 上搭建可供 AI 写笔记、分类整理和查询的知识库
- 需要把零散资料自动转化为可复用的 SOP
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 访问同一套知识库能力
- 需要建立 source 到 SOP 的标准化状态流转与维护机制

## 前置条件
- Windows 环境
- 已安装 Git
- 可使用 PowerShell
- 有一个可写入的本地项目目录，例如 `D:\dolan_env\temp\project\personal`
- 已获取仓库地址：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 需要接入的 AI 客户端已在本机安装（可选）

## 标准步骤

### 步骤 1：克隆项目并确认 Vault 根目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后存在不必要的嵌套目录，先整理目录结构，确保后续所有工具都引用同一个 Vault 根目录。建议统一使用：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已成功克隆仓库，并明确唯一的 Vault 根目录。

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

**预期结果：** 标准知识库目录已创建完成。

### 步骤 3：补齐 Obsidian 基础配置
在 `.obsidian` 下建立或更新以下配置：
- `graph.json`：配置知识图谱颜色分组，建议 `sop` 为黄色
- `app.json`：排除 AI 工作文件
- `appearance.json`：启用 CSS 片段

**预期结果：** Obsidian 可正常识别图谱、文件过滤与外观设置。

### 步骤 4：建立多 AI 客户端 skills 链接
为各客户端建立到 `claude-obsidian` skills 的 Junction。目标位置包括：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/`
- `.windsurf/skills/`

使用 `New-Item -ItemType Junction` 创建链接，并确保源路径和目标父目录正确。

**预期结果：** 各客户端可共享同一套知识库能力。

### 步骤 5：创建 SOP 自动生成 skill
创建文件：`skills/wiki-sop/SKILL.md`

该 skill 至少应定义以下能力：
- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：source 更新时提示更新 SOP
- 质量检查：验证步骤可执行性、检查清单完整性、回链完整性

并明确：输入来自 `wiki/sources/`，输出写入 `wiki/sop/`。

**预期结果：** 系统具备 SOP 检查、生成和更新的统一能力说明。

### 步骤 6：配置 hooks 自动检查机制
修改 `hooks/hooks.json`，在 `SessionStart` 加入 SOP 自动检查规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如需要，也可结合 `PostToolUse` 做自动 commit，但必须符合团队版本管理规范。

**预期结果：** 支持 hooks 的客户端在会话开始时能自动发现 SOP 候选和更新需求。

### 步骤 7：建立 Source 到 SOP 的状态流转规则
统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 含分步骤操作流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

**预期结果：** source 状态清晰，系统能识别哪些资料适合合成为 SOP。

### 步骤 8：按客户端能力执行 SOP 生成策略
- **Claude Code**：支持 hooks，可自动检查 SOP 候选
- **Kimi Code**：支持 skills，需手动输入“整理SOP”等指令触发
- **Codex CLI**：支持 skills，需手动触发
- **Gemini CLI**：支持 skills，需手动触发
- **Cursor / Windsurf**：通常按 skills 方式手动调用

标准分工建议：支持 hooks 的客户端负责自动发现；其他客户端负责按需手动生成和更新。

**预期结果：** 团队对各客户端能力边界有统一认知。

### 步骤 9：验证知识库与 SOP 工作流
按以下顺序测试：
1. 使用 `ingest` 导入原始资料
2. 将资料整理到 `wiki/sources/`
3. 为资料设置正确状态
4. 准备至少 3 条同主题 `sop-ready` 资料，或设置 `sop-priority: high`
5. 在 Claude Code 中重启会话，检查自动提示
6. 在其他客户端中手动输入“整理SOP”测试 skill
7. 检查生成结果是否保存到 `wiki/sop/`
8. 检查 SOP 是否包含步骤、检查清单、FAQ 和来源回链

**预期结果：** 从资料导入到 SOP 产出的端到端流程可用。

### 步骤 10：执行持续维护
日常维护要求：
- 定期运行知识库校验，如 `lint the wiki`
- 新增资料时立即判断是否应标记为 `sop-ready`
- source 更新后检查对应 SOP 是否需要同步更新
- 保持 `wiki/sources/` 与 `wiki/sop/` 的回链完整
- 定期检查 skills 链接和 hooks 配置是否失效

**预期结果：** 知识库持续可维护，SOP 保持与资料同步。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已配置 `.obsidian/graph.json`、`.obsidian/app.json`、`.obsidian/appearance.json`
- [ ] 已为需要的 AI 客户端建立 Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中添加 SOP 自动检查逻辑
- [ ] 已统一 source 状态流转规则
- [ ] 已确认各客户端的触发方式
- [ ] 已完成一次端到端验证
- [ ] 已建立持续维护机制

## 常见问题 FAQ

### 1. 为什么 Claude Code 可以自动检查 SOP，而其他客户端不行？
因为 Claude Code 支持 `hooks.json`，可在 `SessionStart` 自动执行 SOP 检查；其他客户端多数只支持 skills，不支持 hooks，因此需要手动触发。

### 2. 什么时候应把资料标记为 `sop-ready`？
当资料中存在可复用的分步骤操作流程，或可沉淀为最佳实践时，应标记为 `sop-ready`。

### 3. 什么时候应优先生成 SOP？
当同主题 `sop-ready` 资料达到 3 条及以上，或某条资料被标记为 `sop-priority: high` 时，应优先生成。

### 4. 什么情况下要更新已有 SOP？
当 source 更新且内容新于现有 SOP 时，应触发更新，避免 SOP 失真或过期。

### 5. 纯参考资料是否也要变成 SOP？
不需要。纯参考资料应保留为 `processed`，只有具备明确操作流程和复用价值的资料才适合转为 SOP。

### 6. 多客户端接入时最常见问题是什么？
最常见的是路径配置错误、Junction 创建失败、目标父目录不存在，或错误假设所有客户端都支持 hooks 自动触发。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]