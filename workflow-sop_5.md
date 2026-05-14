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

# 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
本 SOP 用于在 Windows 环境中标准化部署 claude-obsidian 知识库，配置多 AI 客户端 skills 连接，并建立 SOP 自动检查、生成与更新机制，使资料能够从采集到 SOP 沉淀形成可复用流程。

## 2. 适用场景
- 需要在 Windows 上搭建本地知识库并接入 AI 自动整理能力
- 需要将来源资料自动归档到 concepts、entities、sources、sop 结构中
- 需要为 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 提供统一知识库入口
- 需要建立 source 到 SOP 的自动触发与更新机制
- 需要让多个 AI 客户端复用同一套 SOP 与知识沉淀

## 3. 前置条件
- Windows 环境可用，且可运行 PowerShell
- 已安装 Git
- 具备本地项目目录写入权限
- 已确定知识库路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个支持 skills 的 AI 客户端
- 了解目标仓库地址：`https://github.com/AgriciDaniel/claude-obsidian.git`

## 4. 标准操作步骤

### 步骤 1：克隆项目并确认 Vault 路径
在 PowerShell 中进入目标工作目录并克隆仓库。若仓库存在嵌套目录或结构不符合预期，先整理目录，确保后续所有配置都指向同一个 Vault 根目录。

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已成功克隆仓库，并明确唯一 Vault 根目录变量 `$VAULT`。

### 步骤 2：初始化标准目录结构
使用 PowerShell 创建知识库所需目录：

```powershell
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
- `wiki/sources`：来源资料与处理结果
- `wiki/sop`：沉淀后的 SOP 文档
- `_templates`：模板
- `.obsidian/snippets`：界面增强配置

**预期结果：** Vault 内已具备统一的知识库目录结构。

### 步骤 3：写入 Obsidian 基础配置
补齐以下配置文件：
- `.obsidian/graph.json`：知识图谱颜色分组，建议将 `sop` 标记为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

执行要求：
1. 优先合并已有配置，不要盲目覆盖。
2. 至少保证 SOP 分类在图谱中可识别。
3. 排除 AI 工作文件，避免干扰主视图。

**预期结果：** Obsidian 已具备基础可用配置，SOP 分类清晰可见。

### 步骤 4：为多 AI 客户端创建 skills 链接
通过 Junction 将统一 skills 目录映射到各客户端：
- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

执行要求：
1. 使用 `New-Item -ItemType Junction` 创建链接。
2. 所有客户端尽量指向同一 skills 源目录。
3. 如目标目录已存在，先确认是否为错误副本。

**预期结果：** 多个 AI 客户端可访问同一套 claude-obsidian skills。

### 步骤 5：创建 SOP 技能定义文件
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：
- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按用户指定主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查模式：检查步骤可执行性、检查清单与回链完整性

要求：
- 输入来源主要是 `wiki/sources/`
- 输出目录为 `wiki/sop/`
- 生成时合并同主题来源并去重
- 结果必须包含步骤、检查清单、FAQ、来源回链

**预期结果：** `skills/wiki-sop/SKILL.md` 已可用于 SOP 生成与维护。

### 步骤 6：配置 hooks 自动检查机制
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入以下规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

配置原则：
1. 自动检查应在会话开始时执行。
2. 先提示，再决定是否生成。
3. 支持 hooks 的客户端启用完整自动机制。

**预期结果：** 支持 hooks 的客户端可在会话启动时自动发现 SOP 候选项或更新需求。

### 步骤 7：建立 Source 状态流转与自动标记规则
统一资料状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

执行要求：
1. 不要将原始资料直接写成 SOP。
2. 只有可执行、可复用内容才进入 `sop-ready`。
3. SOP 生成后可标记为 `synthesized`。

**预期结果：** source 状态清晰，AI 能识别哪些资料适合转 SOP。

### 步骤 8：根据客户端能力选择自动或手动 SOP 工作流
客户端能力差异：
- Claude Code：支持 hooks，可自动检查 SOP
- Kimi Code：支持 skills，通常需手动触发
- Codex CLI：支持 skills，通常需手动触发
- Gemini CLI：支持 skills，通常需手动触发
- Cursor / Windsurf：可接 skills，但一般不支持完整 hooks 自动化

执行建议：
1. 以 Claude Code 作为主自动化入口。
2. 其他客户端用于手动整理、补写与引用。
3. 无 hooks 客户端通过指令手动触发，例如“整理SOP”。

**预期结果：** 已明确各客户端的职责与触发方式。

### 步骤 9：执行 SOP 生成与更新操作
出现以下任一条件时，生成或更新 SOP：
- 同主题 `sop-ready` 来源达到 3 个及以上
- 存在 `sop-priority: high`
- source 比已有 SOP 更新

执行标准：
1. 汇总同主题 sources，抽取共性流程。
2. 将背景信息与操作步骤分离。
3. 输出到 `wiki/sop/`。
4. 更新时优先做增量修订。
5. 不要编造来源中不存在的关键步骤。

**预期结果：** `wiki/sop/` 中已生成或更新结构统一、可执行、可追溯的 SOP。

### 步骤 10：执行质量检查与日常维护
完成 SOP 后执行质量检查：
- 步骤是否可直接执行
- 是否包含命令、路径、条件与结果说明
- 检查清单是否完整
- FAQ 是否覆盖常见问题
- 来源回链是否完整
- 是否需要运行 `lint the wiki`

维护建议：
1. source 更新后复查对应 SOP。
2. 定期清理和校验知识库一致性。
3. 优先维护高频使用 SOP。

**预期结果：** SOP 文档质量稳定，知识库可持续维护，多客户端结果一致。

## 5. 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认唯一 Vault 路径
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已写入或校验 `graph.json`、`app.json`、`appearance.json` 基础配置
- [ ] 已为至少一个 AI 客户端创建指向统一 skills 的 Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 `SessionStart` 的 SOP AUTO-CHECK 规则
- [ ] 已定义 source 状态流转：`raw`、`processed`、`sop-ready`、`synthesized`、`archived`
- [ ] 已明确各客户端是自动触发还是手动触发 SOP
- [ ] 已成功在 `wiki/sop/` 生成或更新至少一份 SOP
- [ ] 已完成步骤可执行性、检查清单、FAQ 与来源回链检查

## 6. 常见问题

### Q1：为什么我已经配置了 skills，但没有自动生成 SOP？
因为 skills 只提供能力入口，不等于自动触发。自动检查通常依赖 hooks 机制。Claude Code 支持 hooks 自动检查；Kimi Code、Codex CLI、Gemini CLI 等通常需要手动触发。

### Q2：什么样的 source 应该标记为 sop-ready？
包含明确步骤、可重复执行流程、最佳实践或经验总结，且可以沉淀为标准操作的资料，都应标记为 `status: sop-ready`。高复用内容可再加 `sop-priority: high`。

### Q3：如果 source 只是参考资料，没有具体步骤，还需要转 SOP 吗？
不需要。这类资料应保留为 `status: processed`，作为背景知识或引用来源。

### Q4：为什么要把多个 AI 客户端都链接到同一个 Vault 或 skills？
为了保证所有客户端使用同一套知识与 SOP 规则，避免多副本导致内容漂移和重复维护。

### Q5：SOP 什么时候应该更新？
当来源资料新增、原有 source 被修改，或检测到 sources 比现有 SOP 更新时，就应提示更新。

### Q6：如果 SessionStart 自动检查没有生效，应该先排查什么？
先确认客户端是否支持 hooks；再确认 `hooks/hooks.json` 路径与内容是否正确；最后检查 `wiki/sources/` 中是否存在带有 `status: sop-ready` 的资料。

## 7. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]