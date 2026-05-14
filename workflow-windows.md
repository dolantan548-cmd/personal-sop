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

本 SOP 用于在 Windows 环境中标准化完成以下工作：

- 部署 `claude-obsidian` 知识库
- 建立 Obsidian 基础目录与配置
- 连接多个 AI 客户端复用同一套 skills
- 配置 SOP 自动检查、手动生成与更新机制
- 统一 source 状态管理，支持流程知识持续沉淀

---

## 2. 适用场景

- 需要在 Windows 上搭建可长期维护的 AI 知识库
- 需要将 AI 对话、操作记录、经验总结沉淀为 sources
- 需要从多个 source 自动归纳 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等客户端中共享知识能力

---

## 3. 前置条件

- Windows 系统，具备 PowerShell 使用权限
- 已安装 Git
- 已安装或可访问 Obsidian
- 可访问仓库：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 已确定 Vault 路径，例如：`D:\dolan_env\temp\project\personal\claude-obsidian`
- 对各 AI 客户端配置目录具备写权限

---

## 4. 标准步骤

### 步骤 1：克隆项目并确认部署目录

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在嵌套目录，整理为统一 Vault 根目录，例如：

`D:\dolan_env\temp\project\personal\claude-obsidian`

**预期结果：** 本地已存在可用的 claude-obsidian Vault 根目录。

---

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

目录说明：

- `.raw`：原始资料
- `wiki/concepts`：概念知识
- `wiki/entities`：实体知识
- `wiki/sources`：来源资料
- `wiki/sop`：SOP 成果
- `_templates`：模板
- `.obsidian/snippets`：样式片段

**预期结果：** Vault 中具备标准目录结构。

---

### 步骤 3：写入 Obsidian 基础配置

创建或更新：

- `.obsidian/graph.json`
- `.obsidian/app.json`
- `.obsidian/appearance.json`

配置原则：

- 在 `graph.json` 中为 `wiki/sop` 设置醒目颜色，例如黄色
- 在 `app.json` 中排除 AI 工作文件和中间目录
- 在 `appearance.json` 中启用 CSS snippets

**预期结果：** Obsidian 能正确加载 Vault，并具备清晰图谱和干净视图。

---

### 步骤 4：配置多 AI 客户端的 skills 链接

将仓库中的 skills 链接到各客户端目录。

目标目录示例：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

PowerShell 示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills\claude-obsidian"
```

对其他客户端重复执行。

**预期结果：** 多个 AI 客户端可复用同一套 skills。

---

### 步骤 5：建立 SOP 专用 skill

创建文件：

`skills/wiki-sop/SKILL.md`

内容应至少覆盖：

1. 自动检查模式
2. 手动生成模式
3. 更新模式
4. 质量检查模式

关键规则：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 支持用户按主题手动生成 SOP
- 当 sources 更新时提示 SOP 更新
- 检查步骤可执行性、checklist 完整性、来源回链完整性

**预期结果：** 已具备 SOP 专用 skill，可用于检查、生成和更新 SOP。

---

### 步骤 6：配置 hooks 自动检查 SOP 机会

编辑：

`hooks/hooks.json`

在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

说明：

- Claude Code 支持 hooks 自动触发
- 其他客户端通常仅支持手动触发 skill

**预期结果：** 在支持 hooks 的环境中，启动会话即能自动检查 SOP 生成或更新机会。

---

### 步骤 7：标准化 source 状态流转规则

采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：

- 分步骤操作流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

推荐 frontmatter 示例：

```yaml
status: sop-ready
sop-priority: high
topic: windows
```

**预期结果：** source 可被系统稳定识别与筛选。

---

### 步骤 8：执行知识导入、整理与维护

按项目原生能力执行：

- `ingest`：导入原始资料
- 自动分类：归入 `concepts`、`entities`、`sources`
- `lint the wiki`：维护知识库结构
- `query:`：执行知识查询

最佳实践：

- 导入后立即标记 source 状态
- 同主题命名保持一致
- 定期维护，减少脏数据和失效链接

**预期结果：** 知识导入、分类、查询、维护形成闭环。

---

### 步骤 9：生成或更新 SOP 文档

触发条件：

- 同主题 `sop-ready` sources 数量 ≥ 3
- 某 source 存在 `sop-priority: high`
- source 更新时间晚于现有 SOP

执行要求：

- 输出目录：`wiki/sop/`
- 文档必须包含：目的、适用场景、前置条件、步骤、检查清单、FAQ、来源回链
- 每一步必须可执行
- 更新时优先补差异，不盲目整体重写

**预期结果：** 产出结构完整、可执行、可追溯的 SOP 文档。

---

### 步骤 10：按客户端能力选择运行方式

客户端差异：

- **Claude Code**：支持 skills + hooks，适合作为自动化主入口
- **Kimi Code**：支持 skills，通常手动触发
- **Codex CLI**：支持 skills，通常手动触发
- **Gemini CLI**：支持 skills，通常手动触发
- **Cursor**：可接入 skills，建议手动触发
- **Windsurf**：可接入 skills，建议手动触发

推荐方式：

- Claude Code 负责自动检查和更新提醒
- 其他客户端负责补充编辑、查询和手动生成

**预期结果：** 不同客户端在统一 Vault 上协同工作，不产生重复维护。

---

## 5. 检查清单

- [ ] 已克隆仓库到本地
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已创建至少一个客户端的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SOP 自动检查规则
- [ ] 已统一 source 状态字段规则
- [ ] 已完成一次 ingest、query 或 lint 测试
- [ ] 已生成至少一份 SOP
- [ ] 已确认 SOP 含来源回链

---

## 6. 常见问题（FAQ）

### Q1：Windows 下没有 setup 脚本怎么办？
A：直接使用 PowerShell 手动创建目录和配置文件即可，这属于 setup 的等效配置方式。

### Q2：哪些客户端支持 SOP 自动检查？
A：Claude Code 支持 hooks 自动检查；其他客户端通常仅支持 skills，需要手动触发。

### Q3：什么样的 source 应标记为 `sop-ready`？
A：凡是能沉淀为可复用操作流程、最佳实践、经验总结的内容，都应标记为 `sop-ready`。

### Q4：什么时候要生成新的 SOP？
A：当同主题 `sop-ready` sources 达到 3 份及以上，或存在 `sop-priority: high` 的资料时。

### Q5：什么时候要更新已有 SOP？
A：当相关 sources 内容更新且时间晚于当前 SOP 时，应提示更新。

### Q6：为什么要给多个 AI 客户端都接入同一套 skills？
A：为了避免重复维护规则，保证不同客户端输出一致。

### Q7：知识图谱太乱怎么办？
A：检查 `app.json` 排除项与 `graph.json` 分组配色，并定期执行知识库维护。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
