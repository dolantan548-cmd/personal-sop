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

本 SOP 用于规范在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制。目标是让资料能够被持续导入、分类、查询，并转化为可复用的标准操作流程。

## 2. 适用场景

- 需要在 Windows 上部署 claude-obsidian
- 需要让 AI 自动写笔记与整理知识库
- 需要将流程型资料转化为 SOP
- 需要多 AI 客户端共用同一套知识库能力
- 需要建立 SOP 自动检查、更新和质量校验机制

## 3. 前置条件

- Windows 环境，且可使用 PowerShell
- 已安装 Git
- 已准备本地工作目录
- 已获取仓库地址：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 已安装至少一个 AI 客户端（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf）
- 具备目录创建、文件写入和 Junction 权限
- 已确定 Vault 根目录

## 4. 标准步骤

### 步骤 1：克隆仓库并确认 Vault 路径

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

建议统一设置：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

如存在嵌套目录，先完成目录整理。

**预期结果：** 本地已存在可用的 claude-obsidian 目录，且 Vault 路径明确。

---

### 步骤 2：初始化 Vault 目录结构

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

- `.raw`：原始资料
- `wiki/concepts`：概念知识
- `wiki/entities`：实体知识
- `wiki/sources`：来源资料
- `wiki/sop`：SOP 文档
- `_templates`：模板文件

**预期结果：** 标准目录已建立。

---

### 步骤 3：写入 Obsidian 基础配置

补齐以下配置文件：

- `.obsidian/graph.json`：设置图谱分组颜色，建议 SOP 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

建议统一保存团队模板并复制使用。

**预期结果：** Obsidian 可正常展示并区分 SOP 节点。

---

### 步骤 4：为多 AI 客户端创建 skills 链接

将 claude-obsidian 通过 Junction 方式链接到各客户端 skills 目录：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/claude-obsidian`
- Windsurf：`.windsurf/skills/claude-obsidian`

使用 `New-Item -ItemType Junction` 创建。

**预期结果：** 各 AI 客户端可访问同一套 skills 能力。

---

### 步骤 5：配置 SOP skill 说明文件

创建 `skills/wiki-sop/SKILL.md`，至少定义以下模式：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查：校验步骤、清单与回链

**预期结果：** AI 具备统一的 SOP 工作规则。

---

### 步骤 6：配置 hooks 自动检查 SOP

修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

支持 hooks 的客户端可自动执行，不支持时改为手动触发。

**预期结果：** 会话开始时可自动发现应生成或更新的 SOP。

---

### 步骤 7：建立 Source 状态流转标准

统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：

- 含分步骤流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考：`status: processed`

**预期结果：** source 状态一致，便于 SOP 自动识别。

---

### 步骤 8：执行知识库导入、整理与查询

使用原生命令：

- `ingest`：导入并自动记笔记
- 自动分类到 `concepts`、`entities`、`sources`
- `lint the wiki`：执行定期维护
- `query:`：查询知识

建议先整理 source，再生成 SOP。

**预期结果：** 知识库内容已导入、整理并可查询。

---

### 步骤 9：生成或更新 SOP

根据客户端能力处理：

- 自动方式：Claude Code 通过 hooks 自动提示生成或更新
- 手动方式：在其他客户端输入“整理SOP”或指定主题

SOP 应包含：

- 适用场景
- 前置条件
- 操作步骤
- 预期结果
- 检查清单
- FAQ
- 来源回链

**预期结果：** `wiki/sop` 中生成或更新了结构完整的 SOP。

---

### 步骤 10：执行 SOP 质量检查与维护

检查以下内容：

- 步骤是否可执行
- 每步是否有明确结果
- checklist 是否可复核
- FAQ 是否覆盖常见问题
- 是否包含完整来源回链
- source 更新后是否重新审查

建议结合 `lint the wiki` 定期维护。

**预期结果：** SOP 可复用、可维护、可追溯。

## 5. 检查清单

- [ ] 已克隆仓库并确认 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已创建所需 AI 客户端 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 自动检查规则
- [ ] 已建立 source 状态流转与标记规则
- [ ] 已验证 `ingest`、`lint the wiki`、`query:` 可用
- [ ] 已完成 SOP 生成或更新测试
- [ ] 已完成 SOP 质量检查与回链校验

## 6. 常见问题（FAQ）

### Q1：项目是否原生支持自动记笔记？
支持，`ingest` 可自动写入资料并参与知识整理。

### Q2：SOP 是否默认自动生成？
不是。需要额外配置 SOP skill 与 hooks 规则。

### Q3：哪些客户端支持自动检查 SOP？
Claude Code 支持 hooks，可自动检查；其他客户端通常依赖手动触发。

### Q4：什么资料应标记为 `sop-ready`？
任何包含明确分步骤流程、可复用经验或最佳实践的资料。

### Q5：何时应提示生成 SOP？
当同主题 `sop-ready` 资料达到 3 个以上、存在高优先级资料，或 source 比 SOP 更新时。

### Q6：不支持 hooks 的客户端如何处理？
通过 skills 手动触发，例如输入“整理SOP”或指定主题生成。

### Q7：SOP 生成后还需要维护吗？
需要，尤其在 source 更新后，应重新检查并同步修订 SOP。

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]