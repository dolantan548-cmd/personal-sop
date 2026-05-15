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

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
本 SOP 用于在 Windows 环境中完成 claude-obsidian 知识库部署、基础配置、跨 AI 客户端 skills 接入，以及 SOP 自动检查与生成机制配置，形成“采集 → 整理 → 标记 → 生成 SOP → 更新 SOP”的标准化工作流。

## 2. 适用场景
- 需要在 Windows 上部署 claude-obsidian 本地知识库
- 需要将 AI 自动记笔记与 SOP 沉淀整合到同一系统
- 需要让多个 AI 客户端共享同一套技能与知识库规则
- 需要基于 sources 自动识别 SOP 机会并定期更新

## 3. 前置条件
- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定 vault 根目录
- 已安装至少一个支持 skills 的 AI 客户端
- 具备创建目录、修改配置文件、建立 Junction 的权限

## 4. 标准操作步骤

### 步骤 1：克隆项目并确认 Vault 路径
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如有嵌套目录，手动整理，确保后续所有配置都指向同一 vault 根目录，例如：

```powershell
D:\dolan_env\temp\project\personal\claude-obsidian
```

**预期结果：** 本地已存在可用的 claude-obsidian 项目目录。

### 步骤 2：初始化标准目录结构
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

目录说明：
- `.raw`：原始输入资料
- `wiki/sources`：整理后的来源资料
- `wiki/concepts`：概念类知识
- `wiki/entities`：实体类知识
- `wiki/sop`：标准操作流程文档
- `_templates`：模板文件

**预期结果：** vault 中形成统一、完整的目录结构。

### 步骤 3：写入 Obsidian 基础配置
创建或更新以下文件：
- `.obsidian/graph.json`：设置图谱分组颜色，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件和中间文件
- `.obsidian/appearance.json`：启用 CSS snippets

如团队已有标准配置，优先复用团队版本。

**预期结果：** Obsidian 能正确显示图谱、隐藏无关文件并启用外观增强。

### 步骤 4：为多 AI 客户端建立 skills 链接
按需将 skills 链接到以下路径：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

使用 `New-Item -ItemType Junction` 创建链接。若父目录不存在，先创建父目录。

**预期结果：** 各 AI 客户端均可复用同一套 skills。

### 步骤 5：创建 wiki-sop 技能定义
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：
- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：当 sources 比 SOP 新时提示更新
- 质量检查：检查步骤可执行性、清单完整性、回链完整性

建议统一规定 SOP 输出目录、文档格式、命名规则与引用方式。

**预期结果：** AI 能基于统一技能说明生成和维护 SOP。

### 步骤 6：配置 hooks 自动检查 SOP 机会
修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数量 ≥ 3 时提示生成 SOP
- 存在 `sop-priority: high` 时优先提示
- 当 sources 晚于 SOP 时提示更新

若客户端不支持 hooks，则将该逻辑作为会话开始时的人工检查步骤。

**预期结果：** 系统可以自动或半自动识别 SOP 生成/更新时机。

### 步骤 7：建立 source 状态流转规范
统一采用以下流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：
- 含明确操作步骤：`status: sop-ready`
- 含最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

**预期结果：** sources 能按统一规则归档并支持自动化筛选。

### 步骤 8：执行知识采集、整理与查询流程
使用以下标准能力：
- `ingest`：导入资料并自动记笔记
- 自动分类到 `concepts`、`entities`、`sources`
- `lint the wiki`：定期维护知识库
- `query:`：检索与汇总知识

整理 source 时补充元数据，如 `status`、`sop-priority`、主题标签等。

**预期结果：** 知识库具备持续输入、整理、维护和检索能力。

### 步骤 9：生成或更新 SOP
满足以下任一条件时执行：
- 同主题 `sop-ready` sources ≥ 3
- 存在 `sop-priority: high`
- source 更新晚于 SOP
- 用户手动指定主题

生成时从相关 sources 提炼：
- 适用场景
- 前置条件
- 标准步骤
- 检查清单
- 常见问题
- 来源回链

输出到 `wiki/sop/`。

**预期结果：** 已形成一份可执行、可复用、可追溯的 SOP。

### 步骤 10：按客户端能力执行自动或手动触发
客户端差异如下：
- **Claude Code**：支持 hooks，适合自动检查 SOP 机会
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常仅支持 skills，需要手动触发

建议统一手动口令，例如：

```text
扫描 sop-ready 并生成/更新 SOP
```

**预期结果：** 不同客户端均可按统一规则执行 SOP 工作流。

## 5. 检查清单
- [ ] 已克隆仓库并确认 vault 根目录
- [ ] 已创建全部标准目录
- [ ] 已完成 Obsidian 基础配置
- [ ] 已完成至少一个 AI 客户端的 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 hooks 或手动替代机制
- [ ] 已统一 source 状态标记规则
- [ ] 已能运行 ingest、lint、query 工作流
- [ ] 已生成至少 1 份 SOP
- [ ] 已验证 SOP 更新提醒机制有效

## 6. 最佳实践
- 所有客户端共用同一套 skills，避免规则分叉
- source 在进入 `sop-ready` 前先做最小清洗和主题归类
- SOP 只沉淀“可重复执行”的内容，避免把纯资料堆进 SOP
- SOP 更新时保留结构稳定，仅修订步骤和证据来源
- 通过 `sop-priority: high` 强化高价值经验的优先沉淀

## 7. 常见问题

### Q1：为什么 SOP 没有自动生成？
通常因为客户端不支持 hooks、source 未标记 `sop-ready`，或同主题资料不足。请依次检查客户端能力、元数据字段和主题聚合情况。

### Q2：哪些资料应该标记为 `sop-ready`？
包含可重复执行的步骤、流程、经验总结、最佳实践的资料都应标记为 `sop-ready`。

### Q3：纯参考资料是否需要生成 SOP？
不需要。纯参考资料通常标记为 `processed`，仅在形成明确流程后再进入 SOP 队列。

### Q4：为什么要做多客户端 skills 链接？
因为这样可以统一知识库能力与 SOP 规则，避免重复配置和多套版本维护。

### Q5：何时应该更新既有 SOP？
当 source 比现有 SOP 更新，或新增关键流程、例外处理、经验总结时，应及时更新。

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
