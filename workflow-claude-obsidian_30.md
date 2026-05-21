---
type: sop
category: workflow
status: active
created: 2026-05-21
updated: 2026-05-21
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP：在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的
本 SOP 用于在 Windows 环境中标准化部署 `claude-obsidian` 知识库，并完成以下目标：
- 启用 AI 自动写笔记与知识整理能力
- 建立标准 wiki 目录结构
- 配置 Obsidian 基础设置
- 让多个 AI 客户端共享同一套 skills
- 配置 SOP 自动检查、生成与更新机制
- 建立 source 到 SOP 的标准流转规则

---

## 2. 适用场景
- 需要在 Windows 上初始化 `claude-obsidian`
- 需要长期维护个人或团队知识库
- 需要把来源资料沉淀为标准 SOP
- 需要让多个 AI 工具共用一套知识处理能力
- 需要在支持 hooks 的客户端中自动发现 SOP 候选资料

---

## 3. 前置条件
- Windows 环境
- 已安装 Git
- 已安装 PowerShell 5.1+ 或 PowerShell 7+
- 可访问 GitHub 仓库：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 已确定 vault 根目录
- 已安装至少一个 AI 客户端（Claude Code、Kimi Code、Codex CLI、Gemini CLI、Cursor、Windsurf 中任意一个）
- 具备创建 Junction 链接权限

---

## 4. 标准操作步骤

### 步骤 1：克隆仓库并确认知识库根目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如果仓库出现额外嵌套目录，整理为单一 vault 根目录。建议最终目录为：

```text
D:\dolan_env\temp\project\personal\claude-obsidian
```

**预期结果：** 本地已存在可用的 vault 根目录，供后续所有配置复用。

---

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

目录用途：
- `.raw`：原始资料
- `wiki/concepts`：概念知识
- `wiki/entities`：实体条目
- `wiki/sources`：处理后的来源资料
- `wiki/sop`：SOP 文档
- `_templates`：模板
- `.obsidian/snippets`：样式片段

**预期结果：** 知识库具备标准化目录结构。

---

### 步骤 3：写入 Obsidian 基础配置
在 `.obsidian` 下创建或更新以下文件：
- `graph.json`：定义图谱颜色分组，建议将 `sop` 设为黄色
- `app.json`：排除 AI 工作文件和临时文件
- `appearance.json`：启用 CSS snippets

要求：
- 修改前先备份已有配置
- 保证 JSON 格式合法
- 合并时不要破坏现有有效设置

**预期结果：** Obsidian 能正常识别该 vault，图谱与显示配置可用。

---

### 步骤 4：建立多 AI 客户端 skills 链接
使用 Windows Junction 让多个客户端共享同一套 skills。

典型映射：
- Kimi Code → `~/.kimi/skills/claude-obsidian`
- Codex CLI → `~/.codex/skills/claude-obsidian`
- Claude Code → `~/.claude/skills/claude-obsidian`
- Gemini CLI → `~/.gemini/skills/claude-obsidian`
- Cursor → `.cursor/skills/`
- Windsurf → `.windsurf/skills/`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

如父目录不存在，先创建父目录。

**预期结果：** 至少一个 AI 客户端可以读取 `claude-obsidian` 的 skills。

---

### 步骤 5：创建 `wiki-sop` skill
创建文件：

```text
skills/wiki-sop/SKILL.md
```

在该文件中定义以下能力：
1. 自动检查模式：扫描 `status: sop-ready` 的 source
2. 手动生成模式：按用户指定主题生成 SOP
3. 更新模式：source 更新时提示更新 SOP
4. 质量检查：验证步骤可执行性、checklist 与回链完整性

建议补充：
- 输入格式
- 输出路径：`wiki/sop/`
- 命名规则
- 判断何时新建 SOP、何时更新 SOP

**预期结果：** 不同 AI 客户端可通过统一规则进行 SOP 处理。

---

### 步骤 6：配置 hooks 启用自动 SOP 检查
编辑：

```text
hooks/hooks.json
```

在 `SessionStart` 中加入 SOP 自动检查逻辑：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

如果客户端支持其他钩子，也可加入附加维护动作，但不要影响主检查逻辑。

**预期结果：** 支持 hooks 的客户端在会话启动时会自动检查 SOP 候选资料。

---

### 步骤 7：实施 source 状态流转规则
采用统一状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

执行标准：
- 新资料导入后进入 `raw` 或待处理状态
- 整理完成后标记为 `processed`
- 可复用流程资料标记为 `sop-ready`
- 已用于 SOP 沉淀的 source 可标记为 `synthesized`
- 长期不再维护的资料标记为 `archived`

建议元数据最少包含：
- `status`
- `topic`
- `updated`
- `sop-priority`（如适用）

**预期结果：** 知识库中的来源资料具备清晰生命周期。

---

### 步骤 8：应用 SOP 候选自动标记规则
整理 source 时按以下标准标记：
- 含明确分步骤操作流程 → `status: sop-ready`
- 最佳实践或经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

该规则应写入整理习惯、提示词或 skill 中，保持一致性。

**预期结果：** SOP 候选识别标准统一，减少误判。

---

### 步骤 9：按客户端能力执行 SOP 生成与维护
客户端差异：
- **Claude Code**：支持 hooks，可自动检查 SOP
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常依赖 skills，需手动触发

推荐操作流程：
1. 使用 `ingest` 导入资料
2. 整理并保存到 `wiki/sources/`
3. 标记 `sop-ready` 或 `sop-priority`
4. 自动或手动触发 SOP 生成
5. 保存结果到 `wiki/sop/`
6. 在 SOP 中添加对 source 的回链

**预期结果：** 无论客户端是否支持 hooks，都能完成 SOP 生成与更新。

---

### 步骤 10：执行质量检查与持续维护
每次生成或更新 SOP 后，检查：
- 步骤是否可执行
- 每一步是否有明确预期结果
- 是否包含 checklist
- 是否包含来源回链
- source 更新后是否触发 SOP 更新
- 是否需要运行 `lint the wiki`

建议定期维护，避免 SOP 过期。

**预期结果：** SOP 保持可执行、可追溯、可持续维护。

---

## 5. 检查清单
- [ ] 已克隆仓库并确认 vault 根目录
- [ ] 已创建标准目录结构
- [ ] 已写入 Obsidian 基础配置
- [ ] 已创建至少一个 AI 客户端的 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json` 的 `SessionStart` 自动检查逻辑
- [ ] 已实施 source 状态流转规则
- [ ] 已落实 SOP 候选自动标记规则
- [ ] 已验证客户端触发方式（自动或手动）
- [ ] 已完成至少一次 SOP 生成或更新

---

## 6. 最佳实践
- 使用统一的 vault 路径，避免多客户端引用错位
- 使用 Junction 共享 skills，不要复制多份
- source 必须带状态字段，便于自动扫描
- 对高价值流程增加 `sop-priority: high`
- SOP 文件必须回链到 source，确保可追溯
- 定期执行维护与更新，避免 SOP 落后于 source
- 优先在支持 hooks 的客户端中承担自动检查职责

---

## 7. 常见问题（FAQ）

### Q1：项目是否原生支持自动写笔记和整理？
支持。可使用 `ingest`、自动分类、`query:` 与 `lint the wiki` 等原生能力。

### Q2：为什么 SOP 不是开箱即用？
因为 SOP 生成依赖额外规则，包括 skill、hooks 和状态流转机制配置。

### Q3：哪些客户端支持自动 SOP 检查？
来源明确 Claude Code 支持 hooks，可自动执行。其他客户端通常需要手动触发。

### Q4：不支持 hooks 的客户端如何使用？
通过 skills 手动触发，例如输入“整理SOP”或指定主题生成 SOP。

### Q5：什么内容应该标记为 `sop-ready`？
任何具备明确步骤、可重复执行、可复用价值的流程资料，都应标记为 `sop-ready`。

### Q6：什么时候应新建或更新 SOP？
当同主题 `sop-ready` source 数量达到 3 个及以上、source 标记高优先级、或 source 更新时间晚于现有 SOP 时，应触发生成或更新。

---

## 8. 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
