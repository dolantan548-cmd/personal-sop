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

# Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端共享 skills，并建立 SOP 自动检查、生成与更新机制。

通过本流程，可实现：
- AI 自动写笔记
- 知识分类整理
- 定期维护与查询
- 将可复用资料转化为 SOP
- 在多个 AI 客户端中共享同一知识库能力

---

## 2. 适用场景

- 需要在 Windows 上初始化 claude-obsidian
- 需要沉淀知识库并持续转化 SOP
- 需要多个 AI 客户端共用同一套知识体系
- 需要建立 source 到 SOP 的标准状态流转

---

## 3. 前置条件

- Windows 环境
- 已安装 Git
- 可使用 PowerShell
- 已确定 vault 根路径
- 已安装需要接入的 AI 客户端
- 对 Obsidian vault、skills、hooks 有基础了解

---

## 4. 操作步骤

### 步骤 1：克隆仓库并确认 Vault 根目录

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

确认最终目录为单一 vault 根路径，例如：

`D:\dolan_env\temp\project\personal\claude-obsidian`

**预期结果：** 本地已成功获取项目，且 vault 根目录清晰可用。

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

**预期结果：** 所有标准目录均已创建完成。

---

### 步骤 3：写入 Obsidian 基础配置

在 `.obsidian` 下准备以下文件：

- `graph.json`：设置图谱颜色分组，建议 SOP 为黄色
- `app.json`：排除 AI 工作文件
- `appearance.json`：启用 CSS snippets

如已有模板，直接复制；如无模板，建立最小可用配置即可。

**预期结果：** Obsidian 展示行为统一，可正确隐藏无关文件并启用样式片段。

---

### 步骤 4：为多 AI 客户端创建 skills 链接

将同一套 skills 映射到各客户端目录。常见目标：

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

**预期结果：** 多个 AI 客户端共享同一份 skills 配置。

---

### 步骤 5：创建 wiki-sop 技能定义

创建文件：

`skills/wiki-sop/SKILL.md`

应覆盖以下能力：
- 自动检查 `status: sop-ready` 资料
- 手动按主题生成 SOP
- sources 更新后提示更新 SOP
- 对 SOP 做质量检查

建议在 skill 中明确：
- 触发条件
- 输出位置：`wiki/sop/`
- 命名规范
- 质量标准
- 回链要求

**预期结果：** AI 具备 SOP 专项操作能力。

---

### 步骤 6：配置 hooks 自动检查 SOP 机会

修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持，也可在 `PostToolUse` 中加入自动 commit 等动作。

**预期结果：** 支持 hooks 的客户端可在会话开始时自动检查 SOP 机会。

---

### 步骤 7：建立 Source 状态流转标准

统一采用以下流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** source 可按统一规则进入 SOP 合成流程。

---

### 步骤 8：执行知识摄取、整理与查询

使用原生能力：
- `ingest`：导入资料
- 自动分类到 `concepts`、`entities`、`sources`
- `lint the wiki`：定期维护
- `query:`：查询知识

整理 source 时，补齐元数据，并对可复用流程内容标记 `sop-ready`。

**预期结果：** 知识库可持续接收、维护与检索内容。

---

### 步骤 9：生成或更新 SOP 文档

满足以下条件时，生成或更新 SOP：
- 同主题 `sop-ready` source ≥ 3
- 某 source 标记 `sop-priority: high`
- source 比 SOP 更新

输出到 `wiki/sop/`，并包含：
- 标题
- 目的
- 适用场景
- 前置条件
- 步骤
- 检查清单
- FAQ
- 来源回链

**预期结果：** 形成可执行、可维护、可追溯的 SOP 文档。

---

### 步骤 10：按客户端能力执行触发与验证

客户端差异：
- **Claude Code**：支持 hooks，可自动检查 SOP
- **Kimi Code**：支持 skills，通常手动触发
- **Codex CLI**：支持 skills，通常手动触发
- **Gemini CLI**：支持 skills，通常手动触发
- **Cursor / Windsurf**：通常手动触发

验证项：
1. 客户端可读取 skills
2. 客户端可访问 vault
3. 客户端能识别 `sop-ready`
4. 客户端能生成或提示更新 SOP

**预期结果：** 各客户端均可按自身能力边界正常使用同一知识库。

---

## 5. 检查清单

- [ ] 已克隆仓库并确认 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已创建各客户端 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已定义 source 状态流转规则
- [ ] 已可执行 ingest / query / lint the wiki
- [ ] 已存在 `sop-ready` source 示例
- [ ] 已验证至少一个客户端可生成或提示更新 SOP

---

## 6. 常见问题

### Q1：为什么导入资料后没有自动生成 SOP？
因为 SOP 自动生成不是完全默认启用，仍需配置 `wiki-sop` skill 与 hooks；如果客户端不支持 hooks，则需手动触发。

### Q2：什么样的资料应标记为 `sop-ready`？
具备清晰步骤、可操作流程、最佳实践、经验总结的资料应标记为 `sop-ready`。

### Q3：为什么要用 Junction 而不是复制 skills？
Junction 可让多个客户端共享同一份配置，避免重复维护与版本不一致。

### Q4：哪些客户端支持自动检查？
来源中明确是 Claude Code 支持 hooks 自动检查；其他工具通常为手动触发。

### Q5：什么时候更新 SOP？
当 sources 内容新增、修订，或其更新时间晚于现有 SOP 时，应更新原 SOP。

### Q6：高质量 SOP 的最低标准是什么？
必须保证步骤可执行、结构标准化、包含检查清单与 FAQ，并附带完整来源回链。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]