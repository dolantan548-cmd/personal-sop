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
规范化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制，确保知识沉淀、流程复用和跨工具引用的一致性。

## 2. 适用场景
- 需要在 Windows 上搭建 claude-obsidian 知识库
- 希望将 AI 对话或资料自动写入知识库并分类整理
- 希望基于资料自动发现可复用流程并生成 SOP
- 需要让 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 共享同一套知识库技能
- 需要建立 source 到 SOP 的标准化状态流转机制

## 3. 前置条件
- Windows 环境，具备 PowerShell 使用权限
- 已安装 Git
- 可访问 claude-obsidian 仓库
- 已确定知识库根目录，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个 AI 客户端，如 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf
- 具备在用户目录下创建 Junction 链接的权限
- 了解基础 Obsidian 目录结构与 Markdown 文件编辑方法

## 4. 标准步骤

### 步骤 1：克隆 claude-obsidian 仓库并确认根目录
在 PowerShell 中进入目标父目录后执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果克隆后出现多层嵌套目录，整理为统一根目录，例如：`D:\dolan_env\temp\project\personal\claude-obsidian`。

**预期结果：** 本地存在可访问的 claude-obsidian 根目录，且路径已确认无误。

### 步骤 2：创建知识库所需目录结构
执行以下 PowerShell 命令：

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

确保目录至少包括：
- `.obsidian/snippets`
- `.raw`
- `wiki/concepts`
- `wiki/entities`
- `wiki/sources`
- `wiki/sop`
- `_templates`

**预期结果：** 知识库目录结构完整，支持原始资料、分类知识和 SOP 文档的分层管理。

### 步骤 3：写入 Obsidian 基础配置
在 `.obsidian` 目录下创建或补充以下配置文件：
- `graph.json`：配置知识图谱颜色分组，建议将 `sop` 设为黄色
- `app.json`：排除 AI 工作文件
- `appearance.json`：启用 CSS snippets

如已有团队标准配置，优先复用统一模板。

**预期结果：** Obsidian 能正确识别知识库配置，图谱、外观和文件排除策略具备基础可用性。

### 步骤 4：为多 AI 客户端创建 skills 链接
使用 `New-Item -ItemType Junction` 将项目 skills 目录链接到目标 AI 客户端：
- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/`
- Windsurf：`.windsurf/skills/`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

必要时先创建父目录，再执行链接命令。

**预期结果：** 目标 AI 客户端可访问同一套 claude-obsidian skills，避免重复维护。

### 步骤 5：创建 wiki-sop 技能说明文件
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：
- 自动检查模式：扫描 `status: sop-ready` 的资料
- 手动生成模式：用户指定主题生成 SOP
- 更新模式：sources 更新时提示更新 SOP
- 质量检查：验证步骤可执行性、检查清单完整性、回链是否齐全

建议补充：输入格式、输出模板、命名规则、回链格式、更新条件。

**预期结果：** `skills/wiki-sop/SKILL.md` 已创建，且 AI 能依据该说明执行 SOP 任务。

### 步骤 6：配置 hooks 实现自动检查 SOP 机会
修改 `hooks/hooks.json`，在 `SessionStart` 中加入以下规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

该机制主要用于支持 hooks 的客户端，优先是 Claude Code。

**预期结果：** 支持 hooks 的客户端在会话开始时会自动发现 SOP 生成或更新机会。

### 步骤 7：建立 source 到 SOP 的状态流转规则
统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

判定规则：
- 包含分步骤操作流程：`status: sop-ready`
- 最佳实践或经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

**预期结果：** source 状态标签统一，AI 能准确识别可综合为 SOP 的资料。

### 步骤 8：按客户端能力执行 SOP 生成与维护
根据客户端能力执行：
- **Claude Code**：支持自动检查，适合做主工作流入口
- **Kimi Code**：支持 skills，通常需手动说“整理SOP”
- **Codex CLI**：支持 skills，通常需手动触发
- **Gemini CLI**：支持 skills，通常需手动触发
- **Cursor / Windsurf**：通常不支持 hooks，建议手动调用 skills

标准建议：
1. 先在 Claude Code 中自动检查
2. 在其他客户端中用统一提示词手动触发
3. 将生成的 SOP 统一保存到 `wiki/sop/`
4. 为 SOP 添加到相关 source 的回链

**预期结果：** 不同客户端均可按照统一标准生成和维护 SOP。

### 步骤 9：验证知识库工作流是否可用
执行一次完整验证：
1. 用 `ingest` 导入一条资料
2. 检查是否完成分类
3. 给 source 添加 `status: sop-ready`
4. 重启支持 hooks 的客户端会话
5. 检查是否出现 SOP 提示
6. 手动生成一次 SOP
7. 执行 `lint the wiki`
8. 用 `query:` 检索相关内容

如失败，优先检查：
- 路径是否正确
- skills Junction 是否生效
- hooks 配置是否被客户端识别
- source 元数据是否符合规则

**预期结果：** 导入、分类、生成、维护、查询全链路可用。

## 5. 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认 VAULT 路径
- [ ] 已创建 `.obsidian`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 等目录
- [ ] 已写入 `graph.json`、`app.json`、`appearance.json` 基础配置
- [ ] 已为目标 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 `SessionStart` 的 SOP AUTO-CHECK 规则
- [ ] 已定义 source 状态流转：`raw`、`processed`、`sop-ready`、`synthesized`、`archived`
- [ ] 已为可复用流程资料添加 `status: sop-ready`
- [ ] 已成功在至少一个客户端中生成或更新 SOP
- [ ] 已验证 `ingest`、`lint the wiki`、`query:` 等核心工作流可用

## 6. 最佳实践
- 统一使用一个 VAULT 根目录，避免多个客户端各自维护副本
- 用 Junction 而非复制目录，减少 skills 配置漂移
- 优先通过 source 元数据驱动 SOP 生成，不要完全依赖人工记忆
- 对高价值流程加 `sop-priority: high`，确保优先被发现
- SOP 输出后必须补充回链，确保可追溯到原始资料
- 定期执行 `lint the wiki`，保持知识库结构整洁
- 当 source 更新时，优先更新 SOP，避免流程文档失效

## 7. 常见问题

**Q：claude-obsidian 是否原生支持 AI 自动写笔记和分类整理？**  
A：支持。资料可通过 `ingest` 命令进入知识库，并自动归类到 `concepts`、`entities`、`sources` 等目录。

**Q：SOP 自动生成是不是开箱即用？**  
A：不是完全开箱即用。需要额外配置 `skills/wiki-sop/SKILL.md` 和 `hooks/hooks.json`。

**Q：哪些客户端支持自动检查 SOP？**  
A：Claude Code 支持 hooks，因此可在 `SessionStart` 自动检查。其他客户端通常需要手动触发。

**Q：什么样的 source 应该标记为 sop-ready？**  
A：包含明确步骤、可复用操作方法、最佳实践或经验总结的资料应标记为 `sop-ready`。

**Q：如果 source 更新了，已有 SOP 怎么办？**  
A：当 source 比 SOP 更新时，应提示并执行 SOP 更新，确保流程内容与资料一致。

**Q：为什么要使用 Junction 创建 skills 链接？**  
A：因为这样可以让多个 AI 客户端共享同一套 skills，减少重复维护和版本不一致问题。

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]