---
type: sop
category: workflow
status: active
created: 2026-05-22
updated: 2026-05-22
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置]]"
tags: [sop, workflow]
---

# SOP: 在 Windows 部署 claude-obsidian 并配置 SOP 自动生成机制

## 目的
标准化在 Windows 环境中部署 claude-obsidian 知识库、配置多 AI 客户端 skills 链接，并启用 SOP 自动检查与生成机制的流程，以实现知识沉淀、流程化整理和跨客户端复用。

## 适用场景
- 需要在 Windows 上搭建本地知识库并接入 AI 自动记笔记能力
- 希望将资料按 `concepts / entities / sources / sop` 结构统一管理
- 需要为多个 AI 客户端配置共享 skills
- 希望对 `sop-ready` 资料进行自动检查、提醒生成 SOP 或更新已有 SOP
- 需要让多个 AI 客户端引用同一套 SOP 与知识库

## 前置条件
- Windows 环境
- 已安装 Git
- 已可使用 PowerShell
- 可访问 `claude-obsidian` 仓库
- 明确知识库安装路径
- 已安装至少一个 AI 客户端
- 具备创建 Junction 的权限

## 标准步骤

### 步骤 1：克隆项目并确认 Vault 根目录
在 PowerShell 中执行：

```powershell
cd D:\dolan_env\temp\project\personal
git clone https://github.com/AgriciDaniel/claude-obsidian.git
```

如仓库目录存在嵌套或结构不规整，先整理为唯一的 Vault 根目录，后续统一使用该路径。

**预期结果：** 本地已完成仓库克隆，并确定 Vault 根路径。

---

### 步骤 2：创建 Obsidian 与知识库标准目录结构
设置 Vault 变量并创建目录：

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

目录约定：
- `.raw`：原始输入
- `wiki/sources`：处理后的来源资料
- `wiki/sop`：SOP 输出
- `wiki/concepts`：概念沉淀
- `wiki/entities`：实体沉淀
- `_templates`：模板

**预期结果：** Vault 中已具备标准目录结构。

---

### 步骤 3：写入 Obsidian 基础配置
补充以下配置文件：
- `.obsidian/graph.json`：配置知识图谱颜色分组，建议将 `sop` 设为黄色
- `.obsidian/app.json`：排除 AI 工作文件
- `.obsidian/appearance.json`：启用 CSS snippets

如已有配置，请合并，不要直接覆盖已有自定义项。

**预期结果：** Obsidian 可正常加载 Vault，基础显示与过滤规则生效。

---

### 步骤 4：为多 AI 客户端创建共享 skills 链接
按需为客户端创建指向 Vault skills 的 Junction。示例：

```powershell
New-Item -ItemType Directory -Path "$HOME\.claude\skills" -Force
New-Item -ItemType Junction -Path "$HOME\.claude\skills\claude-obsidian" -Target "$VAULT\skills" -Force
```

其他客户端参考路径：
- `~/.kimi/skills/claude-obsidian`
- `~/.codex/skills/claude-obsidian`
- `~/.gemini/skills/claude-obsidian`
- `.cursor/skills/claude-obsidian`
- `.windsurf/skills/claude-obsidian`

**预期结果：** 各客户端可复用同一套 skills 定义。

---

### 步骤 5：创建 wiki-sop 技能定义
创建文件：`skills/wiki-sop/SKILL.md`

至少包含以下能力：
- 自动检查模式：扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 手动生成模式：按主题生成 SOP
- 更新模式：当 source 新于 SOP 时提示更新
- 质量检查：检查步骤可执行性、检查清单完整性、回链完整性

**预期结果：** SOP 技能定义清晰，便于各客户端一致调用。

---

### 步骤 6：配置 Hooks 实现自动检查提醒
编辑 `hooks/hooks.json`，在 `SessionStart` 中加入：

```text
SOP AUTO-CHECK: 扫描 wiki/sources/ 中 status: sop-ready 的笔记
- ≥3 个同主题 → 提示生成 SOP
- sop-priority: high → 提示生成 SOP
- sources 比 SOP 新 → 提示更新 SOP
```

支持更多 hooks 的客户端可补充自动提交或记录逻辑。

**预期结果：** 支持 hooks 的客户端在会话开始时会自动进行 SOP 检查。

---

### 步骤 7：建立 Source 状态流转与自动标记规则
统一状态流转：

```text
ingest → raw → processed ──→ archived
              │
              └─→ sop-ready ──→ synthesized
```

自动标记规则：
- 含分步骤流程：`status: sop-ready`
- 最佳实践/经验总结：`status: sop-ready` + `sop-priority: high`
- 纯参考资料：`status: processed`

建议统一 frontmatter 字段：`status`、`topic`、`updated`、`sop-priority`。

**预期结果：** 来源资料可被自动识别是否适合生成 SOP。

---

### 步骤 8：执行知识导入、整理与 SOP 生成
推荐工作流：
1. 用 `ingest` 导入资料
2. 自动或人工归类到 `concepts / entities / sources`
3. 定期执行 `lint the wiki`
4. 用 `query:` 聚合同主题知识
5. 对符合条件的 `sop-ready` 资料生成 SOP 到 `wiki/sop/`
6. source 更新后同步刷新 SOP

手动触发时，可直接输入：
- “整理 SOP”
- “基于某主题生成 SOP”
- “检查 sop-ready 资料并更新 SOP”

**预期结果：** 知识已完成导入、维护，并产出可复用的 SOP。

---

### 步骤 9：按客户端能力选择自动或手动运行模式
客户端差异：
- **Claude Code**：支持 hooks，可自动检查 SOP
- **Kimi Code / Codex CLI / Gemini CLI / Cursor / Windsurf**：通常支持 skills，但需要手动触发

应在团队中明确：自动检查优先在 Claude Code 中运行，其他客户端负责共享知识库与手动调用。

**预期结果：** 团队对各客户端能力边界有一致认知。

---

### 步骤 10：验证整体部署结果
执行端到端验证：
1. 打开 Vault，检查目录与配置
2. 在 `wiki/sources/` 新建一条 `status: sop-ready` 资料
3. 重启支持 hooks 的客户端会话，确认是否触发检查
4. 生成一个测试 SOP 到 `wiki/sop/`
5. 检查 SOP 是否包含步骤、检查清单、回链
6. 在另一个客户端中验证是否能访问同一套 skills

**预期结果：** 全链路部署与 SOP 机制工作正常。

## 检查清单
- [ ] 已完成仓库克隆并确认 Vault 路径
- [ ] 已创建标准目录结构
- [ ] 已写入或合并 Obsidian 配置
- [ ] 已创建至少一个客户端的 skills 链接
- [ ] 已创建 `skills/wiki-sop/SKILL.md`
- [ ] 已配置 `hooks/hooks.json`
- [ ] 已统一 `status` 与 `sop-priority` 规则
- [ ] 已验证 `sop-ready` 可触发 SOP 检查或生成
- [ ] 已验证 SOP 含步骤、检查清单与回链
- [ ] 已验证跨客户端共享可用

## 最佳实践
- 统一使用一个 Vault 根目录，避免多份 skills 或 wiki 副本
- 所有 source 保持一致 frontmatter 字段，方便自动扫描
- SOP 生成后必须补充来源回链，确保可追溯
- 对高价值经验总结优先标记 `sop-priority: high`
- 不支持 hooks 的客户端统一采用手动触发指令，降低预期偏差
- 定期执行 `lint the wiki`，防止知识库结构漂移

## 常见问题（FAQ）

### 1. 为什么有些客户端不会自动检查 SOP？
因为并非所有客户端都支持 hooks。Claude Code 支持 `hooks.json`，其他客户端通常只支持 skills，需要手动触发。

### 2. 什么样的资料应该标记为 `sop-ready`？
包含明确步骤流程的资料都适合标记；若还是经验总结或最佳实践，建议加 `sop-priority: high`。

### 3. 什么时候应该生成 SOP？
当同主题 `sop-ready` 资料达到 3 条及以上，或某条资料具有高优先级时，应及时生成 SOP。

### 4. source 更新后为什么还要更新 SOP？
因为 SOP 是对 sources 的综合提炼，若底层资料已更新，SOP 也需要同步刷新，避免流程失真。

### 5. Windows 下 Junction 创建失败怎么办？
先确认目标父目录存在、PowerShell 权限足够，并检查 `$VAULT\skills` 路径是否正确。

## 相关来源
- [[2026-05-11-claude-obsidian部署与SOP机制配置]]
