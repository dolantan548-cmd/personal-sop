---
type: sop
category: workflow
status: active
created: 2026-05-15
updated: 2026-05-15
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
本 SOP 用于标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制的流程。执行完成后，应能实现：

- AI 自动记笔记
- 知识自动分类整理
- Source 到 SOP 的标准流转
- 多 AI 客户端复用同一套知识能力
- SOP 的自动提示生成与持续更新

## 2. 适用场景
- 需要在 Windows 上初始化 claude-obsidian 知识库
- 希望将 AI 对话、文档或经验沉淀为结构化知识
- 希望自动识别可 SOP 化的资料并生成标准流程文档
- 需要在多个 AI 客户端共享同一套知识与 SOP 能力

## 3. 前置条件
- Windows 环境
- 已安装 Git
- 可使用 PowerShell
- 已确定 vault 存放路径
- 可访问目标 AI 客户端的本地配置目录
- 如需自动触发，优先使用支持 hooks 的 Claude Code

## 4. 标准操作步骤

### 步骤 1：克隆仓库并确认 Vault 根目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

检查克隆后的目录结构，确认该目录就是最终使用的 vault 根目录。如存在额外嵌套目录，先完成整理。

**预期结果：** 本地已存在可用的 claude-obsidian 项目目录，且 vault 路径明确。

### 步骤 2：创建标准目录结构
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

**预期结果：** 必需目录全部存在，后续 AI 与 Obsidian 能按统一结构工作。

### 步骤 3：写入基础 Obsidian 配置
在 `.obsidian` 目录下至少创建以下配置文件：

- `.obsidian/graph.json`：设置知识图谱颜色分组，建议 `sop` 使用黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

如果已有团队模板，直接复用模板配置。

**预期结果：** Obsidian 打开 vault 后图谱、显示和排除规则正常生效。

### 步骤 4：为多 AI 客户端创建 skills 链接
根据实际使用的客户端，将项目 skills 目录链接到对应的客户端 skills 目录。示例：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

示例命令：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

若父目录不存在，先创建父目录。

**预期结果：** 各 AI 客户端能够读取同一套 claude-obsidian skills。

### 步骤 5：创建 SOP 专用 skill
在项目中创建：

```text
skills/wiki-sop/SKILL.md
```

该文件需定义以下能力：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按主题生成 SOP
- 更新模式：source 更新后提示更新 SOP
- 质量检查模式：检查步骤可执行性、清单完整性、来源回链完整性

建议补充 SOP 输出路径、命名规则、文档结构模板。

**预期结果：** 项目具备统一的 SOP 生成与维护规则入口。

### 步骤 6：配置 hooks 自动检查 SOP 触发机制
在支持 hooks 的客户端中，修改 `hooks/hooks.json`，在 `SessionStart` 中加入 SOP 自动检查逻辑：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如工具支持，也可增加 PostToolUse 自动提交等动作。

**预期结果：** 每次会话开始时，系统自动判断是否需要创建或更新 SOP。

### 步骤 7：建立 source 状态流转规范
统一采用以下状态流转：

```text
ingest → raw → processed → archived
              │
              └─→ sop-ready → synthesized
```

自动标记规则：

- 含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

建议 source frontmatter 包含：

- `status`
- `topic`
- `updated`
- `sop-priority`

**预期结果：** Source 的 SOP 候选状态明确，便于 AI 自动识别。

### 步骤 8：执行知识采集、整理与查询验证
完成以下验证：

- 使用 `ingest` 导入资料
- 检查是否自动分类到 `concepts`、`entities`、`sources`
- 运行 `lint the wiki`
- 使用 `query:` 测试知识检索
- 新增若干 `status: sop-ready` 的 source 用于测试 SOP 检查

**预期结果：** 知识库原生能力正常，SOP 候选资料可被识别。

### 步骤 9：触发 SOP 生成或更新
按客户端能力执行：

- Claude Code：依赖 hooks 自动提示
- Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf：手动输入“整理SOP”或指定主题生成

生成或更新的 SOP 应统一放在：

```text
wiki/sop/
```

内容至少包含：

- 标题
- 适用场景
- 前置条件
- 步骤
- 检查清单
- FAQ
- 来源回链

**预期结果：** `wiki/sop/` 下已有结构完整、可执行的 SOP 文档。

### 步骤 10：进行 SOP 质量检查与持续维护
对 SOP 执行以下检查：

- 每一步都可直接执行
- 无模糊或空泛表述
- 包含可复核的检查清单
- 包含来源回链
- Source 更新后可触发 SOP 更新

应将 SOP 视为 source 的综合沉淀结果，持续迭代维护，而不是一次性产物。

**预期结果：** SOP 长期可用、可追溯、可更新。

## 5. 检查清单
- [ ] 已克隆仓库并确认 vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已创建至少一个 AI 客户端的 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 hooks 自动检查逻辑（如适用）
- [ ] 已启用 source 状态流转规范
- [ ] 已验证 ingest、分类、lint、query 功能
- [ ] 已生成或更新至少一个 SOP
- [ ] 已完成 SOP 质量检查

## 6. 最佳实践
- 优先统一 vault 路径，避免多客户端各自维护副本
- 使用 `status` 与 `sop-priority` 作为 SOP 自动化判断依据
- 当同主题 source 数量达到 3 个以上时，再优先综合为 SOP，可减少碎片化流程
- 对高价值经验总结直接标记 `sop-priority: high`
- 定期执行 `lint the wiki`，防止 source、concept、SOP 之间失联
- SOP 输出必须保留来源回链，确保可审计与可复查

## 7. FAQ

### Q1：项目是否原生支持 AI 自动记笔记？
支持，可通过 `ingest` 完成自动记笔记与初步整理。

### Q2：SOP 会自动生成吗？
需要额外配置 skill 和触发机制，尤其是 hooks 逻辑；并非完全零配置开箱即用。

### Q3：哪些客户端支持自动 SOP 检查？
Claude Code 支持 hooks，可自动检查；其他客户端通常需要手动触发。

### Q4：什么样的资料应该标记为 `sop-ready`？
包含明确步骤、可重复执行、具有复用价值的流程资料，应标记为 `sop-ready`。

### Q5：什么情况下需要更新 SOP？
当 source 更新更完整，或同主题新增资料影响已有流程时，应更新 SOP。

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]