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

# SOP：Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于在 Windows 环境中标准化部署 `claude-obsidian`，并完成以下能力配置：

- AI 自动写笔记
- 按知识库结构自动分类整理
- 多 AI 客户端共享 skills
- SOP 自动检查、手动生成、更新提醒与质量校验
- 基于同一 Obsidian vault 进行跨客户端引用

---

## 2. 适用场景

- 需要在 Windows 上部署 claude-obsidian 知识库
- 需要持续沉淀 sources / concepts / entities / SOP
- 需要将零散资料转为可重复执行的 SOP
- 需要 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 共享同一套知识技能

---

## 3. 前置条件

- Windows 系统
- 已安装 Git
- 可使用 PowerShell
- 已确定 vault 路径
- 已安装至少一个 AI 客户端
- 具备创建 Junction 的权限

---

## 4. 标准步骤

### 步骤 1：克隆仓库并确认 Vault 路径

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如有嵌套目录，先整理为单一 vault 根目录，并设置：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已有唯一且可访问的 vault 根目录。

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

**预期结果：** 所有核心目录已建立完成。

---

### 步骤 3：写入 Obsidian 基础配置

配置以下文件：

- `.obsidian/graph.json`：为知识图谱配置颜色分组，SOP 建议标黄
- `.obsidian/app.json`：排除 AI 工作中间文件
- `.obsidian/appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 能正常打开 vault，图谱和显示配置可用。

---

### 步骤 4：配置知识写入与分类规则

统一以下使用规范：

- 用 `ingest` 进行 AI 自动记笔记
- 将内容归档到 `wiki/concepts`、`wiki/entities`、`wiki/sources`
- 用 `query:` 查询知识
- 用 `lint the wiki` 做日常维护

定义 source 状态：

- `raw`
- `processed`
- `sop-ready`
- `archived`
- `synthesized`

**预期结果：** 所有资料处理都遵循统一的目录与状态规范。

---

### 步骤 5：建立 SOP 自动标记规则

按以下规则处理 source：

- 有明确步骤流程 → `status: sop-ready`
- 最佳实践/经验总结/高复用流程 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

**预期结果：** 可形成 SOP 的资料被稳定识别出来。

---

### 步骤 6：创建 SOP skills 能力说明

创建 `skills/wiki-sop/SKILL.md`，至少定义：

- 自动检查模式
- 手动生成模式
- 更新模式
- 质量检查模式

建议明确 SOP 输出结构：标题、用途、适用场景、前置条件、步骤、清单、FAQ、来源回链。

**预期结果：** AI 客户端知道何时生成、更新和校验 SOP。

---

### 步骤 7：配置 hooks 自动检查机制

编辑 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持，也可增加后续钩子动作。

**预期结果：** 会话启动时能自动发现 SOP 候选或更新需求。

---

### 步骤 8：为多 AI 客户端创建 skills 链接

按客户端需要创建 Junction：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/`
- `.windsurf/skills/`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

**预期结果：** 多个客户端共享同一套 skills。

---

### 步骤 9：按客户端能力确定触发方式

统一规范：

- Claude Code：优先自动检查
- Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf：通常手动触发
- 标准手动指令可统一为：`整理SOP`、`生成SOP`、`更新SOP`

**预期结果：** 各客户端触发方式明确，不因平台差异导致流程失效。

---

### 步骤 10：执行一次端到端验证

测试流程：

1. 新增 source 到 `wiki/sources`
2. 标记 `status: sop-ready`
3. 如必要，增加 `sop-priority: high`
4. 启动客户端检查自动/手动触发
5. 确认 `wiki/sop` 中生成 SOP
6. 运行 `lint the wiki`
7. 用 `query:` 检查是否可检索

**预期结果：** 从 source 到 SOP 的整条链路可正常运行。

---

### 步骤 11：建立持续维护机制

维护要求：

- 定期运行 `lint the wiki`
- 批量新增资料后检查是否需要标记 `sop-ready`
- source 更新晚于 SOP 时，及时更新 SOP
- 定期巡检 SOP 步骤可执行性与来源回链
- 检查 skills 链接是否失效

建议：

- 每周一次知识库维护
- 每月一次 SOP 质量巡检

**预期结果：** 知识库、SOP 和多客户端配置长期稳定。

---

## 5. 检查清单

- [ ] 已克隆仓库并确认 vault 路径
- [ ] 已创建标准目录结构
- [ ] 已写入 Obsidian 基础配置
- [ ] 已统一 source 状态字段
- [ ] 已建立 sop-ready 标记规则
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已为至少一个 AI 客户端建立 skills Junction
- [ ] 已明确自动/手动触发策略
- [ ] 已完成端到端验证
- [ ] 已执行 `lint the wiki`
- [ ] 已确认 SOP 可被查询与引用

---

## 6. FAQ

### Q1：为什么 SOP 需要额外配置？
因为知识整理是原生能力，但 SOP 生成依赖“触发条件”和“质量标准”，需要通过 skills 与 hooks 补足。

### Q2：什么资料适合标记为 `sop-ready`？
任何包含明确步骤、可复用流程、最佳实践或经验总结的资料。

### Q3：只有一篇资料能生成 SOP 吗？
可以。如果该资料复用价值高，可直接加 `sop-priority: high`。

### Q4：为什么 Claude Code 更适合自动化？
因为其支持 `hooks.json` 自动检查与后续动作，其他客户端通常只支持 skills 手动触发。

### Q5：如何判断 SOP 是否需要更新？
当 source 的内容更新晚于当前 SOP，或新增了更高质量的流程资料时，就应更新 SOP。

### Q6：Windows 下 Junction 创建失败怎么办？
先确认目标父目录存在、源路径正确、PowerShell 权限足够，再重新执行命令。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
