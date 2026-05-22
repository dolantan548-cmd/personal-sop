---
type: sop
category: workflow
status: active
created: 2026-05-23
updated: 2026-05-23
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于规范在 Windows 环境中部署 `claude-obsidian` 知识库，并完成以下目标：

- 启用 AI 自动记笔记与分类整理
- 建立统一的知识库目录结构
- 让多个 AI 客户端共享同一套 skills
- 配置 SOP 自动检查、手动生成与更新提醒机制
- 保证 SOP 文档可执行、可追溯、可持续维护

---

## 2. 适用场景

适用于以下情况：

- 需要在 Windows 上搭建 `claude-obsidian`
- 需要沉淀工作知识并转化为标准流程
- 需要将多份 source 资料汇总成可执行 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 之间复用同一知识库能力

---

## 3. 前置条件

- Windows 系统，支持 PowerShell
- 已安装 Git
- 拥有目标目录写权限
- 可访问 `claude-obsidian` 仓库
- 已安装至少一个 AI 客户端
- 知道本机用户目录位置，用于创建 skills Junction

---

## 4. 标准操作步骤

### 步骤 1：克隆 claude-obsidian 项目

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果仓库目录出现嵌套，手动整理为统一根目录：

`D:\dolan_env\temp\project\personal\claude-obsidian`

**预期结果：** 本地存在可用的 vault 根目录。

---

### 步骤 2：创建标准 vault 目录结构

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

目录标准：

- `.raw`：原始资料
- `wiki/concepts`：概念
- `wiki/entities`：实体
- `wiki/sources`：来源资料
- `wiki/sop`：SOP 成品
- `_templates`：模板文件

**预期结果：** 标准目录结构完整可用。

---

### 步骤 3：初始化 Obsidian 配置

创建并维护以下文件：

- `.obsidian/graph.json`：知识图谱颜色配置，建议将 SOP 设为黄色
- `.obsidian/app.json`：排除 AI 工作中间文件
- `.obsidian/appearance.json`：启用 CSS snippets

如已有配置，按现有内容合并，不要覆盖有效设置。

**预期结果：** Obsidian 能正确识别和展示 vault。

---

### 步骤 4：为多 AI 客户端创建 skills 链接

使用 Windows Junction 将同一套 skills 链接到各客户端目录，例如：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

可按需为以下客户端创建链接：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

**预期结果：** 多个客户端共享同一套 skills。

---

### 步骤 5：建立 SOP 专用 skill

创建文件：

`skills/wiki-sop/SKILL.md`

该 skill 至少应定义以下能力：

- 自动检查模式
- 手动生成模式
- 更新模式
- 质量检查模式

建议明确：

- 输入来源
- 触发条件
- 输出目录 `wiki/sop/`
- SOP 标准结构
- 回链要求

**预期结果：** SOP skill 已具备统一规范。

---

### 步骤 6：配置 hooks 自动检查 SOP 机会

编辑：

`hooks/hooks.json`

在 `SessionStart` 中加入以下逻辑：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 `>= 3` 时提示生成 SOP
- `sop-priority: high` 时优先提示生成 SOP
- source 新于 SOP 时提示更新 SOP

如客户端支持，可加入 `PostToolUse` 自动提交逻辑。

**预期结果：** 支持 hooks 的客户端可自动发现 SOP 候选主题。

---

### 步骤 7：统一 source 状态流转规则

标准流转如下：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

建议将元数据写入 source 文档头部。

**预期结果：** source 文档可被系统自动判断是否适合生成 SOP。

---

### 步骤 8：执行知识摄取与维护

按项目原生工作流执行：

- 使用 `ingest` 导入资料
- 自动分类到 `concepts`、`entities`、`sources`
- 使用 `lint the wiki` 做维护
- 使用 `query:` 检索知识

同时检查 source 是否具备状态标签。

**预期结果：** 知识库持续增长，且可支撑 SOP 提炼。

---

### 步骤 9：触发 SOP 生成或更新

按客户端能力执行：

- **Claude Code**：依赖 hooks 自动检查并提示生成/更新
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：手动输入“整理SOP”或“根据该主题生成 SOP”

输出统一写入：

`wiki/sop/`

SOP 应包含：

- 标题
- 目的
- 适用场景
- 前置条件
- 步骤
- 检查清单
- 来源回链

**预期结果：** 已生成结构统一的 SOP 文档。

---

### 步骤 10：执行质量检查与持续更新

检查以下内容：

- 步骤是否可执行
- 每步是否有明确成功标准
- 检查清单是否完整
- 是否包含 source 回链
- source 更新后是否触发 SOP 更新提醒

建议定期复查高价值 SOP。

**预期结果：** SOP 持续有效，且与 sources 保持同步。

---

## 5. 检查清单

- [ ] 已完成仓库克隆并确认 vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已初始化 Obsidian 配置文件
- [ ] 已创建至少一个 AI 客户端的 skills Junction
- [ ] 已建立 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SessionStart 检查逻辑
- [ ] 已建立 source 状态与优先级规则
- [ ] 已验证 `ingest`、`lint the wiki`、`query:` 可用
- [ ] 已成功触发 SOP 生成或更新
- [ ] 已完成至少 1 份 SOP 的质量检查

---

## 6. 最佳实践

1. **统一维护一套 skills**：始终使用 Junction，而不是复制多份目录。
2. **优先结构化 source**：source 的元数据越规范，自动生成 SOP 的质量越高。
3. **高价值资料尽早标记**：对最佳实践类资料增加 `sop-priority: high`。
4. **自动与手动并行**：有 hooks 的客户端走自动检查，无 hooks 的客户端保留手动触发口令。
5. **保持回链完整**：每份 SOP 都应能追溯到来源资料。
6. **定期维护**：通过 `lint the wiki` 和 source 更新复查，防止 SOP 过时。

---

## 7. 常见问题

### Q1：claude-obsidian 是否原生支持 SOP 自动生成？

A：具备模板和流程基础，但要实现稳定的自动检查和提示，需要额外配置 skill 与 hooks。

### Q2：为什么 Claude Code 比其他客户端更适合自动检查？

A：因为它支持 `hooks.json`，可以在 `SessionStart` 自动扫描 SOP 候选资料。

### Q3：没有 hooks 的客户端怎么办？

A：仍可通过 skills 手动触发，例如输入“整理SOP”。

### Q4：什么资料最适合转成 SOP？

A：可重复执行、步骤清晰、具备复用价值的操作流程和最佳实践资料。

### Q5：何时应该更新 SOP？

A：当 source 有更新、同主题资料变多，或现有 SOP 已不再匹配最新实践时，应立即更新。

---

## 8. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
