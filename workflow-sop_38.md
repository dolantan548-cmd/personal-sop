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

# 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于标准化在 Windows 环境中部署 `claude-obsidian` 知识库、配置多 AI 客户端共享的 skills 链接，并启用 SOP 自动检查、生成与更新提醒机制。执行完成后，可实现：

- AI 自动记笔记与知识沉淀
- 资料自动分类到知识库结构中
- 根据 source 状态识别可复用流程
- 自动或手动生成 SOP
- 多个 AI 客户端共享同一套知识与 SOP 规则

---

## 2. 适用场景

- 需要在 Windows 上搭建可复用的 AI 知识库
- 需要将 AI 对话、资料和经验沉淀为结构化笔记
- 需要从多个资料源中提炼 SOP
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等工具共享知识库能力

---

## 3. 前置条件

- Windows 系统
- 可使用 PowerShell
- 已安装 Git
- 已安装 Obsidian
- 有本地项目目录，例如 `D:\dolan_env\temp\project\personal`
- 至少已安装一个支持 skills 的 AI 客户端
- 具备创建目录、写配置文件和创建 Junction 的权限

---

## 4. 标准操作步骤

### 步骤 1：克隆 claude-obsidian 项目

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果存在多层嵌套目录，整理到统一 vault 根目录，例如：

```text
D:\dolan_env\temp\project\personal\claude-obsidian
```

**预期结果：** 本地已存在 `claude-obsidian` 目录，且后续使用的 vault 路径唯一明确。

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

目录职责：

- `.raw`：原始资料
- `wiki/concepts`：概念知识
- `wiki/entities`：实体知识
- `wiki/sources`：整理后的资料
- `wiki/sop`：SOP 文档
- `_templates`：模板文件

**预期结果：** 所有标准目录均已创建成功。

### 步骤 3：配置 Obsidian 基础文件

创建或补充以下配置：

- `.obsidian/graph.json`：配置知识图谱分组与颜色，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件与临时文件
- `.obsidian/appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 能正确加载图谱、外观与排除规则，SOP 节点可被清晰识别。

### 步骤 4：为 AI 客户端创建 skills 链接

按实际使用的客户端创建 Junction：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/claude-obsidian`
- Windsurf：`.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

如父目录不存在，请先创建。

**预期结果：** 对应客户端的 skills 目录下已出现 `claude-obsidian` 链接。

### 步骤 5：创建 SOP 技能定义文件

在以下路径创建文件：

```text
skills/wiki-sop/SKILL.md
```

内容至少覆盖：

- 自动检查模式
- 手动生成模式
- 更新模式
- 质量检查模式

建议要求：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的文档
- 支持按主题生成 SOP
- 支持 sources 更新后提醒更新 SOP
- 检查步骤可执行性、检查清单和回链完整性

**预期结果：** `SKILL.md` 可作为跨 AI 客户端通用的 SOP 行为说明。

### 步骤 6：配置 hooks 自动检查 SOP

修改：

```text
hooks/hooks.json
```

在 `SessionStart` 中加入规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如有现有配置，务必按 JSON 结构正确合并。

**预期结果：** Claude Code 在启动会话时可自动检查是否存在应生成或应更新的 SOP。

### 步骤 7：定义 source 状态流转规则

统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 分步骤操作流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

建议在文档 frontmatter 中统一维护：

- `status`
- `sop-priority`
- `updated`

**预期结果：** sources 可被系统稳定识别和筛选，用于后续 SOP 生成。

### 步骤 8：执行日常导入与 SOP 生成流程

标准日常动作如下：

- 使用 `ingest` 导入资料
- 由系统自动分类到 `concepts`、`entities`、`sources`
- 定期执行 `lint the wiki`
- 使用 `query:` 检索知识
- 生成 SOP：
  - Claude Code：自动检查并提示
  - 其他客户端：手动输入“整理SOP”或指定主题

满足以下条件时生成 SOP：

- 同主题 `sop-ready` source 数量大于等于 3
- `sop-priority: high`
- 现有 SOP 落后于 source

**预期结果：** `wiki/sop/` 中出现按主题整理的 SOP 文档。

### 步骤 9：按客户端能力制定使用策略

推荐策略：

- Claude Code：作为自动检查主入口
- Kimi Code / Codex CLI / Gemini CLI：作为手动触发入口
- Cursor / Windsurf：如支持 skills，则共享 SOP 规则与知识库引用

最佳实践：

- 自动化逻辑尽量集中在 Claude Code hooks
- 通用规则统一写入 `skills/wiki-sop/SKILL.md`
- 所有客户端共用同一 vault 路径

**预期结果：** 多客户端使用方式清晰，自动化与手动流程边界明确。

### 步骤 10：检查 SOP 质量并持续维护

每次生成或更新 SOP 后，检查：

- 步骤是否可执行
- 是否有前置条件
- 是否有预期结果
- 是否有检查清单
- 是否回链相关 sources
- source 是否比 SOP 更新
- Obsidian 图谱中是否归类正确

建议定期重新扫描 `sop-ready` 资料，避免 SOP 过时。

**预期结果：** SOP 保持可执行、可维护、可追溯。

---

## 5. 检查清单

- [ ] 已克隆项目
- [ ] 已创建标准目录结构
- [ ] 已配置 Obsidian 基础文件
- [ ] 已创建至少一个 AI 客户端的 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已建立 source 状态流转规范
- [ ] 已验证 ingest / lint / query 流程
- [ ] 已确认客户端自动化差异
- [ ] 已生成至少一份 SOP

---

## 6. 常见问题

### Q1：为什么其他客户端不能像 Claude Code 一样自动检查 SOP？

因为只有 Claude Code 在来源中明确支持 `hooks.json` 自动触发；其他客户端主要支持 skills，因此需手动触发。

### Q2：哪些资料要标记为 `sop-ready`？

包含步骤化操作流程、经验复盘、最佳实践的资料应标记为 `sop-ready`；高复用价值内容再加 `sop-priority: high`。

### Q3：什么时候生成新 SOP？

当同主题累计 3 份及以上 `sop-ready` source，或 source 被标记为高优先级时，应生成新 SOP。

### Q4：什么时候更新 SOP？

当 source 的更新时间晚于对应 SOP，或新增内容改变了流程时，应更新 SOP。

### Q5：Junction 创建失败怎么办？

先创建父目录，确认 PowerShell 权限足够，再重新执行 `New-Item -ItemType Junction`。

### Q6：SOP 在 Obsidian 图谱中没有明显区分怎么办？

检查 `.obsidian/graph.json` 中是否已为 `sop` 分类配置颜色和规则。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
