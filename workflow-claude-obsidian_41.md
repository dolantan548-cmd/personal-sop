---
type: sop
category: workflow
status: active
created: 2026-05-25
updated: 2026-05-25
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
标准化在 Windows 环境中部署 claude-obsidian 知识库、启用 SOP 自动检查与生成机制，并为多 AI 客户端建立统一引用能力，确保知识采集、整理、查询与 SOP 沉淀可持续运行。

## 适用场景
- 需要在 Windows 上初始化 claude-obsidian 知识库
- 需要让 AI 自动 ingest 笔记并按 wiki 结构分类整理
- 需要配置 SOP 自动发现、生成与更新提醒机制
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套知识库/skills
- 需要建立 source 状态流转规则，便于后续 SOP 沉淀

## 前置条件
- Windows 系统并可使用 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定 vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 具备目标 AI 客户端的本地目录访问权限
- 了解基础文件编辑操作，可创建 JSON/Markdown 配置文件

## 标准步骤

### 步骤 1：克隆仓库并确认 Vault 根目录
打开 PowerShell，进入你的项目目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如克隆后存在不必要的嵌套目录，整理为统一的 vault 根目录。后续示例统一使用：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在 claude-obsidian 仓库，且已明确唯一的 Vault 根路径。

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

**预期结果：** Vault 内已具备标准目录。

### 步骤 3：写入 Obsidian 基础配置
创建或更新以下文件：

1. `.obsidian/graph.json`：配置图谱颜色分组，建议为 `wiki/sop` 设置黄色。
2. `.obsidian/app.json`：排除 AI 工作文件或临时文件。
3. `.obsidian/appearance.json`：启用 CSS Snippets。

**预期结果：** Obsidian 能正确识别 Vault，并具备基础图谱分组、文件排除与样式扩展能力。

### 步骤 4：建立多 AI 客户端的 skills 链接
使用 Windows Junction 将 skills 链接到各客户端：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/`
- Windsurf → `.windsurf/skills/`

使用 `New-Item -ItemType Junction` 创建链接，并确认都指向同一源目录。

**预期结果：** 多个 AI 客户端均能访问同一套 claude-obsidian skills。

### 步骤 5：创建 SOP 技能说明文件
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查：步骤可执行性、检查清单、回链完整性

建议明确输入目录为 `wiki/sources/`，输出目录为 `wiki/sop/`。

**预期结果：** `skills/wiki-sop/SKILL.md` 已存在，并清楚定义 SOP 的生成、更新与校验规则。

### 步骤 6：配置 hooks 自动检查 SOP 触发机制
编辑 `hooks/hooks.json`，在 `SessionStart` 钩子中加入以下逻辑：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持其他 hooks，也可扩展自动提交或自动整理逻辑。

**预期结果：** 支持 hooks 的客户端在会话启动时能够自动检查是否存在可生成或需更新的 SOP。

### 步骤 7：落实 Source 状态流转规则
采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

标记规则：
- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** 团队对 source 的状态定义一致，AI 能识别哪些资料适合沉淀为 SOP。

### 步骤 8：按客户端能力选择自动或手动触发方式
客户端差异建议如下：

- **Claude Code**：支持 hooks，适合作为自动巡检入口
- **Kimi Code**：支持 skills，通常需手动输入“整理SOP”
- **Codex CLI**：支持 skills，通常需手动触发
- **Gemini CLI**：支持 skills，通常需手动触发
- **Cursor / Windsurf**：一般需手动触发

**预期结果：** 已根据客户端能力建立一致使用方式。

### 步骤 9：执行验证
部署后进行端到端验证：

1. 使用 `ingest` 测试自动写笔记能力。
2. 确认资料被正确归类到 `concepts`、`entities` 或 `sources`。
3. 运行或触发 `lint the wiki`。
4. 使用 `query:` 测试知识查询。
5. 准备至少 3 篇同主题且标记为 `status: sop-ready` 的 source。
6. 启动支持 hooks 的客户端，确认是否出现 SOP 提示；或手动输入“整理SOP”。
7. 更新 source 后，确认系统是否提示 SOP 更新。

**预期结果：** 知识采集、整理、查询、SOP 自动检查与更新提醒均完成验证。

### 步骤 10：建立日常维护机制
长期执行以下工作：

- 定期运行 `lint the wiki`
- 持续标记高复用流程为 `sop-ready`
- source 更新时同步更新 SOP
- 定期检查 skills 链接有效性
- 统一 SOP 模板字段与命名规范
- 保持主 Vault 为唯一事实源

**预期结果：** 系统进入可持续运行状态，SOP 能持续增长并保持可用。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认唯一 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已配置 `graph.json`、`app.json`、`appearance.json`
- [ ] 已为至少一个 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查规则
- [ ] 已定义并执行 source 状态流转规则
- [ ] 已完成一次 `ingest` 测试
- [ ] 已完成一次 `query:` 或 `lint the wiki` 测试
- [ ] 已验证 SOP 自动或手动触发成功
- [ ] 已确认 SOP 输出目录与来源回链正常

## 最佳实践
- 优先将 Claude Code 作为自动化入口，其他客户端作为补充入口。
- 仅将具备明确步骤、可重复执行的资料标为 `sop-ready`。
- 使用统一的 frontmatter 字段，避免 AI 无法识别状态。
- 所有客户端共享同一 Vault 与 skills 源，避免多份副本并行修改。
- 当 source 比 SOP 新时，优先更新 SOP，而不是重复新建。

## 常见问题

### 1. 这个项目是否原生支持 AI 自动写笔记和 SOP 生成？
AI 自动写笔记、分类整理、定期维护和知识查询属于原生支持能力；SOP 生成本身有模板和结构基础，但自动触发通常需要额外配置 skills 与 hooks。

### 2. 为什么我配置完成后，SOP 没有自动出现？
常见原因包括：
- 客户端不支持 hooks
- `hooks/hooks.json` 未生效
- source 未标记为 `status: sop-ready`
- 同主题资料不足 3 篇
- skills 链接路径错误

### 3. 哪些资料应该标记为 `sop-ready`？
包含明确分步骤操作流程、可复用工作方法、最佳实践或经验总结的资料适合标记为 `sop-ready`；纯参考资料通常仅标记为 `processed`。

### 4. 什么情况下要设置 `sop-priority: high`？
当资料描述高频、关键、稳定且值得优先沉淀的最佳实践或经验总结时，应设置该字段。

### 5. 多 AI 客户端如何避免版本分叉？
所有客户端通过 Junction 或等效链接指向同一个 Vault/skills 源，不在各客户端目录中维护独立副本。

### 6. Claude Code 与其他客户端的主要差异是什么？
Claude Code 通常支持 hooks，可自动检查 SOP；其他客户端多为 skills 手动触发。

### 7. 如果 sources 更新了，如何确保 SOP 也更新？
在 hooks 或 SOP 检查逻辑中加入“source 比 SOP 新则提示更新”的规则，并保持 source 与 SOP 的回链关系。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]