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

本 SOP 用于规范在 Windows 环境中部署 `claude-obsidian` 知识库，并完成 SOP 自动检查、生成与多 AI 客户端复用配置。执行本流程后，应具备以下能力：

- AI 自动写笔记
- 分类整理知识到标准目录
- 定期维护知识库
- 基于来源资料生成或更新 SOP
- 在多个 AI 客户端中复用同一套 skills 与知识库能力

---

## 2. 适用场景

- 需要在 Windows 上初始化 `claude-obsidian` 项目
- 需要建立统一的知识采集与 SOP 沉淀流程
- 需要让 Claude Code 或其他 AI 客户端共享同一知识库
- 需要让 source 文档按状态流转并在适当时机生成 SOP

---

## 3. 前置条件

- Windows 环境，具备 PowerShell 权限
- 已安装 Git
- 可访问仓库：`https://github.com/AgriciDaniel/claude-obsidian.git`
- 已确定知识库安装路径，例如：`D:\dolan_env\temp\project\personal\claude-obsidian`
- 已安装至少一个 AI 客户端
- 具备创建 Junction 链接权限

---

## 4. 标准操作步骤

### 步骤 1：克隆项目并确认知识库根目录

在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如存在嵌套目录，手动整理，确保最终根目录唯一且清晰。

**预期结果：** 本地已存在统一的 `claude-obsidian` 根目录。

---

### 步骤 2：创建标准目录结构

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

**预期结果：** 标准目录全部创建成功。

---

### 步骤 3：写入 Obsidian 基础配置

创建或更新以下文件：

- `.obsidian/graph.json`：配置知识图谱颜色分组，建议 `sop` 为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

**预期结果：** Obsidian 可正常加载知识库配置，图谱和显示行为符合预期。

---

### 步骤 4：为多 AI 客户端创建 skills Junction 链接

根据需要为客户端建立 skills 链接。

示例：Claude Code

```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "D:\dolan_env\temp\project\personal\claude-obsidian\skills"
```

其他常见目标路径：

- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

**预期结果：** 各客户端可访问同一套 skills。

---

### 步骤 5：创建 SOP 自动机制 skill

创建文件：`skills/wiki-sop/SKILL.md`

内容至少覆盖：

- 自动检查模式：扫描 `status: sop-ready`
- 手动生成模式：指定主题生成 SOP
- 更新模式：sources 更新后提示更新 SOP
- 质量检查：验证步骤、清单、回链完整性

**预期结果：** 项目内存在可复用的 SOP skill。

---

### 步骤 6：配置 hooks 自动检查 SOP 机会

编辑 `hooks/hooks.json`，在 `SessionStart` 中加入规则：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

**预期结果：** 支持 hooks 的客户端启动会话时可自动检查 SOP 机会。

---

### 步骤 7：建立 source 状态流转与自动标记规则

统一采用以下状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：

- 分步骤操作流程 → `status: sop-ready`
- 最佳实践/经验总结 → `status: sop-ready` + `sop-priority: high`
- 纯参考资料 → `status: processed`

**预期结果：** source 资料状态清晰，SOP 候选文档可自动识别。

---

### 步骤 8：执行知识采集、整理与 SOP 触发验证

依次验证：

- `ingest`：导入资料并自动写笔记
- 自动分类：检查是否进入 `concepts`、`entities`、`sources`
- `query:`：验证查询
- `lint the wiki`：验证维护

然后准备至少 3 份同主题且标记为 `status: sop-ready` 的 source，验证是否触发 SOP 提示；若客户端不支持 hooks，则手动触发，例如输入“整理SOP”。

**预期结果：** 知识流与 SOP 流至少成功运行一次。

---

### 步骤 9：确认不同 AI 客户端的使用方式

按客户端能力区分：

- **Claude Code**：支持 hooks，建议启用自动检查
- **Kimi Code**：支持 skills，需手动触发
- **Codex CLI**：支持 skills，需手动触发
- **Gemini CLI**：支持 skills，需手动触发
- **Cursor / Windsurf**：通常手动触发

**预期结果：** 团队明确每个客户端的 SOP 操作方式。

---

### 步骤 10：维护与更新 SOP

定期执行：

1. 运行 `lint the wiki`
2. 检查 `wiki/sources` 中新增或更新的 `sop-ready` 资料
3. 若 source 晚于 SOP，则触发更新
4. 更新 SOP 的步骤、清单与来源回链
5. 按规则将已沉淀资料推进到 `synthesized` 或归档

**预期结果：** SOP 持续与最新知识同步。

---

## 5. 检查清单

- [ ] 已克隆仓库并确认唯一根目录
- [ ] 已创建标准目录结构
- [ ] 已完成 Obsidian 基础配置
- [ ] 已创建至少一个 AI 客户端的 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已建立 source 状态流转规则
- [ ] 已验证 `ingest`
- [ ] 已验证 `query:`
- [ ] 已验证 `lint the wiki`
- [ ] 已验证 SOP 自动提示或手动生成

---

## 6. 最佳实践

- 始终让所有客户端指向同一份 skills，避免分叉维护
- 使用明确的 source 状态，避免 SOP 候选资料混乱
- 对高价值经验统一加上 `sop-priority: high`
- 每次批量 ingest 后执行一次集中 SOP 检查
- 发现 source 更新晚于 SOP 时，优先更新 SOP 而不是新建重复文档
- 在 SOP 中保持步骤可执行、检查项完整、来源可回链

---

## 7. 常见问题

### Q1：为什么 SOP 没有自动生成？
可能原因包括：客户端不支持 hooks、source 未标记为 `sop-ready`、同主题资料不足、或未配置 `SessionStart` 检查。

### Q2：哪些客户端支持自动检查？
来源明确说明 Claude Code 支持通过 hooks 自动检查；其他客户端主要依赖 skills 手动触发。

### Q3：什么资料应标记为 `sop-ready`？
凡是可复用的分步骤操作流程，或可沉淀为标准方法的最佳实践资料，都应标记为 `sop-ready`。

### Q4：为什么推荐使用 Junction？
因为 Junction 可以让多个 AI 客户端共享同一套 skills，降低维护成本并避免版本不一致。

### Q5：source 更新后 SOP 怎么办？
如果 source 时间更新于 SOP，应触发 SOP 更新，并补充步骤、清单和来源回链。

---

## 8. 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
