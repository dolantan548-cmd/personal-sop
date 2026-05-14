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

## 1. 目的
本 SOP 用于在 Windows 环境中部署 claude-obsidian 知识库，并配置 SOP 自动生成与多 AI 客户端引用机制，使资料摄取、知识整理、SOP 生成和持续维护形成统一标准流程。

## 2. 适用场景
- 在 Windows 上初始化 claude-obsidian 知识库
- 将 AI 笔记自动整理为 concepts、entities、sources 与 SOP
- 为 Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 建立统一 skills 引用
- 对 `sop-ready` 资料进行自动检查、手动生成与更新提醒
- 建立 source 状态流转和 SOP 维护机制

## 3. 前置条件
- Windows 环境并可使用 PowerShell
- 已安装 Git
- 具备目标目录读写权限
- 可访问 GitHub 仓库 `https://github.com/AgriciDaniel/claude-obsidian.git`
- 已安装至少一个 AI 客户端
- 具备创建 Windows Junction 的权限

## 4. 标准流程

### 步骤 1：克隆 claude-obsidian 仓库并确认目标路径
打开 PowerShell，执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如仓库存在嵌套目录或层级不规范，整理为统一 vault 根目录，例如：
`D:\dolan_env\temp\project\personal\claude-obsidian`

**预期结果：** 本地已存在可访问的 claude-obsidian 根目录。

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

**预期结果：** 知识库目录完整，包含 `.obsidian`、`.raw`、`wiki` 和 `_templates`。

### 步骤 3：写入 Obsidian 基础配置
补充或创建以下文件：
- `.obsidian/graph.json`：设置图谱分组颜色，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 能正确展示知识图谱、排除无关文件并启用样式片段。

### 步骤 4：为多个 AI 客户端创建 skills 链接
为各客户端创建 Junction 链接。常见目标路径如下：
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

若父目录不存在，先手动创建。

**预期结果：** 各 AI 客户端均可访问统一的 skills 定义。

### 步骤 5：建立 SOP 专用 skill
创建 `skills/wiki-sop/SKILL.md`，并在其中定义：
- 自动检查模式
- 手动生成模式
- 更新模式
- 质量检查规则

建议明确 SOP 输出目录为 `wiki/sop/`，并规定回链相关 source。

**预期结果：** AI 可依据 skill 规则生成或更新 SOP。

### 步骤 6：配置 hooks 自动检查 SOP 机会
修改 `hooks/hooks.json`，在 `SessionStart` 中加入：
- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题资料数 `>= 3` 时提示生成 SOP
- `sop-priority: high` 时优先提示
- source 比 SOP 新时提示更新 SOP

**预期结果：** 支持 hooks 的客户端可在会话开始时自动发现 SOP 机会。

### 步骤 7：定义 source 状态流转与自动标记规则
标准状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 含分步骤流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

**预期结果：** AI 能基于统一元数据识别 SOP 候选资料。

### 步骤 8：执行资料摄取、分类与查询验证
使用项目原生命令验证能力：
- `ingest`
- `query:`
- `lint the wiki`

并准备带有 `sop-ready` 标记的 source 进行测试。

**预期结果：** 知识库完成资料摄取、分类、查询和维护验证。

### 步骤 9：按客户端差异执行 SOP 生成或检查
- Claude Code：通过 hooks 自动检查并提示
- Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf：通过 skills 手动触发，例如输入“整理SOP”

生成结果统一输出到 `wiki/sop/`。

**预期结果：** 至少完成一份 SOP 的生成或更新。

### 步骤 10：完成质量检查并纳入持续维护
检查以下项目：
- 步骤是否可执行
- 是否含 checklist
- 是否含 related sources 回链
- source 更新后是否能触发 SOP 更新提醒

定期执行 `lint the wiki`，并复核 `sop-ready` 标记准确性。

**预期结果：** SOP 可执行、可追溯、可持续维护。

## 5. 检查清单
- [ ] 已成功克隆仓库
- [ ] 已创建标准目录结构
- [ ] 已写入 Obsidian 配置文件
- [ ] 已创建至少一个客户端的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已定义 source 状态流转规则
- [ ] 已验证 `ingest`、`query:`、`lint the wiki`
- [ ] 已生成至少一份 SOP
- [ ] 已完成质量检查与后续维护设置

## 6. 最佳实践
- 统一使用 `wiki/sop/` 作为 SOP 输出目录，避免分散存放
- 对高价值流程资料优先增加 `sop-priority: high`
- 在 source 元数据中保持状态字段一致，减少 AI 识别歧义
- 优先在 Claude Code 中使用自动检查机制；其他客户端采用手动触发补足
- 定期执行 `lint the wiki`，避免无效链接、状态错乱或回链缺失

## 7. 常见问题

**Q1：哪些能力是原生支持的？**  
A：AI 自动写笔记、分类整理、定期维护和知识查询为原生支持；SOP 自动生成与多 AI 引用需要额外配置。

**Q2：为什么没有自动生成 SOP？**  
A：通常因为未配置 hooks、客户端不支持 hooks、source 未标记为 `sop-ready`，或同主题资料数量不足。

**Q3：哪些客户端支持自动检查 SOP？**  
A：Claude Code 支持；其他常见客户端通常只支持 skills 手动触发。

**Q4：什么资料应标记为 `sop-ready`？**  
A：包含可复用步骤、明确流程、最佳实践或经验总结的资料。

**Q5：source 更新后如何同步 SOP？**  
A：在 hooks 中加入 source 更新时间比较规则；若客户端不支持 hooks，则手动触发更新。

**Q6：Windows 下创建 Junction 常见问题是什么？**  
A：主要是父目录不存在、权限不足或目标路径写错。应先创建父目录并校验路径。

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]