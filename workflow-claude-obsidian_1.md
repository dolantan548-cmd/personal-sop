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
本 SOP 用于在 Windows 环境中完成 claude-obsidian 知识库部署，并建立 SOP 自动检查、手动生成、更新提示与多 AI 客户端共享访问机制。

---

## 2. 适用场景
- 在 Windows 上搭建个人或团队知识库
- 使用 AI 自动写入与整理笔记
- 将可复用流程资料沉淀为 SOP
- 在多个 AI 客户端之间共享同一套知识库能力
- 为 SOP 建立持续维护机制

---

## 3. 前置条件
- Windows 环境
- PowerShell 可用
- Git 已安装
- 可访问 `https://github.com/AgriciDaniel/claude-obsidian.git`
- 已确定本地 vault 根目录
- 若需自动钩子检查，优先使用支持 hooks 的 Claude Code

---

## 4. 标准步骤

### 步骤 1：克隆 claude-obsidian 仓库
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果仓库目录存在嵌套，整理为单一根目录，确保后续路径统一。

**预期结果：** 本地生成统一的 `claude-obsidian` 根目录，可作为 vault 使用。

---

### 步骤 2：初始化 vault 目录结构
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

目录用途：
- `.raw`：原始资料
- `wiki/sources`：整理后的来源资料
- `wiki/concepts`：概念知识
- `wiki/entities`：实体知识
- `wiki/sop`：流程型 SOP 文档
- `_templates`：模板
- `.obsidian/snippets`：样式片段

**预期结果：** 所有标准目录已创建完成。

---

### 步骤 3：写入 Obsidian 配置
补充或合并以下配置文件：
- `.obsidian/graph.json`：设置图谱分组颜色，建议 SOP 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

配置原则：
1. 路径必须准确
2. 分组命名需与目录一致
3. 有现有配置时优先合并

**预期结果：** Obsidian 可正确加载 vault，并清晰区分 SOP 与普通知识内容。

---

### 步骤 4：为多 AI 客户端建立 skills 链接
使用 Windows Junction 将 skills 路径统一指向同一 vault。

支持目标包括：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/`
- `.windsurf/skills/`

示例命令：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "D:\dolan_env\temp\project\personal\claude-obsidian"
```

若父目录不存在，先创建父目录。

**预期结果：** 多个 AI 客户端可访问同一套 claude-obsidian 配置与知识库结构。

---

### 步骤 5：创建 SOP 专用 skill
新增 `skills/wiki-sop/SKILL.md`，定义以下能力：
- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：按用户指定主题生成 SOP
- 更新模式：当 sources 更新晚于 SOP 时提示更新
- 质量检查模式：校验可执行性、检查清单与回链

建议 skill 明确以下规则：
- 输入目录：`wiki/sources/`
- 输出目录：`wiki/sop/`
- 输出结构：标题、用途、场景、前置条件、步骤、检查清单、FAQ、来源回链
- 资料不足时仅提示，不强制生成正式 SOP

**预期结果：** AI 能调用统一 skill 生成结构标准的 SOP。

---

### 步骤 6：配置 hooks 自动检查机制
修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如客户端支持，可在 `PostToolUse` 加入自动提交或整理逻辑。

**预期结果：** 会话开始时自动发现可生成或需更新的 SOP 主题。

---

### 步骤 7：执行 source 状态流转管理
采用以下标准流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
                    ↑
              (AI 自动标记可复用流程)
```

标记规则：
- 含明确步骤流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考内容：`status: processed`
- 已汇总进 SOP 的来源：可标记为 `synthesized`

**预期结果：** 来源资料按统一规则流转，SOP 候选集清晰可追踪。

---

### 步骤 8：按客户端能力执行 SOP 生成或更新
客户端差异：
- **Claude Code**：支持 hooks，可自动检查
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常仅支持 skills，需手动触发

执行方法：
1. 自动客户端先查看 SessionStart 检查结果
2. 手动客户端输入类似“整理SOP”或指定主题
3. 对满足条件的来源生成 `wiki/sop/` 文档
4. 若 source 更新晚于 SOP，则执行更新流程

**预期结果：** 所有客户端都可按统一规则生成或更新 SOP。

---

### 步骤 9：验证部署与质量
执行一次完整测试：
1. 导入测试资料
2. 确认目录归类正确
3. 将测试资料标记为 `sop-ready`
4. 触发自动检查或手动执行 `wiki-sop`
5. 检查 SOP 是否包含步骤、检查清单、FAQ、来源回链
6. 定期执行 `lint the wiki`

验证重点：
- 路径正确
- Junction 正常
- hooks 触发正常
- SOP 可执行、可追溯

**预期结果：** source 到 SOP 的完整闭环可正常工作。

---

## 5. 检查清单
- [ ] 已克隆 claude-obsidian 仓库
- [ ] 已完成目录初始化
- [ ] 已配置 Obsidian 基础设置
- [ ] 已创建至少一个 AI 客户端 skills Junction
- [ ] 已建立 `wiki-sop` skill
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已应用 source 状态流转规则
- [ ] 已完成一次测试 SOP 生成
- [ ] 已验证 FAQ、检查清单与回链完整
- [ ] 已明确当前客户端是否支持 hooks

---

## 6. 最佳实践
- 使用统一 vault 根目录，避免多份配置分叉
- SOP 仅基于已验证、可重复执行的来源生成
- 当资料少于 3 份且无高优先级标记时，优先补充来源
- 优先更新已有 SOP，而非重复新建
- 定期执行 `lint the wiki` 保持知识库整洁
- 使用状态字段和优先级字段管理 SOP 候选队列

---

## 7. 常见问题

### Q1：为什么没有自动触发 SOP 检查？
因为当前客户端可能不支持 hooks。Claude Code 支持，其他客户端通常需手动触发。

### Q2：什么资料应进入 SOP 队列？
包含步骤化流程、可复用操作、最佳实践或经验总结的资料应标记为 `sop-ready`。

### Q3：同主题需要多少来源才适合生成 SOP？
标准建议为 3 份及以上；如果来源被标记 `sop-priority: high`，可提前生成。

### Q4：source 更新后要不要重建 SOP？
不一定。优先做增量更新，并检查 source 是否晚于 SOP。

### Q5：为什么推荐 Junction？
因为它能让多个 AI 客户端共享同一套 skills 与 vault，减少重复维护。

---

## 8. 来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
