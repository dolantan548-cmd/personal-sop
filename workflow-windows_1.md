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

# SOP: 在 Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于规范在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制。目标是实现以下能力：

- AI 自动写笔记与分类整理
- 结构化知识沉淀
- SOP 的自动检查、手动生成与增量更新
- 多个 AI 客户端共享同一套知识与 SOP 能力

---

## 2. 适用场景

- 需要在 Windows 上搭建可被多个 AI 客户端共用的 Obsidian 知识库
- 需要将 AI 对话、资料和经验自动整理为结构化知识笔记
- 需要基于 sources 定期生成 SOP
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 共用同一套知识与 SOP

---

## 3. 前置条件

- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 本地有可写入的项目目录
- 已准备好 Obsidian vault 路径
- 已安装需要接入的 AI 客户端
- 具备创建 Junction 链接的权限
- 仓库地址：`https://github.com/AgriciDaniel/claude-obsidian.git`

---

## 4. 标准操作步骤

### 步骤 1：克隆 claude-obsidian 仓库并确认目录位置

打开 PowerShell，执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在嵌套目录，需手动整理为单一 vault 根目录。建议设定：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已成功获取项目，并确认统一的 vault 根目录。

---

### 步骤 2：初始化 Windows 所需目录结构

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

**预期结果：** 标准目录结构已创建完成。

---

### 步骤 3：写入 Obsidian 基础配置

配置以下文件：

- `.obsidian/graph.json`：知识图谱颜色分组，建议将 `sop` 设置为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

建议优先使用团队统一模板，确保视觉和行为一致。

**预期结果：** Obsidian 可以正常读取 vault 配置，图谱和外观设置可用。

---

### 步骤 4：为多 AI 客户端创建 skills Junction 链接

将 claude-obsidian skills 链接到各客户端：

- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

其他客户端按相同方式执行。若父目录不存在，需先创建。

**预期结果：** 多个 AI 客户端共享同一套 skills 定义。

---

### 步骤 5：创建 SOP 自动机制的技能说明文件

在 `skills/wiki-sop/` 下创建 `SKILL.md`，至少包含以下机制：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查：验证步骤可执行性、检查清单完整性、回链完整性

建议在文档中补充：

- 输入格式
- 输出路径（建议 `wiki/sop/`）
- 命名规范
- 更新规则

**预期结果：** `skills/wiki-sop/SKILL.md` 已存在，且规则清晰可复用。

---

### 步骤 6：配置 hooks 实现 Claude Code 自动检查

编辑 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如环境允许，也可在 `PostToolUse` 中增加自动 commit 或记录。

**预期结果：** Claude Code 启动会话时可自动检查 SOP 生成/更新条件。

---

### 步骤 7：建立 source 状态流转标准

统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

状态定义：

- `raw`：原始资料
- `processed`：已整理但主要供参考
- `sop-ready`：具备流程复用价值
- `synthesized`：内容已被整合进 SOP
- `archived`：已归档

自动标记规则：

- 包含分步骤流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** 团队对资料状态定义一致，AI 可稳定执行分类标记。

---

### 步骤 8：执行知识写入、分类整理与维护操作

日常维护时使用以下能力：

- `ingest`：导入和写入笔记
- 自动分类：整理到 `concepts`、`entities`、`sources`
- `query:`：查询知识
- `lint the wiki`：定期维护知识库结构

涉及流程型内容时，应额外判断是否需要标记为 `sop-ready`。

**预期结果：** 知识库持续保持结构化、可查询、可维护状态。

---

### 步骤 9：按触发条件生成或更新 SOP

当满足以下任一条件时，执行 SOP 生成或更新：

- 同主题下有 3 篇及以上 `sop-ready` sources
- source 标记 `sop-priority: high`
- source 更新时间晚于 SOP
- 用户手动要求生成或整理 SOP

生成内容应统一包含：

- 目的
- 适用场景
- 前置条件
- 可执行步骤
- 检查清单
- FAQ
- 来源回链

输出目录建议固定为 `wiki/sop/`。

**预期结果：** 形成结构统一、可执行、可追溯的 SOP 文档。

---

### 步骤 10：验证各客户端可用性并形成运行约定

按客户端逐个验证：

- **Claude Code**：支持 skills + hooks，可自动检查 SOP
- **Kimi Code**：支持 skills，通常需手动触发，如“整理SOP”
- **Codex CLI**：支持 skills，通常需手动触发
- **Gemini CLI**：支持 skills，通常需手动触发
- **Cursor / Windsurf**：通常依赖 skills，hooks 支持有限

团队应明确自动与手动边界，避免错误预期。

**预期结果：** 所有客户端的使用方式和限制已明确。

---

## 5. 检查清单

- [ ] 已成功克隆 claude-obsidian 仓库并确认 vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已配置 `.obsidian/graph.json`、`app.json`、`appearance.json`
- [ ] 已完成所需 AI 客户端的 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查逻辑
- [ ] 已统一 source 状态流转标准
- [ ] 已验证 `ingest`、`query:`、`lint the wiki` 能正常使用
- [ ] 已确认 SOP 输出到 `wiki/sop/`
- [ ] 已验证各客户端的自动/手动触发方式

---

## 6. 最佳实践

- 统一 vault 路径，避免多客户端引用不同目录
- 使用 Junction 而不是复制 skills，减少重复维护
- 将流程型内容尽早标记为 `sop-ready`
- 对高价值经验增加 `sop-priority: high`
- 生成 SOP 后保留与 source 的双向回链
- 定期执行 `lint the wiki` 保持知识库质量
- 把 Claude Code 作为自动检查入口，把其他工具作为手动补充入口

---

## 7. 常见问题（FAQ）

### Q1：Windows 环境下是否可以完整部署 claude-obsidian？
可以。可通过 PowerShell 建目录、写配置、创建 Junction 链接实现完整部署。

### Q2：SOP 会自动生成吗？
原生具备模板和自动化基础，但需要额外配置触发机制。Claude Code 可自动检查，其他客户端通常需要手动触发。

### Q3：哪些 source 应该标记为 sop-ready？
凡是包含可复用步骤、最佳实践、经验总结的资料都应考虑标记为 `sop-ready`。

### Q4：为什么要给多个 AI 客户端创建 skills 链接？
为了共享同一套规则和知识能力，避免重复维护和标准不一致。

### Q5：如果 sources 更新了，已有 SOP 怎么办？
应提示或执行 SOP 更新，确保 SOP 内容与最新 sources 保持同步。

### Q6：哪些客户端支持 hooks 自动检查？
当前明确支持的是 Claude Code；其他客户端通常以 skills 手动触发为主。

---

## 8. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]