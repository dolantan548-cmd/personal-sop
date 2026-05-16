---
type: sop
category: workflow
status: active
created: 2026-05-16
updated: 2026-05-16
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP：在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于规范在 Windows 环境中部署 `claude-obsidian` 知识库、配置多 AI 客户端共享 skills，并建立 source 到 SOP 的自动检查与生成机制。执行完成后，可支持知识采集、分类整理、知识查询、SOP 生成与更新提示的标准化运行。

---

## 2. 适用场景

- 需要在 Windows 上搭建 AI 驱动的 Obsidian 知识库
- 需要统一管理 `concepts`、`entities`、`sources`、`sop` 等知识目录
- 需要将可复用流程从 source 自动沉淀为 SOP
- 需要让多个 AI 客户端共享同一套 `claude-obsidian` skills
- 需要建立 source 状态流转和 SOP 更新机制

---

## 3. 前置条件

- Windows 环境，可使用 PowerShell
- 已安装 Git
- 可访问仓库：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 已确定本地 vault 路径，例如：`D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装或准备使用一个或多个 AI 客户端：Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf
- 拥有在用户目录中创建 Junction 的权限

---

## 4. 标准操作步骤

### 步骤 1：克隆 claude-obsidian 仓库到本地

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如出现嵌套目录，整理为单一 Vault 根目录。

**预期结果：** 本地存在 `claude-obsidian` 目录，并被确定为后续 Vault 根目录。

---

### 步骤 2：创建标准 Vault 目录结构

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

**预期结果：** 标准目录已创建完成。

---

### 步骤 3：写入 Obsidian 基础配置文件

在 `.obsidian` 目录中补齐或更新以下配置：

- `graph.json`：为知识图谱设置分类配色，建议 `sop` 为黄色
- `app.json`：排除 AI 工作文件
- `appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 中的图谱、显示和排除项配置正常生效。

---

### 步骤 4：为多 AI 客户端创建 skills Junction 链接

将 Vault 中的 `skills` 目录链接到各客户端技能目录。

常见目标路径：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian" -Target "$VAULT\skills"
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target "$VAULT\skills"
```

**预期结果：** 各 AI 客户端能共享同一套 skills。

---

### 步骤 5：创建 wiki-sop skill

创建文件：`skills/wiki-sop/SKILL.md`

该 skill 应覆盖：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按主题生成 SOP
- 更新模式：sources 更新后提示更新 SOP
- 质量检查：验证可执行性、检查清单、回链完整性

**预期结果：** AI 能识别并执行 SOP 相关工作流。

---

### 步骤 6：配置 hooks 自动检查 SOP 机会

修改 `hooks/hooks.json`，在 `SessionStart` 中加入类似逻辑：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如果客户端支持，可进一步在 `PostToolUse` 中加入自动整理或提交动作。

**预期结果：** 会话开始时自动检查 SOP 新增或更新机会。

---

### 步骤 7：建立 source 状态流转与自动标记规则

标准状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

自动标记规则：

- 含分步骤操作流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

**预期结果：** source 文档可被自动识别并流入 SOP 生成流程。

---

### 步骤 8：执行日常知识采集、整理与查询

按以下标准操作：

- 使用 `ingest` 导入资料
- 自动归类到 `wiki/concepts/`、`wiki/entities/`、`wiki/sources/`
- 定期运行 `lint the wiki`
- 使用 `query:` 执行知识查询

整理 source 时，及时补充 `status`、`sop-priority`、主题标签等字段。

**预期结果：** 知识库持续更新，且为 SOP 沉淀提供稳定输入。

---

### 步骤 9：根据客户端能力触发 SOP 生成或更新

客户端差异如下：

- **Claude Code**：支持 hooks，适合自动检查
- **Kimi Code**：支持 skills，通常手动触发
- **Codex CLI**：支持 skills，通常手动触发
- **Gemini CLI**：支持 skills，通常手动触发
- **Cursor / Windsurf**：通常手动触发

无论哪种方式，生成后的 SOP 均应保存到 `wiki/sop/` 并回链相关 sources。

**预期结果：** 成功生成或更新 SOP，并落位到标准目录。

---

### 步骤 10：执行 SOP 质量校验并发布使用

检查以下项目：

- 步骤是否可执行
- 是否含用途、场景、前置条件、步骤、检查清单、FAQ
- 是否完整回链相关 source
- 是否与最新 source 内容一致
- 是否可供其他 AI 客户端复用

通过后，将状态更新为已综合沉淀，例如 `synthesized`。

**预期结果：** SOP 可被稳定复用并支持后续维护更新。

---

## 5. 检查清单

- [ ] 已成功克隆仓库
- [ ] 已创建标准目录结构
- [ ] 已配置 `.obsidian/graph.json`
- [ ] 已配置 `.obsidian/app.json`
- [ ] 已配置 `.obsidian/appearance.json`
- [ ] 已创建至少一个客户端的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 `SessionStart` 逻辑
- [ ] 已定义并应用 source 状态流转
- [ ] 已验证 `ingest`、`lint the wiki`、`query:` 可用
- [ ] 已生成至少一份 `wiki/sop/` 下的 SOP
- [ ] 已完成 SOP 质量检查与回链

---

## 6. FAQ

### Q1：这个项目是否原生支持 AI 自动写笔记和知识整理？
支持。`ingest`、自动分类、`lint the wiki`、`query:` 都属于原生支持能力。

### Q2：SOP 自动生成是默认开启的吗？
不是。需要额外配置 `wiki-sop` skill 和 `hooks/hooks.json` 才能实现自动检查或提示。

### Q3：哪个客户端最适合自动执行 SOP 检查？
Claude Code 最适合，因为支持 `hooks.json`，可在 `SessionStart` 自动扫描 SOP 机会。

### Q4：什么样的资料要标记为 `sop-ready`？
凡是包含可复用步骤、流程、最佳实践、经验总结的资料，都应标记为 `sop-ready`。

### Q5：如果 source 更新了怎么办？
当 source 比已存在 SOP 更新时，应触发 SOP 更新提示，并重新审查流程文档。

### Q6：为什么推荐用 Junction 而不是复制目录？
Junction 能让多个客户端共用同一份 `skills`，避免重复维护和版本偏差。

### Q7：如果客户端不支持 hooks，如何操作？
使用手动触发方式，例如直接让 AI 执行“整理SOP”或指定某一主题生成 SOP。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
