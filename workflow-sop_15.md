---
type: sop
category: workflow
status: active
created: 2026-05-17
updated: 2026-05-17
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
本 SOP 用于标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端共享 skills，并启用 SOP 自动检查、生成与更新提醒机制。

## 适用场景
- 需要初始化 claude-obsidian 本地知识库
- 需要将 sources 沉淀为 SOP
- 需要在多个 AI 客户端之间复用同一套知识工作流
- 需要建立 SOP 自动发现与更新机制

## 前置条件
- Windows 环境与 PowerShell 权限
- 已安装 Git
- 已确定 Vault 路径
- 已安装至少一个 AI 客户端
- 可创建 Junction 链接

## 标准流程

### 步骤 1：克隆仓库并确认 Vault 路径
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
$VAULT = "D:\dolan_env\temp\project\personal\claude-obsidian"
```

**预期结果：** 本地已存在 claude-obsidian 根目录，且 Vault 路径唯一明确。

---

### 步骤 2：创建标准目录结构
执行：

```powershell
New-Item -ItemType Directory -Path "$VAULT\.obsidian\snippets" -Force
New-Item -ItemType Directory -Path "$VAULT\.raw" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\concepts" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\entities" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sources" -Force
New-Item -ItemType Directory -Path "$VAULT\wiki\sop" -Force
New-Item -ItemType Directory -Path "$VAULT\_templates" -Force
```

**预期结果：** 知识库目录结构完整，可用于采集、分类和 SOP 输出。

---

### 步骤 3：写入基础 Obsidian 配置
创建或更新以下文件：
- `.obsidian/graph.json`：设置图谱颜色分组，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 中的知识图谱和文件显示规则支持 SOP 管理。

---

### 步骤 4：为多 AI 客户端创建 skills 链接
按需为各客户端创建 Junction：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.claude/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

示例：

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills"
```

**预期结果：** 多个 AI 客户端都能读取同一套 skills。

---

### 步骤 5：创建 `wiki-sop` 技能说明
在 `skills/wiki-sop/SKILL.md` 中定义：
- 自动检查模式
- 手动生成模式
- 更新模式
- 质量检查规则

建议同时明确：
- 输入目录与输出目录
- SOP 文件命名规范
- 来源回链要求
- 生成内容结构

**预期结果：** AI 可以基于统一技能定义生成或更新 SOP。

---

### 步骤 6：配置 hooks 自动检查机制
修改 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

**预期结果：** 支持 hooks 的客户端在启动会话时会自动识别 SOP 机会。

---

### 步骤 7：建立 source 状态流转规则
使用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记原则：
- 分步骤流程资料 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** source 分类标准统一，系统可识别哪些资料适合 SOP 化。

---

### 步骤 8：执行知识采集、整理与 SOP 生成
使用系统原生能力：
- `ingest`：自动记笔记
- 自动分类到 `concepts`、`entities`、`sources`
- `lint the wiki`：定期维护
- `query:`：知识查询

在以下条件触发 SOP：
- 同主题 `sop-ready` source ≥ 3
- `sop-priority: high`
- source 更新晚于 SOP

生成后的 SOP 统一写入 `wiki/sop/`。

**预期结果：** 知识采集、整理和 SOP 沉淀形成闭环。

---

### 步骤 9：按客户端能力选择触发方式
- **Claude Code**：自动检查，支持 hooks
- **Kimi Code**：手动触发，如“整理SOP”
- **Codex CLI**：手动触发
- **Gemini CLI**：手动触发
- **Cursor / Windsurf**：通常手动触发

**预期结果：** 团队成员明确自己所用客户端的 SOP 触发方式。

---

### 步骤 10：验证 SOP 机制是否生效
验证流程：
1. 新建一条带步骤的 source
2. 标记 `status: sop-ready`
3. 启动支持 hooks 的客户端或手动触发
4. 检查 `wiki/sop/` 是否生成 SOP
5. 更新 source 后检查是否提示 SOP 更新

**预期结果：** SOP 能被成功生成或更新，且内容完整。

## 检查清单
- [ ] 已克隆仓库并确认 Vault 路径
- [ ] 已建立标准目录结构
- [ ] 已写入 Obsidian 配置
- [ ] 已创建 skills Junction
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已建立 source 状态流转规则
- [ ] 已验证 SOP 生成流程
- [ ] 已确认 SOP 输出到 `wiki/sop/`
- [ ] 已确认 SOP 更新提醒生效

## 最佳实践
- 所有客户端尽量指向同一套 skills，避免维护多份配置
- 仅对具备复用价值的资料标记 `sop-ready`
- 对高价值流程增加 `sop-priority: high`
- 在 SOP 中保留来源回链，便于追溯与更新
- 定期执行知识库维护，降低 source 噪声

## 常见问题

### 1. 为什么没有自动生成 SOP？
通常是因为仅完成了知识库部署，尚未配置 `wiki-sop` skill 或 hooks 自动检查规则。

### 2. 哪些客户端支持自动检查？
Claude Code 支持 hooks，因此可自动检查；其他客户端通常需要手动触发。

### 3. 什么资料适合做 SOP？
有清晰步骤、可重复执行、具备稳定最佳实践的资料最适合 SOP 化。

### 4. source 更新后如何同步 SOP？
通过“source 时间新于 SOP 则提示更新”的规则进行检测，并重新生成或修订 SOP。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]