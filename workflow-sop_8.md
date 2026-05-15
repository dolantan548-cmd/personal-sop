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

# SOP: Windows 环境部署 claude-obsidian 并配置 SOP 自动生成机制

**类别:** workflow  
**最后更新:** 2026-05-15

## 目的

在 Windows 环境下完整部署 claude-obsidian 知识库项目，并配置 AI 自动笔记、SOP 自动生成与多 AI 客户端引用机制，解决跨工具知识沉淀和流程标准化问题。

## 适用场景

- 首次在 Windows 系统部署 claude-obsidian 知识库
- 需要让多个 AI 客户端（Claude Code、Kimi Code、Codex、Gemini、Cursor、Windsurf）共享同一个 vault
- 希望 AI 自动将对话内容沉淀为笔记并定期转为 SOP
- 需要配置 SOP 自动触发机制（扫描 sop-ready 状态笔记并生成 SOP）

## 前置条件

- Windows 系统已安装 Git 和 PowerShell
- 已安装至少一个 AI CLI 客户端（推荐 Claude Code 以获得 hooks 自动检查能力）
- 已安装 Obsidian 桌面客户端
- 拥有 GitHub 访问权限
- 对 PowerShell 基本命令（New-Item、Junction）有了解

## 操作步骤

### 步骤 1：克隆 claude-obsidian 仓库

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如出现嵌套目录需手动整理。

**预期结果:** 项目文件完整出现在目标路径下。

### 步骤 2：创建 vault 目录结构

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

**预期结果:** 所有必需目录已创建。

### 步骤 3：写入 Obsidian 配置文件

在 `.obsidian/` 下创建：

- `graph.json` — 图谱分组着色（sop=黄色）
- `app.json` — 排除 AI 工作目录
- `appearance.json` — 启用 CSS 片段

**预期结果:** Obsidian 打开后图谱按类别着色。

### 步骤 4：为多 AI 客户端创建 skills 链接

| 工具 | 链接路径 |
|------|---------|
| Claude Code | `~/.claude/skills/claude-obsidian` |
| Kimi Code | `~/.kimi/skills/claude-obsidian` |
| Codex CLI | `~/.codex/skills/claude-obsidian` |
| Gemini CLI | `~/.gemini/skills/claude-obsidian` |
| Cursor | `.cursor/skills/` |
| Windsurf | `.windsurf/skills/` |

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target $VAULT
```

**预期结果:** 各客户端 list skills 可见 claude-obsidian。

### 步骤 5：创建 wiki-sop SKILL

在 `skills/wiki-sop/SKILL.md` 中定义：

- 自动检查模式
- 手动生成模式
- 更新模式
- 质量检查模式

**预期结果:** SKILL 文件可被 AI 识别。

### 步骤 6：配置 hooks（Claude Code）

编辑 `hooks/hooks.json` 在 `SessionStart` 加入：

```
SOP AUTO-CHECK:
- ≥3 同主题 sop-ready → 提示生成
- sop-priority: high → 提示生成
- sources 比 SOP 新 → 提示更新
```

并在 `PostToolUse` 配置自动 commit。

**预期结果:** 启动会话自动检查，工具调用后自动提交。

### 步骤 7：定义 Source 状态流转

```
ingest → raw → processed → archived
                 └→ sop-ready → synthesized
```

Auto-marking 规则：

- 分步骤操作 → `sop-ready`
- 最佳实践 → `sop-ready` + `priority: high`
- 纯参考 → `processed`

**预期结果:** 笔记自动带正确 status。

### 步骤 8：验证部署

在 Claude Code 中 `ingest:` 与 `query:` 验证，切换其他客户端手动触发 SOP 生成，在 Obsidian 中检查图谱与回链。

**预期结果:** 全链路可用。

## 检查清单

- [ ] git clone 已完成且无嵌套目录
- [ ] 所有目录已创建
- [ ] graph.json / app.json / appearance.json 已写入
- [ ] skills Junction 链接已建立
- [ ] wiki-sop SKILL.md 已创建
- [ ] hooks.json 已配置
- [ ] 状态流转规则已实现
- [ ] 多客户端验证通过
- [ ] Obsidian 图谱着色正确

## 常见问题

**Q: 只有 Claude Code 能自动检查 SOP？**  
A: 是的，其他客户端只支持 skills 手动调用。

**Q: Junction 报访问拒绝？**  
A: 以管理员身份运行 PowerShell。

**Q: ingest 后没有 sop-ready？**  
A: 检查内容是否包含分步骤；纯参考资料会被标 processed。

**Q: 多客户端并发写入会冲突吗？**  
A: 可能冲突，建议切换前 git commit，并依赖 PostToolUse 钩子。

**Q: 如何验证触发阈值？**  
A: 写 3 条同主题 sop-ready 笔记后重启 Claude Code 会话观察提示。

## 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
