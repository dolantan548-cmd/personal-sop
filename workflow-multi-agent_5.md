---
type: sop
category: workflow
status: active
created: 2026-05-20
updated: 2026-05-20
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: claude-obsidian 部署与多 AI 客户端 SOP 自动机制配置

**类别:** workflow  
**版本:** 1.0  
**适用范围:** Windows 环境下的 claude-obsidian 知识库首次部署、多 AI 客户端配置、SOP 自动生成触发机制搭建

---

## 1. 目的

在 Windows 环境下完成 claude-obsidian 知识库的部署，配置 SOP 自动生成触发机制，并建立多 AI 客户端统一引用能力，实现“AI 自动记笔记 → 自动标记 → 定期转 SOP”的完整闭环。

## 2. 适用场景

- 首次在 Windows 环境部署 claude-obsidian 知识库
- 需要为多个 AI 客户端（Claude Code / Kimi Code / Codex CLI 等）配置统一的 vault 访问与 SOP 生成能力
- 配置 AI 自动标记 `sop-ready` 与定期转 SOP 的触发机制
- 维护现有 SOP 并根据 sources 更新提示同步修订

## 3. 前置条件

- Windows 操作系统（支持 PowerShell）
- 已安装 Git
- 已安装至少一个支持的 AI 客户端（Claude Code / Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf）
- 具备目标目录的读写权限（建议路径：`D:\dolan_env\temp\project\personal`）
- （可选）安装 Obsidian 用于可视化查看知识图谱与 SOP

## 4. 操作步骤

### Step 1: 克隆项目与整理目录

在 PowerShell 中进入目标父目录，执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

克隆完成后检查是否出现嵌套目录，如有则整理为单层目录结构，确保 vault 根目录位于 `D:\dolan_env\temp\project\personal\claude-obsidian`。

**预期结果:** 项目成功克隆，vault 根目录路径正确，无嵌套冗余层级。

### Step 2: 创建标准化目录结构

在 PowerShell 中执行：

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

**预期结果:** 所有目录创建成功，分别为 `.obsidian/snippets`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates`。

### Step 3: 写入 Obsidian 核心配置

在 `$VAULT\.obsidian` 下创建或更新三个配置文件：

1. **`graph.json`** — 配置知识图谱颜色分组，将 sop 节点设置为黄色高亮
2. **`app.json`** — 设置排除规则，将 AI 工作文件（如 `.raw`、临时生成文件）排除在图谱外
3. **`appearance.json`** — 启用自定义 CSS snippets，确保 SOP 与 sources 的视觉区分生效

**预期结果:** Obsidian 打开 vault 后，知识图谱中 sop 文件显示为黄色分组，AI 工作文件被排除，CSS 片段正常加载。

### Step 4: 创建多 AI 客户端 skills 链接

对各 AI 工具分别创建 Junction（Windows 符号链接），指向 vault 根目录。命令模板：

```powershell
New-Item -ItemType Junction -Path "<客户端skills路径>\claude-obsidian" -Target "$VAULT"
```

| 工具 | 链接目标路径 |
|------|-------------|
| Claude Code | `~\.claude\skills\claude-obsidian` |
| Kimi Code | `~\.kimi\skills\claude-obsidian` |
| Codex CLI | `~\.codex\skills\claude-obsidian` |
| Gemini CLI | `~\.gemini\skills\claude-obsidian` |
| Cursor | `.cursor\skills\claude-obsidian` |
| Windsurf | `.windsurf\skills\claude-obsidian` |

**预期结果:** 每个 AI 客户端的 skills 目录下均存在指向 vault 的 Junction，客户端可通过 skills 机制读取与写入 vault 内容。

### Step 5: 创建 wiki-sop SKILL 文件

在 `$VAULT\skills\wiki-sop\` 下创建 `SKILL.md`，定义四种核心模式：

1. **自动检查模式** — 扫描 `status: sop-ready` 的资料
2. **手动生成模式** — 用户指定主题生成 SOP
3. **更新模式** — 当 sources 更新时提示更新对应 SOP
4. **质量检查** — 验证步骤可执行性、检查清单完整性、回链（backlinks）完整性

**预期结果:** SKILL.md 文件存在且包含上述四种模式的具体指令与示例，AI 客户端加载 skills 后可识别并执行 SOP 相关任务。

### Step 6: 配置 hooks 自动触发机制

修改 `$VAULT\hooks\hooks.json`，在 `SessionStart` 钩子中加入 SOP AUTO-CHECK 逻辑：

```
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

**预期结果:** 每次新会话启动时，AI 自动执行扫描并给出是否需要生成/更新 SOP 的提示。

### Step 7: 验证 Source 状态自动流转

确认并测试 sources 的生命周期：

```
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

在 ingest 或整理笔记时，由 AI 根据内容自动标记状态：

- 包含分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果:** AI 能够根据内容特征自动为 sources 标记正确的 status 和 sop-priority，状态流转路径符合预期。

### Step 8: 端到端测试 SOP 生成与更新

1. 手动创建 3 个同主题且 `status: sop-ready` 的测试笔记
2. 启动新会话，验证 AI 是否提示生成 SOP
3. 选择生成 SOP，确认输出到 `wiki/sop/` 并包含完整 steps、checklist、faq
4. 修改其中一个 source，再次启动会话，验证 AI 提示更新现有 SOP
5. 检查生成的 SOP 是否包含回链到原始 sources

**预期结果:** 从 source 自动标记 → 满足条件触发 → 生成 SOP → source 更新后提示更新 的全流程可正常运行。

## 5. 检查清单

- [ ] 项目已克隆到目标路径，目录结构无嵌套
- [ ] `.obsidian/snippets`、`.raw`、`wiki/concepts`、`wiki/entities`、`wiki/sources`、`wiki/sop`、`_templates` 目录全部创建
- [ ] `.obsidian/graph.json`、`app.json`、`appearance.json` 配置已写入且生效
- [ ] 至少为 Claude Code 创建 skills Junction，其他客户端按需配置
- [ ] `skills/wiki-sop/SKILL.md` 已创建并包含四种核心模式说明
- [ ] `hooks/hooks.json` 的 `SessionStart` 钩子已加入 SOP AUTO-CHECK 逻辑
- [ ] AI 自动标记规则已配置：分步骤流程 → `sop-ready`，最佳实践 → `sop-ready` + `high`，纯参考 → `processed`
- [ ] 端到端测试通过：≥3 同主题 `sop-ready` 笔记能触发 SOP 生成提示
- [ ] Source 更新后，重新进入会话能触发 SOP 更新提示
- [ ] 生成的 SOP 文件包含完整的 steps、checklist、faq 和回链

## 6. 常见问题

**Q: 哪些 AI 客户端支持 SessionStart 自动检查 SOP？**  
A: 目前仅 Claude Code 完全支持通过 `hooks.json` 在 `SessionStart` 自动检查并提示生成/更新 SOP。Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 均支持 skills，但需要在对话中手动触发，例如直接说“整理 SOP”或调用对应 skill。

**Q: Windows 下创建 Junction 失败怎么办？**  
A: 确保 PowerShell 以正常权限运行（无需管理员，除非目标路径在系统目录），检查目标路径 `$VAULT` 是否存在且无中文引号问题。如果客户端 skills 父目录不存在，需先用 `New-Item -ItemType Directory -Path "父目录" -Force` 创建。

**Q: 如何确认 hooks 自动触发机制已生效？**  
A: 在 `wiki/sources/` 下创建 ≥3 个带有 `status: sop-ready` 且同主题的笔记，然后启动一次新的 Claude Code 会话。如果在开场白或自动执行流程中看到“SOP AUTO-CHECK”相关的扫描与提示，即表示生效。

**Q: sources 状态不会自动变化怎么办？**  
A: 确认在 ingest 或整理笔记时明确指示了 AI 使用自动标记规则。也可以在 `.raw` 文件处理完成后，手动要求 AI “根据内容标记 status：分步骤流程标记 sop-ready，纯参考标记 processed”。建议将自动标记规则写入项目级提示词或 skill 文件。

**Q: Obsidian 是否是必须安装的？**  
A: 不是必须的。整个 SOP 自动机制和 AI 交互不依赖 Obsidian 运行。但安装 Obsidian 可以更直观地查看知识图谱、颜色分组和回链关系，推荐用于人工审阅与维护阶段。

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
