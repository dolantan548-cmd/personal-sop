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

## 1. 目的

本 SOP 用于标准化在 Windows 环境中部署 `claude-obsidian` 知识库、配置多 AI 客户端共享的 skills 链接，并启用 SOP 自动检查与生成机制。目标是让资料从摄入、分类、状态标记到 SOP 沉淀形成统一闭环。

---

## 2. 适用场景

- 需要在 Windows 上搭建可供多个 AI 客户端共用的 Obsidian 知识库
- 希望将资料自动整理到 `concepts`、`entities`、`sources` 与 `sop`
- 希望通过规则自动发现可沉淀为 SOP 的 source
- 需要跨 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 共享同一套能力定义

---

## 3. 前置条件

- Windows 环境，且可使用 PowerShell
- 已安装 Git
- 可访问 `claude-obsidian` 仓库
- 已确定 Vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个目标 AI 客户端
- 了解 Obsidian Vault 与 YAML 元数据的基础用法

---

## 4. 标准操作步骤

### Step 1. 克隆项目并确认 Vault 目录

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果出现嵌套目录或路径不一致，先整理目录结构，确保只有一个最终 Vault 根目录。

**预期结果：** 本地存在可访问的 `claude-obsidian` 目录，且 Vault 路径已唯一确定。

---

### Step 2. 创建标准目录结构

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

目录说明：
- `.raw`：原始资料
- `wiki/concepts`：概念笔记
- `wiki/entities`：实体笔记
- `wiki/sources`：来源与处理后的源资料
- `wiki/sop`：标准操作文档
- `_templates`：模板文件
- `.obsidian/snippets`：界面片段

**预期结果：** Vault 目录结构完整，满足知识整理与 SOP 生成需要。

---

### Step 3. 写入 Obsidian 基础配置

在 `.obsidian` 下创建或更新：

- `graph.json`：配置知识图谱颜色分组，建议将 `sop` 标为黄色
- `app.json`：排除 AI 工作文件和中间文件
- `appearance.json`：启用 CSS snippets

完成后使用 Obsidian 打开该 Vault，确认配置已生效。

**预期结果：** 图谱、排除规则和外观设置可正常使用。

---

### Step 4. 为多 AI 客户端创建 skills 链接

将项目 skills 目录通过 Junction 链接到各工具的 skills 路径。目标路径示例：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/`
- Windsurf → `.windsurf/skills/`

使用 `New-Item -ItemType Junction` 创建链接。若存在旧链接，先删除后重建。

**预期结果：** 所有目标客户端共享同一套 `claude-obsidian` skills。

---

### Step 5. 创建 SOP 自动机制的 skill

创建文件：`skills/wiki-sop/SKILL.md`

该 skill 至少应定义以下能力：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按主题生成 SOP
- 更新模式：当 source 晚于 SOP 时提示更新
- 质量检查：验证步骤可执行性、检查清单、来源回链

建议在 skill 中明确输入、输出、触发条件和判定逻辑。

**预期结果：** 存在一个统一的 `wiki-sop` 能力入口，供各客户端调用。

---

### Step 6. 配置 hooks 自动检查规则

修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

对于支持 hooks 的客户端，应在每次会话启动时执行。对于不支持 hooks 的客户端，也保留该规则作为统一检查标准。

**预期结果：** 系统能自动或半自动发现需要生成/更新的 SOP。

---

### Step 7. 建立 source 状态流转规则

统一使用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 含分步骤流程 → `status: sop-ready`
- 属于最佳实践或经验总结 → `status: sop-ready` + `sop-priority: high`
- 仅参考资料 → `status: processed`

处理 source 时必须补齐状态字段，便于系统自动判断是否适合转 SOP。

**预期结果：** 每份 source 都有明确状态，SOP 候选资料可被稳定识别。

---

### Step 8. 执行端到端验证

准备测试资料：
- 至少 3 份同主题 source，或
- 1 份 `sop-priority: high` 的流程型 source

将资料放入 `wiki/sources/` 并写入相应元数据。然后验证：

- Claude Code：启动新会话，确认自动出现 SOP 检查提示
- Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf：手动触发“整理 SOP”或调用 `wiki-sop`

检查以下结果：
1. 能识别同主题聚合阈值
2. 能识别高优先级 source
3. 能识别 source 更新晚于 SOP
4. 生成结果具备步骤、清单和来源回链

**预期结果：** 至少一个客户端完成从 source 检测到 SOP 提示或生成的完整闭环。

---

### Step 9. 按客户端能力制定使用规范

统一使用建议：

- Claude Code：用于自动巡检 SOP 候选项
- Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf：用于手动触发整理与生成

日常流程建议：
1. 先 ingest 资料
2. 再分类并写入状态
3. 优先在支持 hooks 的客户端自动巡检
4. 在其他客户端按统一 skill 触发整理
5. 将完成的 SOP 存入 `wiki/sop/` 并回链来源

**预期结果：** 各客户端职责明确，自动与手动流程互补。

---

## 5. 检查清单

- [ ] 已成功克隆项目并确认 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已写入 Obsidian 基础配置
- [ ] 已创建各 AI 客户端的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 `SessionStart` 自动检查规则
- [ ] 已建立 source 状态流转和自动标记规则
- [ ] 已完成至少一次端到端验证
- [ ] 已确认生成的 SOP 包含步骤、检查清单与来源回链

---

## 6. 常见问题（FAQ）

### Q1. 为什么需要单独配置 SOP 自动机制？
因为项目原生支持 ingest、分类和查询，但“何时生成 SOP、基于哪些 source 生成、何时更新”属于策略层逻辑，需要通过 skills 和 hooks 明确触发条件。

### Q2. 哪些客户端支持自动检查 SOP？
Claude Code 支持 hooks，可自动执行 SessionStart 检查；Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 主要采用手动触发方式。

### Q3. 什么时候将 source 标记为 `sop-ready`？
当内容包含明确步骤、操作流程、可复用实践或经验总结时，应标记为 `sop-ready`；若重要性高，再加 `sop-priority: high`。

### Q4. 只有参考资料，没有操作步骤，是否适合生成 SOP？
不适合。此类资料应先标记为 `processed`，保留为知识参考，待补齐可执行流程后再考虑沉淀为 SOP。

### Q5. 如何判断应更新已有 SOP？
当 source 的信息更新晚于现有 SOP，或新增高质量同主题资料时，应提示更新，避免 SOP 失效。

### Q6. 为什么推荐使用 Junction 而不是复制 skills？
Junction 可以让多个客户端引用同一套 skills，避免多份副本不一致，维护更轻量。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]