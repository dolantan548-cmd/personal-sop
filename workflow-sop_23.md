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

## 1. 目的
本 SOP 用于标准化在 Windows 环境中部署 claude-obsidian 知识库、启用 SOP 自动生成与更新机制，并完成多 AI 客户端共享引用配置，确保知识采集、整理、查询与 SOP 产出流程可重复执行。

## 2. 适用场景
- 需要在 Windows 上搭建可被多个 AI 客户端共用的 Obsidian 知识库
- 希望将 AI 采集的资料自动整理到 wiki 并按条件转化为 SOP
- 需要为 Claude Code 配置自动 SOP 检查与更新提示
- 需要让 Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等工具复用同一套 skills

## 3. 前置条件
- Windows 环境，具备 PowerShell 执行能力
- 已安装 Git
- 可访问仓库 `https://github.com/AgriciDaniel/claude-obsidian.git`
- 已确定知识库路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装或准备使用至少一个 AI 客户端（如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf）
- 具备创建目录、写入配置文件、创建 Junction 链接的权限
- 了解 Obsidian vault 的基本目录结构

## 4. 标准操作步骤

### 步骤 1：克隆仓库并确认 Vault 根目录
在 PowerShell 中进入目标工作目录并克隆项目：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如克隆后出现多层嵌套目录，整理为单一 vault 根目录，并记录路径变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可用的 claude-obsidian 项目目录，且已明确唯一的 vault 根路径。

### 步骤 2：创建标准目录结构
执行以下命令：

```powershell
New-Item -ItemType Directory -Path "$VAULT\.obsidian\snippets" -Force
New-Item -ItemType Directory -Path "$VAULT\.raw" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\concepts" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\entities" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sources" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sop" -Force
New-Item -ItemType Directory -Path "$VAULT\_templates" -Force
```

**预期结果：** 已生成 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等标准目录。

### 步骤 3：写入 Obsidian 基础配置
补齐或更新以下配置文件：

1. `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 目录设为黄色。
2. `.obsidian/app.json`：排除 AI 工作文件，减少干扰。
3. `.obsidian/appearance.json`：启用 CSS snippets。

建议将这些配置纳入版本管理，避免团队成员配置不一致。

**预期结果：** Obsidian 可正确识别 vault，图谱分组正常，AI 工作文件被排除，样式片段已启用。

### 步骤 4：为多 AI 客户端创建 skills Junction 链接
将共享 skills 链接到各客户端目录。示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target "$VAULT\skills"
```

对于 Cursor、Windsurf，将链接建立到其 `.cursor/skills/` 或 `.windsurf/skills/` 目录下。若父目录不存在，先创建。

**预期结果：** 各 AI 客户端均能访问同一套 skills，无需重复维护。

### 步骤 5：创建 wiki-sop 技能定义
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：

- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题时生成 SOP
- 更新模式：当 sources 更新且比现有 SOP 更新时，提示刷新 SOP
- 质量检查：验证步骤可执行性、检查清单完整性、来源回链完整性

建议同时定义输入格式、输出路径、命名规范和验收标准。

**预期结果：** `skills/wiki-sop/SKILL.md` 已存在且可被客户端调用。

### 步骤 6：配置 hooks 自动检查机制
修改 `hooks/hooks.json`，在 `SessionStart` 中加入以下检查规则：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题来源数量 `>= 3` 时提示生成 SOP
- 若存在 `sop-priority: high` 则优先提示生成 SOP
- 如果 sources 更新时间晚于 SOP，则提示更新 SOP

如使用 Claude Code，可借助 hooks 实现自动检查和后续自动化操作。

**预期结果：** 会话开始时可自动识别可生成或需更新的 SOP。

### 步骤 7：建立 Source 状态流转规则
统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 包含分步骤操作流程：`status: sop-ready`
- 最佳实践或经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

建议把这些规则写入模板 frontmatter。

**预期结果：** source 文档状态统一、可机读，自动触发逻辑稳定。

### 步骤 8：执行一次端到端验证
验证链路如下：

1. 通过 `ingest` 导入测试内容
2. 确认资料进入 `.raw` 或 `wiki/sources/` 并完成分类
3. 为至少 3 份同主题资料设置 `status: sop-ready`，或为单份高价值资料设置 `sop-priority: high`
4. 启动 Claude Code，会话开始时检查是否出现 SOP 生成/更新提示
5. 在不支持 hooks 的工具中手动输入“整理SOP”等指令进行验证
6. 检查 SOP 是否生成到 `wiki/sop/`，并包含步骤、检查清单与来源回链

**预期结果：** 从导入到 SOP 生成的全流程可成功执行。

### 步骤 9：按客户端差异制定使用方式
客户端差异如下：

- **Claude Code**：支持自动 SOP 检查，适合启用 hooks 自动模式
- **Kimi Code**：支持 skills，通常需手动触发
- **Codex CLI**：支持 skills，通常需手动触发
- **Gemini CLI**：支持 skills，通常需手动触发
- **Cursor / Windsurf**：可共享 skills，但通常不支持同等级 hooks 自动化

**预期结果：** 用户明确知道各工具的触发方式，不会误判自动化能力。

### 步骤 10：建立日常维护与更新规范
将以下动作纳入日常维护：

- 定期运行知识库维护，例如 `lint the wiki`
- 新资料入库后及时标记 `status` 与 `sop-priority`
- source 更新后检查对应 SOP 是否需要刷新
- 定期检查 `wiki/sop/` 中内容是否仍可执行
- 统一维护模板、skills 与 hooks 配置

**预期结果：** 知识库与 SOP 长期保持可用、可追溯、可更新。

## 5. 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已为目标 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中添加 SOP 自动检查逻辑
- [ ] 已确定 source 状态流转与自动标记规则
- [ ] 已完成端到端验证
- [ ] 已明确各客户端的触发方式
- [ ] 已建立日常维护机制

## 6. 常见问题

### Q1：该项目是否原生支持 AI 自动写笔记和知识整理？
支持。可通过 `ingest` 自动写笔记，并自动分类到 `concepts`、`entities`、`sources` 等目录。

### Q2：SOP 会自动生成吗？
可以，但需要额外配置。项目具备模板与技能基础能力，需补充 `wiki-sop` skill 和 hooks 触发逻辑。

### Q3：哪些客户端支持自动 SOP 检查？
来源中明确支持自动 hooks 的是 Claude Code。其他客户端多为共享 skills + 手动触发模式。

### Q4：什么情况下应标记为 `sop-ready`？
当资料包含可复用流程、明确步骤、可执行经验总结时，应标记为 `sop-ready`；高优先级内容应追加 `sop-priority: high`。

### Q5：什么时候应提示生成 SOP？
当同主题 `sop-ready` 资料达到 3 份及以上，或单份资料被标记为高优先级时，应提示生成。

### Q6：什么时候需要更新 SOP？
当 source 内容的更新时间晚于现有 SOP 时，应提示更新，防止知识过期。

### Q7：如果工具不支持 hooks 怎么办？
继续使用共享 skills，但改为手动触发，例如直接要求工具“整理SOP”或指定主题生成 SOP。

## 7. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]