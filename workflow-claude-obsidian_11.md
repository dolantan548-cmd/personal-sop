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

本 SOP 用于在 Windows 环境中部署 claude-obsidian 知识库，并完成以下能力配置：

- AI 自动写笔记与知识摄取
- sources/concepts/entities 的分类整理
- SOP 候选资料标记与自动检查
- 基于多来源资料生成或更新 SOP
- 多 AI 客户端共享同一套 skills

适用于希望将知识管理、流程沉淀与 AI 协作整合到同一个 Obsidian vault 的场景。

---

## 2. 适用场景

- 需要在 Windows 上初始化 claude-obsidian
- 需要统一管理知识库与 SOP 资产
- 需要让多个 AI 客户端共享同一套技能配置
- 需要自动或半自动发现 SOP 候选资料并生成 SOP

---

## 3. 前置条件

- Windows 系统
- 已安装 Git
- 可使用 PowerShell
- 已安装至少一个 AI 客户端（Claude Code / Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf）
- 已确定 vault 根目录
- 可访问 claude-obsidian 仓库

---

## 4. 标准步骤

### 步骤 1：克隆项目并确认 vault 路径

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果存在嵌套目录，先整理为单一 vault 根目录。然后设置变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已有可用的 claude-obsidian 根目录，后续命令可统一基于 `$VAULT` 执行。

### 步骤 2：创建标准目录结构

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

**预期结果：** vault 中已具备 claude-obsidian 所需的基础目录，能够容纳原始资料、知识条目与 SOP 文档。

### 步骤 3：写入 Obsidian 基础配置

创建或更新以下文件：

- `.obsidian/graph.json`：设置图谱颜色分组，建议将 `sop` 分类设为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

如已有配置，采用合并策略，避免覆盖已有个性化设置。

**预期结果：** Obsidian 能正确加载 vault，并显示适配后的图谱与外观设置。

### 步骤 4：为多 AI 客户端创建 skills 链接

使用 `New-Item -ItemType Junction` 将 skills 目录链接到客户端技能路径。示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

按需为以下客户端创建：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

**预期结果：** 多个 AI 客户端可共享同一套 claude-obsidian skills。

### 步骤 5：创建 SOP 专用 skill

新增文件：`skills/wiki-sop/SKILL.md`

至少包含以下能力说明：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按主题生成 SOP
- 更新模式：当 source 更新时提示更新 SOP
- 质量检查：验证步骤可执行性、检查清单、来源回链完整性

建议明确：

- 输入格式
- 触发条件
- 输出路径
- 命名规范
- 更新判定规则

**预期结果：** 客户端可根据统一说明执行 SOP 相关任务。

### 步骤 6：配置 hooks 自动检查 SOP

修改 `hooks/hooks.json`，在 `SessionStart` 中加入以下检查逻辑：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数 ≥ 3 时提示生成 SOP
- `sop-priority: high` 时优先提示生成 SOP
- 当 source 比 SOP 新时提示更新 SOP

如客户端支持，也可增加 `PostToolUse` 自动提交或操作记录逻辑。

**预期结果：** 支持 hooks 的客户端在会话开始时自动识别 SOP 候选或发现待更新 SOP。

### 步骤 7：建立 source 状态流转规范

统一采用以下状态模型：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：

- 含分步骤操作流程：`status: sop-ready`
- 含最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

建议在 frontmatter 中维护这些字段，便于自动扫描与筛选。

**预期结果：** sources 可被系统稳定识别为普通资料、SOP 候选资料或已综合资料。

### 步骤 8：按客户端能力执行 SOP 生成与维护

执行方式如下：

- **Claude Code**：可通过 hooks 自动检查 SOP 候选
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常需手动触发，如输入“整理SOP”或“根据 sources 生成 SOP”

生成 SOP 时，建议明确：

- 主题
- 来源范围
- 输出路径（如 `wiki/sop/主题名.md`）
- 输出结构（场景、前置条件、步骤、检查清单、FAQ、来源回链）

**预期结果：** `wiki/sop/` 中生成内容结构完整、可执行、可维护的 SOP。

### 步骤 9：验证部署结果并进行首次试运行

建议按以下顺序验证：

1. ingest 一份资料
2. 整理到 `wiki/sources/`
3. 设置 `status` 与 `sop-priority`
4. 启动支持 hooks 的客户端观察自动提示，或手动触发 skill
5. 检查 `wiki/sop/` 是否生成对应 SOP
6. 在 Obsidian 图谱中确认 SOP 节点分组是否正常
7. 必要时执行 `lint the wiki`

**预期结果：** 从资料导入到 SOP 生成的完整链路可正常运行。

---

## 5. 检查清单

- [ ] 已克隆仓库并确认 vault 路径
- [ ] 已创建全部标准目录
- [ ] 已配置 Obsidian 基础设置
- [ ] 已创建至少一个客户端的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SOP 检查规则
- [ ] 已建立 source 状态标记规范
- [ ] 已明确各客户端是自动触发还是手动触发
- [ ] 已完成一次端到端试运行

---

## 6. 最佳实践

1. 优先通过 frontmatter 管理 `status` 与 `sop-priority`，不要依赖人工记忆。
2. 当同一主题已有多个来源时，再综合为 SOP，避免单来源流程失真。
3. 对高复用价值资料设置 `sop-priority: high`，让系统优先关注。
4. 客户端不支持 hooks 时，保留统一的手动触发口令，例如“整理SOP”。
5. 不要覆盖现有 Obsidian 配置，采用增量合并。
6. 定期执行知识库维护，如 `lint the wiki`，保证链接、结构与分类质量。

---

## 7. 常见问题（FAQ）

### Q1：为什么有些客户端不会自动提示生成 SOP？
因为并非所有客户端都支持 hooks。Claude Code 支持 `hooks.json`，可自动检查；其他多数客户端仅支持 skills，需要手动触发。

### Q2：哪些 source 应该标记为 `sop-ready`？
凡是包含明确执行步骤、最佳实践、经验总结、可复用方法的资料，都适合标记为 `sop-ready`。高价值内容可增加 `sop-priority: high`。

### Q3：什么时候应该生成 SOP？
当同一主题已有至少 3 条相关来源，或单条资料已被标记为高优先级时，应生成 SOP。若 sources 更新且晚于 SOP，也应更新 SOP。

### Q4：Obsidian 配置已有内容，是否可以覆盖？
不建议。应按字段合并，以保留原有使用习惯与插件设置。

### Q5：如何验证 skills 链接是否生效？
检查链接是否为 Junction，且客户端能识别并调用对应 skill；若能执行知识整理或 SOP 生成任务，则说明链接正常。

---

## 8. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]