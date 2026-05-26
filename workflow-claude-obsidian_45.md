---
type: sop
category: workflow
status: active
created: 2026-05-26
updated: 2026-05-26
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于标准化在 Windows 环境中部署 `claude-obsidian` 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查、生成与更新机制。目标是实现：

- AI 自动记笔记
- 知识分类整理
- SOP 自动提示与沉淀
- 多 AI 客户端共用同一知识库与技能体系

---

## 2. 适用场景

- 需要在 Windows 上初始化 `claude-obsidian` knowledge vault
- 需要为 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 配置统一 skills
- 需要把原始资料整理成结构化知识库
- 需要把可复用流程沉淀为 SOP
- 需要让多个 AI 工具共享同一个 Obsidian vault

---

## 3. 前置条件

- Windows 环境
- 已安装 Git
- 可使用 PowerShell
- 已确定 vault 路径，例如：`D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装一个或多个 AI 客户端
- 对 skills、hooks、Obsidian vault 结构有基本认知

---

## 4. 操作步骤

### 步骤 1：克隆仓库并确认 vault 根目录

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在嵌套目录，手动整理为单一根目录，例如：

`D:\dolan_env\temp\project\personal\claude-obsidian`

**预期结果：** 本地已存在清晰、可访问的 `claude-obsidian` 根目录。

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

目录说明：

- `.raw`：原始输入资料
- `wiki/sources`：整理后的来源资料
- `wiki/concepts`：概念类知识
- `wiki/entities`：实体类知识
- `wiki/sop`：流程类 SOP 文档
- `_templates`：模板目录

**预期结果：** 所有标准目录创建完成。

---

### 步骤 3：写入 Obsidian 基础配置

补齐以下配置文件：

- `.obsidian/graph.json`：设置知识图谱颜色分组，`sop` 建议为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

如仓库已有配置，优先复用；如无，则手动创建合法 JSON 文件。

**预期结果：** Obsidian 可正常识别 vault，图谱和显示规则符合知识管理需求。

---

### 步骤 4：为多 AI 客户端创建 skills Junction 链接

根据已安装工具，在对应 skills 目录下创建指向 `claude-obsidian` 的 Junction 链接。

常见目标：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/`
- Windsurf：`.windsurf/skills/`

使用 `New-Item -ItemType Junction` 创建链接。执行前先确保父目录存在。

**预期结果：** 目标客户端均能识别 `claude-obsidian` skill。

---

### 步骤 5：建立 SOP 专用 skill

创建：

`skills/wiki-sop/SKILL.md`

至少定义以下能力：

1. 自动检查模式：扫描 `status: sop-ready`
2. 手动生成模式：按主题生成 SOP
3. 更新模式：sources 更新后提示更新 SOP
4. 质量检查模式：检查步骤可执行性、checklist、来源回链

建议在 skill 中明确：

- 输入格式
- 输出位置：`wiki/sop/`
- 命名规范
- 更新策略

**预期结果：** 客户端可调用统一的 SOP 生成能力。

---

### 步骤 6：配置 hooks 自动检查 SOP 机会

修改 `hooks/hooks.json`，在 `SessionStart` 中加入自动检查逻辑：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 `≥ 3` 时提示生成 SOP
- `sop-priority: high` 时优先提示生成 SOP
- 若 sources 比 SOP 更新，则提示更新 SOP

如客户端支持，可增加 `PostToolUse` 的自动记录或提交逻辑。

**预期结果：** 支持 hooks 的客户端会在会话开始时自动发现 SOP 生成或更新机会。

---

### 步骤 7：标准化 source 状态流转与自动标记规则

统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 含分步骤操作流程：`status: sop-ready`
- 含最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

建议在 frontmatter 中记录状态、主题、更新时间、关联 SOP 等字段。

**预期结果：** sources 状态统一，AI 能识别哪些资料适合沉淀为 SOP。

---

### 步骤 8：执行资料摄取与知识整理

使用项目原生能力：

- `ingest`：导入资料
- 自动分类到 `concepts` / `entities` / `sources`
- `lint the wiki`：执行一致性维护
- `query:`：执行知识查询

重点保证：

- source 内容完整
- 主题清晰
- 元数据规范
- 与概念、实体、SOP 建立回链

**预期结果：** 知识库结构清晰，可供 SOP 合成与查询复用。

---

### 步骤 9：按客户端能力触发 SOP 生成或更新

按客户端差异执行：

- **Claude Code**：优先自动检查 + 自动提示
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常手动触发，例如输入“整理SOP”

生成时应输出到：

`wiki/sop/`

并包含以下结构：

- 标题
- 目的
- 适用场景
- 前置条件
- 步骤
- 检查清单
- FAQ
- 来源回链

**预期结果：** 成功生成或更新 SOP，并可被多个客户端读取与引用。

---

### 步骤 10：验收并持续维护 SOP 体系

完成后执行以下检查：

1. 步骤是否具体、可执行、可复现
2. 是否包含 checklist、FAQ、来源回链
3. source 是否比 SOP 更新
4. SOP 是否位于 `wiki/sop/`
5. 图谱分组是否正确
6. 至少一个客户端是否可成功读取该 SOP

后续定期执行：

- `lint the wiki`
- `SessionStart` 自动检查
- source 状态复核
- SOP 更新提示处理

**预期结果：** SOP 体系稳定、可维护、可跨客户端复用。

---

## 5. 检查清单

- [ ] 已克隆仓库并确认 vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已创建至少一个 skills Junction 链接
- [ ] 已建立 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 自动检查逻辑
- [ ] 已定义 source 状态流转与自动标记规则
- [ ] 已完成资料 ingest 与整理
- [ ] 已生成或更新至少一个 SOP
- [ ] 已验证跨客户端可引用

---

## 6. 常见问题 FAQ

### Q1：claude-obsidian 是否原生支持自动记笔记和分类整理？
支持。可通过 `ingest` 导入资料，并自动整理到 `concepts`、`entities`、`sources`。

### Q2：SOP 自动生成是否开箱即用？
不是完全开箱即用。项目具备模板和知识组织能力，但自动触发通常需要配置 `skills/wiki-sop/SKILL.md` 和 `hooks/hooks.json`。

### Q3：哪些客户端支持自动 SOP 检查？
来源中明确 Claude Code 支持 hooks 自动检查；其他客户端通常以手动触发为主。

### Q4：没有 hooks 的客户端还能用吗？
可以。可手动调用相关 skill，或直接要求客户端“整理SOP”。

### Q5：什么样的资料应标记为 `sop-ready`？
凡是包含分步骤流程、可复用操作方法、经验总结或最佳实践的资料，都适合标记为 `sop-ready`。

### Q6：为什么要创建 Junction 而不是复制 skills？
Junction 可让多个客户端共享同一份 skills，避免多份副本不一致。

### Q7：何时应更新已有 SOP？
当 source 内容新增、时间戳更新，或同主题资料积累到足够数量时，应重新检查并更新 SOP。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
