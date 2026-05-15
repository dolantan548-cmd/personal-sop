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

# SOP: claude-obsidian Windows 部署与 SOP 自动机制配置

> **分类:** workflow  
> **目的:** 在 Windows 环境下完成 claude-obsidian 知识库部署，配置 SOP 自动触发机制，并实现多 AI 客户端共享同一 vault 与 skills。

---

## 适用场景

- 首次在 Windows 机器上部署 claude-obsidian 知识库
- 需要配置 AI 自动记笔记 + 自动整理 SOP 的工作流
- 希望多个 AI 客户端共用同一份 vault 与 skills 目录
- 为现有 vault 增加 SOP 自动检查、更新与质量校验机制

## 前置条件

- Windows 10/11 + PowerShell（建议管理员）
- 已安装 Git，可访问 GitHub
- 已安装 Obsidian（可选）
- 已安装至少一个 AI CLI：Claude Code / Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf
- 工作目录：`D:\dolan_env\temp\project\personal`

---

## 步骤

### 1. 克隆仓库并整理目录

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```
如有嵌套目录，将内层内容移动到外层。

**预期结果：** vault 根目录可见 `wiki/`、`skills/`、`hooks/`、`_templates/`，无多余嵌套。

### 2. 运行 setup 等效配置（创建目录结构）

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

**预期结果：** 目录结构完整。

### 3. 写入 Obsidian 配置文件

在 `$VAULT\.obsidian` 下写入：

- `graph.json`：知识图谱分组颜色（sop=黄、concepts=蓝、entities=绿、sources=灰）
- `app.json`：`userIgnoreFilters` 排除 `.raw/`、`.watchdog/`、`hooks/`
- `appearance.json`：`enabledCssSnippets` 启用 CSS 片段

**预期结果：** Obsidian 打开 vault 时按色分组，AI 工作文件不出现在搜索/图谱中。

### 4. 为多个 AI 客户端创建 skills Junction 链接

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian"   -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian"  -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target "$VAULT\skills"
```

Cursor / Windsurf 在项目目录下的 `.cursor\skills\`、`.windsurf\skills\` 同样建立 Junction。

**预期结果：** 所有客户端 skills 目录都能看到同一份 claude-obsidian 内容。

### 5. 创建 `skills/wiki-sop/SKILL.md`

包含四种模式：

1. **自动检查模式** — 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
2. **手动生成模式** — 用户指定主题生成 SOP
3. **更新模式** — sources 比 SOP 新时提示更新
4. **质量检查** — 步骤可执行性、checklist、回链 `[[wikilinks]]`

触发关键词：`整理SOP` / `生成SOP` / `检查SOP`。

**预期结果：** 在 AI 客户端中触发关键词即可按规范产出 SOP。

### 6. 修改 `hooks/hooks.json` 加入 SOP AUTO-CHECK

```
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

Claude Code 同时在 `PostToolUse` 钩子加入 auto-commit。

**预期结果：** Claude Code 启动时自动列出待生成/待更新的 SOP 清单。

### 7. 约定 Source 状态流转与 Auto-marking

```
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

Auto-marking 规则：

- 含分步骤操作 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** ingest 自动带正确 status，wiki-sop 可正确筛选素材。

### 8. 验证多 AI 客户端协作

在每个客户端依次：

1. `query: <主题>` 验证读 wiki
2. `ingest` 写入新笔记
3. Claude Code 观察 SessionStart 是否提示
4. 其他客户端手动说"整理SOP"

**预期结果：** 所有客户端能读写同一 vault；Claude Code 自动、其他手动均能产出 SOP。

### 9. 提交与备份

```powershell
cd $VAULT
git add .
git commit -m "feat: bootstrap vault + SOP auto mechanism on Windows"
git push
```

**预期结果：** GitHub 可见完整配置；watchdog 后续自动 commit。

---

## 检查清单

- [ ] 已克隆 claude-obsidian 仓库且无嵌套目录
- [ ] 已创建完整目录结构
- [ ] 已写入三份 Obsidian 配置
- [ ] 已为所有目标 AI 客户端创建 skills Junction
- [ ] `skills/wiki-sop/SKILL.md` 已包含四种模式
- [ ] `hooks/hooks.json` 已加入 SOP AUTO-CHECK 规则
- [ ] Source 状态机与 Auto-marking 规则已落地
- [ ] 在 ≥2 个 AI 客户端验证通过
- [ ] 初始化提交已 push

---

## FAQ

**Q: 为什么 Kimi Code / Codex CLI / Gemini CLI 不能自动检查 SOP？**  
A: 它们暂不支持 `hooks.json`，需要用户手动触发关键词。

**Q: 必须用 Junction，不用符号链接行不行？**  
A: Junction 在 Windows 上无需管理员权限，最稳。符号链接需要管理员或开发者模式。

**Q: 怎么判断 source 是否 sop-ready？**  
A: 含可复用分步流程、最佳实践或经验总结即 `sop-ready`；高价值材料再加 `sop-priority: high`。

**Q: 已有 SOP 在 sources 更新后会被覆盖吗？**  
A: 不会。更新模式以增量补丁形式提示，由用户确认是否写回。

**Q: 必须装 Obsidian 吗？**  
A: 不是。机制只依赖文件系统和 Markdown，Obsidian 只用于人类浏览。

---

## 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
