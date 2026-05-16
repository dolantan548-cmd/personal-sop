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

## 目的
规范化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制，确保知识沉淀、流程复用与跨客户端引用一致。

## 适用场景
- 需要在 Windows 本地搭建可供 AI 写笔记与知识整理的 Obsidian 知识库
- 需要将分散资料沉淀为可复用的 SOP 文档
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套知识库与 skills
- 需要为 sources 笔记配置 SOP 自动检查、更新提示与质量校验机制

## 前置条件
- Windows 环境
- 已安装 Git
- 已安装 PowerShell 5+ 或 PowerShell 7+
- 具备本地文件夹创建与链接权限
- 已准备 Obsidian vault 存放路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 计划接入的 AI 客户端已在本机安装，且支持本地 skills 目录或工作区目录

## 标准操作步骤

### 1. 克隆仓库并确认 Vault 根目录
在 PowerShell 中进入目标工作目录，克隆 claude-obsidian 仓库，并确认最终 vault 根路径可作为 Obsidian 知识库使用。

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果仓库目录存在嵌套或历史残留结构，请手动整理，确保后续所有目录均在同一个 vault 根目录下。

**预期结果：** 本地存在可访问的 claude-obsidian 根目录，后续可作为统一 Vault 路径使用。

### 2. 创建标准目录结构
在 vault 根目录下创建 Obsidian 配置目录、原始资料目录、wiki 分类目录、SOP 目录和模板目录。

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

**预期结果：** Vault 内已具备标准目录结构。

### 3. 写入基础 Obsidian 配置
在 `.obsidian` 目录中补充必要配置文件：

- `.obsidian/graph.json`：为知识图谱设置分类颜色，建议将 `sop` 分组标识为黄色
- `.obsidian/app.json`：排除 AI 工作文件，减少噪音
- `.obsidian/appearance.json`：启用 CSS snippets

如果已有同名文件，先备份再修改。

**预期结果：** Obsidian 能正确识别知识库结构，图谱中可区分 SOP，且 AI 工作文件不会干扰浏览。

### 4. 为多 AI 客户端创建 skills 链接
将仓库中的 skills 目录通过 Windows Junction 链接到各 AI 客户端约定的 skills 位置。

推荐目标：
- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/claude-obsidian`
- Windsurf：`.windsurf/skills/claude-obsidian`

示例：
```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "D:\dolan_env\temp\project\personal\claude-obsidian\skills"
```

**预期结果：** 多个 AI 客户端可读取同一套 skills。

### 5. 创建 SOP 自动机制技能说明文件
在 `skills/wiki-sop/SKILL.md` 中定义 SOP 自动化规则，至少包括：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按指定主题生成 SOP
- 更新模式：sources 更新时提示刷新 SOP
- 质量检查：验证步骤可执行性、检查清单完整性、回链完整性

建议明确 SOP 输出结构：用途、场景、前置条件、步骤、检查清单、FAQ、关联来源、Markdown 正文。

**预期结果：** AI 可按统一规范执行 SOP 检查、生成与更新。

### 6. 配置 hooks 自动检查规则
在 `hooks/hooks.json` 中配置自动触发逻辑，重点为 `SessionStart`：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

Claude Code 可结合 `PostToolUse` 做进一步自动处理；不支持 hooks 的客户端保留同样规则供手动执行。

**预期结果：** 支持 hooks 的客户端在会话开始时自动扫描 SOP 候选资料。

### 7. 统一 Source 状态流转规则
建立以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 包含分步骤操作流程：`status: sop-ready`
- 包含最佳实践或经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

**预期结果：** 来源资料具备清晰生命周期，AI 能识别 SOP 候选内容。

### 8. 执行知识导入与日常维护
使用项目原生命令：

- `ingest`：导入资料并自动记笔记
- 自动分类到 `concepts`、`entities`、`sources`
- `lint the wiki`：定期维护
- `query:`：知识查询

导入后检查 source 元数据状态是否正确，必要时手动修正。

**预期结果：** 资料被持续导入并规范分类，知识库保持可查询与可维护状态。

### 9. 生成或更新 SOP 文档
根据自动扫描结果或手动指定主题，在 `wiki/sop/` 中生成 SOP。触发建议：

- 同主题 `sop-ready` 资料 ≥ 3
- `sop-priority: high`
- source 比 SOP 更新

生成时应合并多来源内容，统一术语，去重并补全缺失步骤。

**预期结果：** 目标主题生成结构统一、可执行、可回溯的 SOP 文档。

### 10. 验证跨客户端可用性并完成交付
分别在各客户端验证：

1. 能否读取 skills
2. 能否访问同一 vault 路径
3. 能否查询 `wiki/sources/` 与 `wiki/sop/`
4. Claude Code 是否可在 `SessionStart` 自动检查 SOP
5. 其他客户端是否可通过手动指令完成 SOP 生成

最后在 Obsidian 中检查图谱、目录和页面回链。

**预期结果：** 同一知识库可被多个 AI 客户端稳定复用，自动或手动 SOP 流程均可运行。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认统一 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已写入基础 Obsidian 配置
- [ ] 已至少为一个 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 `SessionStart` 规则
- [ ] 已统一 source 状态流转与自动标记规则
- [ ] 已完成至少一次 `ingest` 导入
- [ ] 已成功生成或更新至少一个 SOP
- [ ] 已完成跨客户端验证

## 最佳实践
- 使用统一的 vault 根目录，避免路径漂移
- 使用 Junction 而非复制目录，降低多客户端维护成本
- 将 SOP 候选识别规则写入 skill 与 hook，避免依赖人工记忆
- 优先从高复用、高优先级 sources 生成 SOP
- 定期检查 sources 与 SOP 的时间差，及时更新过期流程
- 生成 SOP 时保留来源回链，确保可追溯

## 常见问题

### Q1：为什么有些 AI 客户端不会自动提示生成 SOP？
因为并非所有客户端都支持 hooks。Claude Code 支持 `hooks.json`，可自动检查；其他客户端多为 skills 手动触发模式。

### Q2：什么样的 source 应该标记为 `sop-ready`？
包含明确步骤、可重复执行流程、最佳实践或经验总结的资料，都应标记为 `sop-ready`；高价值内容再增加 `sop-priority: high`。

### Q3：什么时候应该生成新的 SOP？
当同主题累计至少 3 份 `sop-ready` 资料，或存在 `sop-priority: high`，或 sources 比现有 SOP 更新时，应生成或更新 SOP。

### Q4：目录结构不标准会有什么影响？
会影响 skills 引用、hooks 扫描、分类存放和 Obsidian 浏览，因此必须保持统一目录结构。

### Q5：Windows 上为什么推荐使用 Junction？
因为它适合本地目录复用，能让多个客户端共享同一份 skills，而无需复制多份内容。

## 关联来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
