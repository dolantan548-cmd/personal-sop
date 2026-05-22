---
type: sop
category: workflow
status: active
created: 2026-05-23
updated: 2026-05-23
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
本 SOP 用于在 Windows 环境中标准化完成 claude-obsidian 的部署、知识库目录初始化、多 AI 客户端 skills 复用，以及 SOP 自动检查/生成机制的配置，确保资料可以从导入、整理、识别到 SOP 沉淀形成闭环。

## 2. 适用场景
- 需要在 Windows 上搭建可被多个 AI 客户端共用的 Obsidian 知识库
- 需要把 AI 整理后的资料自动分类到知识库目录
- 需要将可复用流程资料自动识别并沉淀为 SOP
- 需要在 Claude Code 中启用 SessionStart 自动 SOP 检查
- 需要在多个 AI 工具之间共用同一套 skills 与 Vault

## 3. 前置条件
- Windows 环境
- 已安装 Git
- 可使用 PowerShell
- 已确定 Vault 根目录
- 已安装至少一个 AI 客户端（Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 等）
- 具备创建 Junction 链接的权限

## 4. 标准目录结构
```text
claude-obsidian/
├─ .obsidian/
│  └─ snippets/
├─ .raw/
├─ wiki/
│  ├─ concepts/
│  ├─ entities/
│  ├─ sources/
│  └─ sop/
└─ _templates/
```

## 5. 操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录
在 PowerShell 中执行：
```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```
如存在嵌套目录，需整理为统一 Vault 根目录。

**预期结果：** 本地已有可访问的 claude-obsidian 目录，并已明确唯一 Vault 路径。

### 步骤 2：初始化 Vault 标准目录结构
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

**预期结果：** Vault 目录结构完整，所有知识与 SOP 有固定存放位置。

### 步骤 3：写入 Obsidian 基础配置
创建或更新以下文件：
- `.obsidian/graph.json`
- `.obsidian/app.json`
- `.obsidian/appearance.json`

配置要求：
- `graph.json` 中为 `sop` 设置醒目颜色（建议黄色）
- `app.json` 中排除 AI 工作文件
- `appearance.json` 中启用 CSS 片段

**预期结果：** Obsidian 可正确展示与区分 SOP 相关节点。

### 步骤 4：为多 AI 客户端创建 skills Junction 链接
为各客户端创建技能链接：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

示例：
```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

**预期结果：** 多个 AI 客户端共享同一套 claude-obsidian skills。

### 步骤 5：建立 SOP 专用 skill 定义
创建文件：`skills/wiki-sop/SKILL.md`

内容至少覆盖：
- 自动检查模式
- 手动生成模式
- 更新模式
- 质量检查模式

建议定义：
- 扫描 `wiki/sources/` 中的 `status: sop-ready`
- 用户指定主题时直接生成 SOP
- 当 source 比 SOP 新时提示更新
- 输出到 `wiki/sop/`

**预期结果：** AI 工具可依据 SOP skill 执行 SOP 检查、生成与更新。

### 步骤 6：配置 hooks 自动检查 SOP 状态
修改 `hooks/hooks.json`，在 `SessionStart` 中加入：
```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

**预期结果：** 每次会话开始时自动识别可生成或需更新的 SOP。

### 步骤 7：统一 Source 状态流转规则
使用以下状态流转：
```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

标记规则：
- 分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** 所有 source 都可被自动化规则正确识别。

### 步骤 8：执行资料摄取、整理与 SOP 触发
标准工作流：
1. 使用 `ingest` 导入资料
2. 整理到 `wiki/sources/`
3. 补充 `status` 与必要元数据
4. 自动或手动触发 SOP 检查
5. 输出 SOP 到 `wiki/sop/`

补充命令：
- 查询：`query:`
- 维护：`lint the wiki`

**预期结果：** 资料完成从导入到 SOP 产出的闭环。

### 步骤 9：按客户端能力选择自动或手动触发方式
客户端差异：
- **Claude Code**：支持 hooks，自动检查 SOP
- **Kimi Code**：手动触发
- **Codex CLI**：手动触发
- **Gemini CLI**：手动触发
- **Cursor**：手动触发
- **Windsurf**：手动触发

建议统一口令，例如：`整理SOP`。

**预期结果：** 所有客户端均按统一规范参与 SOP 生成流程。

### 步骤 10：进行质量检查与持续维护
每次生成或更新 SOP 后检查：
- 步骤是否可执行
- 是否包含 checklist
- 是否有来源回链
- 是否与最新 source 一致
- 是否保存在 `wiki/sop/`

定期执行：
- `lint the wiki`
- 检查 source 与 SOP 的更新时间差异
- 对高优先级主题优先补齐 SOP

**预期结果：** SOP 持续保持高质量、可追溯、可维护。

## 6. 检查清单
- [ ] 已克隆项目并确认 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已创建至少一个客户端的 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已统一 source 状态字段
- [ ] 已识别至少一条 `sop-ready` 资料
- [ ] 已生成或更新至少一份 SOP
- [ ] 已完成质量检查

## 7. 最佳实践
- 所有客户端共享同一 Vault 与 skills，避免重复维护
- 对经验总结类资料优先标记 `sop-priority: high`
- 对 SOP 节点使用统一图谱颜色，方便识别
- 每次 source 更新后都检查 SOP 是否需要同步更新
- 优先在支持 hooks 的 Claude Code 中执行自动检查

## 8. 常见问题

**Q1：为什么没有自动提示生成 SOP？**  
A：请检查 source 是否标记为 `status: sop-ready`，是否满足同主题数量阈值，或当前客户端是否支持 hooks。

**Q2：哪些客户端支持自动检查？**  
A：Claude Code 支持 `hooks.json` 自动检查；其他客户端通常需手动触发。

**Q3：为什么使用 Junction？**  
A：可让多个客户端共享同一套 skills，减少重复维护并保持一致性。

**Q4：哪些资料适合标记为 `sop-ready`？**  
A：凡是包含清晰操作步骤、最佳实践、可复用经验总结的资料都适合。

**Q5：SOP 生成后是否还要人工审查？**  
A：要，重点审查可执行性、checklist、来源回链和版本一致性。

## 9. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
