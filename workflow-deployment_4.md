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

本 SOP 用于规范在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端共享 skills，并建立 SOP 自动检查与生成机制。目标是让 AI 资料能够持续进入统一知识库，经过分类、维护和检索后，被进一步提炼为可复用、可执行、可追溯的 SOP。

---

## 2. 适用场景

- 需要在 Windows 本地部署 claude-obsidian
- 需要把 AI 对话记录或工作资料导入知识库
- 需要将可复用流程自动识别为 SOP 候选
- 需要让多个 AI 客户端复用同一套知识与技能配置
- 需要让 Claude Code 在会话启动时自动检查 SOP 候选资料

---

## 3. 前置条件

- Windows 环境，具备 PowerShell 权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定 vault 路径，例如：`D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个支持 skills 的 AI 客户端
- 了解基础目录操作、Junction 链接和 JSON 配置

---

## 4. 标准流程

### 步骤 1：克隆项目并确认 Vault 路径

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在嵌套目录，先整理为统一 vault 根目录。然后设置变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在 claude-obsidian 项目目录，并确定唯一 vault 根路径。

---

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

目录用途：

- `.raw`：原始输入资料
- `wiki/concepts`：概念类知识
- `wiki/entities`：实体类知识
- `wiki/sources`：处理后的来源资料
- `wiki/sop`：SOP 文档
- `_templates`：模板文件

**预期结果：** 已建立标准化知识库目录结构。

---

### 步骤 3：写入 Obsidian 基础配置

创建或更新以下文件：

- `.obsidian/graph.json`
- `.obsidian/app.json`
- `.obsidian/appearance.json`

配置要求：

- 在图谱中为 SOP 设置独立颜色分组，建议黄色
- 排除 AI 工作文件，减少噪音
- 启用 CSS snippets，便于后续样式扩展

**预期结果：** Obsidian 可以正确展示、过滤和扩展知识库内容。

---

### 步骤 4：为多 AI 客户端创建 skills 链接

将项目 skills 目录通过 Junction 链接到各客户端：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/`
- Windsurf → `.windsurf/skills/`

使用 PowerShell 的 `New-Item -ItemType Junction` 创建链接。确保源目录存在、目标父目录已建立。

**预期结果：** 多个 AI 客户端共享同一套 skills 配置。

---

### 步骤 5：创建 wiki-sop 技能定义

在 `skills/wiki-sop/` 下创建 `SKILL.md`，定义以下能力：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：source 更新时提示更新 SOP
- 质量检查：检查步骤可执行性、清单完整性、回链完整性

标准要求：

- 输入来源为 `wiki/sources/`
- 输出路径为 `wiki/sop/`
- 生成结果必须包含步骤、检查清单、来源回链

**预期结果：** AI 客户端可调用统一 SOP 能力进行整理与生成。

---

### 步骤 6：配置 hooks 自动检查 SOP

编辑 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如果客户端支持额外自动化，可继续补充如 `PostToolUse` 等动作。

**预期结果：** 支持 hooks 的客户端可在会话开始时自动检查并提示 SOP 生成或更新。

---

### 步骤 7：建立 source 状态流转规范

统一使用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** 每份资料都能被明确分类，并决定是否进入 SOP 流程。

---

### 步骤 8：执行首次资料导入与 SOP 检查

执行项目原生命令：

- `ingest`：导入资料
- `lint the wiki`：维护一致性
- `query:`：验证检索能力

检查 `wiki/sources/` 是否存在 `sop-ready` 资料。若使用 Claude Code，重启会话触发自动检查；若使用其他客户端，手动输入如“整理SOP”进行触发。

**预期结果：** 资料已导入、可检索，并可进入 SOP 候选筛选。

---

### 步骤 9：生成或更新 SOP 文档

在 `wiki/sop/` 中生成目标主题的 SOP，要求：

- 使用统一模板
- 步骤可执行
- 包含检查清单
- 建立来源回链
- 若已有同主题 SOP，则优先更新

**预期结果：** 生成的 SOP 结构完整、可执行、可维护、可追溯。

---

### 步骤 10：验证跨客户端可用性并纳入日常维护

在各客户端验证：

- skills 可被识别
- vault 路径一致
- 知识查询正常
- SOP 可自动或手动触发

日常维护要求：

- 定期运行 `lint the wiki`
- 新资料及时标记状态
- source 更新时检查 SOP 是否需要更新
- 保持 `wiki/sources/` 与 `wiki/sop/` 回链完整

**预期结果：** 知识库与 SOP 机制可长期稳定运行，并支持多客户端复用。

---

## 5. 检查清单

- [ ] 已克隆仓库并确认 vault 路径
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已为目标客户端建立 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 自动检查规则
- [ ] 已建立 source 状态流转规范
- [ ] 已完成一次 ingest、lint、query 验证
- [ ] 已生成至少一个 SOP
- [ ] 已验证跨客户端可用性

---

## 6. 常见问题

### Q1：哪些客户端支持自动 SOP 检查？
Claude Code 支持 `hooks.json`，可以在 `SessionStart` 自动检查。Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 一般需要手动触发。

### Q2：什么样的资料应标记为 `sop-ready`？
凡是包含分步骤流程、最佳实践或经验总结，并且具备复用价值的资料，都应标记为 `sop-ready`。

### Q3：纯参考资料是否需要生成 SOP？
不需要。纯参考资料应保留为 `processed`，避免生成不可执行或价值不高的 SOP。

### Q4：何时触发 SOP 生成最合适？
当同主题 `sop-ready` 资料达到 3 份及以上，或资料被标记为高优先级，或 source 已明显新于既有 SOP 时，应触发生成或更新。

### Q5：为什么推荐使用 Junction 共享 skills？
因为 Junction 能让多个客户端指向同一份 skills 配置，避免复制粘贴带来的版本不一致和重复维护。

### Q6：source 更新后是新建 SOP 还是更新原 SOP？
优先更新原 SOP。只有在主题完全不同或结构需要拆分时，才考虑新建。

---

## 7. 关联来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
