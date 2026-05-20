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

# Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

规范在 Windows 环境中部署 claude-obsidian 知识库、配置 SOP 自动检查与生成机制，并打通多个 AI 客户端对同一 vault 的引用方式，确保知识沉淀、流程复用与 SOP 维护可持续运行。

## 2. 适用场景

- 需要在 Windows 上搭建可供 AI 写入与整理的 Obsidian 知识库
- 需要将原始资料自动沉淀为结构化 wiki 内容
- 需要建立 SOP 自动检查、手动生成与更新提醒机制
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等客户端共享同一 vault
- 需要为流程文档化、知识复用和跨 AI 协作建立统一标准

## 3. 前置条件

- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 本地有可用目录，例如 `D:\dolan_env\temp\project\personal`
- 能访问 claude-obsidian 仓库
- 已安装至少一个 AI 客户端
- 了解 Obsidian vault 的基础结构
- 具备创建目录、配置文件和 Junction 链接的权限

## 4. 标准操作步骤

### 步骤 1：克隆 claude-obsidian 仓库到本地

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如有嵌套目录，完成克隆后立即整理，确保项目根目录就是后续 vault 根目录。

**预期结果：** 本地已存在可直接作为 Obsidian vault 使用的 `claude-obsidian` 目录。

---

### 步骤 2：创建标准 vault 目录结构

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

目录职责：

- `.raw`：原始资料输入
- `wiki/concepts`：概念类知识
- `wiki/entities`：实体类知识
- `wiki/sources`：来源与资料沉淀
- `wiki/sop`：标准操作流程文档
- `_templates`：模板文件
- `.obsidian/snippets`：样式片段

**预期结果：** 标准目录结构创建完成。

---

### 步骤 3：写入 Obsidian 基础配置

补充或修改以下配置文件：

1. `.obsidian/graph.json`：知识图谱颜色分组，建议将 `sop` 标记为黄色
2. `.obsidian/app.json`：排除 AI 中间工作文件
3. `.obsidian/appearance.json`：启用 CSS snippets

配置原则：

- 图谱中能快速识别 SOP 资产
- AI 过程文件不污染主视图
- 样式配置可被 Obsidian 正常加载

**预期结果：** Obsidian 配置可用，图谱与文件视图符合知识管理预期。

---

### 步骤 4：为多 AI 客户端创建 skills Junction 链接

为各客户端建立统一 skills 入口，使用 `New-Item -ItemType Junction` 创建链接。标准映射如下：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

要求所有链接都指向同一份技能定义，避免配置分叉。

**预期结果：** 多个 AI 客户端可共享同一套 claude-obsidian skills。

---

### 步骤 5：配置 SOP 专用 skill

创建文件：

`skills/wiki-sop/SKILL.md`

该 skill 至少应包括以下能力：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：支持按主题生成 SOP
- 更新模式：当 source 更新后提示 SOP 修订
- 质量检查：检查步骤可执行性、检查清单完整性、来源回链完整性

建议在 skill 中明确：

- 输入格式
- 触发条件
- 输出路径 `wiki/sop/`
- SOP 标准结构

**预期结果：** SOP skill 可被客户端调用，用于 SOP 生成与维护。

---

### 步骤 6：配置 hooks 触发 SOP 自动检查

修改 `hooks/hooks.json`，在 `SessionStart` 加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持，可进一步配置 `PostToolUse` 处理自动提交或同步。

说明：

- Claude Code 可优先启用完整 hooks 自动化
- 其他不支持 hooks 的客户端，保留手动触发方案

**预期结果：** 支持 hooks 的客户端在启动会话时自动执行 SOP 检查。

---

### 步骤 7：建立 source 状态流转规范

统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

标记规则：

- 包含明确步骤流程 → `status: sop-ready`
- 最佳实践、经验总结、复用价值高 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`
- 完成 SOP 提炼后 → 视情况标记为 `synthesized` 或归档

**预期结果：** source 资料状态清晰，系统能自动识别可转 SOP 的内容。

---

### 步骤 8：执行知识摄入与分类整理

使用项目原生命令完成知识处理：

- `ingest`：导入资料
- 自动或手动分类到 `wiki/concepts`、`wiki/entities`、`wiki/sources`
- `lint the wiki`：定期维护结构
- `query:`：执行知识查询

整理要求：

- 保留来源信息
- 主题命名统一
- 分类准确
- 状态字段规范

**预期结果：** 原始资料已进入标准知识库结构，可查询、可维护、可综合。

---

### 步骤 9：生成或更新 SOP 文档

触发方式：

1. 自动触发：由支持 hooks 的客户端在 SessionStart 提示
2. 手动触发：通过口令如“整理SOP”或指定主题生成

生成要求：

- 输出路径：`wiki/sop/`
- 文档内容需包括：适用场景、前置条件、步骤、检查清单、FAQ、来源回链
- 同主题 sources 达到 3 篇及以上时，优先综合为统一 SOP
- 若 source 更新晚于 SOP，则应执行更新而不是重复新建

生成后要求：

- SOP 与 source 双向链接
- 标题明确、命名规范
- 内容可执行且便于复用

**预期结果：** `wiki/sop/` 中已生成或更新结构完整的 SOP 文档。

---

### 步骤 10：按客户端能力执行运行与维护策略

分客户端维护策略如下：

- **Claude Code**：启用自动 SOP 检查；可结合 hooks 自动提示与后处理
- **Kimi Code**：支持 skills，但通常需手动说“整理SOP”
- **Codex CLI**：支持 skills，通常需手动触发
- **Gemini CLI**：支持 skills，通常需手动触发
- **Cursor / Windsurf**：以 skills 接入为主，通常无完整 hooks 自动化

日常维护要求：

- 定期检查 `wiki/sources` 中未综合的 `sop-ready` 资料
- 定期检查 SOP 是否落后于 source
- 定期执行 `lint the wiki`
- 新增客户端时复用同样的 Junction 与 skills 配置

**预期结果：** 不同客户端均可稳定参与 SOP 工作流，自动与手动机制边界明确。

## 5. 检查清单

- [ ] 已成功克隆 claude-obsidian 仓库
- [ ] 已创建标准 vault 目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已为目标客户端建立 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查规则
- [ ] 已建立 source 状态流转规范
- [ ] 已可执行 `ingest`、`query:`、`lint the wiki`
- [ ] 已生成至少一份 SOP 到 `wiki/sop/`
- [ ] 已验证 SOP 更新提醒机制有效

## 6. 常见问题

### Q1：为什么有些客户端不会自动提示生成 SOP？

因为自动提示依赖 hooks 支持。Claude Code 支持 `hooks.json`，可在 `SessionStart` 自动检查；其他客户端多数只能依赖 skills 和手动指令触发。

### Q2：什么样的 source 应该标记为 `sop-ready`？

包含明确分步骤流程、可重复执行方法、最佳实践或高复用经验总结的资料都应标记为 `status: sop-ready`。高价值内容建议再加 `sop-priority: high`。

### Q3：什么时候应该生成 SOP？

当同主题 source 达到 3 篇及以上、某条 source 被标记为 `sop-priority: high`、或资料已足够形成稳定可复用流程时，应生成 SOP。

### Q4：如果 source 更新了，现有 SOP 要怎么处理？

应执行更新流程：比对差异、补充步骤、更新检查清单，并保留与最新 source 的回链，而不是盲目新建重复 SOP。

### Q5：为什么要统一使用 Junction 链接 skills？

因为这样可以让多个 AI 客户端共享同一套能力定义，避免重复维护，减少规则漂移和版本不一致问题。

### Q6：一份合格的 SOP 最少应包含什么？

至少应包含目的、适用场景、前置条件、步骤、每步预期结果、检查清单、FAQ 与相关来源回链。

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]