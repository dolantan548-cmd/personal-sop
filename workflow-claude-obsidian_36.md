---
type: sop
category: workflow
status: active
created: 2026-05-24
updated: 2026-05-24
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
规范在 Windows 环境中部署 claude-obsidian 知识库、启用多 AI 客户端 skills 引用，并配置 SOP 自动检查与生成机制，确保笔记可持续整理、查询并沉淀为标准化 SOP。

## 2. 适用场景
- 需要在 Windows 本地搭建 claude-obsidian 知识库
- 需要让 AI 自动写入、分类和维护笔记
- 需要将 sources 自动识别并转化为 SOP
- 需要在多个 AI 客户端中共享同一套 skills
- 需要跨 AI 客户端统一引用同一个 Obsidian vault

## 3. 前置条件
- Windows 环境，具备 PowerShell 权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定 vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装一个或多个 AI 客户端：Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf
- 具备创建 Junction 链接的权限

## 4. 操作步骤

### 步骤 1：克隆 claude-obsidian 仓库并确认 vault 路径
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在目录嵌套或路径不统一，先完成整理。确认最终路径：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在唯一且明确的 vault 根目录。

### 步骤 2：创建标准目录结构
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

**预期结果：** vault 中已具备知识库运行和 SOP 管理所需的基础目录。

### 步骤 3：配置 Obsidian 基础设置
创建或更新以下文件：
- `.obsidian/graph.json`：配置知识图谱颜色分组，`sop` 建议为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 可以正确展示知识图谱、隔离工作文件并启用样式片段。

### 步骤 4：为多个 AI 客户端创建 skills Junction 链接
按需创建以下映射：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

PowerShell 示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

**预期结果：** 多个 AI 客户端可共享同一套 skills。

### 步骤 5：创建 SOP 专用 skill
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：
- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查：验证步骤可执行性、检查清单、来源回链

建议统一输出到 `wiki/sop/`。

**预期结果：** 已具备可调用的 SOP 生成与更新能力。

### 步骤 6：配置 hooks 自动检查 SOP 机会
修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持，可补充 `PostToolUse` 自动提交等逻辑。

**预期结果：** 支持 hooks 的客户端在会话开始时自动扫描 SOP 生成机会。

### 步骤 7：执行 source 状态流转与标记规则
统一采用：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** source 状态统一，AI 可稳定识别 SOP 候选资料。

### 步骤 8：验证核心功能
依次验证：
1. 使用 `ingest` 导入资料
2. 检查是否自动分类到 `concepts`、`entities`、`sources`
3. 使用 `query:` 验证查询能力
4. 使用 `lint the wiki` 验证维护能力
5. 准备至少 3 条同主题且 `status: sop-ready` 的资料，重新启动支持 hooks 的客户端
6. 在不支持 hooks 的客户端手动输入“整理SOP”验证手动触发路径

**预期结果：** 自动记笔记、分类、查询、维护和 SOP 生成链路全部可用。

### 步骤 9：根据客户端差异制定使用规范
- **Claude Code**：支持 hooks，适合作为自动化主客户端
- **Kimi Code / Codex CLI / Gemini CLI**：支持 skills，但通常不支持 hooks，需要手动触发
- **Cursor / Windsurf**：按其 skills 能力执行手动触发

**预期结果：** 团队成员知道何时依赖自动机制、何时手动触发。

### 步骤 10：执行日常维护
定期执行以下动作：
- 运行 `lint the wiki`
- 检查长期停留在 `processed` 的资料
- 检查 source 更新后是否需要更新 SOP
- 确保 SOP 包含步骤、检查清单和来源回链
- 新增 AI 客户端时，通过 Junction 接入同一 skills 目录

**预期结果：** 知识库与 SOP 机制可长期稳定运行。

## 5. 检查清单
- [ ] 已克隆仓库并确定 vault 路径
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 配置
- [ ] 已为至少一个 AI 客户端创建 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 加入 SOP 自动检查逻辑
- [ ] 已实施 source 状态流转规则
- [ ] 已验证 `ingest`、`query:`、`lint the wiki`
- [ ] 已验证自动或手动 SOP 生成路径

## 6. 最佳实践
- 使用单一 vault 路径，避免多副本并行维护
- 所有 AI 客户端共享同一 skills 目录，避免配置漂移
- 优先将具备步骤化执行价值的资料标记为 `sop-ready`
- 以 Claude Code 作为自动检查主入口，其余客户端作为手动入口
- SOP 输出时必须包含来源回链，确保后续可追溯更新

## 7. 常见问题

### Q1：为什么 SOP 不会自动生成？
通常是因为客户端不支持 hooks、`hooks/hooks.json` 未配置，或 source 未标记为 `status: sop-ready`。

### Q2：哪些资料应该标记为 `sop-ready`？
包含操作步骤、可复用流程、经验总结或最佳实践的资料应标记为 `sop-ready`。

### Q3：为什么要共用同一个 skills 目录？
这样可以避免多客户端之间技能版本不一致，减少重复维护。

### Q4：source 更新后 SOP 要怎么处理？
当 source 比 SOP 更新时，应提示并执行 SOP 更新流程，确保 SOP 与最新实践一致。

### Q5：不支持 hooks 的客户端怎么办？
直接通过手动指令触发，例如“整理SOP”或指定主题生成 SOP。

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]