# GAI 赋能的小学文化传承：临平滚灯

这是一个用于毕业设计展示的临平滚灯主题网站，包含前端展示、后端登录与反馈、以及可切换 Mock/真实接口的 AI 问答模块。项目内置占位素材和示例内容，先跑通系统，再逐步替换成你的真实教学资源即可。

- 文档更新时间：2026-04-02
- 主要技术栈：Vite、React、TypeScript、TailwindCSS、Zustand、Recharts、A-Frame（WebAR）

## 文档索引

- 项目总览：`README.md`（当前文件）
- 本地运行与排障：`本地运行教程.md`
- 部署与重启：`DEPLOY_MANUAL.md`
- Unity 导出与发布：`Unity导出与发布教程.md`
- Prompt 调整：`Prompt编辑指南.md`
- 修改日志：`CHANGELOG.md`

## 1. 快速开始

### 1.1 安装依赖

```bash
# 根目录（前端）
pnpm install

# 后端
cd server
npm install
```

### 1.2 启动开发环境

```bash
# 终端 1：后端
cd server
npm run db:init
npm run dev

# 终端 2：前端
pnpm dev
```

浏览器访问：`http://localhost:5173`

### 1.3 构建与测试

```bash
pnpm build
pnpm preview
pnpm test
```

## 2. 目录结构

```text
/public
  /images      页面图片和海报资源
  /videos      微纪录片与动作短视频
  /models      WebAR 模型（如 lantern.glb）
  /resources   课程资源附件（PPT、PDF、教案、ZIP）

/content        站点内容配置（JSON/JSONC）
  entries.json
  lessons.json
  microdoc.json
  handbook.json
  resources.json
  faq.json
  cross_subject.json

/src
  /pages
  /components
  /lib
  /styles

/server         登录、反馈、统计与微纪录片互动接口
```

## 3. 内容维护（你最常改的文件）

### 3.1 百科与时间轴

文件：`content/entries.json`

- 用于首页时间轴和文化百科页面。
- 重点字段：`title`、`desc`、`media`、`ts`、`keywords`。

### 3.2 动作微课

文件：`content/lessons.json`

- 用于 `/lessons` 页面。
- 重点字段：`thumb`、`clip`、`beats`、`steps`。
- 视频放在 `public/videos`，缩略图放在 `public/images`。

### 3.3 H5 手册

文件：`content/handbook.json`

- 用于 `/h5-handbook` 页面章节与题库。
- 重点字段：`title`、`svg`、`audio`、`quiz`。

### 3.4 课程资源中心

文件：`content/resources.json`

- 用于 `/resources` 页面，按学科展示课程项目。
- 每个项目可包含多个资源文件：课件、教案、活动单、课堂小软件等。
- 建议同时提供：
  - `previewUrl`：可在线预览文件（建议 PDF）
  - `downloadUrl`：原始文件（PPTX、DOCX、ZIP 等）
- 实体文件统一放在 `public/resources`。

### 3.5 微纪录片

文件：`content/microdoc.json`

- 用于 `/microdoc` 播放列表。
- 支持视频详情下方评论和点赞（需后端开启）。

### 3.6 AI Mock 问答库

文件：`content/faq.json`

- 当 `VITE_ENABLE_MOCK=true` 时，`/ai-qa` 优先使用这里的问答数据。

## 4. 后端、登录与反馈

### 4.1 后端环境变量

复制 `server/.env.example` 为 `server/.env`，本地建议至少确认：

```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/feedback.db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CORS_ORIGIN=http://localhost:5173
MICRODOC_COMMENT_LOGIN_REQUIRED=true

# AI（后端代理）
VOLCENGINE_API_KEY=你的API密钥
VOLCENGINE_ENDPOINT_ID=你的端点ID
VOLCENGINE_MODEL=Doubao-1.5-pro-256k
```

### 4.2 登录规则

前端登录地址：`/login`

- 学生：`s + 年级(3-9) + 班级(01-10) + 学号(01-45)`，示例 `s30101`
- 教师：`t + 年级(3-9) + 班级(01-10)`，示例 `t301`
- 管理员：`admin`
- 当前规则为“账号与密码一致校验”，首次登录会自动建档。

### 4.3 反馈与权限

- `/feedback` 为登录保护路由。
- 学生可以提交、修改、撤回自己的反馈。
- 教师和管理员可查看班级反馈并执行管理操作（教师受班级范围限制）。
- 数据默认写入 SQLite：`server/data/feedback.db`。

### 4.4 关键接口（节选）

- `PATCH /api/feedback/:id`
- `PATCH /api/feedback/:id/status`
- `DELETE /api/feedback/:id`
- `GET /api/microdoc/:clipId`
- `POST /api/microdoc/:clipId/like`
- `POST /api/microdoc/:clipId/comments`
- `POST /api/ai/chat`
- `POST /api/ai/chat/stream`

## 5. AI 问答配置

### 5.1 Mock 模式（默认推荐）

`.env`：

```env
VITE_ENABLE_MOCK=true
```

适合演示、离线使用和成本可控场景。

### 5.2 火山引擎真实模型（后端代理）

`server/.env`：

```env
VOLCENGINE_API_KEY=你的API密钥
VOLCENGINE_ENDPOINT_ID=你的端点ID
VOLCENGINE_MODEL=Doubao-1.5-pro-256k
```

前端 `.env` 仅需：

```env
VITE_ENABLE_MOCK=false
VITE_API_URL=http://localhost:3001/api
```

相关实现文件（后端代理）：

- `server/routes/ai.js`
- `src/lib/aiClient.ts`

修改配置后请重启后端服务（如有需要再重启前端）。

### 5.3 开源复用必读（Fork 后必须自配）

本仓库是开源项目，任何克隆者都可以运行，但 AI 与生产部署配置必须使用“自己的值”：

- 必须在自己的 `server/.env` 设置：
  - `VOLCENGINE_API_KEY`
  - `VOLCENGINE_ENDPOINT_ID`
  - `VOLCENGINE_MODEL`（可选）
- 必须在自己的前端 `.env` 设置：
  - `VITE_ENABLE_MOCK=false`（使用真实 AI 时）
  - `VITE_API_URL`（指向自己的后端）
- 如果使用 GitHub Actions 自动部署，必须在自己仓库 Secrets 设置：
  - `PROD_SSH_HOST`
  - `PROD_SSH_USER`
  - `PROD_SSH_KEY`
  - `PROD_SSH_PORT`
  - `PROD_VOLCENGINE_API_KEY`
  - `PROD_VOLCENGINE_ENDPOINT_ID`
  - `PROD_VOLCENGINE_MODEL`
  - `PROD_FRONTEND_API_URL`
  - `PROD_FRONTEND_ENABLE_MOCK`（可选，默认 `false`）

注意：

- 本仓库不会提交真实密钥（`.env` / `server/.env` 已被忽略）。
- 你看到的示例值仅用于说明格式，不能直接用于生产。
- 迁移到新域名时请同步修改 `CORS_ORIGIN`、Nginx `server_name` 和 SSL 证书配置。

## 6. 页面路由速查

- `/` 首页
- `/about-linping-lantern` 文化百科
- `/microdoc` 微纪录片
- `/lessons` 动作微课
- `/resources` 课程资源中心
- `/h5-handbook` H5 互动手册
- `/webar` WebAR 体验
- `/ai-qa` AI 智能问答
- `/feedback` 学习反馈（需登录）
- `/login` 登录页

## 7. 验收建议

建议至少走一遍以下流程：

1. 首页、百科、微课、资源中心、H5、WebAR 页面是否可正常访问。
2. 登录后能否进入反馈页并完成提交、编辑、撤回。
3. 微纪录片页面点赞和评论是否生效（含实时同步）。
4. AI 问答能否在 Mock 与真实接口之间切换。
5. `pnpm test` 与 `pnpm build` 是否通过。

## 8. 维护约定

- 真实数据库文件（`server/data/*.db`）不要提交到仓库。
- 真实密钥只保存在 `server/.env` 与 GitHub Actions secrets，不要写入前端 `VITE_*` 配置。
- 内容优先在 `content/*.json` 维护，不建议硬编码到页面组件。
- 每次提交后同步更新 `CHANGELOG.md`，保持版本可追溯。

## 9. 自动部署与可用性

- `push main` 会触发 `.github/workflows/deploy.yml` 自动部署到生产服务器。
- 部署时自动把 Actions secrets 中的 `VOLCENGINE_*` 写入服务器 `server/.env`，并重启后端。
- 仓库启用 `.github/workflows/secret-guard.yml`，防止密钥/私钥误提交。
- 开源复用者在自己的仓库补齐 Secrets 后，可直接复用同一套自动化流程。
