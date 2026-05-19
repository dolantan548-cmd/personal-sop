---
type: sop
category: workflow
status: active
created: 2026-05-19
updated: 2026-05-19
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
用于在 Windows 环境中部署 claude-obsidian 知识库，完成 Obsidian Vault 基础结构、AI skills 链接、SOP 自动触发规则与多 AI 客户端引用配置，从而实现知识采集、分类整理、SOP 生成与后续维护的标准化流程。

## 适用场景
- 需要在 Windows 上初始化 claude-obsidian 知识库
- 需要为知识库增加 SOP 自动识别与生成机制
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 共享同一套 skills
- 需要建立 source 到 SOP 的标准流转与维护流程
- 需要在 Obsidian 中统一查看知识、SOP 与图谱关系

## 前置条件
- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 claude-obsidian 项目仓库
- 本地已安装或准备使用 Obsidian
- 已确定 Vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 具备至少一个 AI 客户端的本地 skills 目录访问权限

## 标准步骤

### 1. 克隆 claude-obsidian 仓库并确认 Vault 路径
在 PowerShell 中进入目标工作目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后目录存在额外嵌套，请整理为统一的 Vault 根目录，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`。

**预期结果：** 本地已存在可访问的 claude-obsidian 目录，并确定一个唯一的 Vault 根路径。

### 2. 创建 Vault 标准目录结构
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

**预期结果：** Vault 中已存在标准目录结构。

### 3. 写入 Obsidian 基础配置
在 `.obsidian` 目录中创建或更新以下文件：
- `graph.json`：配置知识图谱颜色分组，建议将 `sop` 设置为黄色
- `app.json`：排除 AI 工作文件
- `appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 能正确识别 Vault，图谱分组与 CSS 片段配置生效。

### 4. 为多 AI 客户端创建 skills 链接
按需为各客户端创建 Junction：

```powershell
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target "$VAULT\skills"
```

Cursor 与 Windsurf 也应链接到各自的 `.cursor/skills/`、`.windsurf/skills/` 目录。

**预期结果：** 至少一个 AI 客户端已成功引用 `claude-obsidian` skills。

### 5. 创建 wiki-sop skill 并定义 SOP 生成规则
在 `skills/wiki-sop/` 下创建 `SKILL.md`，至少定义以下能力：
- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：指定主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查：检查步骤可执行性、检查清单完整性、回链完整性

建议统一要求输出的 SOP 包含：标题、目的、适用场景、前置条件、步骤、检查清单、FAQ、来源回链。

**预期结果：** `skills/wiki-sop/SKILL.md` 已存在，且内容完整。

### 6. 配置 hooks 实现自动 SOP 检查
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入以下规则：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 ≥ 3 时提示生成 SOP
- `sop-priority: high` 时优先提示生成 SOP
- sources 比 SOP 新时提示更新 SOP

**预期结果：** 支持 hooks 的客户端可在会话启动时自动检查 SOP 生成与更新机会。

### 7. 建立 source 状态流转标准
统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 包含分步骤操作流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

建议在 frontmatter 中维护：`status`、`topic`、`updated_at`、`sop-priority`。

**预期结果：** source 可被系统自动识别并进入 SOP 生成链路。

### 8. 执行知识采集、分类与维护操作
按原生能力执行日常操作：
- 使用 `ingest` 导入资料
- 自动分类到 `concepts`、`entities`、`sources`
- 定期执行 `lint the wiki`
- 使用 `query:` 查询知识

导入后检查新增 source 是否应标记为 `sop-ready`。

**预期结果：** 知识可持续导入、整理、查询，并为 SOP 自动化提供数据基础。

### 9. 根据客户端能力执行自动或手动 SOP 生成
- **Claude Code**：依赖 hooks 自动检查并提示生成或更新 SOP
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通过 skills 手动触发，例如输入“整理SOP”或指定主题

生成后的 SOP 统一保存到 `wiki/sop/`，并确保包含来源回链。

**预期结果：** `wiki/sop/` 中已有结构统一、可执行、可追溯的 SOP 文档。

### 10. 校验 SOP 质量并完成发布
发布前检查：
- 步骤是否可执行、可复现
- 是否包含 checklist 与 FAQ
- 是否已回链相关 source
- source 更新后是否需要同步刷新 SOP
- Obsidian 图谱中是否可见 SOP 与 source 关系

**预期结果：** SOP 达到可执行标准，并具备持续维护能力。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已配置 `.obsidian/graph.json`、`.obsidian/app.json`、`.obsidian/appearance.json`
- [ ] 已为至少一个 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查规则
- [ ] 已定义并使用 source 状态字段
- [ ] 已能使用 `ingest`、`query:`、`lint the wiki`
- [ ] 已在 `wiki/sop/` 成功生成至少一个 SOP
- [ ] 已检查 SOP 的步骤、回链、FAQ 与更新机制是否完整

## FAQ

### 1. 为什么某些 AI 客户端不会自动检查 SOP？
因为不同客户端对 hooks 的支持不同。Claude Code 支持通过 `hooks.json` 在 `SessionStart` 自动检查；Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 通常需要手动触发 skills。

### 2. 什么样的 source 应该标记为 `status: sop-ready`？
当资料包含明确分步骤操作流程，或属于稳定的最佳实践/经验总结时，应标记为 `sop-ready`；高优先级资料可额外设置 `sop-priority: high`。

### 3. 什么时候应该生成新的 SOP？
当同主题累计至少 3 份 `sop-ready` source、某条 source 标记了 `sop-priority: high`，或用户明确指定主题需要整理时，应生成 SOP。

### 4. 什么时候应该更新已有 SOP？
当相关 source 的更新时间晚于对应 SOP，或新增 source 已经改变原有流程与最佳实践时，应更新 SOP。

### 5. 如果 skills 链接创建失败怎么办？
先确认目标父目录存在，再检查 PowerShell 权限与路径是否正确。Windows 下推荐使用 `New-Item -ItemType Junction` 创建目录链接。

### 6. SOP 文件应放在哪里？
统一放在 `wiki/sop/` 目录中，便于图谱展示、来源回链与后续维护。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]