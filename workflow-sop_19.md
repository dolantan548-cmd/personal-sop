---
type: sop
category: workflow
status: active
created: 2026-05-18
updated: 2026-05-18
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于标准化在 Windows 环境中部署 claude-obsidian 知识库、接入多 AI 客户端 skills，并配置 SOP 自动检查与生成机制。执行后可实现：

- AI 自动写笔记与资料沉淀
- source 的自动分类与状态管理
- SOP 候选资料自动检查
- 手动或自动生成 SOP
- 多 AI 客户端共享同一套知识库工作流

---

## 2. 适用场景

- 需要在 Windows 上初始化 claude-obsidian 知识库
- 希望将 AI 对话和资料统一沉淀到 Obsidian vault
- 需要把 source 资料逐步转为标准 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用 skills
- 需要建立 source 到 SOP 的自动提示和更新维护机制

---

## 3. 前置条件

- Windows 环境，具备 PowerShell 权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定 vault 根目录
- 已安装或准备使用一个或多个 AI 客户端
- 具备建立目录、写入配置文件、创建 Junction 的权限

---

## 4. 标准操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

设置统一 vault 路径变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已成功获取项目，并明确唯一的 vault 根目录。

### 步骤 2：创建标准目录结构

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

**预期结果：** 标准目录结构已补齐。

### 步骤 3：写入基础 Obsidian 配置

创建或更新以下文件：

- `.obsidian/graph.json`：设置知识图谱颜色分组，确保 `wiki/sop` 可被明显区分，建议为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 能正确识别 vault，图谱中 SOP 清晰可见，AI 工作文件不会污染视图。

### 步骤 4：为多 AI 客户端建立 skills Junction 链接

根据实际客户端建立映射，例如：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

常见目标路径包括：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

**预期结果：** 所需客户端均可共享同一套 skills。

### 步骤 5：创建 SOP 专用 skill 定义

创建文件：

`skills/wiki-sop/SKILL.md`

文件中至少定义以下能力：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按指定主题输出 SOP
- 更新模式：当 source 比 SOP 更新时提示修订
- 质量检查：校验步骤、清单、FAQ、回链完整性

**预期结果：** SOP skill 已具备统一行为定义，可跨客户端复用。

### 步骤 6：配置 hooks 实现自动检查提示

修改 `hooks/hooks.json`，在 `SessionStart` 中加入类似规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持更多 hooks，可继续扩展自动提交或后处理逻辑。

**预期结果：** 支持 hooks 的客户端可在会话开始时自动检查 SOP 候选资料。

### 步骤 7：建立 Source 到 SOP 的状态流转规范

采用以下状态流：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：

- 含分步骤流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

**预期结果：** source 的 SOP 转化条件被标准化，后续自动检查可稳定工作。

### 步骤 8：按客户端能力执行 SOP 生成与维护

- Claude Code：可通过 hooks 自动检查并提示
- Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf：通常需手动输入“整理SOP”或指定主题触发

生成或更新 SOP 时，统一要求：

- 从 `wiki/sources/` 汇总同主题资料
- 输出到 `wiki/sop/`
- 包含步骤、检查清单、FAQ 和来源回链
- 若已有 SOP，则执行更新而不是重复创建

**预期结果：** SOP 可在当前客户端能力范围内被正确生成和维护。

### 步骤 9：执行质量检查与日常维护

每次生成或更新 SOP 后检查：

- 步骤是否清晰可执行
- 是否提供必要命令或操作条件
- 检查清单是否可核验
- FAQ 是否覆盖常见问题
- 是否包含对 source 的回链
- source 更新后是否及时修订 SOP

并定期执行维护动作，例如：

- `lint the wiki`

**预期结果：** 知识库结构稳定，SOP 与 source 保持同步且长期可用。

---

## 5. 检查清单

- [ ] 已成功克隆 claude-obsidian 仓库并确认 vault 路径
- [ ] 已创建标准目录结构
- [ ] 已写入基础 Obsidian 配置
- [ ] 已建立所需客户端的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 SessionStart 检查规则
- [ ] 已完成 source 状态字段标准化
- [ ] 已完成一次 SOP 生成或更新测试
- [ ] 已检查 SOP 的步骤、FAQ、清单和回链完整性

---

## 6. 常见问题

### Q1：为什么 SOP 没有自动生成？

通常是因为当前客户端不支持 hooks，或 source 没有标记 `status: sop-ready`，或同主题资料数量不足，未达到自动提示阈值。

### Q2：哪些客户端支持自动检查 SOP？

来源中明确支持自动 hooks 的是 Claude Code。其他客户端通常支持 skills，但需要手动触发。

### Q3：哪些资料应该进入 `sop-ready`？

凡是包含可复用操作流程、标准做法、最佳实践或经验总结的资料，都适合进入 `sop-ready`。

### Q4：如果 source 更新了，SOP 需要怎么处理？

应更新现有 SOP，而不是重复创建新文档。重点修订步骤、FAQ、清单和来源引用。

### Q5：为什么推荐使用 Junction 共享 skills？

因为这样能让多个 AI 客户端共用一套 skills，减少重复维护和配置漂移。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
