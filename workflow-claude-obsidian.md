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
规范在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制，确保知识沉淀、流程复用和跨客户端一致引用。

## 适用场景
- 需要在 Windows 上搭建 claude-obsidian 知识库
- 希望 AI 自动写入、整理和查询笔记
- 希望将可复用流程自动转化为 SOP
- 需要在 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor 或 Windsurf 中复用同一套知识库/skills
- 需要建立 source 到 SOP 的标准状态流转机制

## 前置条件
- Windows 环境，具备 PowerShell 权限
- 已安装 Git
- 可访问 claude-obsidian 仓库：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 明确知识库目录，例如 `D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个支持 skills 的 AI 客户端
- 具备创建 Junction 目录链接的权限

## 标准步骤

### 1. 克隆仓库并确认 Vault 路径
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在嵌套目录或旧版本残留，请整理为单一 vault 根目录，并定义统一变量：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录，且已确定唯一统一的 Vault 路径。

### 2. 初始化 Vault 目录结构
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

**预期结果：** Vault 中已具备标准目录结构。

### 3. 写入基础 Obsidian 配置
需要配置：

- `.obsidian/graph.json`：知识图谱颜色分组，`sop` 建议设为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS 片段

配置原则：
- SOP 节点可在图谱中明显区分
- AI 中间文件不干扰日常浏览
- snippets 功能可用

**预期结果：** Obsidian 能正确识别 Vault，图谱与界面符合知识库管理要求。

### 4. 为多 AI 客户端创建 skills Junction 链接
将项目中的 skills 目录通过 Junction 链接到各客户端。典型路径包括：

- Kimi Code：`~/.kimi/skills/claude-obsidian`
- Codex CLI：`~/.codex/skills/claude-obsidian`
- Claude Code：`~/.claude/skills/claude-obsidian`
- Gemini CLI：`~/.gemini/skills/claude-obsidian`
- Cursor：`.cursor/skills/`
- Windsurf：`.windsurf/skills/`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills\claude-obsidian"
```

**预期结果：** 多个 AI 客户端可共享同一套 skills。

### 5. 创建 wiki-sop skill
在 `skills/wiki-sop/SKILL.md` 中定义以下能力：

- 自动检查模式：扫描 `status: sop-ready` 的 sources
- 手动生成模式：按主题生成 SOP
- 更新模式：source 更新时提示更新 SOP
- 质量检查：验证步骤可执行性、检查清单、回链完整性

建议明确：
- 输入：主题、sources、目标文件名
- 输出：标准化 SOP 文档
- 校验项：步骤编号、命令、预期结果、FAQ、引用来源

**预期结果：** AI 已具备面向 SOP 的专用能力模块。

### 6. 配置 hooks 自动检查 SOP
修改 `hooks/hooks.json`，在 `SessionStart` 加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持其他钩子，可扩展自动提交等行为，但 `SessionStart` 为最低要求。

**预期结果：** 支持 hooks 的客户端在每次会话启动时都会自动发现待生成或待更新的 SOP。

### 7. 建立 Source 状态流转规则
统一采用以下状态流：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

自动标记规则：
- 分步骤操作流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

建议在 frontmatter 中统一维护：
- `status`
- `topic`
- `sop-priority`
- `updated`

**预期结果：** 系统能自动识别 source 是否具备 SOP 转化价值。

### 8. 执行端到端验证
验证流程如下：

1. ingest 一份测试资料
2. 确认资料进入 `wiki/sources/`
3. 添加 `status: sop-ready` 或 `sop-priority: high`
4. 重启支持 hooks 的客户端
5. 观察是否触发自动检查
6. 生成 SOP 到 `wiki/sop/`
7. 检查 SOP 的结构完整性
8. 在第二个客户端中验证引用

无 hooks 的客户端可手动输入“整理SOP”触发。

**预期结果：** 从 source 到 SOP 再到跨客户端调用的链路完整可用。

### 9. 按客户端能力制定使用规范
建议统一规定：

- Claude Code：负责自动检查待办 SOP
- Kimi Code / Codex CLI / Gemini CLI：负责手动触发式生成与补写
- Cursor / Windsurf：负责引用、补充和复核
- 所有客户端统一使用同一 Vault 和同一套 skills

**预期结果：** 团队成员理解自动化差异并按统一机制协作。

## 检查清单
- [ ] 已成功克隆 claude-obsidian 仓库并确认唯一 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已配置 `.obsidian/graph.json`、`.obsidian/app.json`、`.obsidian/appearance.json`
- [ ] 已为至少一个 AI 客户端创建 skills Junction 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已在 `hooks/hooks.json` 中加入 SOP 自动检查规则
- [ ] 已建立 source 状态流转与标记规则
- [ ] 已完成端到端测试
- [ ] 已验证至少两个客户端可引用同一 SOP

## FAQ

### Q1. 为什么 SOP 不会自动生成？
最常见原因是客户端不支持 hooks，或 `hooks/hooks.json` 未配置 `SessionStart` 自动检查。无 hooks 的客户端通常需要手动触发。

### Q2. 哪些 source 应该标记为 `sop-ready`？
包含操作步骤、排障路径、经验总结、最佳实践且具备复用价值的资料，都应标记为 `sop-ready`。

### Q3. 什么时候应该提示生成 SOP？
当同主题 `sop-ready` source 达到 3 份及以上，或存在 `sop-priority: high` 的资料时，应提示生成；当 source 更新晚于 SOP 时，应提示更新。

### Q4. 为什么使用 Junction？
因为 Junction 能让多个客户端共享同一份 skills，避免复制带来的版本漂移。

### Q5. 无 hooks 的客户端还能用吗？
可以。它们仍可共享 Vault 与 skills，只是需要手动触发 SOP 生成或更新。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]