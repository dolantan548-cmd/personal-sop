---
type: sop
category: workflow
status: active
created: 2026-05-15
updated: 2026-05-15
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: Windows 环境部署 claude-obsidian 知识库并配置 SOP 自动生成机制

> **Category:** workflow  
> **Last Updated:** 2026-05-15  
> **Related Sources:** [[2026-05-11-claude-obsidian部署与SOP机制配置]]

## 目的

在 Windows 环境下完整部署 claude-obsidian 知识库项目，并配置 AI 自动笔记记录、SOP 自动生成与跨 AI 客户端引用机制，实现 **知识沉淀 → 流程标准化** 的闭环。

## 适用场景

- 需要在 Windows 系统首次部署 claude-obsidian 知识库
- 需要让 Claude Code / Kimi Code / Codex CLI 等多个 AI 客户端共享同一个知识库
- 需要配置 AI 自动将笔记转化为 SOP 的触发机制
- 需要建立 source 状态流转（raw → processed → sop-ready → synthesized）的工作流

## 前置条件

- Windows 10/11，PowerShell 5.1+
- Git for Windows、Obsidian 桌面客户端
- 至少一个 AI 客户端（Claude Code / Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf）
- 目标盘符 ≥500MB 可用空间
- 创建 Junction 的权限（管理员或开发者模式）

---

## 步骤

### 1. 克隆仓库并整理目录

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
cd claude-obsidian
```

如果克隆出现嵌套目录，需将内部文件移到顶层。

**预期结果：** 顶层可见 README.md、skills/、hooks/。

### 2. 创建 vault 核心目录结构

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

**预期结果：** .obsidian、.raw、wiki/{concepts,entities,sources,sop}、_templates 目录全部存在。

### 3. 写入 Obsidian 配置文件

在 `.obsidian/` 下创建：

| 文件 | 作用 |
|------|------|
| `graph.json` | 知识图谱颜色分组（sop=黄、sources=蓝、concepts=绿、entities=紫） |
| `app.json` | 在 userIgnoreFilters 中排除 `.raw/`、`.watchdog/`、`scripts/` |
| `appearance.json` | 启用 `sop-highlight` CSS 片段 |

**预期结果：** Obsidian 图谱按颜色分组，搜索结果不含 AI 工作文件。

### 4. 为各 AI 客户端创建 skills Junction

```powershell
# Claude Code
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\claude-obsidian" -Target $VAULT
# Kimi Code
New-Item -ItemType Junction -Path "$env:USERPROFILE\.kimi\skills\claude-obsidian" -Target $VAULT
# Codex CLI
New-Item -ItemType Junction -Path "$env:USERPROFILE\.codex\skills\claude-obsidian" -Target $VAULT
# Gemini CLI
New-Item -ItemType Junction -Path "$env:USERPROFILE\.gemini\skills\claude-obsidian" -Target $VAULT
# 项目内
New-Item -ItemType Junction -Path ".cursor\skills\claude-obsidian" -Target $VAULT
New-Item -ItemType Junction -Path ".windsurf\skills\claude-obsidian" -Target $VAULT
```

**预期结果：** 各 AI 客户端 skills 目录下能进入 vault，`ingest`、`query:` 等命令可识别。

### 5. 创建 wiki-sop skill

在 `skills/wiki-sop/SKILL.md` 中定义四种模式：

1. **自动检查**：扫描 `status: sop-ready`
2. **手动生成**：按主题聚合 sources 生成 SOP
3. **更新模式**：sources 比 SOP 新时提示更新
4. **质量检查**：可执行性、检查清单、回链

**预期结果：** AI 识别 `整理SOP` 等触发短语。

### 6. 配置 hooks.json（Claude Code）

```
SessionStart:
  SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
    - 同主题 ≥3 个 → 提示生成 SOP
    - sop-priority: high → 提示生成 SOP
    - sources 比 SOP 新 → 提示更新 SOP
PostToolUse:
  自动 git commit
```

**预期结果：** 重启会话自动输出待办；git log 出现 `auto:` 提交。

### 7. Source 状态流转规则

```
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

**自动标记规则：**
- 含分步骤操作 → `status: sop-ready`
- 最佳实践 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** 新笔记自动获得正确状态；`lint the wiki` 不报错。

### 8. 端到端验证

1. `ingest:` 测试内容 → 检查 sources/
2. Obsidian 打开核对 frontmatter
3. `整理 SOP: 测试主题` → 检查 sop/
4. `query: 测试主题` → 验证检索
5. （Claude Code）重启会话观察 SessionStart

**预期结果：** 五步全过；source ↔ SOP 双向 wikilink；git 自动提交可见。

---

## 检查清单

- [ ] 仓库克隆完成且无嵌套目录
- [ ] vault 七个核心目录全部存在
- [ ] graph.json / app.json / appearance.json 已写入
- [ ] 至少一个 AI 客户端的 Junction 创建成功
- [ ] skills/wiki-sop/SKILL.md 四种模式定义完整
- [ ] hooks/hooks.json 已加入 SOP AUTO-CHECK 与自动 commit
- [ ] Source 状态规则已文档化
- [ ] 端到端工作流验证通过
- [ ] git 自动提交正常

---

## 各 AI 客户端支持差异

| 工具 | 自动检查 SOP | Hooks 支持 |
|------|------------|-----------|
| **Claude Code** | ✅ 自动 | ✅ hooks.json |
| Kimi Code | ⚠️ 手动 | ❌ |
| Codex CLI | ⚠️ 手动 | ❌ |
| Gemini CLI | ⚠️ 手动 | ❌ |
| Cursor | ⚠️ 手动 | ❌ |
| Windsurf | ⚠️ 手动 | ❌ |

---

## 常见问题

**Q: 为什么使用 Junction 而不是 symlink？**  
A: Junction 在 Windows 上兼容性更好，不需管理员权限（开发者模式下），且 CLI 工具不会将其视为不可信路径。

**Q: 非 Claude Code 客户端如何自动检查？**  
A: 只能手动触发，或依赖仓库内 `.watchdog` 守护进程定时扫描。

**Q: 如何判定 sop-ready？**  
A: 含分步操作 / 是经验总结 / 同主题 ≥3 篇 sources，任一满足。

**Q: 多 AI 同时写入会冲突吗？**  
A: 概率小；依赖 PostToolUse 自动 commit 保留快照，冲突时用 git 解决。

**Q: ingest 后笔记搜索不到？**  
A: 检查 .obsidian/app.json 的 userIgnoreFilters，确认笔记已从 raw 流转。

**Q: SOP 与 sources 如何保持同步？**  
A: wiki-sop 的更新模式会在 SessionStart 比较 mtime，超过即提示更新。

---

## 相关 Sources

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
