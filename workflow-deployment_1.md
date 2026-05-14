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

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
规范化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制，确保知识沉淀、流程复用和跨工具引用的一致性。

## 适用场景
- 需要在 Windows 上搭建 claude-obsidian 知识库环境
- 需要让 AI 自动写入、整理和查询知识笔记
- 需要将可复用流程资料自动转化为 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套知识库和 SOP
- 需要为团队或个人建立可维护的 SOP 生成与更新机制

## 前置条件
- Windows 环境，并可使用 PowerShell
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定知识库根目录路径，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 目标 AI 客户端已安装，且支持 skills 或目录链接
- 具备创建目录、写入配置文件和建立 Junction 链接的权限

## 标准步骤

### 1. 克隆仓库并确认 Vault 根目录
在 PowerShell 中进入目标工作目录并克隆项目仓库。若克隆后存在多层嵌套目录，先整理为单一 vault 根目录。

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

确认后续统一使用以下变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 项目目录，且已明确唯一的 Vault 根路径。

### 2. 创建标准目录结构
在 Vault 下创建 Obsidian 配置目录、原始资料目录、知识库分类目录、SOP 目录和模板目录。

```powershell
New-Item -ItemType Directory -Path "$VAULT\.obsidian\snippets" -Force
New-Item -ItemType Directory -Path "$VAULT\.raw" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\concepts" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\entities" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sources" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sop" -Force
New-Item -ItemType Directory -Path "$VAULT\_templates" -Force
```

**预期结果：** Vault 中已具备标准目录结构。

### 3. 写入基础配置文件
在 `.obsidian` 目录中补齐基础配置，至少包括以下内容：

1. `.obsidian/graph.json`：配置知识图谱颜色分组，并为 `sop` 类内容设置明显颜色（如黄色）。
2. `.obsidian/app.json`：排除 AI 工作文件，避免噪音文件影响视图与检索。
3. `.obsidian/appearance.json`：启用 CSS snippets，确保自定义显示规则可生效。

如果已有文件，按当前 vault 规范补充相应字段；如果没有，则创建最小可用配置。

**预期结果：** Obsidian 能正确识别 Vault，知识图谱、文件排除规则和样式片段配置已启用。

### 4. 为多 AI 客户端建立 skills 链接
将同一份 claude-obsidian 技能目录以 Junction 方式链接到各 AI 客户端的 skills 目录，确保多个工具共享同一套知识处理能力。

目标示例：
- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/claude-obsidian`
- Windsurf → `.windsurf/skills/claude-obsidian`

示例命令：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT"
```

如目标父目录不存在，先创建父目录。

**预期结果：** 目标 AI 客户端的 skills 目录下已出现指向同一 Vault 的 Junction 链接。

### 5. 创建 SOP 自动机制技能说明
在 Vault 中创建 `skills/wiki-sop/SKILL.md`，并写明以下能力：

- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：当 sources 更新晚于已有 SOP 时，提示更新 SOP
- 质量检查：检查步骤可执行性、检查清单、回链完整性

建议写明：
- 同主题资料数量达到阈值时提示生成 SOP
- 高优先级资料优先生成 SOP
- SOP 输出应统一结构和命名

**预期结果：** `skills/wiki-sop/SKILL.md` 已存在，AI 可据此执行 SOP 检查、生成和更新任务。

### 6. 配置 hooks 自动检查逻辑
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入 SOP 自动检查提示逻辑：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持其他 hooks，可补充自动提交或维护动作；但核心是保证 `SessionStart` 可触发检查。

**预期结果：** 支持 hooks 的客户端在会话启动时能够自动检查 SOP 候选资料和待更新内容。

### 7. 建立 Source 状态流转规则
统一 source 笔记状态字段，推荐状态流：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践或经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

要求 source 文档 frontmatter 至少包含状态字段，必要时增加主题、优先级和更新时间字段。

**预期结果：** sources 已具备统一状态标记，AI 能区分普通资料、SOP 候选资料和已综合资料。

### 8. 执行知识导入、整理与查询流程
使用项目原生能力处理知识内容：
- 使用 `ingest` 导入资料并自动记笔记
- 自动分类到 `concepts`、`entities`、`sources`
- 定期执行 `lint the wiki` 进行维护
- 使用 `query:` 进行知识检索

日常优先将流程性强、可复用的资料沉淀到 `wiki/sources/`，并补充状态字段。

**预期结果：** 知识内容已被导入、分类和维护，且可通过统一命令检索和复用。

### 9. 生成或更新 SOP
根据客户端能力执行：
- Claude Code：依赖 hooks 自动检查并提示生成或更新
- Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf：通常需手动触发，如输入“整理SOP”

生成 SOP 时统一要求：
- 使用标准 SOP 结构
- 保存到 `wiki/sop/`
- 关联来源 source
- 补齐执行步骤、检查清单、更新说明

若已有同主题 SOP，优先增量更新，而不是重复创建。

**预期结果：** `wiki/sop/` 中已生成或更新对应 SOP，内容可执行、可追溯、可复用。

### 10. 验证部署结果并进行例行维护
完成部署后执行端到端验证：
1. 用任一支持 skills 的客户端访问 Vault
2. 导入一条流程型 source，并标记为 `status: sop-ready`
3. 再补充同主题资料，验证是否触发 SOP 提示条件
4. 在支持 hooks 的客户端中重新开启会话，检查 `SessionStart` 是否执行自动扫描
5. 定期运行 `lint the wiki`，并检查 sources 与 SOP 的更新时间差异

维护建议：
- 定期审查 `sop-ready` 积压项
- 发现 SOP 与 source 不一致时立即更新
- 保持多客户端 skills 链接始终指向同一 Vault

**预期结果：** 整个部署链路已被验证可用，SOP 自动检查与手动生成流程均正常运行。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已写入或补齐 Obsidian 基础配置文件
- [ ] 已为所需 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 `SessionStart` 自动检查规则
- [ ] 已统一 source 状态流转与 frontmatter 标记
- [ ] 已验证 `ingest`、`query:` 和 `lint the wiki` 可用
- [ ] 已成功生成至少一个测试 SOP 到 `wiki/sop/`
- [ ] 已确认 sources 更新后可触发 SOP 更新提示

## 最佳实践
- 使用单一 Vault 作为所有 AI 客户端共享知识源，避免重复维护
- 用状态流转管理资料成熟度，减少无效 SOP 生成
- 将高复用、高价值经验优先标记为 `sop-ready` 和 `sop-priority: high`
- SOP 生成优先更新现有文档，避免同主题重复分叉
- 定期运行知识库维护命令，保持链接、分类和内容时效性

## 常见问题
### 1. 为什么项目原生支持笔记整理，却不能直接自动生成 SOP？
因为知识导入、分类和查询是原生能力，而 SOP 生成依赖模板和触发机制，需要额外配置 skills 与 hooks。

### 2. 哪些客户端支持自动检查 SOP？
Claude Code 支持通过 hooks 自动检查。其他客户端通常只支持 skills，因此需要手动触发。

### 3. 什么样的 source 应该标记为 `sop-ready`？
凡是包含分步骤操作流程、最佳实践、经验总结，且具有复用价值的资料，都应标记为 `sop-ready`。

### 4. 什么时候应该更新 SOP？
当 source 更新晚于 SOP，或新增关键流程、限制条件、经验规则时，应立即更新对应 SOP。

### 5. 为什么建议使用 Junction 而不是复制目录？
Junction 能保证多个客户端共享同一份配置与知识内容，避免副本不一致。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]