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

# SOP: Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于在 Windows 环境中标准化部署 claude-obsidian 知识库，配置多 AI 客户端 skills 引用，并建立 SOP 自动检查、生成与更新机制，以支持知识沉淀、流程复用和跨工具协同。

## 2. 适用场景

- 需要在 Windows 上搭建可供 AI 自动写笔记的 Obsidian 知识库
- 需要将资料按 `concepts`、`entities`、`sources`、`sop` 结构化管理
- 需要基于已有资料自动识别可 SOP 化内容并触发生成
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等客户端复用同一套知识库能力
- 需要建立 source 到 SOP 的状态流转与维护机制

## 3. 前置条件

- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 claude-obsidian 项目仓库
- 已确定 vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 本机已安装至少一种 AI 客户端（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf）
- 具备创建目录、配置文件和 Junction 链接的权限
- 了解 Obsidian vault 基本目录结构

## 4. 标准操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录

在 PowerShell 中进入目标工作目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后出现额外嵌套目录，需手动整理，确保最终 vault 根目录直接包含 `.obsidian`、`wiki`、`_templates`、`skills`、`hooks` 等项目结构。

建议定义变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且已明确唯一的 Vault 路径。

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

**预期结果：** Vault 中已具备标准目录结构，可供 AI 和 Obsidian 正常读写。

---

### 步骤 3：写入或校正 Obsidian 配置文件

在 `.obsidian` 目录中创建或更新以下文件：

1. `graph.json`：配置知识图谱分组与颜色，建议将 `sop` 分组设置为黄色。
2. `app.json`：配置排除 AI 工作文件。
3. `appearance.json`：启用 CSS snippets。

如团队已有标准模板，应直接复用。

**预期结果：** Obsidian 能正确展示知识图谱、过滤工作文件并启用样式配置。

---

### 步骤 4：为多 AI 客户端创建 skills Junction 链接

将项目 skills 目录以 Junction 方式链接到各客户端 skills 路径。

常见目标路径：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/claude-obsidian`
- Windsurf：`.windsurf/skills/claude-obsidian`

示意命令：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

按相同方法为其他客户端创建链接。

**预期结果：** 各 AI 客户端可复用同一套 claude-obsidian skills 能力。

---

### 步骤 5：建立 SOP 专用 skill 定义

创建文件：`skills/wiki-sop/SKILL.md`

至少包含以下能力：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按指定主题生成 SOP
- 更新模式：当 source 新于 SOP 时提示更新
- 质量检查：验证步骤可执行性、检查清单完整性、来源回链完整性

**预期结果：** SOP 相关 skill 已标准化定义，AI 可据此执行流程化操作。

---

### 步骤 6：在 hooks 中配置 SOP 自动检查规则

修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题 `>= 3` 份资料时提示生成 SOP
- 存在 `sop-priority: high` 时优先提示生成 SOP
- 当 source 比 SOP 更新时提示更新 SOP

**预期结果：** 支持 hooks 的客户端可在会话启动时自动发现待处理 SOP。

---

### 步骤 7：执行 Source 状态流转与自动标记规则

统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 包含分步骤操作流程：`status: sop-ready`
- 包含最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

**预期结果：** source 文档具备可识别状态，便于 AI 自动筛选 SOP 候选项。

---

### 步骤 8：按客户端能力执行 SOP 生成与维护

- **Claude Code**：支持自动检查，可在 `SessionStart` 自动提示；可结合其他 hooks 做后续维护。
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常需手动触发，例如输入“整理SOP”。

推荐工作流：

1. ingest 或整理 source
2. 检查是否为 `sop-ready`
3. 满足条件时生成 `wiki/sop/` 文档
4. source 更新后优先更新原 SOP

**预期结果：** 不同客户端均可在各自能力范围内完成 SOP 生成与维护。

---

### 步骤 9：验证知识库功能与 SOP 产出质量

进行端到端验证：

1. 使用 `ingest` 写入测试资料
2. 检查是否正确分类到 `concepts`、`entities`、`sources`
3. 执行 `lint the wiki`
4. 运行 `query:` 检查知识查询能力
5. 准备至少 3 份同主题 `sop-ready` source，验证 SOP 生成提示
6. 检查 SOP 是否包含：
   - 可执行步骤
   - 检查清单
   - 来源回链
   - 更新逻辑
7. 更新 source，验证是否会提示 SOP 更新

**预期结果：** 整个知识库工作流可稳定运行，SOP 生成机制有效。

## 5. 检查清单

- [ ] 已成功克隆 claude-obsidian 仓库并确定唯一 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已配置 `graph.json`、`app.json`、`appearance.json`
- [ ] 已为至少一个 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中配置 SOP 自动检查规则
- [ ] 已定义并使用统一 source 状态流转
- [ ] 已验证 `ingest`、`query:`、`lint the wiki` 正常工作
- [ ] 已成功触发至少一次 SOP 生成
- [ ] 已验证 source 更新后可触发 SOP 更新提示

## 6. 最佳实践

- 优先使用统一 Vault 路径，避免多个客户端各自维护副本
- 所有 source 在进入 SOP 流程前必须具备明确状态字段
- SOP 不应基于单一零散资料直接固化，优先等待多来源汇聚
- source 更新后优先维护原 SOP，避免重复生成同主题文件
- 在支持 hooks 的客户端中尽量启用自动检查，以减少遗漏
- 在不支持 hooks 的客户端中准备统一手动触发口令，如“整理SOP”

## 7. 常见问题

### Q1：为什么有些客户端不会自动提示生成 SOP？
因为不同 AI 客户端对 hooks 的支持能力不同。Claude Code 支持 `hooks.json`，可自动检查；其他客户端通常需要手动触发。

### Q2：什么样的 source 应该标记为 `sop-ready`？
凡是包含清晰步骤、可重复执行经验、最佳实践总结的资料，都应标记为 `sop-ready`。

### Q3：纯参考资料要不要生成 SOP？
不要。纯参考资料应保留为 `processed`，供查询和后续综合使用。

### Q4：为什么建议同主题至少 3 份资料再生成 SOP？
因为多来源更有助于提高 SOP 的稳定性、完整性和可执行性。

### Q5：SOP 更新时应该重建还是改原文件？
优先更新原文件，只有主题边界明显变化时才考虑拆分或新建。

### Q6：Windows 为什么推荐 Junction？
因为 Junction 可让多个 AI 客户端共享同一 skills 定义，减少重复维护，且适合 Windows 环境。

## 8. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
