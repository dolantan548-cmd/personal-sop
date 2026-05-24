---
type: sop
category: workflow
status: active
created: 2026-05-25
updated: 2026-05-25
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
标准化在 Windows 环境中部署 claude-obsidian 知识库、建立多 AI 客户端 skills 链接，并配置 SOP 自动检查与生成机制的流程，确保知识沉淀、流程复用和跨客户端调用一致可用。

## 适用场景
- 需要在 Windows 上初始化 claude-obsidian 知识库
- 需要为知识库启用 SOP 自动发现、提示生成和更新机制
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 共享同一套 skills
- 需要将原始资料通过 ingest 流程沉淀为可检索、可维护、可转 SOP 的结构化知识

## 前置条件
- Windows 环境，已可使用 PowerShell
- 已安装 Git
- 有可写入的本地项目目录，例如 `D:\dolan_env\temp\project\personal`
- 明确的 vault 路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 至少一个 AI 客户端已安装并支持 skills 或 hooks
- 具备创建目录、写入配置文件、创建 Junction 链接的权限

## 标准步骤

### 1. 克隆项目并确认 vault 根目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果仓库存在嵌套目录或结构不符合预期，整理到最终 vault 根目录，例如：
`D:\dolan_env\temp\project\personal\claude-obsidian`

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且路径已确定为唯一 vault 路径。

### 2. 创建标准目录结构
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

**预期结果：** vault 下已存在标准目录，可用于知识沉淀与 SOP 生成。

### 3. 写入 Obsidian 基础配置
至少补齐以下文件：

- `.obsidian/graph.json`：配置知识图谱颜色分组，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS 片段

要求配置文件为合法 JSON，并与项目目录结构匹配。

**预期结果：** Obsidian 可正常识别图谱、排除规则和外观片段。

### 4. 为多 AI 客户端创建 skills Junction 链接
根据客户端按需创建 Junction，使其 skills 统一指向同一份内容。

常见映射：
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

**预期结果：** 多个 AI 客户端可共用同一套 skills，减少重复维护。

### 5. 创建 wiki-sop skill
在 `skills/wiki-sop/SKILL.md` 中定义 SOP 工作规则，至少包括：

- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：按主题生成 SOP
- 更新模式：source 更新后提示更新 SOP
- 质量检查：验证步骤可执行性、检查清单、回链完整性

建议明确输入、触发条件、输出格式与更新标准。

**预期结果：** SOP skill 行为清晰，适用于多个客户端复用。

### 6. 配置 hooks 实现自动检查
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如果客户端支持，也可在其他钩子中加入自动提交或自动维护逻辑。

**预期结果：** 支持 hooks 的客户端在会话启动时自动检查 SOP 候选与更新需求。

### 7. 建立 source 状态流转与自动标记规则
统一使用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** source 状态统一，SOP 候选资料可被稳定识别。

### 8. 按客户端能力选择触发方式
- **Claude Code**：支持 hooks，可自动检查 SOP 候选
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常仅支持 skills，需手动触发，例如输入“整理SOP”

不要将“不支持自动 hooks”误判为“skills 配置失败”。

**预期结果：** 团队明确每种客户端的 SOP 调用方式。

### 9. 执行端到端验证
准备测试 source 放入 `wiki/sources/`，并按规则标记状态，然后验证：

1. 启动支持 hooks 的客户端，检查是否自动提示生成或更新 SOP
2. 在不支持 hooks 的客户端手动调用 wiki-sop skill
3. 检查生成内容是否写入 `wiki/sop/`
4. 检查输出是否包含可执行步骤、检查清单和 source 回链
5. 更新 source 后再次验证是否提示更新 SOP

**预期结果：** source → SOP 的完整链路验证通过。

### 10. 建立日常维护机制
将以下动作纳入常规维护：

- 使用 `ingest` 导入资料
- 让资料自动归类到 `concepts`、`entities`、`sources`
- 定期执行 `lint the wiki`
- 使用 `query:` 命令检索知识和 SOP
- 定期比较 source 与 SOP 的更新时间，必要时更新 SOP

**预期结果：** 知识库维护与 SOP 生成形成稳定闭环。

## 检查清单
- [ ] 已成功克隆仓库并确认 vault 路径
- [ ] 已创建标准目录结构
- [ ] 已写入必要的 Obsidian 配置文件
- [ ] 已为至少一个客户端创建可用的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中配置 `SessionStart` 自动检查
- [ ] 已建立 source 状态流转与自动标记规则
- [ ] 已明确各客户端的自动/手动触发方式
- [ ] 已完成一次端到端验证
- [ ] 已建立日常维护节奏

## 最佳实践
- 用单一 vault 路径作为所有客户端共享的知识源，避免多份副本
- 用 Junction 而非复制目录，减少 skills 漂移
- 将 `sop-ready` 作为强约束状态，而不是随意标签
- 当同主题 source 累积到 3 份以上时，优先整理为 SOP
- 对高价值经验总结添加 `sop-priority: high`，缩短沉淀路径
- 每次 source 发生关键更新后，检查对应 SOP 是否需要同步修订
- 用 `lint the wiki` 和 `query:` 维持知识库质量与可发现性

## 常见问题

### Q1：这个项目是否原生支持 AI 自动记笔记和 SOP 生成？
A：自动记笔记、分类整理、定期维护和知识查询是原生支持的；SOP 生成依赖模板与触发机制，需要额外配置。

### Q2：为什么有些客户端不能自动检查 SOP？
A：因为并非所有客户端都支持 `hooks.json`。Claude Code 支持 hooks，因此可以自动检查；其他客户端通常只能通过 skills 手动触发。

### Q3：什么时候把 source 标记为 `sop-ready`？
A：当资料包含明确步骤、可复用操作流程，或沉淀了可执行最佳实践时，应标记为 `sop-ready`。

### Q4：什么时候应提示生成新的 SOP？
A：当同主题 `sop-ready` source 达到 3 条及以上、某条资料带有 `sop-priority: high`，或用户明确要求整理某个主题时，应生成 SOP。

### Q5：什么时候应更新已有 SOP？
A：当 source 比现有 SOP 更新，或新增关键步骤、限制条件、最佳实践时，应触发更新。

### Q6：多 AI 客户端共享能力的最佳方式是什么？
A：通过 PowerShell Junction 让各客户端的 skills 路径统一指向同一份实际内容，避免复制粘贴造成不一致。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
