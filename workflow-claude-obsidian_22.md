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
规范化在 Windows 环境中部署 claude-obsidian 知识库、建立多 AI 客户端 skills 链接，并配置 SOP 自动检查与生成机制，以实现知识沉淀、流程复用和跨工具引用。

## 适用场景
- 需要在 Windows 上搭建 claude-obsidian 知识库
- 希望 AI 自动写入、分类和维护笔记
- 希望将可复用流程自动识别并转化为 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等工具中共享同一套知识库能力
- 需要通过 hooks 或手动触发方式检查并更新 SOP

## 前置条件
- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定知识库根目录路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 具备在用户目录下创建 Junction 链接的权限
- 了解各 AI 客户端本地 skills 目录位置

## 标准流程

### 步骤 1：克隆 claude-obsidian 仓库并确认目录位置
打开 PowerShell，进入目标工作目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如仓库存在嵌套目录或历史整理遗留，请手动确认最终 vault 根目录为后续统一使用的路径，例如：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已成功获取 claude-obsidian 仓库，且已确认唯一的 vault 根目录路径。

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

**预期结果：** vault 内已具备标准目录，支持原始资料、知识分类、SOP 输出和模板管理。

### 步骤 3：写入基础 Obsidian 配置
配置以下文件：

1. `.obsidian/graph.json`：为知识图谱设置颜色分组，建议 `sop` 使用黄色。
2. `.obsidian/app.json`：排除 AI 工作文件，减少噪音。
3. `.obsidian/appearance.json`：启用 CSS snippets。

如已有配置，保留原结构并追加 `sop` 相关规则；如无，可先创建最小可用配置并在 Obsidian 内验证。

**预期结果：** Obsidian 可正确加载 vault，知识图谱和外观设置生效。

### 步骤 4：建立多 AI 客户端 skills 链接
将各 AI 客户端的本地 skills 目录通过 Junction 链接到 claude-obsidian 的 skills 目录。目标位置示例：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/`
- Windsurf：`.windsurf/skills/`

如父目录不存在，先创建父目录，再执行 `New-Item -ItemType Junction`。

**预期结果：** 多个 AI 客户端共享同一套 skills，无需重复复制维护。

### 步骤 5：配置 SOP 技能文档
在 `skills/wiki-sop/SKILL.md` 中定义统一 SOP 能力，至少包括：

- 自动检查模式：扫描 `status: sop-ready` 资料
- 手动生成模式：按用户指定主题生成 SOP
- 更新模式：source 更新时提示更新 SOP
- 质量检查：检查步骤可执行性、清单完整性、回链完整性

**预期结果：** AI 客户端能够基于统一技能说明执行 SOP 检查、生成和更新。

### 步骤 6：配置 hooks 自动检查机制
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入 SOP 自动检查规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

对于支持 hooks 的客户端，自动在会话开始时执行；对于不支持 hooks 的客户端，将这套逻辑作为人工检查标准。

**预期结果：** SOP 候选项与待更新项可以被稳定发现。

### 步骤 7：落实 source 状态流转规则
统一资料状态流：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** 资料具备统一状态，便于自动扫描与 SOP 产出。

### 步骤 8：按客户端能力执行 SOP 检查与生成
- **Claude Code**：使用 hooks 自动检查；如已配置，可在 SessionStart 自动发现候选 SOP。
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：使用 skills 手动触发，例如“整理SOP”“生成某主题 SOP”“检查需要更新的 SOP”。

执行时重点判断：
- 是否已有 `sop-ready` 资料
- 同主题资料是否不少于 3 份
- 是否存在 `sop-priority: high`
- source 是否比 SOP 更新

**预期结果：** 各客户端都能以统一规则完成 SOP 生成或更新。

### 步骤 9：验证知识库功能与 SOP 结果
验证以下能力：

1. `ingest` 能自动记笔记
2. 内容能自动分类到 `concepts`、`entities`、`sources`
3. `lint the wiki` 可用于维护
4. `query:` 可用于知识查询
5. 满足条件时可在 `wiki/sop/` 生成或提示更新 SOP
6. SOP 包含清晰步骤、检查清单和来源回链

如结果异常，优先检查：
- `skills/wiki-sop/SKILL.md` 是否缺失或描述不完整
- `hooks/hooks.json` 是否未加入 SessionStart 检查
- `wiki/sources/` 中 frontmatter 状态是否不统一

**预期结果：** 整套知识库与 SOP 机制可稳定运行。

## 检查清单
- [ ] 已克隆 claude-obsidian 仓库并确认统一的 vault 路径
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已完成 `.obsidian/graph.json`、`.obsidian/app.json`、`.obsidian/appearance.json` 配置
- [ ] 已为所需 AI 客户端建立 skills Junction 链接
- [ ] 已创建或更新 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SessionStart 的 SOP 自动检查规则
- [ ] 已定义并执行 source 状态流转与自动标记规则
- [ ] 已明确各客户端的自动触发或手动触发方式
- [ ] 已验证 ingest、分类、lint、query 和 SOP 生成流程
- [ ] 已确认生成的 SOP 存放于 `wiki/sop/` 且包含来源回链

## 最佳实践
- 统一使用一个 vault 根目录，避免路径漂移导致 skills 或 hooks 失效。
- 用 Junction 共享 skills，而不是复制目录，降低维护成本。
- 对 source frontmatter 做统一约束，优先保证 `status` 与 `sop-priority` 可机器识别。
- 在 SOP 生成前先确保 source 足够聚合，避免单一资料过早转为低质量 SOP。
- 定期执行 `lint the wiki`，保持链接、分类和结构整洁。
- 对已生成 SOP 建立回链，确保能追溯到原始来源。

## 常见问题 FAQ

### 1. claude-obsidian 是否原生支持 SOP 自动生成？
原生具备 AI 自动记笔记、分类、维护与查询能力，也有模板和技能机制支持 SOP 生成；但“定期转 SOP”和“多 AI 引用 SOP”通常需要额外配置触发机制与 skills 链接。

### 2. 哪些客户端支持自动检查 SOP？
Claude Code 支持 hooks，可通过 `hooks.json` 在 SessionStart 自动检查。Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 通常仅支持 skills，需要手动触发。

### 3. 什么样的 source 应该标记为 `sop-ready`？
包含明确分步骤操作、可复用流程、最佳实践或经验总结的资料，都应标记为 `status: sop-ready`；高价值资料可加 `sop-priority: high`。

### 4. 什么时候应生成新的 SOP？
当同主题下已有至少 3 份 `sop-ready` 资料，或出现 `sop-priority: high` 的资料时，应提示生成。

### 5. 什么时候应更新 SOP？
当 source 比现有 SOP 更新，或 source 中新增关键步骤、限制条件、最佳实践时，应触发更新提醒。

### 6. 客户端不支持 hooks 怎么办？
保留相同规则，但改为通过 skills 手动执行，例如输入“整理SOP”或“检查需要更新的 SOP”。

### 7. 为什么推荐使用 Junction？
因为 Junction 可让多个客户端共享同一套 skills，避免重复维护、版本不一致和路径分叉。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]