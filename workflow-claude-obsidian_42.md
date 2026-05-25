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

## 1. 目的

规范在 Windows 环境中部署 claude-obsidian 知识库、启用 SOP 自动生成与更新检查机制，并为多个 AI 客户端配置统一 skills 引用路径，确保知识沉淀、流程复用与跨工具协同一致可用。

## 2. 适用场景

- 需要在 Windows 本地搭建 claude-obsidian 知识库
- 希望通过 AI 自动写入笔记并按 `concepts / entities / sources` 分类整理
- 希望基于已有 source 笔记自动识别可 SOP 化内容并触发生成/更新
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 共用同一套 skills 与 vault
- 需要建立 source 状态流转与 SOP 维护机制

## 3. 前置条件

- Windows 环境，具备 PowerShell 执行权限
- 已安装 Git
- 可访问仓库：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 已确定本地 vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个支持 skills 的 AI 客户端
- 了解 Obsidian 基本目录结构与本地文件读写方式

## 4. 操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录

打开 PowerShell，进入目标父目录后克隆仓库，并确认最终 vault 路径不出现多层嵌套。

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后目录存在额外嵌套，手动整理为统一 vault 根目录，例如：`D:\dolan_env\temp\project\personal\claude-obsidian`。

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且后续所有配置都将以该目录作为唯一 Vault。

### 步骤 2：创建标准目录结构

在 PowerShell 中定义 vault 路径，并创建 Obsidian 配置、原始资料、知识库分类、SOP 与模板目录。

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

- `.raw/`：原始输入资料
- `wiki/concepts/`：概念类知识
- `wiki/entities/`：实体类知识
- `wiki/sources/`：来源与过程性资料
- `wiki/sop/`：沉淀后的 SOP 文档
- `_templates/`：模板目录

**预期结果：** Vault 目录结构完整，具备后续 ingest、分类整理、SOP 生成与模板管理所需的基础路径。

### 步骤 3：写入 Obsidian 基础配置

在 vault 的 `.obsidian/` 目录中创建或修改以下配置文件：

- `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 分组设为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

最低要求：

1. 图谱中可区分 SOP 节点
2. AI 中间文件不进入主视图
3. CSS 片段可以生效

**预期结果：** Obsidian 能正确识别 vault 基础配置，图谱、过滤与外观设置满足知识库维护需要。

### 步骤 4：为多 AI 客户端创建统一 skills 链接

使用 PowerShell 的 Junction 将同一套 claude-obsidian skills 暴露给不同客户端，避免重复维护。

标准映射：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

示例命令：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills\claude-obsidian"
```

如果目标父目录不存在，先创建父目录后再建立 Junction。

**预期结果：** 至少一个 AI 客户端已能通过固定 skills 路径访问 claude-obsidian；多个客户端可共用同一套技能配置。

### 步骤 5：建立 SOP skill 并定义三种工作模式

在 `skills/wiki-sop/` 下创建 `SKILL.md`，至少包含以下能力：

1. 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
2. 手动生成模式：用户指定主题时生成 SOP
3. 更新模式：sources 更新时提示或执行 SOP 更新
4. 质量检查：验证步骤可执行性、检查清单完整性、来源回链完整性

建议在 `SKILL.md` 中明确以下输出规范：

- SOP 标题清晰
- 步骤按顺序编号
- 每一步必须有可执行动作与预期结果
- 必须附检查清单
- 必须附 source 回链

**预期结果：** Vault 内存在专用于 SOP 工作流的 skill，AI 能依据该 skill 执行自动扫描、手动生成与更新检查。

### 步骤 6：配置 hooks 以自动检查 SOP 机会

修改 `hooks/hooks.json`，在 `SessionStart` 钩子中加入 SOP 自动检查逻辑。建议规则如下：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

推荐在支持 hooks 的客户端中优先启用，尤其是 Claude Code。

**预期结果：** 会话启动时能够自动发现 SOP 生成或更新机会，减少人工巡检成本。

### 步骤 7：执行 source 状态流转标准

统一 source 文档状态，标准流转如下：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

维护要求：

- source 在完成整理后必须写入明确状态
- 已被沉淀为 SOP 的 source 可继续保留并标记为已综合使用
- 无复用价值的过程材料最终归档

**预期结果：** 所有来源笔记都具备统一状态字段，系统能够稳定识别 SOP 候选资料与更新来源。

### 步骤 8：按客户端能力选择自动或手动触发方式

根据客户端差异选择 SOP 工作方式：

- **Claude Code**：支持 hooks，可在 `SessionStart` 自动检查 SOP 机会
- **Kimi Code**：支持 skills，但通常需手动输入“整理SOP”等指令
- **Codex CLI**：支持 skills，通常需手动触发
- **Gemini CLI**：支持 skills，通常需手动触发
- **Cursor / Windsurf**：可挂接 skills，但通常不具备同等级 hooks 自动化

标准建议：

1. 需要自动巡检时优先使用 Claude Code
2. 需要跨客户端复用同一知识库时统一使用 skills 链接
3. 对不支持 hooks 的客户端，建立固定口令，如“扫描 sop-ready 并整理 SOP”

**预期结果：** 团队或个人已明确各客户端的触发方式，不会误以为所有工具都具备同等级自动化能力。

### 步骤 9：验证部署与 SOP 自动机制

完成配置后执行一次端到端验证：

1. 新增或导入一份 source 资料
2. 将包含流程的资料标记为 `status: sop-ready`
3. 再补充至少 2 份同主题资料，或给单份高价值资料添加 `sop-priority: high`
4. 启动支持的 AI 客户端，观察是否出现 SOP 生成提示
5. 手动触发“整理SOP”或指定主题生成 SOP
6. 检查输出是否写入 `wiki/sop/`
7. 更新 source 后再次启动会话，验证是否出现 SOP 更新提示

验证通过标准：

- source 能被识别
- SOP 能被生成或提示生成
- SOP 更新机会能被发现
- 相关回链完整

**预期结果：** 从 source 输入到 SOP 提示、生成、更新的闭环可正常运行，部署正式可用。

## 5. 检查清单

- [ ] 已成功克隆 claude-obsidian 仓库并确认唯一 Vault 路径
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已写入 `graph.json`、`app.json`、`appearance.json` 基础配置
- [ ] 已至少为一个 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md` 并定义自动检查、手动生成、更新、质量检查规则
- [ ] 已在 `hooks/hooks.json` 中加入 `SessionStart` 的 SOP AUTO-CHECK 逻辑
- [ ] 已为 source 文档采用 `raw / processed / sop-ready / synthesized / archived` 状态流转
- [ ] 已明确各 AI 客户端是自动触发还是手动触发
- [ ] 已完成一次从 source 到 SOP 生成/更新提示的验证

## 6. 常见问题

### Q1：为什么项目本身支持知识整理，但 SOP 不能自动出现？

因为 SOP 生成属于“需配置”的能力。项目原生具备 ingest、分类整理、查询等功能，但 SOP 依赖额外的 skill 与 hook 触发规则。未配置 `skills/wiki-sop/SKILL.md` 和 `hooks/hooks.json` 时，通常只能手动整理。

### Q2：哪些客户端支持真正自动检查 SOP 机会？

根据来源信息，Claude Code 支持 `hooks.json`，可在 `SessionStart` 自动检查。Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 主要支持 skills，通常需要手动发出指令触发。

### Q3：什么样的 source 应该标记为 sop-ready？

凡是包含明确分步骤操作流程、可重复执行经验、最佳实践总结的资料，都应标记为 `status: sop-ready`。如果内容价值高、复用频繁，建议再加 `sop-priority: high`。纯背景参考资料通常保留为 `status: processed`。

### Q4：触发生成 SOP 的推荐阈值是什么？

标准规则是：同主题 `sop-ready` 资料达到 3 份及以上时提示生成 SOP；或者单份资料标记了 `sop-priority: high` 时直接优先提示。

### Q5：如果 source 更新了，如何避免 SOP 过期？

在 `SessionStart` 的检查逻辑中加入“sources 比 SOP 新 → 提示更新 SOP”的规则。这样每次启动支持 hooks 的客户端时，都会主动发现 SOP 是否需要同步修订。

### Q6：为什么要用 Junction 而不是复制 skills 目录？

Junction 可让多个客户端共享同一份 skills 内容，避免多份副本维护不一致。更新一次 skill，即可被所有已链接客户端复用。

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]