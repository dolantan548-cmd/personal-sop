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

本 SOP 用于在 Windows 环境中完成 claude-obsidian 的标准化部署，并建立一套可持续运行的知识库工作流，包括：

- AI 自动写笔记
- 自动分类整理
- 定期维护与查询
- 基于 source 状态的 SOP 自动检查与生成
- 在多个 AI 客户端之间共享同一套知识库能力

---

## 2. 适用场景

- 需要在 Windows 上初始化 claude-obsidian 知识库
- 希望通过 AI 自动摄取和整理知识
- 需要将零散资料沉淀为标准 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 之间共享 skills 与 Vault
- 需要建立 source 到 SOP 的自动化或半自动化机制

---

## 3. 前置条件

- Windows 环境
- 已安装 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 本地有可写目录，例如 `D:\dolan_env\temp\project\personal`
- 已安装至少一个 AI 客户端
- 对 Vault 目录与配置文件具有写权限

---

## 4. 标准步骤

### 步骤 1：克隆 claude-obsidian 仓库

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在嵌套目录，整理为单一根目录，后续统一作为 Vault 根路径。

**预期结果：** 本地存在可作为 Vault 使用的 `claude-obsidian` 根目录。

---

### 步骤 2：创建标准 Vault 目录结构

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

目录用途：

- `.raw`：原始资料
- `wiki/concepts`：概念笔记
- `wiki/entities`：实体笔记
- `wiki/sources`：来源资料
- `wiki/sop`：SOP 文档
- `_templates`：模板文件

**预期结果：** Vault 目录结构完整，满足知识沉淀与 SOP 生成需要。

---

### 步骤 3：写入 Obsidian 基础配置

在 `.obsidian` 目录中建立或更新以下文件：

- `graph.json`：设置知识图谱颜色分组，建议为 `wiki/sop` 设置黄色
- `app.json`：排除 AI 工作文件和临时文件
- `appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 能正确显示知识结构，并避免无关文件干扰。

---

### 步骤 4：为多 AI 客户端创建 skills 链接

按需为不同客户端创建 Windows Junction，使其共享同一个 skills/Vault 源。

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target $VAULT
```

常见目标路径：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

**预期结果：** 各 AI 客户端可访问相同的 claude-obsidian 能力和知识内容。

---

### 步骤 5：创建 SOP 专用 skill

创建文件：

`skills/wiki-sop/SKILL.md`

至少包含以下功能定义：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：当 source 新于 SOP 时提示更新
- 质量检查：验证步骤可执行性、检查清单完整性、回链完整性

**预期结果：** 项目具备统一的 SOP 生成与维护 skill。

---

### 步骤 6：配置 hooks 自动检查机制

编辑：

`hooks/hooks.json`

在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如使用 Claude Code，可进一步结合 `PostToolUse` 自动提交变更。

**预期结果：** 会话开始时系统可自动发现 SOP 生成或更新机会。

---

### 步骤 7：执行 source 状态流转标准

采用统一状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** 所有 source 都可被明确判断是否适合进入 SOP 流程。

---

### 步骤 8：根据客户端能力生成或更新 SOP

- **Claude Code**：依赖 hooks 自动检查并提示生成/更新
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：手动输入“整理SOP”或指定主题

生成 SOP 时，输出至少应包含：

- 目的
- 适用场景
- 前置条件
- 操作步骤
- 检查清单
- FAQ
- 来源回链

**预期结果：** SOP 可被稳定生成，且结构一致、可执行。

---

### 步骤 9：验证核心功能

逐项测试：

1. 使用 `ingest` 导入新资料
2. 确认自动分类到 `concepts` / `entities` / `sources`
3. 执行 `lint the wiki`
4. 使用 `query:` 验证查询能力
5. 准备 3 条以上同主题 `sop-ready` source，确认是否提示生成 SOP
6. 更新 source 后，确认是否提示更新现有 SOP

**预期结果：** 部署、分类、查询、维护、SOP 生成和更新能力均正常。

---

### 步骤 10：纳入日常维护流程

建议固定执行以下维护动作：

- 新资料先 ingest
- 处理后标记 `processed` 或 `sop-ready`
- 定期运行整理与 lint
- 每次会话开始检查 SOP 机会
- SOP 完成后将来源资料标记为 `synthesized`
- 不再活跃的资料归档为 `archived`
- 多客户端统一使用同一 Vault 路径

**预期结果：** 形成稳定的知识沉淀闭环。

---

## 5. 检查清单

- [ ] 已成功克隆仓库
- [ ] 已创建标准 Vault 目录结构
- [ ] 已完成 `.obsidian` 配置
- [ ] 已创建至少一个 AI 客户端的 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 中的 SOP AUTO-CHECK
- [ ] 已执行 source 状态流转标准
- [ ] 已验证 ingest / query / lint 等能力
- [ ] 已验证 SOP 可生成
- [ ] 已验证 SOP 可更新

---

## 6. 最佳实践

- 所有 AI 客户端共用同一 Vault，避免知识分叉
- 对 SOP 相关资料使用统一状态和 frontmatter 字段
- `sop-ready` 只用于可复用流程，不要泛化到所有资料
- 对高价值经验总结增加 `sop-priority: high`
- 每次 SOP 生成后保持 source 与 SOP 的双向回链
- SOP 更新优先基于 source 时间戳和内容差异进行判断

---

## 7. FAQ

### Q1：为什么不会自动生成 SOP？
因为这部分需要额外配置 `wiki-sop` skill 和 hooks 规则，默认并非完全自动。

### Q2：哪些客户端支持自动检查？
Claude Code 支持通过 hooks 自动检查；其他客户端通常只能手动触发。

### Q3：什么时候标记为 `sop-ready`？
当资料具有明确步骤、可复用流程或高价值经验总结时。

### Q4：什么时候提示生成 SOP？
当同主题 `sop-ready` source 达到 3 条及以上，或某条 source 标记为 `sop-priority: high`。

### Q5：什么时候更新 SOP？
当 source 的内容、命令、流程或最佳实践已经新于现有 SOP 时。

### Q6：如果客户端不支持 hooks 怎么办？
使用统一的手动触发语句，例如“整理SOP”或按主题生成。

### Q7：为什么要共享同一 Vault？
这样所有客户端都能访问相同知识和 SOP，减少重复维护。

---

## 8. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]