---
title: "配置飞书 Webhook 机器人消息提醒"
type: sop
category: notification
status: active
created: 2026-05-12
updated: 2026-05-12
tags: [feishu, webhook, notification, bot]
related_sources:
  - 2026-05-12-deployment-configuration-session.md
---

# 配置飞书 Webhook 机器人消息提醒

## 概述

在飞书群中添加自定义机器人，当知识库生成新的 SOP 时，自动发送卡片消息到群聊提醒。

## 前置条件

- 飞书账号（个人版即可）
- 已创建飞书群或已有群

## 步骤

### 1. 创建飞书群

打开飞书 → 消息 → 右上角 `+` → **创建群组**

群名建议：`SOP 知识库` 或 `AI 笔记提醒`

### 2. 添加自定义机器人

1. 进入群 → 点击**群名称** → **设置**
2. 选择 **群机器人**
3. 点击 **添加机器人** → 选择 **自定义机器人**
4. 给机器人起名字，如 `SOP助手`
5. 点击 **添加**
6. **复制 Webhook 地址**（格式如下）：
   ```
   https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

### 3. 配置到项目

编辑 `.watchdog/config.yaml`：

```yaml
feishu:
  enabled: true
  webhook: "https://open.feishu.cn/open-apis/bot/v2/hook/你的Webhook地址"
  app_id: ""
  app_secret: ""
  folder_token: ""
```

### 4. 测试发送

运行 Python 脚本测试：

```python
import requests

card = {
    "msg_type": "interactive",
    "card": {
        "header": {
            "title": {"tag": "plain_text", "content": "测试消息"},
            "template": "blue"
        },
        "elements": [
            {"tag": "div", "text": {"tag": "lark_md", "content": "✅ 飞书机器人配置成功！"}}
        ]
    }
}

requests.post("你的Webhook地址", json=card)
```

### 5. 集成到工作流

当 daemon 运行并生成 SOP 时，`feishu_sync.py` 会自动调用 Webhook，发送包含以下信息的卡片：

- SOP 标题
- 内容摘要（前 3000 字符）
- 来源资料列表
- 生成时间

## 消息格式

飞书机器人支持两种消息类型：

| 类型 | 用途 | 说明 |
|------|------|------|
| **文本消息** | 简单通知 | `msg_type: text` |
| **卡片消息** | 结构化展示 | `msg_type: interactive`，支持标题、内容、按钮 |

项目默认使用**卡片消息**（更美观，支持蓝色标题栏）。

## 限制

- 个人版飞书可以使用自定义机器人
- 但**不能**使用 API 模式创建云文档（需要企业版）
- Webhook 地址包含密钥，不要泄露到公开仓库

## 相关配置

- `.watchdog/config.yaml` → `feishu.enabled: true`
- `scripts/daemon/feishu_sync.py` → 飞书同步逻辑
