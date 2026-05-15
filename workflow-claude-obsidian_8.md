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

# SOP: 在 Windows 环境部署 claude-obsidian 知识库并配置 SOP 自动机制

**类别:** workflow  
**日期:** 2026-05-15

## 目的
在 Windows 环境下完整部署 claude-obsidian 知识库项目，并配置 AI 自动生成 SOP 的触发机制，使多个 AI 客户端（Claude Code / Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf）均可引用同一个 vault 进行知识沉淀与 SOP 复用。

## 适用场景
- 首次在 Windows 机器上部署 claude-obsidian 知识库
- 需要让多个 AI 客户端共享同一个知识库 vault
- 希望 AI 在写笔记的同时自动识别并生成 SOP
- 需要配置 source → sop-ready → synthesized 的自动流转
- 迁移或重建 .obsidian 配置时需要标准化流程

## 前置条件
- Windows 系统并已安装 PowerShell 5+
- 已安装 Git 并配置好 GitHub 访问
- 已安装 Obsidian 客户端
- 至少安装一个 AI 客户端
- 对 PowerShell Junction 链接与 Obsidian vault 结构有基本了解
- 拥有目标目录 `D:\dolan_env\temp\project\personal` 的写入权限

## 步骤

### 1. 克隆仓库并整理目录结构
```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```
若产生嵌套目录需手工提层。
**预期结果:** 顶层可见 README/scripts/wiki，没有多余嵌套。

### 2. 创建 vault 必备目录骨架
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
**预期结果:** 全部目录创建成功。

### 3. 写入 Obsidian 配置文件
- `.obsidian/graph.json` — sop 黄色分组
- `.obsidian/app.json` — 排除 AI 工作文件
- `.obsidian/appearance.json` — 启用 CSS 片段

**预期结果:** Obsidian 中 sop 节点为黄色，AI 文件不污染文件树。

### 4. 为多个 AI 客户端创建 skills Junction 链接
| 工具 | 链接位置 |
|------|---------|
| Kimi Code | `~/.kimi/skills/claude-obsidian` |
| Codex CLI | `~/.codex/skills/claude-obsidian` |
| Claude Code | `~/.claude/skills/claude-obsidian` |
| Gemini CLI | `~/.gemini/skills/claude-obsidian` |
| Cursor | `.cursor/skills/` |
| Windsurf | `.windsurf/skills/` |

```powershell
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian" -Target $VAULT
```
**预期结果:** 各客户端可识别 claude-obsidian skill。

### 5. 创建 wiki-sop SKILL 文件
在 `skills/wiki-sop/SKILL.md` 中定义四种模式：
- 自动检查
- 手动生成
- 更新提示
- 质量检查

**预期结果:** AI 调用时能按统一模板输出 SOP。

### 6. 配置 hooks.json（仅 Claude Code）
在 `hooks/hooks.json` 的 SessionStart 中加入 SOP AUTO-CHECK；在 PostToolUse 中加入自动 commit。
**预期结果:** Claude Code 启动 session 时自动提示 SOP 状态。

### 7. 建立 Source 状态流转规则
```
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```
- 分步骤操作 → `sop-ready`
- 最佳实践 → `sop-ready` + `sop-priority: high`
- 纯参考资料 → `processed`

**预期结果:** 新笔记按规则自动打标。

### 8. 验证端到端流程
Ingest 一段含步骤的内容 → 检查 frontmatter → 重启 Claude Code 看自动提示 → 在其他客户端手动触发 → Obsidian graph 检查颜色与回链。
**预期结果:** ingest → SOP 全链路通过。

## 检查清单
- [ ] 仓库 clone 完成且无嵌套
- [ ] 目录骨架已创建
- [ ] 三份 Obsidian 配置已写入
- [ ] 至少一个客户端 Junction 已创建
- [ ] wiki-sop SKILL.md 已就绪
- [ ] （可选）hooks.json 已配置
- [ ] Source 状态规则已文档化
- [ ] 端到端验证通过

## FAQ
**Q: 为什么用 Junction 而不是 mklink /D 或复制？**  
A: Junction 无需管理员权限，且对 AI 客户端透明，避免多份副本同步问题。

**Q: 非 Claude Code 的客户端无法自动检查 SOP 怎么办？**  
A: 在对话中手动说“整理 SOP”，由 wiki-sop skill 进入手动模式。

**Q: ingest 的笔记没有被自动标记为 sop-ready？**  
A: 检查是否含分步骤结构；可手动改 frontmatter。

**Q: SOP 与 sources 如何保持同步？**  
A: 更新模式比较修改时间；建议每次 ingest 后 `lint the wiki`。

**Q: 如何在 graph 中区分 SOP？**  
A: 在 `graph.json` 中为 `path:wiki/sop` 设黄色分组。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
