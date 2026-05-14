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

本 SOP 用于规范在 Windows 环境中部署 claude-obsidian 知识库、接入多个 AI 客户端，并建立从 source 到 SOP 的自动检查、生成与维护机制。目标是让资料沉淀过程标准化、可追溯、可持续更新。

---

## 2. 适用场景

- 需要在 Windows 上搭建可被多个 AI 客户端共享的知识库
- 需要把原始资料自动整理到 wiki 并进一步转成 SOP
- 需要统一配置 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 的 skills 引用
- 需要建立标准化的 source 状态流转与 SOP 更新机制

---

## 3. 前置条件

- Windows 环境，具备 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 具备本地文件读写权限与 Junction 创建权限
- 已确定 Vault 路径，例如：`D:\dolan_env\temp\project\personal\claude-obsidian`
- 至少一个支持 skills 的 AI 客户端

---

## 4. 标准操作步骤

### 步骤 1：克隆项目并确认 Vault 路径

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

如目录有嵌套或结构异常，先整理到最终 Vault 根目录。

**预期结果：** 本地已存在可用的 claude-obsidian Vault 根目录。

### 步骤 2：创建 Vault 标准目录结构

执行：

```powershell
New-Item -ItemType Directory -Path "$VAULT\.obsidian\snippets" -Force
New-Item -ItemType Directory -Path "$VAULT\.raw" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\concepts" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\entities" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sources" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sop" -Force
New-Item -ItemType Directory -Path "$VAULT\_templates" -Force
```

目录约定：

- `.raw`：原始输入
- `wiki/concepts`：概念类笔记
- `wiki/entities`：实体类笔记
- `wiki/sources`：来源资料
- `wiki/sop`：SOP 文档
- `_templates`：模板文件

**预期结果：** Vault 目录结构完整。

### 步骤 3：写入 Obsidian 基础配置

补齐以下配置：

- `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 设为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

如已有团队标准模板，直接复用。

**预期结果：** Obsidian 可正确展示图谱、隐藏中间文件并启用样式片段。

### 步骤 4：为多个 AI 客户端创建 skills 链接

按需执行：

```powershell
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$VAULT\.cursor\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$VAULT\.windsurf\skills\claude-obsidian" -Target "$VAULT"
```

如果客户端要求其他目录结构，按其规范调整，但必须统一指向同一套 skills 内容。

**预期结果：** 多个 AI 客户端可共享同一套 claude-obsidian 能力。

### 步骤 5：建立 SOP 专用技能定义

创建文件：`skills/wiki-sop/SKILL.md`

技能至少应包含：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：source 更新后提示 SOP 更新
- 质量检查：检查步骤可执行性、checklist、来源回链

建议补充：输入输出规范、存放路径、命名规则、失败回退策略。

**预期结果：** AI 客户端可基于统一规则识别、生成和维护 SOP。

### 步骤 6：配置 hooks 自动检查 SOP 机会

在 `hooks/hooks.json` 中的 `SessionStart` 加入自动检查逻辑：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

Claude Code 可优先使用该自动机制；其他不支持 hooks 的客户端改为手动触发。

**预期结果：** 每次会话开始时系统能发现可生成或应更新的 SOP。

### 步骤 7：标准化 Source 状态流转

采用以下统一流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

标记规则：

- 有分步骤流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`
- 已被提炼进 SOP：可标记为 `synthesized`

**预期结果：** Source 笔记状态清晰，便于 AI 自动判断下一步动作。

### 步骤 8：执行资料导入、整理与 SOP 生成

操作顺序：

1. 使用 `ingest` 导入原始资料
2. 确认资料被整理到 `concepts`、`entities`、`sources`
3. 为流程型 source 补充 `status: sop-ready`
4. 自动或手动触发 SOP 检查/生成
5. 将输出保存到 `wiki/sop/`
6. 为 SOP 补充来源回链、适用范围、步骤、检查清单与更新信息

**预期结果：** 满足条件的资料已成功沉淀为 SOP。

### 步骤 9：验证不同 AI 客户端的触发方式

验证要点：

- Claude Code：检查 `hooks.json` 是否自动执行
- Kimi Code：手动输入“整理SOP”等指令验证
- Codex CLI：手动触发 SOP 检查
- Gemini CLI：手动触发 skills
- Cursor/Windsurf：确认 skills 可见并可手动调用

将实际差异记录到团队使用说明中。

**预期结果：** 团队清楚每个客户端的自动化边界与正确使用方式。

### 步骤 10：执行质量检查与定期维护

定期执行以下检查：

- SOP 步骤是否明确可执行
- 是否包含 checklist
- 是否保留相关 source 回链
- source 更新后是否触发 SOP 更新判断
- 是否运行 `lint the wiki`
- 是否能通过 `query:` 查询知识

建议每周或每批新增资料后执行一次。

**预期结果：** 知识库与 SOP 持续保持高质量、可追溯、可维护。

---

## 5. 检查清单

- [ ] 已成功克隆 claude-obsidian
- [ ] 已创建标准 Vault 目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已创建所需 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 自动检查逻辑
- [ ] 已落实 source 状态流转规则
- [ ] 已验证至少一个客户端可生成或更新 SOP
- [ ] 已将 SOP 存入 `wiki/sop/` 并添加回链
- [ ] 已建立周期性维护机制

---

## 6. 最佳实践

- 使用统一 Vault 路径变量，避免命令中多次修改路径
- 所有 AI 客户端共享同一套 skills，避免维护多份副本
- 将 `sop-ready` 作为 SOP 候选的唯一标准入口，降低歧义
- 对高价值资料增加 `sop-priority: high`，让系统优先处理
- 每份 SOP 必须保留来源回链，确保可追溯与可更新
- 将 `lint the wiki` 纳入例行维护，避免结构漂移

---

## 7. 常见问题

### Q1：为什么 SOP 不会自动生成？
因为客户端可能不支持 hooks，或者 source 没有被标记为 `status: sop-ready`。Claude Code 自动化支持更完整，其他客户端通常需要手动触发。

### Q2：什么内容应该标记为 `sop-ready`？
任何具备明确步骤、可复用执行路径、最佳实践或经验总结的资料都适合标记为 `sop-ready`。

### Q3：同主题 source 不足 3 个还能生成 SOP 吗？
可以。`≥3` 是自动推荐阈值，不是硬性限制。高价值流程可直接手动生成初版。

### Q4：如何判断 SOP 需要更新？
当 source 的更新时间晚于对应 SOP，或 source 新增了关键步骤、边界条件、最佳实践时，就应触发更新。

### Q5：日常最低维护动作是什么？
导入新资料、正确标记状态、运行 `lint the wiki`、检查 SOP 是否过期。

---

## 8. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
