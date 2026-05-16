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

## 1. 目的
本 SOP 用于在 Windows 环境中部署 claude-obsidian 知识库，并配置 SOP 自动检查、手动生成与更新提醒机制，使多个 AI 客户端可共享同一套知识库与流程能力。

## 2. 适用场景
- 需要在 Windows 本地搭建 Obsidian + AI 知识库
- 需要将 ingest 的资料自动分类管理
- 需要把高复用流程型知识沉淀为 SOP
- 需要跨 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 复用同一套 skills

## 3. 前置条件
- Windows 环境，具备 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 项目仓库
- 已确定本地 vault 路径
- 已安装至少一个 AI 客户端
- 具备创建 Junction 的权限
- 已安装或准备使用 Obsidian

## 4. 标准步骤

### 步骤 1：克隆项目并确认 vault 根目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在嵌套目录，整理为单一 vault 根目录。建议设置变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在明确的 claude-obsidian vault 根目录。

### 步骤 2：初始化标准目录结构
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

**预期结果：** 标准目录全部创建完成。

### 步骤 3：写入 Obsidian 基础配置
补齐或更新：
- `.obsidian/graph.json`：为 SOP 配置颜色分组，建议黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

完成后使用 Obsidian 打开 vault，确认配置可正常加载。

**预期结果：** Obsidian 可正常使用，图谱与外观配置生效。

### 步骤 4：为多 AI 客户端创建 skills Junction 链接
根据实际安装情况，在以下路径创建 `claude-obsidian` 链接：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/`
- `.windsurf/skills/`

使用 `New-Item -ItemType Junction` 指向项目 skills 目录。必要时先创建父目录。

**预期结果：** 客户端可访问共享 skills。

### 步骤 5：创建 wiki-sop 技能定义
创建文件：`skills/wiki-sop/SKILL.md`

内容至少应覆盖：
- 自动检查模式
- 手动生成模式
- 更新模式
- 质量检查

建议明确：输出目录、命名规则、引用来源、检查标准。

**预期结果：** AI 可依据技能说明执行 SOP 工作流。

### 步骤 6：配置 hooks 自动检查逻辑
在 `hooks/hooks.json` 的 SessionStart 中加入：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题数量 `≥3` 时提示生成 SOP
- `sop-priority: high` 时提示生成 SOP
- sources 比 SOP 新时提示更新 SOP

如支持 PostToolUse 自动提交，可补充配置，但不应影响主逻辑。

**预期结果：** 支持 hooks 的客户端可在新会话开始时自动发现 SOP 候选项。

### 步骤 7：落实 source 状态流转与自动标记规则
采用统一状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** SOP 候选资料可被稳定识别与管理。

### 步骤 8：按客户端能力制定使用方式
- **Claude Code**：支持 hooks，可自动检查 SOP
- **Kimi Code**：支持 skills，通常需手动说“整理SOP”
- **Codex CLI**：支持 skills，通常需手动触发
- **Gemini CLI**：支持 skills，通常需手动触发
- **Cursor / Windsurf**：通常依赖手动触发

团队应明确说明：支持 hooks 的客户端自动检查，不支持 hooks 的客户端手动触发。

**预期结果：** 使用者了解各客户端的 SOP 触发方式。

### 步骤 9：执行端到端验证
验证流程如下：
1. 用 ingest 导入资料
2. 检查分类是否进入 `wiki/concepts`、`wiki/entities`、`wiki/sources`
3. 标记至少 3 条同主题 source 为 `status: sop-ready`，或设置 `sop-priority: high`
4. 启动支持 hooks 的客户端检查自动提示；否则手动触发
5. 生成 SOP 到 `wiki/sop/`
6. 更新 source 后验证是否出现 SOP 更新提醒
7. 执行 `lint the wiki` 做维护检查

**预期结果：** 从导入、分类、触发、生成到更新提醒的全链路可运行。

## 5. 检查清单
- [ ] 已成功克隆项目并确认 vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已写入 Obsidian 基础配置
- [ ] 已创建至少一个 AI 客户端的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SessionStart 规则
- [ ] 已采用统一的 source 状态流转规则
- [ ] 已明确各客户端自动/手动触发方式
- [ ] 已完成端到端验证
- [ ] 已验证 SOP 更新提醒逻辑

## 6. 最佳实践
- 始终使用固定的 vault 路径，避免多份配置分叉
- skills 与 hooks 规则应尽量集中维护，减少多客户端重复修改
- 对高价值流程资料优先标记 `sop-priority: high`
- SOP 输出统一放在 `wiki/sop/`，确保可查询、可维护
- 定期执行 `lint the wiki`，保持知识库结构稳定

## 7. 常见问题

**Q：为什么 SOP 不自动生成？**  
A：先检查客户端是否支持 hooks；再检查 `hooks/hooks.json` 是否生效；最后检查 source 是否已标记 `status: sop-ready`，以及是否满足数量或优先级条件。

**Q：哪些客户端支持自动检查？**  
A：来源中明确只有 Claude Code 支持 hooks 自动检查；其他客户端以手动触发为主。

**Q：什么资料应该标记为 `sop-ready`？**  
A：可复用、步骤明确、可执行的流程型资料，以及高价值最佳实践总结。

**Q：如果 sources 更新了怎么办？**  
A：当 source 新于现有 SOP 时，应触发更新提醒；支持 hooks 的客户端可在 SessionStart 自动提示。

**Q：为什么要用 Junction？**  
A：Junction 能让多个 AI 客户端共享同一套 skills，减少重复配置和维护成本。

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]