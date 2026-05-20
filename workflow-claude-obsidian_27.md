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

本 SOP 用于指导在 Windows 环境中部署 `claude-obsidian`，并完成以下标准化配置：

- 初始化知识库目录结构
- 配置 Obsidian 基础文件
- 为多个 AI 客户端建立统一 skills 链接
- 建立 SOP 自动检查、生成、更新机制
- 规范 source 状态流转，持续沉淀 SOP 资产

该流程适用于希望将 AI 对话、资料与经验系统化沉淀到 Obsidian，并进一步生成可复用 SOP 的场景。

---

## 2. 适用场景

- 需要在 Windows 上部署 claude-obsidian 作为知识库与 SOP 中心
- 希望自动记录和整理 AI 工作产出
- 希望将高复用流程从 source 自动升级为 SOP
- 希望让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 共享同一套知识库能力
- 需要建立 SOP 生成、更新、引用的统一规范

---

## 3. 前置条件

- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定 Vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 至少安装一个 AI 客户端（Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等）
- 具备创建 Junction 链接的权限
- 了解基础 Obsidian 与 Markdown 文件结构

---

## 4. 标准操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

设置统一 Vault 路径变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

如存在嵌套目录或旧目录结构，先清理并统一为单一 Vault 根目录。

**预期结果：** 本地已成功获取项目，且 Vault 根目录已明确。

---

### 步骤 2：初始化知识库目录结构

执行以下命令创建标准目录：

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

**预期结果：** Vault 目录结构完整，包含 Obsidian 配置目录、原始资料目录、分类知识目录、SOP 目录和模板目录。

---

### 步骤 3：写入 Obsidian 基础配置

补齐以下配置文件：

1. `.obsidian/graph.json`
   - 配置知识图谱颜色分组
   - 建议 `sop` 节点使用黄色

2. `.obsidian/app.json`
   - 配置排除规则
   - 避免 AI 中间工作文件影响浏览与索引

3. `.obsidian/appearance.json`
   - 启用 CSS snippets

要求：
- 所有 JSON 文件必须语法有效
- 若团队已有模板，优先复用统一模板

**预期结果：** Obsidian 可正常识别图谱分组、排除规则和样式设置。

---

### 步骤 4：为多 AI 客户端创建统一 skills 链接

根据本机安装情况，使用 `New-Item -ItemType Junction` 创建链接。

支持目标包括：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/`
- Windsurf → `.windsurf/skills/`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

如父目录不存在，先创建父目录。

**预期结果：** 至少一个 AI 客户端已可访问共享 skills；多客户端可共用同一套知识库能力。

---

### 步骤 5：建立 SOP 自动生成 skill

创建文件：

`skills/wiki-sop/SKILL.md`

该 skill 至少应包含以下模式：

- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题后生成 SOP
- 更新模式：当 source 更新时提示或执行 SOP 更新
- 质量检查模式：验证步骤可执行性、检查清单与回链完整性

建议补充内容：

- 输入来源说明
- 触发条件
- 输出目录 `wiki/sop/`
- 命名规范
- source 引用规范
- 异常处理规则

**预期结果：** AI 已具备统一的 SOP 生成与维护操作说明。

---

### 步骤 6：配置 hooks 自动检查 SOP 机会

编辑：

`hooks/hooks.json`

在 `SessionStart` 中加入 SOP 自动检查逻辑：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如果客户端支持其他 hooks（例如 PostToolUse），可额外配置自动提交或维护操作，但不得替代 SessionStart 的核心 SOP 检查。

**预期结果：** 支持 hooks 的客户端在会话开始时可自动识别 SOP 生成或更新机会。

---

### 步骤 7：实施 Source 状态流转与自动标记规则

统一 source 生命周期：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践、经验总结、高复用流程 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料、无明确操作流程 → `status: processed`

要求：
- 状态字段写入 frontmatter
- 字段名和值保持统一
- SOP 生成后保留与 source 的双向链接

**预期结果：** 系统能稳定识别哪些资料可转为 SOP，哪些资料仅作为参考保存。

---

### 步骤 8：执行笔记摄取、分类与维护

使用项目原生能力执行日常知识维护：

- 用 `ingest` 命令导入原始资料
- 自动分类到 `concepts`、`entities`、`sources`
- 定期执行 `lint the wiki`
- 使用 `query:` 检索知识

处理每条 source 时，应补充：

- 主题
- 状态
- 优先级
- 关联链接

**预期结果：** 知识库持续得到结构化输入，source 可被稳定查询并用于 SOP 合成。

---

### 步骤 9：按客户端能力触发 SOP 生成或更新

客户端差异如下：

- **Claude Code**：支持 hooks，可自动检查 SOP 机会
- **Kimi Code**：支持 skills，通常需手动触发
- **Codex CLI**：支持 skills，通常需手动触发
- **Gemini CLI**：支持 skills，通常需手动触发
- **Cursor / Windsurf**：通常需手动触发

满足以下任一条件时，应生成或更新 SOP：

- 同主题 `sop-ready` source 达到 3 条及以上
- 某条 source 标记了 `sop-priority: high`
- source 内容晚于现有 SOP
- 用户明确要求整理某主题 SOP

建议将产物输出到：

`wiki/sop/`

并保留到 source 的双向引用。

**预期结果：** SOP 已生成或更新，并保存在统一目录下。

---

### 步骤 10：对 SOP 进行质量检查并完成发布

发布前至少检查：

- 步骤是否按顺序编排
- 每步是否可执行
- 是否包含适用场景、前置条件、检查清单、FAQ
- 是否正确引用相关 sources
- 是否具备完整回链
- 是否适合被其他 AI 客户端直接复用

如发现问题，应回到 source 或生成逻辑中补充并重新生成。

**预期结果：** 最终 SOP 可执行、可追溯、可复用、可维护。

---

## 5. 检查清单

- [ ] 已成功克隆 claude-obsidian 仓库并确定 Vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已写入 graph.json、app.json、appearance.json
- [ ] 已为至少一个 AI 客户端创建 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP AUTO-CHECK 逻辑
- [ ] 已统一 source 状态字段与标记规则
- [ ] 已验证 ingest、query、lint the wiki 可用
- [ ] 已测试 SOP 自动检查或手动触发生成
- [ ] 已将 SOP 保存到 `wiki/sop/` 并建立回链

---

## 6. 常见问题（FAQ）

### Q1：Windows 下没有 setup 脚本怎么办？
A：直接使用 PowerShell 手动创建目录、配置文件和 Junction 链接即可，这就是 setup 的等效实现方式。

### Q2：哪些客户端支持自动检查 SOP？
A：目前资料表明 Claude Code 支持 `hooks.json`，可在 `SessionStart` 自动检查；其他客户端多为 skills 手动触发。

### Q3：什么时候把 source 标记为 `sop-ready`？
A：当资料中存在清晰的分步骤流程，或具有高复用价值的最佳实践、经验总结时，应标记为 `sop-ready`。

### Q4：source 不足 3 条还能生成 SOP 吗？
A：可以。3 条及以上是自动提示阈值，不是强制要求。若用户明确要求，或存在 `sop-priority: high`，也可直接生成。

### Q5：SOP 何时需要更新？
A：当 source 更新晚于现有 SOP，或新增了关键步骤、最佳实践、异常处理内容时，应更新 SOP。

### Q6：为什么 frontmatter 状态字段必须统一？
A：因为 hooks 和 skills 的自动扫描依赖固定字段。如果字段不统一，系统将无法可靠判断 source 是否适合转 SOP。

### Q7：SOP 生成后 source 还能删吗？
A：不建议删除。source 是 SOP 的依据和上下文，应保留并建立双向引用，便于追溯和持续更新。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
