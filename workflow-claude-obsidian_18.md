---
type: sop
category: workflow
status: active
created: 2026-05-17
updated: 2026-05-17
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
用于在 Windows 环境中部署 claude-obsidian 知识库，配置基础目录与 Obsidian 设置，建立多 AI 客户端 skills 链接，并启用 SOP 自动检查、手动生成与更新提示机制。

## 适用场景
- 需要在 Windows 上搭建可供 AI 自动写笔记、分类整理与知识查询的 Obsidian 知识库
- 需要把分散的 source 笔记转为可复用的 SOP 文档
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 共享同一套 skills 与 vault
- 需要配置 SOP 自动检查、状态流转与更新提示机制

## 前置条件
- Windows 环境，且可使用 PowerShell
- 已安装 Git
- 可访问 GitHub 仓库 `https://github.com/AgriciDaniel/claude-obsidian.git`
- 已安装 Obsidian
- 已安装至少一个 AI 客户端，如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf
- 具备在用户目录下创建 Junction 链接的权限
- 已确定 vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`

## 标准步骤

### 1. 克隆 claude-obsidian 仓库到本地
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如仓库出现嵌套目录，先整理为单一根目录，确保后续所有配置都指向同一 vault。

**预期结果：** 本地存在可直接作为 vault 使用的 `claude-obsidian` 根目录。

### 2. 创建标准 vault 目录结构
在 PowerShell 中执行：

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
- `wiki/sources`：处理后的来源笔记
- `wiki/sop`：SOP 成品
- `wiki/concepts`：概念沉淀
- `wiki/entities`：实体归档
- `_templates`：模板文件

**预期结果：** 所有标准目录创建完成。

### 3. 写入 Obsidian 基础配置
准备并写入以下配置文件：

- `.obsidian/graph.json`：配置知识图谱颜色分组，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS 片段

建议将统一配置纳入版本控制，以便团队共享。

**预期结果：** Obsidian 中图谱、排除规则和外观设置正常生效。

### 4. 为多 AI 客户端创建 skills Junction 链接
将仓库内 skills 链接到各客户端的 skills 目录。标准映射如下：

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

如果父目录不存在，请先创建。

**预期结果：** 多个 AI 客户端均可读取同一套 `claude-obsidian` skills。

### 5. 创建 `skills/wiki-sop/SKILL.md`
在 `skills/wiki-sop/SKILL.md` 中定义 SOP 技能，至少包含：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题时生成 SOP
- 更新模式：当 sources 更新而 SOP 未同步时提示更新
- 质量检查：验证步骤可执行性、检查清单完整性、回链完整性

建议统一输出结构：标题、适用场景、前置条件、步骤、检查清单、FAQ、来源回链。

**预期结果：** AI 客户端可依据该技能执行 SOP 的识别、生成、更新与质检。

### 6. 配置 hooks 启用 SOP 自动检查
修改 `hooks/hooks.json`，在 `SessionStart` 中加入自动检查规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持 hooks，应确保该逻辑在每次会话开始时运行。

**预期结果：** 支持 hooks 的客户端可自动发现 SOP 生成或更新机会。

### 7. 实施 source 状态流转规范
统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

标记规则：
- 含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** sources 状态统一且可用于自动筛选。

### 8. 按客户端能力选择自动或手动 SOP 工作流
客户端差异：

- **Claude Code**：支持自动检查与 hooks
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常仅支持 skills，需手动触发

手动触发时，可直接输入“整理SOP”或明确指定某个主题。

**预期结果：** 无论客户端是否支持 hooks，都能正常启动 SOP 工作流。

### 9. 执行 SOP 生成与更新
当出现以下任一情况时执行：

- 同主题 `sop-ready` 资料达到 3 个及以上
- 存在 `sop-priority: high`
- source 更新晚于已有 SOP

执行要求：
1. 汇总同主题 sources
2. 提炼共通流程和最佳实践
3. 生成或更新 `wiki/sop/` 中的 SOP
4. 增加来源回链
5. 避免重复创建同主题 SOP

**预期结果：** `wiki/sop/` 中存在高质量、可执行、可追溯的 SOP 文档。

### 10. 完成质量检查与日常维护
生成后检查：

- 步骤是否明确、可执行
- 是否包含检查清单
- FAQ 是否覆盖常见问题
- 是否完整回链 source
- sources 与 SOP 是否保持同步

同时定期执行：
- `lint the wiki`
- 使用 `query:` 做知识检索

**预期结果：** SOP 可长期维护与复用，知识库保持整洁稳定。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库到本地
- [ ] 已创建标准 vault 目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已为至少一个 AI 客户端建立 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查规则
- [ ] 已实施统一的 source 状态流转规范
- [ ] 已确认当前客户端的 hooks 支持情况
- [ ] 已成功生成至少一个 SOP 文档到 `wiki/sop/`
- [ ] 已完成质量检查并验证来源回链

## 常见问题（FAQ）

### 1. 这个项目是否原生支持 AI 自动写笔记和知识整理？
支持。项目原生具备自动写笔记、自动分类整理和知识查询能力。

### 2. SOP 自动生成是否开箱即用？
不是。需要补充 `wiki-sop` 技能和 hooks 自动检查逻辑。

### 3. 哪些客户端支持自动 SOP 检查？
Claude Code 支持。其他客户端通常需要手动触发。

### 4. 如果客户端不支持 hooks 怎么办？
保留 skills 配置，通过手动命令触发，例如“整理SOP”或“根据某主题 sources 生成 SOP”。

### 5. 哪些 source 应标记为 `sop-ready`？
带有可复用步骤、流程、最佳实践或经验总结的资料都适合标记为 `sop-ready`。

### 6. 什么时候应该更新 SOP？
当 source 更新晚于已有 SOP，或新增 sources 改变原流程时，应立即更新。

### 7. 为什么推荐使用 Junction？
因为可以让多个 AI 客户端共享同一套 skills，减少重复维护和配置漂移。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]