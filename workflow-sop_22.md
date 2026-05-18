---
type: sop
category: workflow
status: active
created: 2026-05-19
updated: 2026-05-19
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 1. 目的

本 SOP 用于标准化在 Windows 环境中部署 `claude-obsidian` 知识库，并建立一套可持续运行的 SOP 自动生成机制，使资料能够从导入、整理、标记到 SOP 产出形成闭环。

---

## 2. 适用场景

- 需要初始化 `claude-obsidian` 知识库
- 需要让 AI 自动写入并整理笔记
- 需要把来源资料持续沉淀为 SOP
- 需要在多个 AI 客户端之间共享同一知识库
- 需要建立 `source -> sop-ready -> SOP` 的标准化生产流程

---

## 3. 前置条件

- Windows 环境
- 已安装 Git
- 可使用 PowerShell
- 已确认 Vault 根目录
- 已具备目标 AI 客户端的配置目录访问权限
- 已获取 `claude-obsidian` 仓库

---

## 4. 操作步骤

### 步骤 1：克隆项目并确认 Vault 根目录

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如有嵌套目录，整理为统一根目录，并设置：

```powershell
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 已得到单一可用的 Vault 根目录。

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

**预期结果：** Vault 目录结构完整，可用于知识沉淀和 SOP 管理。

### 步骤 3：写入基础 Obsidian 配置

创建或补充以下配置文件：

- `.obsidian/graph.json`：设置知识图谱颜色分组，建议 SOP 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 能正确加载图谱、显示和过滤配置。

### 步骤 4：建立多 AI 客户端 skills 链接

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.kimi\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.codex\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT"
New-Item -ItemType Junction -Path "$HOME\.gemini\skills\claude-obsidian" -Target "$VAULT"
```

Cursor 与 Windsurf 也按相同思路创建链接。

**预期结果：** 多个 AI 客户端均可访问同一 Vault。

### 步骤 5：创建 SOP 自动机制技能说明

在 `skills/wiki-sop/SKILL.md` 中定义：

- 自动检查模式
- 手动生成模式
- 更新模式
- 质量检查模式

要求 SOP 输出必须包括：目的、场景、前置条件、步骤、检查清单、FAQ、来源回链。

**预期结果：** SOP 技能说明完整，生成规则明确。

### 步骤 6：配置 hooks 自动检查逻辑

修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的笔记
- 同主题数量 >= 3 时提示生成 SOP
- `sop-priority: high` 时优先提示
- source 比 SOP 更新时提示更新

**预期结果：** 支持 hooks 的客户端能自动发现 SOP 生成与更新机会。

### 步骤 7：落实 Source 状态流转规范

统一采用以下状态流：

```text
ingest → raw → processed → archived
              └→ sop-ready → synthesized
```

标记规则：

- 有分步骤流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

**预期结果：** Source 可被统一识别和自动处理。

### 步骤 8：执行知识摄入、整理与维护

按项目原生能力执行：

- `ingest`：导入资料
- 自动分类：写入 `concepts`、`entities`、`sources`
- `lint the wiki`：定期维护
- `query:`：检索知识

**预期结果：** 新资料已进入知识库并完成结构化整理。

### 步骤 9：生成或更新 SOP

触发方式：

- 自动：由支持 hooks 的客户端在会话开始时提示
- 手动：输入“整理SOP”或指定主题生成 SOP

生成结果应写入 `wiki/sop/`，并保留来源回链。若已有 SOP，则在 source 更新后执行增量更新。

**预期结果：** 成功生成新的 SOP，或完成既有 SOP 的更新。

### 步骤 10：进行 SOP 质量检查与跨客户端验证

检查以下内容：

1. 步骤是否可执行
2. 每步是否有预期结果
3. 是否有 checklist
4. 是否有 FAQ
5. 是否保留 source 回链
6. 是否可在目标 AI 客户端中被引用

**预期结果：** SOP 可执行、可追溯、可复用。

---

## 5. 检查清单

- [ ] 已克隆仓库并确认 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已写入基础 Obsidian 配置
- [ ] 已建立多 AI 客户端 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已建立 source 状态流转规范
- [ ] 已完成资料 ingest 与整理
- [ ] 已标记 `sop-ready` 资料
- [ ] 已生成或更新至少一份 SOP
- [ ] 已完成质量检查与客户端验证

---

## 6. 常见问题

### Q1：哪些客户端支持自动检查 SOP？
Claude Code 支持 hooks，可自动检查；其他客户端通常依赖手动触发。

### Q2：什么资料适合标记为 `sop-ready`？
包含清晰步骤、可重复执行流程、最佳实践总结的资料最适合。

### Q3：如果 sources 更新了怎么办？
应触发 SOP 更新；自动模式下由 hooks 提示，手动模式下由用户主动发起。

### Q4：为什么要用 Junction？
为了让多个客户端共享同一个知识库，避免重复维护。

### Q5：纯参考资料是否要生成 SOP？
通常不需要，应保留为 `processed`。

---

## 7. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
