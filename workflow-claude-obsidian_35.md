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
本 SOP 用于在 Windows 环境中部署 claude-obsidian 知识库，建立标准目录结构、Obsidian 配置、跨 AI 客户端 skills 链接，以及 SOP 自动检查与生成机制，确保知识可被持续入库、分类、维护，并沉淀为可复用 SOP。

## 2. 适用场景
- 需要在 Windows 上初始化 claude-obsidian
- 需要让 AI 自动写入和整理知识笔记
- 需要把 sources 中的流程型资料沉淀为 SOP
- 需要在多个 AI 客户端之间共享同一套技能配置
- 需要建立 SOP 自动检查、手动生成和更新提示机制

## 3. 前置条件
- Windows 环境，具备 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定 Vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装或可访问一个或多个 AI 客户端
- 当前用户对 Vault 目录有读写权限

## 4. 操作步骤

### 步骤 1：克隆 claude-obsidian 仓库并确认 Vault 路径
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

确认统一的 Vault 根路径：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在仓库目录，且后续配置将以统一 Vault 路径为准。

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

**预期结果：** 已创建标准目录结构，可供知识分类和 SOP 存储使用。

### 步骤 3：写入 Obsidian 基础配置
在 `.obsidian` 目录中创建或更新：

- `graph.json`：配置知识图谱颜色分组，`sop` 使用黄色高亮
- `app.json`：排除 AI 工作文件
- `appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 中的图谱分组清晰，AI 中间文件不会干扰使用，样式片段生效。

### 步骤 4：为多个 AI 客户端创建 skills 链接
按需要将 Vault 中的 skills 链接到各客户端。示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

常见客户端目标目录：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/`
- `.windsurf/skills/`

**预期结果：** 多个 AI 客户端可共享同一套 claude-obsidian skills。

### 步骤 5：创建 wiki-sop 技能说明文件
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：sources 更新后提示刷新 SOP
- 质量检查：验证可执行性、检查清单、回链完整性

建议补充：
- 输入格式
- 输出路径（固定到 `wiki/sop/`）
- 命名规范
- 更新判定方式

**预期结果：** AI 客户端可依据技能定义执行 SOP 检查、生成和更新。

### 步骤 6：在 hooks 中配置 SOP 自动检查规则
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入规则：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数 `≥ 3` 时提示生成 SOP
- `sop-priority: high` 时提示优先生成 SOP
- source 比 SOP 更新时提示更新 SOP

如支持，可在其他钩子中增加自动 commit 或后处理逻辑。

**预期结果：** 支持 hooks 的客户端能在会话开始时自动识别 SOP 候选和更新需求。

### 步骤 7：建立 source 状态流转与自动标记规则
采用如下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 分步骤流程资料 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** source 状态统一，AI 能稳定识别哪些内容适合转 SOP。

### 步骤 8：执行知识入库与分类整理
使用项目原生命令：
- `ingest`：导入资料
- 自动分类到 `concepts`、`entities`、`sources`
- `lint the wiki`：执行定期维护
- `query:`：执行知识查询

整理 sources 时，补充 `status` 和 `sop-priority` 字段。

**预期结果：** 新资料已进入知识库并具备结构化状态信息。

### 步骤 9：按客户端能力触发 SOP 生成或更新
- **Claude Code**：优先使用 hooks 自动检查
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：手动输入如“整理SOP”或指定主题触发

生成时要求 AI：
1. 聚合同主题 sources
2. 生成可执行 SOP
3. 输出到 `wiki/sop/`
4. 补充来源回链
5. 如已有 SOP，则根据 source 更新时间执行更新

**预期结果：** 已在 `wiki/sop/` 中生成或更新 SOP 文件。

### 步骤 10：执行 SOP 质量检查与持续维护
每次生成后检查：
- 步骤是否清晰且可执行
- 是否包含检查清单
- 是否回链到相关 sources
- 是否基于最新 sources
- 是否符合目录与命名规范

定期检查 `sop-ready` 资料是否被及时转化，避免积压。

**预期结果：** SOP 可直接复用，来源可追溯，并能随知识库更新持续维护。

## 5. 检查清单
- [ ] 已成功克隆仓库并确认 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已完成 `.obsidian` 基础配置
- [ ] 已创建所需 AI 客户端的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查规则
- [ ] 已统一 source 状态流转与标记规则
- [ ] 已完成至少一次 ingest 和分类整理
- [ ] 已验证至少一个客户端可生成或更新 SOP
- [ ] 已确认 SOP 包含来源回链与检查清单

## 6. 常见问题

### Q1：claude-obsidian 是否原生支持 AI 自动记笔记和 SOP 生成？
A：自动记笔记、分类整理、查询和维护为原生支持；SOP 生成需要额外配置技能和触发机制。

### Q2：为什么 Claude Code 更适合做 SOP 自动检查？
A：因为它支持 `hooks.json`，可以在会话开始时自动扫描并提示生成或更新 SOP。

### Q3：哪些资料应标记为 `sop-ready`？
A：凡是具备明确步骤、可重复操作、最佳实践或经验总结的资料，都适合标记为 `sop-ready`。

### Q4：什么时候该生成 SOP？
A：当同主题 `sop-ready` 资料达到 3 个及以上、存在 `sop-priority: high`，或 source 比现有 SOP 更新时，应生成或更新 SOP。

### Q5：纯参考资料是否需要转成 SOP？
A：不需要。纯参考资料应保留为 `processed`，供查询和引用使用。

### Q6：SOP 质量检查最关键的点是什么？
A：可执行性、检查清单完整性和来源回链完整性最关键。

## 7. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]