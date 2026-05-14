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

本 SOP 用于在 Windows 环境中标准化部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并建立 SOP 自动检查、生成与更新机制，使知识沉淀、流程复用和跨客户端引用可持续运行。

## 2. 适用场景

- 需要在 Windows 上搭建本地知识库并支持 AI 自动记笔记
- 需要将资料按 concepts、entities、sources、sop 结构化整理
- 需要根据已积累的资料自动识别可 SOP 化主题
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套知识库
- 需要为 SOP 建立手动生成、自动提醒和更新检查流程

## 3. 前置条件

- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 本地已确定知识库路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 需要接入的 AI 客户端已在本机安装
- 具备创建目录、写入配置文件和建立 Junction 链接的权限

## 4. 标准操作步骤

### 步骤 1：克隆仓库并确认 Vault 根目录

在 PowerShell 中进入目标工作目录并克隆仓库。若仓库存在嵌套目录或下载后层级不符合预期，先整理为单一 vault 根目录。

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

建议定义统一变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且 Vault 路径明确。

---

### 步骤 2：创建标准目录结构

执行以下命令创建目录：

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
- `wiki/concepts`：概念知识
- `wiki/entities`：实体信息
- `wiki/sources`：来源资料
- `wiki/sop`：标准操作流程
- `_templates`：模板

**预期结果：** Vault 具备完整标准目录结构。

---

### 步骤 3：写入 Obsidian 基础配置

在 `.obsidian` 中补齐以下配置：

1. `.obsidian/graph.json`
   - 配置知识图谱颜色分组
   - 建议将 `sop` 设为黄色

2. `.obsidian/app.json`
   - 排除 AI 工作文件
   - 降低中间文件干扰

3. `.obsidian/appearance.json`
   - 启用 CSS snippets

**预期结果：** Obsidian 能正常识别并展示 Vault，SOP 节点在图谱中可清晰区分。

---

### 步骤 4：为多 AI 客户端建立 skills Junction 链接

将 Vault 中的 skills 目录通过 Junction 暴露给各客户端。常见目标：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

**预期结果：** 多个 AI 客户端共用同一套 skills 配置。

---

### 步骤 5：建立 SOP 专用 skill

创建 `skills/wiki-sop/SKILL.md`，定义以下能力：

- 自动检查模式：扫描 `status: sop-ready` 资料
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查：验证步骤、清单、回链是否完整

建议最低标准：
- 标题清晰
- 步骤编号
- 每步可执行
- 含前置条件、检查清单、FAQ、相关来源

**预期结果：** AI 可按统一 SOP 规则运行检查、生成和维护流程。

---

### 步骤 6：配置 hooks 自动检查机制

修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

支持 hooks 的客户端可自动执行；不支持的客户端则通过 skills 手动触发同等逻辑。

**预期结果：** 会话开始时自动识别待生成或待更新的 SOP。

---

### 步骤 7：执行 Source 状态流转标准化

统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

规则：
- 分步骤操作流程 → `status: sop-ready`
- 最佳实践或经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** Source 可被自动识别和筛选，SOP 候选不遗漏。

---

### 步骤 8：运行知识摄入、整理与查询流程

执行日常工作流：

- 使用 `ingest` 导入资料
- 自动分类到 `concepts`、`entities`、`sources`
- 定期执行 `lint the wiki`
- 使用 `query:` 进行知识查询

整理时主动识别可 SOP 化主题，并及时标记为 `sop-ready`。

**预期结果：** 知识库持续更新，且 SOP 候选持续积累。

---

### 步骤 9：生成或更新 SOP 文档

当出现以下条件时执行生成或更新：

- 同主题 `sop-ready` source ≥ 3
- 存在 `sop-priority: high`
- source 更新晚于 SOP
- 用户手动要求整理 SOP

输出到 `wiki/sop/`，结构应包括：
- 标题
- 适用场景
- 前置条件
- 步骤
- 检查清单
- FAQ
- 相关来源回链

**预期结果：** 形成可直接执行的 SOP 文档。

---

### 步骤 10：按客户端能力选择自动或手动触发方式

客户端差异：

- **Claude Code**：支持 hooks，可自动检查 SOP
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常仅支持 skills，需手动触发

建议统一触发口令：
- `整理SOP`
- `检查待生成SOP`
- `更新过期SOP`

**预期结果：** 不同客户端下均可稳定触发 SOP 流程。

---

### 步骤 11：执行质量复核与持续维护

对生成或更新后的 SOP 重点检查：

- 步骤是否具体、可执行
- 是否说明前置条件和成功标准
- 是否包含 checklist
- 是否包含 FAQ
- 是否回链对应 sources
- 是否与知识图谱和目录结构一致

维护动作：
- 定期运行 `lint the wiki`
- 定期扫描 `sop-ready`
- source 更新后检查 SOP 是否过期
- 失效 SOP 及时修订或归档

**预期结果：** SOP 长期保持有效、可追溯、可复用。

## 5. 检查清单

- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已完成 `.obsidian` 基础配置
- [ ] 已为所需 AI 客户端创建 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查规则
- [ ] 已建立 source 状态流转标准
- [ ] 已启用 `sop-priority: high` 规则
- [ ] 已可执行 `ingest`、`lint the wiki`、`query:`
- [ ] 已成功生成或更新至少一个 SOP
- [ ] 已明确各客户端的触发方式

## 6. 常见问题

### Q1：这个项目是否原生支持 AI 自动记笔记和知识分类？
支持。可通过 `ingest` 导入资料，并自动分类到相关目录。

### Q2：SOP 自动生成是不是开箱即用？
不是。需要额外配置 SOP 专用 skill 和 hooks 规则。

### Q3：Windows 环境下没有 setup 脚本怎么办？
可使用 PowerShell 手动创建目录、写入配置并建立 Junction，达到 setup 等效效果。

### Q4：哪些客户端支持自动检查 SOP？
来源中明确 Claude Code 支持 hooks，可自动检查；其他客户端通常需手动触发。

### Q5：什么时候把 source 标记为 `sop-ready`？
当资料包含可复用的步骤、最佳实践或经验总结时，应标记为 `sop-ready`。

### Q6：什么情况下应该生成 SOP？
当同主题已有多个 `sop-ready` source、存在高优先级 source、source 更新晚于现有 SOP，或用户手动要求时，应生成或更新 SOP。

### Q7：为什么推荐 Junction 而不是复制 skills？
因为 Junction 能让多个客户端共用同一份配置，减少重复维护和版本不一致。

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
