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

## 1. 目的
本 SOP 用于标准化在 Windows 环境中部署 claude-obsidian 知识库、启用 SOP 自动检查与生成机制，并通过 skills 链接为多个 AI 客户端提供统一能力，确保知识沉淀、流程复用与跨工具引用的一致性。

## 2. 适用场景
- 需要在 Windows 上搭建本地知识库并接入 AI 自动记笔记能力
- 需要将分散资料提炼为标准 SOP
- 需要多个 AI 客户端共享同一套知识与 skills
- 需要建立 source 到 SOP 的状态流转与持续维护机制

## 3. 前置条件
- Windows 系统
- 已安装 Git
- 已安装 PowerShell
- 可访问 GitHub 仓库
- 已确定 vault 根目录
- 如需多客户端接入，已安装目标 AI 客户端并具备其配置目录权限

## 4. 标准步骤

### 步骤 1：克隆仓库并确认 Vault 根目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如有嵌套目录或既有知识库整合需求，先整理为唯一的 vault 根路径：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已具备可用的 claude-obsidian 仓库目录，并明确了统一的 Vault 根路径。

### 步骤 2：创建标准目录结构
执行：

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

目录用途：
- `.raw`：原始资料
- `wiki/concepts`：概念
- `wiki/entities`：实体
- `wiki/sources`：来源资料
- `wiki/sop`：SOP 文档
- `_templates`：模板

**预期结果：** Vault 具备标准化目录结构，可支持知识整理与 SOP 生成。

### 步骤 3：初始化 Obsidian 配置文件
创建或更新以下文件：
- `.obsidian/graph.json`：配置图谱颜色分组，建议将 `sop` 显示为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 视图清晰，SOP 节点可在图谱中快速识别，临时工作文件不影响主视图。

### 步骤 4：建立多 AI 客户端 skills 链接
使用 `New-Item -ItemType Junction` 将 skills 链接到各客户端目录。目标可包括：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/`
- `.windsurf/skills/`

原则：所有客户端尽量共享同一套 skills，而不是分别复制。

**预期结果：** 多个 AI 客户端可访问同一套 skills，避免重复维护。

### 步骤 5：创建 wiki-sop 技能定义
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：
- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按用户主题生成 SOP
- 更新模式：sources 更新后提示同步 SOP
- 质量检查：验证步骤、清单与回链完整性

建议明确：输入、输出、触发条件、生成目录、更新规则。

**预期结果：** AI 能基于技能定义识别何时生成、更新与检查 SOP。

### 步骤 6：配置 Hooks 自动检查 SOP 机会
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持，可增加其他 hook 做自动提交或维护动作。

**预期结果：** 支持 hooks 的客户端在会话开始时能自动识别 SOP 生成或更新机会。

### 步骤 7：执行 Source 状态流转标准
统一采用以下流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

状态规则：
- `raw`：原始导入
- `processed`：完成初步整理
- `sop-ready`：适合提炼为 SOP
- `synthesized`：已纳入 SOP
- `archived`：归档

Auto-marking 标准：
- 分步骤流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** Sources 的状态清晰一致，AI 可据此推进 SOP 流程。

### 步骤 8：按客户端能力选择触发方式
客户端差异：
- **Claude Code**：支持 hooks，推荐作为自动化主入口
- **Kimi Code**：支持 skills，通常手动触发
- **Codex CLI**：支持 skills，通常手动触发
- **Gemini CLI**：支持 skills，通常手动触发
- **Cursor / Windsurf**：如不支持 hooks，则通过手动指令触发

建议：自动化依赖 Claude Code，其他客户端复用同一 vault 与 skills，并在需要时手动发出“整理SOP”等指令。

**预期结果：** 团队清楚不同客户端的自动化边界，不会误判功能状态。

### 步骤 9：生成并保存标准 SOP 文档
当满足规则或收到手动指令后，在 `wiki/sop/` 中生成 SOP。生成标准：
- 标题明确
- 步骤按顺序编号且可执行
- 包含检查清单
- 保留来源回链
- 若 sources 更新，则更新现有 SOP 而不是重复创建

**预期结果：** `wiki/sop/` 中存在结构统一、可执行、可追溯的 SOP 文档。

### 步骤 10：运行知识库维护与质量检查
定期维护：
- 执行 `lint the wiki`
- 检查 source 与 SOP 的双向链接
- 检查 `sop-ready` 是否长期未处理
- 检查 SOP 是否落后于最新 sources
- 检查各客户端 skills Junction 是否有效

**预期结果：** 知识库结构稳定、可查询、可追溯，SOP 与 sources 保持同步。

## 5. 检查清单
- [ ] 已克隆仓库并确认 Vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已建立至少一个 AI 客户端的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SOP 自动检查规则
- [ ] 已给 sources 正确打上状态标签
- [ ] 已明确各客户端的触发方式
- [ ] 已成功生成或更新至少一份 SOP
- [ ] 已执行一次 lint 或等效维护检查

## 6. 最佳实践
- 优先用 Claude Code 承担自动检查与更新提醒
- 所有客户端共享同一套 skills，避免复制多份
- source 的 frontmatter 状态要统一命名
- SOP 必须保留来源回链，便于追溯与更新
- 同一主题 sources 达到一定数量时再综合生成 SOP，可减少碎片化文档

## 7. 常见问题

### Q1：为什么 SOP 没有自动生成？
通常是因为客户端不支持 hooks，或 source 未标记为 `status: sop-ready`。请先检查 hooks 配置与文档状态。

### Q2：哪些客户端支持自动检查？
现有资料显示 Claude Code 支持最好。其他客户端多为 skills 手动触发模式。

### Q3：什么内容应标记为 `sop-ready`？
任何包含可复用步骤、操作流程、最佳实践或经验总结的资料都应进入 `sop-ready`。

### Q4：sources 更新后如何同步 SOP？
在 hooks 中加入“sources 比 SOP 新则提示更新”的逻辑，并在定期维护中复查更新时间与回链。

### Q5：为什么要用 Junction？
Junction 可以保证多个客户端共享同一套 skills，减少复制、遗漏和版本不一致问题。

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
