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

## 1. 目的
规范在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并建立 SOP 自动检查与生成机制，以实现资料沉淀、流程复用和跨客户端引用。

## 2. 适用场景
- 需要在 Windows 上搭建可被多个 AI 客户端复用的 Obsidian 知识库
- 希望将 AI 产生的笔记自动分类到 wiki 并支持后续查询
- 希望基于 sources 笔记自动识别可 SOP 化内容并触发生成提醒
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套 skills
- 需要建立 source 从 ingest 到 sop-ready 再到 synthesized 的标准状态流转

## 3. 前置条件
- Windows 环境，具备 PowerShell 权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定知识库根目录，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个 AI 客户端，如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf
- 了解 Obsidian vault 的基本目录结构和 markdown 文件编辑方法

## 4. 标准操作步骤

### 步骤 1：克隆仓库并确认 Vault 根目录
在 PowerShell 中进入目标目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后存在嵌套目录或路径不符合统一管理规范，先整理目录，确保最终 vault 根目录唯一且明确，例如：`D:\dolan_env\temp\project\personal\claude-obsidian`。

**预期结果：** 本地已成功获取 claude-obsidian 项目，并明确唯一的 Vault 根路径。

### 步骤 2：创建标准目录结构
使用 PowerShell 创建标准目录：

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

如目录已存在，可重复执行，不影响结果。

**预期结果：** Vault 内已具备 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop` 和 `_templates` 等标准目录。

### 步骤 3：写入 Obsidian 基础配置
补齐以下配置文件：
- `.obsidian/graph.json`：配置知识图谱颜色分组，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

如果团队已有统一配置模板，优先复用团队模板。

**预期结果：** Obsidian 可以正常识别知识图谱、排除无关文件，并启用样式扩展。

### 步骤 4：为多 AI 客户端创建 skills 链接
将 Vault 或 skills 能力通过 Junction 链接到各客户端技能目录：

```powershell
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target "$VAULT"
```

对于 Cursor 和 Windsurf，将链接建立在 `.cursor/skills/` 与 `.windsurf/skills/` 下。务必保证所有客户端都指向同一个 Vault 根目录。

**预期结果：** 各 AI 客户端均可访问同一套 claude-obsidian skills 与知识库。

### 步骤 5：建立 SOP 生成技能定义
创建 `skills/wiki-sop/SKILL.md`，至少包含以下内容：
- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查：检查步骤可执行性、检查清单完整性、回链完整性

同时明确生成位置为 `wiki/sop/`，并统一 SOP 输出结构。

**预期结果：** 系统已具备独立的 SOP 技能定义，AI 可按统一规则生成或更新 SOP。

### 步骤 6：配置自动触发 Hook
修改 `hooks/hooks.json`，在 `SessionStart` 中加入 SOP 自动检查逻辑：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持更多 hook，可在其他事件中补充自动 commit 或状态刷新逻辑。当前已知 Claude Code 支持该自动机制，其余客户端通常需手动触发。

**预期结果：** 支持 hooks 的客户端在会话启动时自动检查 SOP 候选内容，并给出生成或更新提醒。

### 步骤 7：执行 Source 状态流转规范
统一 source 生命周期：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：
- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`
- 已被纳入 SOP 并完成沉淀 → `synthesized`

建议在 frontmatter 中维护状态字段。

**预期结果：** sources 均按统一状态标准管理，系统可识别可 SOP 化资料。

### 步骤 8：验证各客户端的触发方式
逐一验证客户端能力：
- **Claude Code**：检查 `hooks.json` 是否在 SessionStart 自动扫描 SOP 候选资料
- **Kimi Code**：手动输入“整理SOP”测试 skills
- **Codex CLI**：手动触发 SOP 技能，确认可读取 vault
- **Gemini CLI**：手动触发 skills，确认可读取 sources 和输出 SOP
- **Cursor/Windsurf**：确认 skills 目录可见并能手动运行工作流

若无法自动触发，但可手动触发，则视为可接受。

**预期结果：** 已明确每个客户端的支持边界，并确认至少具备手动 SOP 能力。

### 步骤 9：执行端到端测试
按以下顺序测试：
1. 使用 `ingest` 导入资料
2. 确认资料进入 `wiki/sources/`
3. 将至少 3 篇同主题资料标记为 `status: sop-ready`
4. 启动支持 hooks 的客户端，观察是否提示生成 SOP
5. 生成 SOP 到 `wiki/sop/`
6. 更新一篇 source，检查是否提示 SOP 更新
7. 执行 `lint the wiki`
8. 使用 `query:` 检查 SOP 是否可检索

**预期结果：** 导入、分类、识别、生成、更新和检索全链路验证通过。

### 步骤 10：运行维护与持续优化
将以下动作纳入日常维护：
- 定期执行 `lint the wiki`
- source 大幅更新后检查对应 SOP 是否需要更新
- 定期清理和审查 `sop-ready` 资料
- 统一模板和 frontmatter 字段
- 优先处理 `sop-priority: high` 的资料

**预期结果：** 知识库与 SOP 资产保持持续可用、可检索、可复用。

## 5. 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 根目录
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已写入或补齐 `.obsidian/graph.json`、`.obsidian/app.json`、`.obsidian/appearance.json`
- [ ] 已为至少一个 AI 客户端创建指向同一 Vault 的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md` 并定义自动检查、手动生成、更新和质量检查规则
- [ ] 已在 `hooks/hooks.json` 中加入 SessionStart 的 SOP 自动检查逻辑
- [ ] 已建立 source frontmatter 状态字段并开始使用 `sop-ready` 标记
- [ ] 已验证 Claude Code 自动检查或其他客户端手动触发功能可用
- [ ] 已完成一次端到端测试，包括 source 更新后 SOP 更新提醒
- [ ] 已能通过 `query:` 命令检索并引用生成的 SOP

## 6. 常见问题

### Q1：哪些客户端支持 SOP 自动检查？
A：根据来源信息，Claude Code 支持通过 `hooks.json` 在 SessionStart 自动检查 SOP。Kimi Code、Codex CLI、Gemini CLI、Cursor 和 Windsurf 主要依赖 skills，但通常需要手动触发。

### Q2：什么时候应该把 source 标记为 `status: sop-ready`？
A：当资料包含明确的分步骤操作流程，或沉淀了可复用的最佳实践、经验总结时，应标记为 `sop-ready`。若复用价值高，建议同时加上 `sop-priority: high`。

### Q3：如果资料只是参考信息，没有明确流程，是否要生成 SOP？
A：不建议。纯参考资料应保留为 `status: processed`，只有具备可执行流程的资料才适合 SOP 化。

### Q4：如何判断需要更新已有 SOP？
A：当 sources 的更新时间晚于对应 SOP，或 source 中的关键步骤、最佳实践发生变化时，应提示并执行 SOP 更新。

### Q5：多客户端接入时最常见的问题是什么？
A：最常见问题是各客户端链接到了不同目录副本，导致 SOP、sources 和 skills 不一致。应确保所有 Junction 都指向同一个 Vault 根目录。

### Q6：为什么要保留 `wiki/sop/` 独立目录？
A：独立目录便于在知识图谱中高亮 SOP 资产、统一查询、集中维护模板，并与 sources、concepts、entities 分层管理。

## 7. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
