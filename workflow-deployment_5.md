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

# SOP: claude-obsidian 知识库部署与 SOP 自动机制配置（Windows）

**Category:** workflow  
**Date:** 2026-05-15

## 目的
在 Windows 环境下完整部署 claude-obsidian 知识库项目，配置 SOP 自动生成机制，并实现多 AI 客户端（Claude Code / Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf）共享同一份 vault 与 skills 的能力。

## 适用场景
- 首次在 Windows 机器上落地 claude-obsidian 知识库项目
- 需要让多个 AI 客户端引用同一份 vault 与 SOP
- 需要将 sources 中的可复用流程自动转化为 SOP 文档
- 希望让 Claude Code 在每次会话开始时自动检查并提示生成/更新 SOP

## 前置条件
- Windows 操作系统，已安装 PowerShell 5+ 或 PowerShell 7
- 已安装 Git 并可访问 GitHub
- 已安装 Obsidian 客户端（用于查看知识库）
- 至少安装一种 AI 客户端：Claude Code / Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf
- 拥有目标部署目录的读写权限
- 了解 PowerShell 中 Junction（目录连接）的基本概念

## 步骤

### 1. 克隆仓库并整理目录
```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
cd claude-obsidian
# 如出现嵌套目录，使用 Move-Item 将内层文件上移并删除冗余目录
```
**期望结果：** 仓库根目录直接包含 wiki/、skills/、hooks/ 等顶层文件夹。

### 2. 创建 vault 骨架目录
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
**期望结果：** vault 骨架建立完成，可被 Obsidian 识别。

### 3. 写入 Obsidian 配置文件
- `.obsidian/graph.json` — 知识图谱分组颜色（sop 节点黄色）
- `.obsidian/app.json` — userIgnoreFilters 排除 .raw / .git / scripts 等
- `.obsidian/appearance.json` — 启用 snippets 下的 CSS 片段

**期望结果：** Obsidian 中左侧文件树干净，图谱视图按分类配色。

### 4. 创建多 AI 客户端 skills Junction 链接
```powershell
$SRC = "D:\dolan_env\temp\project\personal\claude-obsidian"
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian"   -Target $SRC -Force
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian"  -Target $SRC -Force
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target $SRC -Force
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target $SRC -Force
New-Item -ItemType Junction -Path ".cursor\skills\claude-obsidian"   -Target $SRC -Force
New-Item -ItemType Junction -Path ".windsurf\skills\claude-obsidian" -Target $SRC -Force
```
**期望结果：** 所有客户端 skills 目录指向同一 vault。

### 5. 创建 wiki-sop skill
在 `skills/wiki-sop/SKILL.md` 定义四种工作模式：
1. **自动检查**：扫描 status: sop-ready 的 sources
2. **手动生成**：按用户主题合并 sources
3. **更新**：sources 新于 SOP 时提示更新
4. **质量检查**：步骤可执行性 / checklist / 回链完整性

**期望结果：** 在任一客户端说"整理 SOP"均能生成符合模板的文件。

### 6. 配置 Claude Code Hooks 实现自动触发
编辑 `hooks/hooks.json`：
- **SessionStart**：扫描 wiki/sources/ 中 status: sop-ready 的笔记
  - 同主题 ≥ 3 篇 → 提示生成 SOP
  - sop-priority: high → 立即提示
  - sources 新于 SOP → 提示更新
- **PostToolUse**：自动 git commit

**期望结果：** Claude Code 启动时自动输出待处理 SOP 列表。

### 7. 建立 Source 状态流转规则
```
ingest → raw → processed → archived
                │
                └─→ sop-ready → synthesized
```
Auto-marking 规则：
- 含分步骤流程 → `status: sop-ready`
- 最佳实践/经验 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**期望结果：** ingest 阶段自动写入正确的 status frontmatter。

### 8. 端到端验证
1. ingest 一段含步骤的内容
2. 确认 wiki/sources/ 出现 sop-ready 笔记
3. 重启 Claude Code 会话，验证 SessionStart 提示
4. 说"整理 SOP"，确认 wiki/sop/ 出现新文件
5. 在 Obsidian 中查看图谱与回链

**期望结果：** ingest → sop-ready → 生成 SOP → 图谱可视化全链路打通。

## 各 AI 客户端能力对照

| 工具 | 自动检查 SOP | Hooks 支持 | 触发方式 |
|------|-------------|-----------|---------|
| **Claude Code** | ✅ 自动 | ✅ hooks.json | SessionStart 自动 + 自动 commit |
| Kimi Code | ⚠️ 手动 | ❌ | 用户说"整理SOP" |
| Codex CLI | ⚠️ 手动 | ❌ | 用户说"整理SOP" |
| Gemini CLI | ⚠️ 手动 | ❌ | 用户说"整理SOP" |
| Cursor | ⚠️ 手动 | ❌ | 用户说"整理SOP" |
| Windsurf | ⚠️ 手动 | ❌ | 用户说"整理SOP" |

## 检查清单
- [ ] 仓库已克隆且无嵌套目录
- [ ] $VAULT 骨架目录齐全
- [ ] graph.json / app.json / appearance.json 已写入
- [ ] 各 AI 客户端 Junction 已创建
- [ ] skills/wiki-sop/SKILL.md 四种模式已定义
- [ ] hooks/hooks.json SessionStart 包含 SOP AUTO-CHECK
- [ ] ingest skill 能自动写入 status frontmatter
- [ ] 端到端验证通过

## FAQ
**Q: 为什么必须使用 Junction？**  
A: 普通 .lnk 不被识别为目录，符号链接需管理员权限；Junction 在用户态即可创建且对应用透明。

**Q: 其他客户端能否像 Claude Code 那样自动触发？**  
A: 目前只有 Claude Code 原生支持 hooks，其余需手动触发。

**Q: 出现嵌套目录怎么办？**  
A: 用 Move-Item 上移内层文件，再删空目录。

**Q: 如何判断 source 是否 sop-ready？**  
A: 含分步骤 / 最佳实践 / 可复用流程 → sop-ready；纯参考资料 → processed。

**Q: 多个客户端同时写入会冲突吗？**  
A: 物理层同一目录，建议开启自动 commit；冲突用 git 解决。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
