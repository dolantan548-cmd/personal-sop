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
用于在 Windows 环境中部署 claude-obsidian 知识库，配置知识整理目录、跨 AI 客户端 skills 链接，以及启用 SOP 自动检查与生成机制，形成可持续维护的知识库工作流。

## 适用场景
- 需要在 Windows 上搭建 claude-obsidian 知识库
- 希望让 AI 自动写入、整理和查询笔记
- 希望将可复用流程自动沉淀为 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等工具中复用同一套知识库技能

## 前置条件
- Windows 环境
- 已安装 Git
- 已安装 PowerShell，且具有创建目录与 Junction 链接的权限
- 可访问 claude-obsidian 仓库
- 已明确知识库存放路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 了解各 AI 客户端本地 skills 目录的位置

## 标准步骤

### 1. 克隆 claude-obsidian 仓库
在 PowerShell 中进入目标目录并克隆仓库：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后出现多层嵌套目录，需手动整理，确保 vault 根目录就是 `claude-obsidian`。

**预期结果：** 本地存在可用的 `claude-obsidian` 根目录，且后续所有配置均以该目录作为 VAULT 根路径。

### 2. 初始化 Vault 目录结构
设置变量并创建标准目录：

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

目录用途标准化如下：
- `.raw/`：原始输入资料
- `wiki/concepts/`：概念类笔记
- `wiki/entities/`：实体类笔记
- `wiki/sources/`：来源资料与处理后的知识源
- `wiki/sop/`：SOP 文档
- `_templates/`：模板文件
- `.obsidian/snippets/`：Obsidian CSS 片段

**预期结果：** Vault 中具备可直接用于知识管理与 SOP 生成的标准目录结构。

### 3. 写入 Obsidian 基础配置
在 Vault 中创建或更新以下配置文件：
- `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 类别设为黄色，便于在图谱中识别
- `.obsidian/app.json`：排除 AI 工作文件，避免干扰日常浏览
- `.obsidian/appearance.json`：启用 CSS snippets

如团队已有统一模板，应优先使用统一配置；若无模板，至少保证图谱分组、工作文件隐藏、样式片段启用这三项配置完成。

**预期结果：** Obsidian 打开 Vault 后，图谱展示、文件过滤与样式能力可正常工作，SOP 文件可被清晰识别。

### 4. 为多 AI 客户端创建 skills 链接
将本项目 skills 目录通过 Junction 链接到各 AI 客户端的 skills 目录，确保同一套能力可被多个客户端复用。

Kimi Code：
```powershell
New-Item -ItemType Junction -Path ~/.kimi/skills/claude-obsidian -Target $VAULT
```

Codex CLI：
```powershell
New-Item -ItemType Junction -Path ~/.codex/skills/claude-obsidian -Target $VAULT
```

Claude Code：
```powershell
New-Item -ItemType Junction -Path ~/.claude/skills/claude-obsidian -Target $VAULT
```

Gemini CLI：
```powershell
New-Item -ItemType Junction -Path ~/.gemini/skills/claude-obsidian -Target $VAULT
```

Cursor：
```powershell
New-Item -ItemType Junction -Path .cursor/skills/claude-obsidian -Target $VAULT
```

Windsurf：
```powershell
New-Item -ItemType Junction -Path .windsurf/skills/claude-obsidian -Target $VAULT
```

若目标目录不存在，先手动创建父目录。若某客户端不支持 hooks，也仍可通过 skills 实现手动调用。

**预期结果：** 目标 AI 客户端可识别 `claude-obsidian` skills，能够复用知识库工作流与 SOP 相关能力。

### 5. 创建 SOP 自动机制 skill
在项目中创建 `skills/wiki-sop/SKILL.md`，并定义 SOP 处理规则，至少包含以下四类能力：
1. 自动检查模式：扫描 `status: sop-ready` 的资料
2. 手动生成模式：用户指定主题时生成 SOP
3. 更新模式：当 source 比现有 SOP 更新时提示更新 SOP
4. 质量检查：检查步骤可执行性、检查清单完整性、回链是否完整

建议在 `SKILL.md` 中明确输出要求：
- 统一 SOP 模板
- 必须包含步骤、检查清单、FAQ、来源回链
- 优先从多个同主题 source 归纳，而不是直接复制单一资料

**预期结果：** 项目内存在可被 AI 调用的 SOP 专用 skill，且其职责覆盖自动检查、手动生成、更新提醒与质量校验。

### 6. 配置 hooks 自动检查 SOP 机会
修改 `hooks/hooks.json`，在 `SessionStart` 钩子中加入 SOP 自动检查逻辑。规则应至少覆盖：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 若同主题资料数量 ≥ 3，则提示生成 SOP
- 若 `sop-priority: high`，则优先提示生成 SOP
- 若 source 更新时间晚于对应 SOP，则提示更新 SOP

可将规则描述为类似以下内容：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

在支持 hooks 的客户端中，此机制可实现会话开始时自动提示。

**预期结果：** 支持 hooks 的客户端在会话启动时会自动检查 SOP 生成或更新机会。

### 7. 标准化 Source 状态流转
在知识库中统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

并执行以下标记规则：
- 包含分步骤操作流程：标记为 `status: sop-ready`
- 最佳实践或经验总结：标记为 `status: sop-ready` 且 `sop-priority: high`
- 纯参考资料、不可直接操作内容：标记为 `status: processed`

建议在 source 的 frontmatter 中统一维护 `status`、`topic`、`updated_at`、`sop-priority` 等字段，以便后续自动扫描。

**预期结果：** 资料状态可被一致识别，AI 能稳定判断哪些内容适合进入 SOP 工作流。

### 8. 执行日常知识导入与整理
按项目原生工作流使用以下能力：
- 用 `ingest` 导入资料并自动生成笔记
- 将资料分类到 `concepts`、`entities`、`sources`
- 定期执行 `lint the wiki` 做知识库维护
- 使用 `query:` 命令进行知识查询

在导入后，检查新产生的 source 是否满足 SOP 条件；如满足，则补充 `status: sop-ready` 或 `sop-priority: high`。

**预期结果：** 知识库持续新增结构化资料，且潜在 SOP 来源会被及时识别与标记。

### 9. 根据客户端能力触发 SOP 生成
按客户端能力选择触发方式：
- Claude Code：支持 hooks，可在 `SessionStart` 自动检查 SOP 机会；如有配置，也可在 `PostToolUse` 自动提交变更
- Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf：通常不支持 hooks，需要手动输入如“整理SOP”或指定主题以触发 skill

手动生成时，要求 AI：
- 从多个相关 source 汇总流程
- 输出到 `wiki/sop/`
- 附带检查清单、FAQ 与来源回链
- 若已有旧版 SOP，则执行更新而非重复创建

**预期结果：** 无论客户端是否支持 hooks，都能稳定触发 SOP 的创建或更新。

### 10. 验收并维护 SOP 质量
生成 SOP 后进行质量检查，至少确认：
- 每一步都是可执行动作，而不是抽象建议
- 有明确的成功结果或产出
- 检查清单覆盖部署、配置、验证和维护要点
- FAQ 能回答最常见问题
- SOP 回链到相关 source
- 当 source 更新后，SOP 会被重新提示更新

建议定期检查 `wiki/sop/` 与 `wiki/sources/` 的更新时间差异，避免 SOP 失效。

**预期结果：** SOP 文档可直接复用、可被他人执行，且能随来源知识演进持续更新。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库到本地
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录
- [ ] 已完成 `.obsidian/graph.json`、`.obsidian/app.json`、`.obsidian/appearance.json` 基础配置
- [ ] 已为至少一个 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查规则
- [ ] 已统一 source 的 `status` 与 `sop-priority` 标记规则
- [ ] 已验证 `ingest`、`lint the wiki`、`query:` 等基础能力可正常使用
- [ ] 已验证可手动或自动触发 SOP 生成/更新
- [ ] 已确认生成的 SOP 包含步骤、检查清单、FAQ 与来源回链

## 常见问题

### 1. 这个项目是否原生支持 AI 自动写笔记和 SOP 生成？
AI 自动写笔记、分类整理、定期维护和知识查询是原生支持的；SOP 生成能力依赖模板与工作流，需要额外配置触发机制后才能稳定使用。

### 2. 为什么我在某些客户端中没有自动弹出 SOP 检查？
并非所有客户端都支持 hooks。Claude Code 支持 `hooks.json` 自动检查；Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 通常只能通过 skills 手动触发。

### 3. 什么时候应该把 source 标记为 `sop-ready`？
当资料包含明确分步骤操作流程，或可被复用的最佳实践、经验总结时，应标记为 `sop-ready`。若内容优先级高，可再加 `sop-priority: high`。

### 4. 同主题资料需要多少份才建议生成 SOP？
标准规则是同主题 `sop-ready` 资料达到 3 份及以上时提示生成 SOP；如果单份资料已被标记为 `sop-priority: high`，也可提前生成。

### 5. SOP 已存在，但 source 更新了，应该怎么处理？
应比较 source 与 SOP 的更新时间；若 source 更新更晚，则触发 SOP 更新流程，而不是新建重复文档。

### 6. Windows 下为什么推荐使用 Junction？
Junction 适合在 Windows 中将同一套 skills 暴露给多个客户端，避免复制目录造成多份不一致配置。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]