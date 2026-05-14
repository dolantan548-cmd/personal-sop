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

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成与多 AI 客户端联动

## 目的
规范化在 Windows 环境中部署 claude-obsidian 知识库、启用 SOP 自动检查/生成机制，并通过 skills 链接让多个 AI 客户端复用同一套知识库与 SOP 工作流。

## 适用场景
- 需要在 Windows 上搭建可被 AI 自动写入与整理的 Obsidian 知识库
- 需要将分散资料沉淀为可复用 SOP
- 需要为 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等工具共享同一套技能与知识库
- 需要建立 source 到 SOP 的标准状态流转与自动检查机制

## 前置条件
- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已安装至少一个 AI 客户端（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf）
- 已确认知识库目标路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 对 Obsidian Vault 目录结构和技能目录（skills）有基本了解

## 标准步骤

### 1. 克隆项目并确认 Vault 路径
在 PowerShell 中进入目标父目录后克隆仓库，并确认最终 Vault 路径唯一且可用。

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如仓库目录出现额外嵌套，请整理到最终 Vault 根目录，例如：`D:\dolan_env\temp\project\personal\claude-obsidian`。

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且后续所有配置都将以该目录作为统一 Vault。

### 2. 创建标准目录结构
在 Vault 根目录下创建 Obsidian 配置目录、原始资料目录、Wiki 分类目录、SOP 目录与模板目录。

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

**预期结果：** Vault 中已具备标准目录结构。

### 3. 写入基础 Obsidian 配置
在 `.obsidian` 目录中补齐基础配置，至少包括：
- `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 设为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS 片段

配置原则：
1. 区分 sources、concepts、entities、sop
2. 隔离 AI 中间产物
3. 启用 snippets 样式扩展

**预期结果：** Obsidian 可正确识别并展示知识库结构。

### 4. 为多 AI 客户端创建 skills 链接
将项目 skills 目录通过 Junction 链接到各 AI 客户端的 skills 路径。

参考目标：
- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

在 Windows 下使用 `New-Item -ItemType Junction` 创建链接，并确保目标父目录已存在。

**预期结果：** 一个或多个 AI 客户端可共享同一套 claude-obsidian skills。

### 5. 创建 wiki-sop 技能说明文件
在 `skills/wiki-sop/SKILL.md` 中定义 SOP 能力与触发规则，至少覆盖：
- 自动检查模式
- 手动生成模式
- 更新模式
- 质量检查模式

建议明确：
- 输入主要来自 `wiki/sources/`
- 输出统一写入 `wiki/sop/`
- 优先整合同主题多份 source
- SOP 必须包含步骤、检查清单、FAQ、相关来源

**预期结果：** AI 可根据技能说明执行 SOP 检查、生成、更新与质检。

### 6. 配置 SessionStart 自动检查钩子
修改 `hooks/hooks.json`，在 `SessionStart` 中加入 SOP 自动检查逻辑。

推荐规则：
```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持额外 hooks（例如 PostToolUse 自动提交），可一并启用。

**预期结果：** 支持 hooks 的客户端可在会话开始时自动检查 SOP 生成/更新机会。

### 7. 建立 Source 状态流转规范
统一使用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

标记规则：
- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** 团队对 source 进入 SOP 流程的条件有统一判断标准。

### 8. 执行资料摄取、分类与维护
使用项目原生命令完成知识库日常运作：
- `ingest`：AI 自动写笔记
- 自动分类到 `concepts`、`entities`、`sources`
- `lint the wiki`：定期维护
- `query:`：知识查询

最佳实践：
1. ingest 后检查是否应标记为 `sop-ready`
2. 定期执行维护
3. 查询主题时先检查是否已有 SOP

**预期结果：** 资料持续被摄取、整理并可用于 SOP 沉淀。

### 9. 生成或更新 SOP
根据自动检查结果或人工指令生成 SOP：
- 自动触发：SessionStart 检测到满足条件的 source 集合后提示生成
- 手动触发：输入“整理SOP”或指定主题

生成标准：
1. 优先整合同主题多份 source
2. 提炼可执行步骤，而非原文摘抄
3. 包含前置条件、步骤结果、检查清单、FAQ
4. 建立 SOP 到 source 的回链
5. 若 source 更新，则更新已有 SOP

**预期结果：** `wiki/sop/` 中生成或更新了结构清晰、可追溯的 SOP 文档。

### 10. 按客户端能力选择运行方式
客户端支持差异：
- Claude Code：支持 hooks，可自动检查 SOP
- Kimi Code：支持 skills，通常需手动触发
- Codex CLI：支持 skills，通常需手动触发
- Gemini CLI：支持 skills，通常需手动触发
- Cursor：通常需手动触发
- Windsurf：按 skills 方式接入

执行原则：
1. 有 hooks 就启用自动检查
2. 无 hooks 就统一手动口令
3. 所有客户端共享同一 Vault 与 skills

**预期结果：** 不同客户端都能以一致方式使用 SOP 工作流。

### 11. 执行 SOP 质量检查与持续维护
每次生成或更新 SOP 后，按以下标准复核：
1. 步骤是否可执行
2. 是否包含检查清单
3. 是否包含 source 回链
4. 是否与最新 sources 一致
5. 是否位于 `wiki/sop/` 且命名规范统一

建议定期检查：
- `sop-ready` 是否被遗漏
- source 与 SOP 时间差
- 高频 SOP 是否需要维护升级

**预期结果：** SOP 保持可执行、可追溯、可维护。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认唯一 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已完成基础 Obsidian 配置
- [ ] 已为至少一个 AI 客户端创建共享 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 `SessionStart` 自动检查
- [ ] 已建立 source 状态流转规范
- [ ] 已明确 `sop-ready` 与 `sop-priority: high` 标记规则
- [ ] 已验证日常 ingest、lint、query 能正常运行
- [ ] 已验证能够自动或手动触发 SOP 生成/更新
- [ ] 已确认 SOP 含步骤、检查清单、FAQ、来源回链

## FAQ

### 1. 为什么项目原生支持知识整理，但 SOP 还需要额外配置？
因为资料摄取、分类、查询与维护属于项目现成能力，但 SOP 的生成时机、更新规则和质检标准需要通过 skills 与 hooks 明确下来。

### 2. 哪些 source 应该标记为 `sop-ready`？
凡是包含分步骤操作流程、可复用操作方法、最佳实践或经验总结的资料，都应标记为 `sop-ready`；高价值内容可额外加 `sop-priority: high`。

### 3. 如果客户端不支持 hooks，还能使用这套流程吗？
可以。仍可通过共享 skills 使用同一套流程，只是改为手动触发，例如输入“整理SOP”。

### 4. 什么时候应该新建 SOP，什么时候应该更新已有 SOP？
当同主题 source 积累到足以沉淀流程时可新建；若已有 SOP 且 source 更新更晚，则应优先更新原 SOP。

### 5. 为什么建议多个 AI 客户端共享同一个 Vault 和 skills？
这样可避免配置分叉、重复维护与 SOP 版本不一致问题。

### 6. SOP 生成后还需要人工检查吗？
需要。至少要检查步骤可执行性、检查清单完整性、source 回链完整性，以及是否与最新资料一致。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]