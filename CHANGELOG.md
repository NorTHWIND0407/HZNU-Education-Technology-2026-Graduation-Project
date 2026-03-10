# 变更记录（CHANGELOG）

本文档用于统一维护项目的历史更改日期、版本与关键改动。

## 2026-03-10（文档整理）

- 新增统一变更记录：`CHANGELOG.md`。
- 将以下历史说明文档整合到本文件：
  - `AI模块配置完成说明.md`
  - `AI问答模块改进总结.md`
  - `滚动问题修复说明.md`
- 保留使用型文档：`README.md`、`本地运行教程.md`、`DEPLOY_MANUAL.md`、`Prompt编辑指南.md`。

## 2025-10-15（v2.1 - 滚动体验修复版）

- 修复 AI 流式输出期间“滚轮被强制拉回底部”的问题。
- 将自动滚动逻辑调整为“用户在底部时跟随，离开底部后暂停跟随”。
- 主要影响文件：`src/components/QAChat.tsx`。

## 2025-10-15（v2.0 - 智能交互增强版）

- 快捷问题支持一键提问，并扩展问题数量。
- 优化 AI 回答风格与 Prompt 结构，增强多样性和可读性。
- 新增 Prompt 使用与修改说明文档。
- 主要影响文件：
  - `src/components/QAChat.tsx`
  - `src/lib/aiClient.ts`
  - `Prompt编辑指南.md`

## 2025-10（v1.0 - AI 问答配置完成）

- 完成 AI 问答模块的真实接口接入（支持 Mock/真实模式切换）。
- 完成火山引擎客户端与统一 AI 客户端接入。
- 完成 AI 问答页面与聊天组件的基础能力（流式响应、多轮对话、快捷问题）。
- 主要影响文件：
  - `src/lib/volcengineClient.ts`
  - `src/lib/aiClient.ts`
  - `src/components/QAChat.tsx`
  - `src/pages/AIQA.tsx`

