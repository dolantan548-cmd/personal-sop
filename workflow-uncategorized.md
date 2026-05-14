---
type: sop
category: workflow
status: active
created: 2026-05-14
updated: 2026-05-14
related_sources:
  - "[[2026-05-11-claude-obsidian部署与SOP机制配置_1]]"
  - "[[2026-05-12-full-chat-session]]"
  - "[[2026-05-12-session-summary]]"
  - "[[claude-obsidian-ecosystem-research_1]]"
  - "[[example-docker-compose-setup]]"
tags: [sop, workflow]
---

# SOP: 部署 claude-obsidian 自动化知识库并建立 SOP 生成与多端发布闭环

## 目的

本 SOP 用于在本地部署 `claude-obsidian` 知识库，并建立从原始资料摄入、结构化整理、SOP 自动生成，到 Git 托管、Vercel 发布、飞书通知和多 AI 客户端复用的标准化工作流。

---

## 适用场景

- 需要搭建个人或团队知识中台，将原始资料持续沉淀为结构化笔记与 SOP
- 希望在 Claude Code、Kimi Code、Codex CLI 等多个 AI 客户端中复用同一套知识库与 SOP
- 需要将知识库自动同步到 GitCode / GitHub，并通过 Vercel 对外发布
- 需要在 API 可用时自动处理资料，在 API 不可用时切换到手动整理流程
- 需要对 SOP 生成结果进行通知、索引维护与周期性质量检查

---

## 前置条件

- Windows 环境，且可访问目标项目目录，例如 `D:\dolan_env\temp\project\personal`
- 已安装 Git，建议安装 Git for Windows 以补齐 `ssh` / `rsync` 等工具链
- 已安装 Python 运行环境，可执行项目脚本
- 可访问 `claude-obsidian` 项目源码仓库
- 已准备至少一个可用的 AI API；若使用 Kimi，需确认是通用 API key 而非仅限 Kimi For Coding 的 key
- 已具备 GitCode、GitHub、Vercel、飞书等外部平台账号（按需）
- 已明确知识库目录规划：`.raw/`、`wiki/sources/`、`wiki/sop/`、`wiki/concepts/`、`wiki/entities/`、`wiki/meta/`
- 如需生产式容器化部署外部服务，已准备 Docker Compose 运行环境与 secrets 管理方式

---

## 标准步骤

### 步骤 1：部署 claude-obsidian 到本地知识库目录

在目标路径下克隆并整理项目目录。推荐将仓库放置到：

```powershell
D:\dolan_env\temp\project\personal\claude-obsidian
```

若原始脚本为 Unix Shell，需在 Windows PowerShell 中执行等效配置。完成后检查并创建核心目录：

- `.raw/`
- `wiki/sources/`
- `wiki/sop/`
- `wiki/concepts/`
- `wiki/entities/`
- `wiki/meta/`

同时初始化 Obsidian 配置文件，如：

- `.obsidian/graph.json`
- `.obsidian/app.json`
- `.obsidian/appearance.json`

**预期结果：** 本地已存在可打开的 `claude-obsidian` Vault，核心目录结构完整，Obsidian 可以正常识别该知识库。

---

### 步骤 2：建立标准知识库目录与内容分类规则

统一知识落点规则：

- 原始输入放入 `.raw/`
- AI 整理后的来源笔记放入 `wiki/sources/`
- 抽象方法论放入 `wiki/concepts/`
- 人物、工具、项目等实体放入 `wiki/entities/`
- 可执行流程沉淀为 `wiki/sop/`
- 仪表盘、统计与元数据放入 `wiki/meta/`

所有结构化笔记应使用标准 frontmatter，至少包含：

```yaml
---
title: 标题
type: source|concept|entity|sop
created: 2026-05-12
updated: 2026-05-12
tags: []
related_sources: []
status: raw|processed|sop-ready|synthesized|archived
sop_ready: true|false
---
```

**预期结果：** 知识库已形成统一分类规则，后续新增资料均能按同一标准落盘与管理。

---

### 步骤 3：定义 Source 状态流转与 SOP 候选标记规则

采用统一生命周期：

```text
raw → processed → archived
        └→ sop-ready → synthesized
```

执行规则如下：

- 包含分步骤操作流程的资料标记为 `status: sop-ready`
- 包含最佳实践、经验总结、可复用方法的资料标记为 `status: sop-ready`，必要时补充 `sop-priority: high`
- 纯参考或背景资料标记为 `status: processed`
- 当某一主题累计 `>=3` 篇相关 `sop-ready` 资料，或单篇被标记为高优先级时，进入 SOP 生成队列

**预期结果：** 所有来源资料具备明确状态，系统可以判断哪些资料适合进一步综合为 SOP。

---

### 步骤 4：配置 SOP 模板、索引与专用 Skill

创建或更新以下文件：

1. `_templates/sop.md`
2. `wiki/sop/_index.md`
3. `skills/wiki-sop/SKILL.md`

`SKILL.md` 至少定义以下模式：

- `Auto-Check`：自动扫描 SOP 候选资料
- `Manual`：用户指定主题手动生成 SOP
- `Update`：来源更新后提示刷新 SOP
- `Lint`：检查步骤可执行性、检查清单、回链和格式质量

SOP 模板建议包含：

- frontmatter
- 目的
- 适用场景
- 前置条件
- 步骤
- 检查清单
- FAQ
- 相关来源

**预期结果：** 知识库已具备统一的 SOP 生成格式、索引入口与可复用的生成技能。

---

### 步骤 5：配置会话启动检查与多 AI 客户端接入

对支持 hooks 的客户端，在 `hooks/hooks.json` 中配置 `SessionStart` 自动检查逻辑：

- 扫描 `wiki/sources/` 中 `status: sop-ready` 的资料
- 若同主题资料数量达到阈值或存在 `sop-priority: high`，则提示或触发生成 SOP

在项目根目录增加客户端配置文件：

- `CLAUDE.md`
- `KIMI.md`
- `CODEX.md`
- `GEMINI.md`

如有需要，补充编辑器规则文件：

- `.cursor/rules/claude-obsidian.mdc`
- `.windsurf/rules/claude-obsidian.md`

差异说明：

- `Claude Code`：原生支持 `hooks.json`
- `Kimi Code` / `Codex CLI` / `Gemini CLI` / `Cursor` / `Windsurf`：通常需手动触发、重启加载或使用项目启动协议补足

**预期结果：** 至少一个 AI 客户端可正确识别知识库技能；在 Claude Code 中可自动执行 SOP 候选检查，其他客户端可按约定加载相同知识规则。

---

### 步骤 6：执行原始资料摄入并生成结构化来源笔记

将原始对话、文档、研究记录等放入 `.raw/`。

#### API 可用时

使用项目的 ingest 能力或 daemon 自动处理，将资料整理为 `wiki/sources/` 笔记。

#### API 不可用时

执行手动流程：

1. 打开原始资料全文阅读
2. 判断内容应归属 `concept`、`entity`、`source` 或 `sop`
3. 创建结构化笔记
4. 补齐标准 frontmatter
5. 添加 `[[wikilink]]` 或普通链接建立关联
6. 更新对应 `_index.md`

对每份来源笔记补充与 SOP 相关的状态字段，确保能进入后续判断。

**预期结果：** 原始资料已转化为结构化笔记，放置在正确目录，且已带有索引、关联与状态标记。

---

### 步骤 7：生成或更新 SOP

当同主题 `sop-ready` 资料数量达到阈值，或某资料为高优先级时，基于 `_templates/sop.md` 生成标准 SOP 到 `wiki/sop/`。

生成时必须：

- 综合多个来源
- 提炼统一目的
- 明确适用场景
- 补全前置条件
- 输出可执行步骤
- 写明验证标准
- 补充 FAQ
- 记录相关来源

生成后执行以下动作：

- 将来源资料状态更新为 `synthesized`
- 在 `wiki/sop/_index.md` 中登记新 SOP
- 在 `source`、`concept`、`entity`、`sop` 之间建立相互链接

**预期结果：** 已产出符合统一模板的 SOP 文件，索引可查，来源可追溯，相关资料已建立双向关联。

---

### 步骤 8：执行知识库质量检查与维护

定期运行 wiki lint 或等效检查，重点验证：

- 步骤是否可执行
- 命令是否完整
- 检查清单是否可勾选
- FAQ 是否覆盖常见问题
- 链接是否有效
- SOP 与 source 是否存在回链
- 索引是否更新

当 `sources` 内容新增或配置改变时，执行 Update 模式，提示刷新 SOP。必要时维护 hot cache、执行自动提交或整理归档。

**预期结果：** 知识库中的 SOP 与来源资料保持一致，结构清晰，质量可控，可持续复用。

---

### 步骤 9：配置 Git 托管与远程备份

将知识库接入 Git 托管。可按需配置 GitCode 作为主备份仓库，并将统一账户上下文写入本地代理配置文件，例如：

- `~/.claude/AGENTS.md`
- `~/.claude/CLAUDE.md`
- `~/.codex/AGENTS.md`
- `~/.kimi/AGENTS.md`

> 注意：不要在 wiki 笔记或公开仓库中明文保存敏感 token。

建议采用双仓库策略：

- 主 Wiki 仓库存放完整知识库
- SOP 独立仓库仅同步 `wiki/sop/`

完成初始提交并推送远端分支。

**预期结果：** 知识库已具备可用的远程仓库备份，AI 客户端在需要时可共享统一仓库上下文，敏感凭据未被暴露到知识库内容中。

---

### 步骤 10：配置 Vercel 发布主 Wiki 与独立 SOP 站点

将主知识库站点部署到 Vercel，推荐采用 Docsify 零构建渲染 Markdown，确保存在如下入口文件：

- `index.html`
- `wiki/_sidebar.md`

若需提升 SOP 的独立访问性与远程备份能力，将 `wiki/sop/` 单独同步到 GitHub 仓库并连接 Vercel 部署独立 SOP 站点。

部署完成后验证：

- 主 Wiki 可公网访问
- SOP 独立站点可公网访问（如已配置）

**预期结果：** 主知识库与 SOP 内容至少有一个公网可访问入口；若采用双站点模式，则主 Wiki 与 SOP 站点均可正常浏览。

---

### 步骤 11：配置飞书通知与自动化守护进程

在 `.watchdog/config.yaml` 中启用飞书机器人，例如：

```yaml
feishu:
  enabled: true
  webhook: "https://open.feishu.cn/open-apis/bot/v2/hook/..."
```

配置后发送测试消息，确认 SOP 生成后可自动推送群通知。

若 API 可用，运行 daemon 自动流程：

```bash
python scripts\daemon\auto_daemon.py --mode auto --once
```

自动流程应依次完成：

1. 扫描 `.raw/`
2. 生成 `wiki/sources/`
3. 检查 `sop-ready`
4. 生成 SOP
5. 推送 Git 仓库
6. 发送飞书消息
7. 若 SSH 可用，再同步到服务器

**预期结果：** 自动处理链路可运行，SOP 生成后能够触发远程同步与飞书通知。

---

### 步骤 12：处理故障并选择替代发布路径

#### 常见故障与处理

- **AI ingest 403**：检查是否误用了 Kimi For Coding key，改为通用 API key
- **Windows 缺少 ssh/rsync**：安装 Git for Windows
- **服务器 SSH 免密失败**：先切换到 Vercel 作为公网发布主链路

#### 生产环境最佳实践（如需外部服务）

若需对外部支撑服务进行容器化管理，可采用 Docker Compose，并将敏感配置放入 `secrets/`。例如：

```bash
mkdir -p secrets
openssl rand -base64 32 > secrets/db_password.txt
chmod 600 secrets/db_password.txt
```

同时在 Compose 中使用：

- 版本化镜像标签，避免 `latest`
- `healthcheck`
- `restart: unless-stopped`
- 命名卷持久化
- secrets 文件注入密码

**预期结果：** 常见阻塞项均有可执行替代方案，系统可在 API、SSH 或本地工具链不完善的情况下继续运行核心知识流程。

---

## 检查清单

- [ ] 已在本地成功部署 claude-obsidian，并能通过 Obsidian 打开 Vault
- [ ] 已创建 `.raw/`、`wiki/sources/`、`wiki/sop/`、`wiki/concepts/`、`wiki/entities/`、`wiki/meta/` 目录
- [ ] 已定义并实际使用 source 状态流转：raw / processed / sop-ready / synthesized / archived
- [ ] 已创建 `_templates/sop.md`、`wiki/sop/_index.md`、`skills/wiki-sop/SKILL.md`
- [ ] 已在至少一个客户端中配置知识库协议文件，如 `CLAUDE.md` 或 `KIMI.md`
- [ ] 已配置 `hooks/hooks.json` 或等效的启动检查机制
- [ ] 已将至少一份 `.raw/` 资料成功整理为 `wiki/sources/` 结构化笔记
- [ ] 已基于多个 sources 生成至少一份 SOP，并写入 `wiki/sop/`
- [ ] 已更新相关 `_index.md` 文件并建立 wikilink 关联
- [ ] 已完成 Git 远程仓库推送，且未在笔记中泄露敏感 token
- [ ] 已完成 Vercel 主 Wiki 或 SOP 独立站点发布
- [ ] 已启用飞书 webhook 并验证消息可达
- [ ] 已验证 daemon 自动流程或已准备 API 不可用时的手动流程
- [ ] 已记录并采用至少一种故障替代路径（如 Vercel 替代 SSH 部署）

---

## FAQ

### 1. 为什么 AI ingest 会出现 403？
常见原因是使用了仅适用于 Kimi For Coding 的 key，而不是通用 API key。应改用可用于通用调用的平台密钥，例如 Moonshot Platform 提供的 API key。

### 2. 哪些客户端可以自动执行 SOP 检查？
`Claude Code` 原生支持 `hooks.json`，可在 `SessionStart` 自动检查 `sop-ready` 资料。其他如 `Kimi Code`、`Codex CLI`、`Gemini CLI`、`Cursor`、`Windsurf` 通常需要手动触发、重启加载或借助项目配置协议实现近似效果。

### 3. API 不可用时还能继续整理知识库吗？
可以。将原始资料放入 `.raw/` 后，按手动流程阅读、分类、创建结构化笔记、补齐 frontmatter、建立链接并更新索引，之后再手动生成 SOP。

### 4. 什么时候应该把 source 标记为 `sop-ready`？
当资料中包含可复用的分步骤操作流程、最佳实践、经验总结或可稳定执行的方法时，应标记为 `sop-ready`；若价值高且复用性强，可再加 `sop-priority: high`。

### 5. 为什么建议把 SOP 独立部署成单独站点？
因为 SOP 通常更适合作为高频查询、标准执行入口。将其与主 Wiki 分离，可提升访问效率、维护清晰度和远程备份独立性。

### 6. 服务器 SSH 同步失败时怎么办？
不要让 SSH 阻塞整体流程。优先使用 Vercel 托管静态站点完成公网发布，将 SSH 同步降级为备用链路，后续再排查免密登录、权限或服务端配置问题。

### 7. 多 AI 客户端共享 Git 凭据时要注意什么？
可以在各自的本地代理配置文件中写入统一仓库上下文，但不要把敏感 token 明文写入 wiki 笔记或公开仓库。知识库中只保留必要的配置说明，不保存密钥明文。

### 8. 如果需要把相关外部服务做成生产级部署，有什么通用实践？
可采用 Docker Compose 管理多容器服务，使用版本化镜像、健康检查、自动重启、命名卷和 secrets 文件管理敏感配置，避免把密码直接写入主配置文件。

---

## 相关来源

- [[2026-05-11-claude-obsidian部署与SOP机制配置_1]]
- [[2026-05-12-full-chat-session]]
- [[2026-05-12-session-summary]]
- [[claude-obsidian-ecosystem-research_1]]
- [[example-docker-compose-setup]]
