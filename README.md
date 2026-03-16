# GAI 赋能的小学文化传承——临平滚灯

本项目是“临平滚灯”主题的小学文化传承网站骨架，在没有真实素材的情况下也可以直接跑起来预览。你只需要按本文档的操作教程替换占位资源、按需启动后端与 AI 配置，即可完成自己的毕业设计展示。

- 技术栈：Vite + React + TypeScript + React Router + TailwindCSS + Zustand + Recharts + A‑Frame（CDN，可 Mock）
- 特性：全站占位/注释、Mock/真接口切换、AR 降级、双语与暗色模式、登录与反馈统计（SQLite 本地持久化）、AI 问答模块
- 本地运行与构建排障：见 `本地运行教程.md`
- 文档最后整理：2026-03-12

## 文档导航

- 项目总览：`README.md`（本文件）
- 本地运行与排障：`本地运行教程.md`
- 服务器部署与重启：`DEPLOY_MANUAL.md`
- AI Prompt 调整：`Prompt编辑指南.md`
- 历史变更记录：`CHANGELOG.md`

---

## 一、快速开始（前端 + 后端）

> 仅浏览静态内容（百科、微课、课程资源、H5、WebAR、AI Mock）可以只跑前端；若要使用“登录 + 反馈 + 真 AI 问答”，建议同时启动后端。

1. 安装依赖

```bash
# 前端（项目根目录）
pnpm install

# 后端（反馈与登录服务）
cd server
npm install
```

2. 启动开发环境

```bash
# 终端 1：后端（提供 /api 与 /ws）
cd server
npm run db:init   # 首次运行建议执行；会初始化/检查 SQLite 数据库文件
npm run dev

# 终端 2：前端
pnpm dev
```

打开浏览器访问：`http://localhost:5173`

3. 构建与预览

```bash
pnpm build
pnpm preview
```

4. 运行单元测试

```bash
pnpm test
```

---

## 二、目录结构与资产位置

```text
/public
  /images        # 占位图片，TODO：替换为真实海报、缩略图等
  /videos        # 占位视频，TODO：替换为微纪录片与动作短片
  /models        # 3D 模型（lantern.glb），TODO：替换为真实滚灯模型
  /resources     # 课程资源附件（PPT/PDF/教案/小软件等）

/content         # 所有可编辑内容配置，支持 JSONC（可写 // 和 /* */ 注释）
  entries.json       # 百科词条与时间轴
  lessons.json       # 微课与动作分解
  microdoc.json      # 微纪录片播放列表
  handbook.json      # H5 互动手册题库与章节
  cross_subject.json # 跨学科融合点位（参考用）
  faq.json           # AI 预置问答（Mock 模式用）
  resources.json     # 滚灯课程资源中心（按学科划分的课件/教案/小软件）

/src
  /pages
    Home.tsx          # 首页
    AboutLantern.tsx  # 滚灯文化百科 / 搜索
    Microdoc.tsx      # 微纪录片展示
    Lessons.tsx       # 动作微课 + StepAnnotator
    Resources.tsx     # 课程资源中心（新模块）
    H5Handbook.tsx    # H5 互动手册
    WebAR.tsx         # WebAR 3D 体验
    AIQA.tsx          # AI 智能问答（Mock/真实接口可切换）
    Feedback.tsx      # 学习反馈与可视化
  /components         # 导航、Footer、时间线、视频播放器、AR 组件、AI 聊天组件等
  /lib                # i18n、多语言、状态管理、API/AI 客户端等
  /styles             # Tailwind 与设计 tokens

/server               # 后端（登录 + 反馈 + 统计 API）
  routes/             # auth、feedback、stats 等路由
  db/                 # SQLite 文件持久化数据库层（sql.js）
  scripts/            # 初始化/填充数据库脚本
  index.js            # 服务器入口（含 WebSocket）
  .env(.example)      # 后端环境变量配置
```

---

## 三、内容配置与操作教程（含“课程资源”模块）

所有可替换内容都集中在 `content/*.json`，支持 JSONC 注释。下面按文件说明如何“填充真实内容”。

### 1. 百科与时间轴：`content/entries.json`

- 功能：驱动首页时间线和“文化百科”搜索页的词条内容。
- 关键字段：
  - `id`：唯一标识（如 `"overview"`、`"history-01"`）。
  - `title`：词条标题。
  - `desc`：词条正文描述（支持较长段落）。
  - `media`：可选，图片路径，如 `/images/your_entry.jpg`。
  - `ts`：时间标记，如 `"清代"`、`"2008 年"`。
  - `keywords[]`：关键词，用于搜索联想与结果匹配。
- 操作步骤：
  1. 打开 `content/entries.json`，找到带 `TODO` 注释的占位项目。
  2. 按上述字段含义重写 `title` / `desc` / `media` / `keywords`。
  3. 保存后刷新页面 `/` 和 `/about-linping-lantern` 即可看到更新。

### 2. 动作微课：`content/lessons.json`

- 功能：驱动 `/lessons` 页面微课列表及 StepAnnotator 计拍教学。
- 关键字段：
  - `title`：微课标题，如“基本步伐练习”。
  - `thumb`：缩略图路径，如 `/images/lesson_basic_steps.jpg`。
  - `clip`：短片视频路径，如 `/videos/lesson_basic_steps.mp4`。
  - `beats`：节拍数，用于节奏辅助条。
  - `steps[]`：动作分解说明，每一项对应一个节拍或步骤提示。
- 操作步骤：
  1. 将真实动作短片放入 `public/videos`，缩略图放入 `public/images`。
  2. 在 `lessons.json` 中为每节课配置对应的 `thumb`、`clip`、`beats` 和 `steps[]`。
  3. 页面 `/lessons` 中勾选“本地练习完成”会自动写入 LocalStorage（键：`lp_progress`）。

### 3. H5 互动手册：`content/handbook.json`

- 功能：驱动 `/h5-handbook` 页面章节轮播与问答互动。
- 关键字段：
  - `title`：章节标题。
  - `svg`：章节插图路径，推荐 SVG 或 JPG，如 `/images/placeholder_svg.svg`。
  - `audio`：可选，语音讲解或音乐路径，如 `/audio/chapter1.mp3`（目录可自行创建）。
  - `quiz[]`：题目数组，每题包含 `q`（题干）、`a[]`（选项）与 `correct`（正确选项索引）。
- 操作步骤：
  1. 按章节拆分知识点，编写对应题目与选项。
  2. 将插图和音频文件放入 `public/images` / `public/audio`，路径写入 JSON。
  3. 切换 `/h5-handbook` 页面即可看到互动答题效果与得分。

### 4. 新模块：滚灯课程资源中心 `content/resources.json` + `public/resources`

> 用于集中管理「不同学科融入滚灯」的课程开发项目：包括课件（PPT/PDF）、教案（Word/PDF）以及课堂小软件等，并支持部分资源在线预览。

#### 4.1 数据结构

`content/resources.json` 中每个对象代表一个“学科项目”，示例结构：

```jsonc
{
  "id": "chn-rolling-lantern-01",
  "subject": "语文",
  "subjectEn": "Chinese Language",
  "title": "主题识字课：走进临平滚灯",
  "grade": "三年级上",
  "summary": "简要说明本课如何在语文学科中融入临平滚灯文化。",
  "keywords": ["识字", "传统文化", "口语表达"],
  "files": [
    {
      "id": "slides",
      "label": "课件（PPT）",
      "type": "课件",
      "format": "pptx",
      "previewUrl": "/resources/chn-rolling-lantern-01-slides.pdf",
      "downloadUrl": "/resources/chn-rolling-lantern-01-slides.pptx"
    }
  ]
}
```

- 顶层字段：
  - `subject` / `subjectEn`：学科名称（如 语文 / Chinese Language）。
  - `title`：该学科项目标题（如“滚灯造型与纹样设计”）。
  - `grade`：适用年级学段（如 三年级上、四年级下）。
  - `summary`：本项目如何在该学科中引入滚灯的简要说明，适合写成“教学设计摘要”。
  - `keywords[]`：用于展示的标签字样（如“造型”“色彩搭配”“民俗纹样”等）。
- `files[]` 中每个元素代表一个具体资源：
  - `label`：显示名称，例如“教学课件”“教学设计与反思”“课堂互动小软件”。
  - `type`：资源类别（课件 / 教案 / 小软件 / 活动单等）。
  - `format`：文件格式说明（pptx / pdf / docx / zip 等，仅用于文字展示）。
  - `previewUrl`：可选，适合在线预览的地址（推荐 PDF / 图片 / HTML），如 `/resources/xxx.pdf`。
  - `downloadUrl`：下载地址，如 `/resources/xxx.pptx` 或 `/resources/xxx.zip`，真实文件放在 `public/resources`。

#### 4.2 文件放置与命名

1. 所有课程资源附件放在 `public/resources` 目录下：
   - PPT 课件：如 `chn-rolling-lantern-01-slides.pptx`
   - 导出的 PDF：如 `chn-rolling-lantern-01-slides.pdf`
   - 教案 Word/PDF：如 `chn-rolling-lantern-01-plan.docx` / `.pdf`
   - 小软件 / 演示程序：打包为 `zip`，如 `science-rolling-lantern-01-tool.zip`
2. 在 `content/resources.json` 中：
   - `previewUrl` 填写希望在线预览的文件（推荐 PDF），例如 `"/resources/chn-rolling-lantern-01-slides.pdf"`。
   - `downloadUrl` 填写原始文件（PPTX/DOCX/ZIP 等），例如 `"/resources/chn-rolling-lantern-01-slides.pptx"`。
3. 命名建议：使用“学科缩写 + 项目标号 + 类型”，如 `chn-rolling-lantern-01-slides.pdf`、`art-rolling-lantern-01-plan.pdf`。

#### 4.3 在线浏览实现方案（可写入论文的技术说明）

- 前端页面：`src/pages/Resources.tsx`。
- 交互流程：
  1. 页面加载 `content/resources.json`，按学科（`subject`）分组展示项目。
  2. 用户点击“在线预览”，前端打开模态框，内部使用 `<iframe>` 加载 `previewUrl`。
  3. 浏览器利用自身的 PDF / 图片 / HTML 渲染能力展示文件内容，**不依赖第三方在线 Office 服务，也无需单独安装插件**。
  4. 若浏览器不支持某种格式，用户仍可通过“在新标签打开”或“下载”按钮获取文件。
- 对你来说，需要做的仅为：
  1. 确保 `previewUrl` 指向浏览器能够直接渲染的文件（推荐 PDF）。
  2. 将对应文件放入 `public/resources`，路径与 JSON 中填写保持一致。

---

## 四、各页面与模块说明（操作视角）

- 首页 `/`
  - 展示项目主题、平台特色与模块入口卡片。
  - 时间线数据来自 `content/entries.json` 中的前若干条记录。
- 文化百科 `/about-linping-lantern`
  - 支持输入关键字搜索（如“滚灯 起源”“滚灯 制作”等），使用 `entries.json` 进行模糊匹配。
  - 左侧为搜索结果列表，右侧为当前选中条目的详细内容。
- 微纪录片 `/microdoc`
  - 播放清单来自 `content/microdoc.json`，默认使用占位视频路径 `/public/videos/placeholder_*.mp4`。
  - 替换步骤：将真实 MP4 放入 `public/videos`，修改 `microdoc.json` 中对应条目的 `sources` 列表。
- 动作微课 `/lessons`
  - 列表与节拍详解从 `content/lessons.json` 读取。
  - 每一条微课可以勾选“本地练习完成”，进度保存到浏览器 LocalStorage，刷新后仍然保留。
- 课程资源中心 `/resources`
  - 顶部说明 + 学科筛选（按 `subject` 过滤）。
  - 每个“项目卡片”对应 `resources.json` 中一条记录，内含多个资源文件。
  - “在线预览”按钮会弹出模态框，用 `<iframe>` 打开 `previewUrl`（PDF/图片/HTML），支持在浏览器直接查看。
  - “下载”按钮直接访问 `downloadUrl`，用于获取原始 PPT / Word / 小软件等。
- H5 互动手册 `/h5-handbook`
  - 从 `handbook.json` 加载章节、插图和问答题库。
  - 页面提供上一页 / 下一页导航与得分统计。
- WebAR `/webar`
  - 尝试通过 A‑Frame 加载 `/public/models/lantern.glb`。
  - 如无模型或浏览器不支持，会展示降级指引，不影响其他模块使用。
- AI 智能问答 `/ai-qa`
  - 默认走 Mock 模式，根据 `content/faq.json` 进行简单问答示例。
  - 可通过环境变量切换到火山引擎真实大模型 API（见下文“六、AI 问答模块配置”）。
- 学习反馈 `/feedback`
  - 在仅前端模式下，页面可作为 UI 展示示例；结合后端 server 后，可提交反馈并查看统计（见下一节）。

---

## 五、登录与反馈系统（后端 server）

登录、身份识别、反馈表单与数据可视化依赖 `server/` 目录下的 Node.js 后端。

1. 后端环境变量

复制 `server/.env.example` 为 `server/.env`，默认配置适合本地开发：

```env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/feedback.db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_EXPIRE_HOURS=24
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

如需在其它域名或端口部署，请相应修改 `PORT` 与 `CORS_ORIGIN`。

2. 初始化与启动后端

```bash
cd server
npm run db:init   # 初始化/检查 SQLite 数据库（首次必做，后续可重复执行）
npm run dev       # 开发环境；或 npm start 运行生产模式
```

3. 登录与角色

前端登录页面：`http://localhost:5173/login`

- 示例账号（已在文档中约定的典型用法）：
  - 学生：`s30101`
  - 教师：`t301`
  - 管理员：`admin`
- 登录特点：
  - 账号+密码登录，且账号与密码需一致（后端仅校验，不保存密码）。
  - 首次登录自动创建账户。
  - 用户名规则决定角色：学生 `s+年级(3-9)+班级(01-10)+学号(01-45)`（如 `s30101`），教师 `t+年级(3-9)+班级(01-10)`（如 `t301`），管理员 `admin`。
- 登录后：导航栏右侧会显示头像（首字母）、姓名、角色徽章，以及“退出登录”入口。

4. 路由保护与权限

- `/feedback` 为受保护页面，需登录后访问；未登录访问会跳转 `/login`。
- 其它页面（首页、百科、微课、课程资源等）默认公开访问。
- 你可以在 `src/components/ProtectedRoute.tsx` 中基于角色进一步细化权限（例如仅教师/管理员可访问某些统计页面）。

5. 反馈数据与可视化（概览）

- 后端提供 `/api/feedback/*` 与 `/api/stats/*` 接口；前端通过 `src/lib/apiClient.ts` 调用。
- 后端默认使用本地 SQLite 持久化文件（`server/data/feedback.db`）。
- 反馈数据按账号写入数据库，重启服务后不会丢失；同账号跨会话可继续查看历史反馈。
- 适合课堂演示与毕业设计本地部署；如需上云，可根据 `database-schema.sql` 迁移到 MySQL / PostgreSQL。

6. 本版本（2026-03-12）后端数据库变更摘要

- 数据库实现由“内存 Mock”改为“SQLite 文件持久化（sql.js）”。
- 服务启动时自动初始化数据库（`server/index.js` 中执行 `initDB()`）。
- `auth` / `feedback` / `stats` / `users` 路由统一接入 `server/db/index.js`。
- `npm run db:init` 已切换为 SQLite 初始化流程。
- 新增 `.gitignore` 规则，默认忽略 `server/data/*.db`，避免误提交数据文件。

7. 数据库备份、恢复与迁移（论文附录可引用）

- 当前数据库类型：SQLite（单文件），默认路径：`server/data/feedback.db`。

（1）备份（本地或服务器）

```bash
cp server/data/feedback.db server/data/feedback.db.bak.$(date +%Y%m%d-%H%M%S)
```

（2）恢复（回滚到指定备份）

```bash
# 先停止后端进程（pm2 或 node）
cp server/data/feedback.db.bak.20260312-153000 server/data/feedback.db
```

恢复后重新启动后端（`npm run dev` 或 `pm2 restart lantern-api`）。

（3）迁移到其他数据库（MySQL/PostgreSQL）的最小流程

1. 以 `database-schema.sql` 为基础，在目标数据库创建等价表结构。  
2. 从 SQLite 导出核心业务表：`users`、`sessions`、`feedbacks`、`learning_progress`。  
3. 按新数据库驱动重写 `server/db/index.js` 的 CRUD 层接口，保持路由层不变。  
4. 先做灰度验证（登录、提交反馈、查看统计）后再切换生产环境。  

---

## 六、AI 问答模块配置（Mock 与火山引擎）

AI 问答模块统一由 `src/lib/aiClient.ts` 管理，支持两种模式：Mock 模式与火山引擎（Volcengine）真实大模型。

1. Mock 模式（默认）

- 适用于：无网络/不想产生费用/课堂演示。
- 配置：在 `.env` 中保持（或设置）

```env
VITE_ENABLE_MOCK=true
```

- 行为：
  - `/ai-qa` 页面顶部显示 “Mock 模式 / 演示数据”。
  - 回答来自 `content/faq.json` 中的预置问答。
  - 不会发出外部网络请求，成本为 0。

2. 启用火山引擎 Doubao 真实大模型

> 环境变量名与调用逻辑见 `src/lib/aiClient.ts` 与 `src/lib/volcengineClient.ts`。

（1）在 `.env` 中配置：

```env
# 关闭 Mock，启用真实 AI
VITE_ENABLE_MOCK=false

# 火山引擎 API 配置（从控制台获取）
VITE_VOLCENGINE_API_KEY=你的API密钥
VITE_VOLCENGINE_ENDPOINT_ID=你的端点ID
VITE_VOLCENGINE_MODEL=Doubao-1.5-pro-256k   # 可选，不填则使用默认 lite 模型
```

（2）在火山引擎控制台的基本步骤（简要）：

1. 注册并实名认证火山引擎账号：<https://www.volcengine.com/>
2. 在豆包大模型控制台开通服务：<https://console.volcengine.com/ark>
3. 创建 API Key，并复制保存（形如 `ak-...`）。
4. 创建“推理接入点”（Endpoint），选择合适模型（示例：`doubao-lite-32k` 或 `Doubao-1.5-pro-256k`），复制端点 ID（形如 `ep-...`）。
5. 把上述值填入 `.env` 中对应的环境变量。

（3）重启前端开发服务器：

```bash
# 终端中先 Ctrl + C 结束，再重新启动
pnpm dev
```

（4）验证配置：

1. 打开 `http://localhost:5173/ai-qa`。
2. 页面顶部应显示“火山引擎 AI”绿色状态。
3. 试着提问：
   - “临平滚灯的历史是什么？”
   - “滚灯是怎么制作的？”
   - “滚灯表演有哪些技巧？”
4. 预期现象：有打字机效果，回答专业且适合小学生阅读。

（5）成本大致估算（按文档示例）：

- 模型：`doubao-lite-32k`。
- 假设：50 个学生 × 每人每天 5 个问题，问题 + 回答共 400 tokens。
- 估算月成本约 ¥6–10（以官方定价为准，可在控制台查看最新价格）。

> 不想产生费用时，只需把 `VITE_ENABLE_MOCK` 改回 `true`。

---

## 七、定制 AI 回答风格（Prompt 编辑）

系统提示词（Prompt）决定 AI 的“角色、知识范围、语气风格和回答结构”。项目已内置一份较长的 Prompt，专门围绕“临平滚灯”文化做了人格和知识设计。

1. Prompt 位置

- 文件：`src/lib/aiClient.ts`
- 搜索关键词：`systemPrompt:`
- 当前为一个多行模板字符串（反引号 `` `...` `` 包裹），包含：
  - 角色设定（临平滚灯文化传承智能助手）。
  - 核心知识库（起源、制作工艺、表演技艺、文化意义等）。
  - 回答准则（语言风格、篇幅、结构、互动引导等）。
  - 多种示例回答风格（惊叹开场、设问开场、故事开场等）。

2. 修改步骤（建议）

1. 用编辑器打开 `src/lib/aiClient.ts`。
2. 找到 `systemPrompt: \`` 开头到结尾反引号之间的内容。
3. 根据需要修改：
   - 角色：例如从“热情的文化向导”改为“严谨的博物馆讲解员”。
   - 知识点：补充你在论文中整理好的滚灯历史、传承人信息、当代传承实践等。
   - 风格：调整“回答长度”“是否多用比喻/故事”“结尾是否鼓励学生实践”等。
4. 保存文件，刷新 `/ai-qa` 页面测试回答效果。

3. 常见调整场景举例

- 让 AI 回答更简洁：降低 Prompt 中建议的字数范围，或在其中强调“优先用短句和要点回答”。
- 让 AI 更严肃专业：减少 emoji，增加“专业严谨、用词规范”的描述。
- 强调毕业设计主题：在 Prompt 最前面增加“这是某某小学《临平滚灯》综合实践课程的 AI 助手”等背景说明。

> 提示：修改 Prompt 不会影响费用，只会改变回答风格与内容侧重点，非常适合在论文中作为“AI 人格设计与 Prompt 工程实践”的一部分来展示。

---

## 八、测试与验收建议

- 单元测试：`pnpm test`（当前包括 `aiClient`、校验工具等示例测试）。
- 推荐的手动验收路径：
  1. 首页 → 检查中英文切换与暗色模式。
  2. 百科页 → 关键词搜索、时间轴与图片展示。
  3. 微课页 → 动作分解、节拍辅助、LocalStorage 进度记录。
  4. 课程资源中心 → 按学科筛选、资源下载与在线预览。
  5. H5 互动手册 → 章节切换与得分统计。
  6. WebAR → 有/无 3D 模型时的加载与降级提示。
  7. AI 问答 → Mock / 真实 AI 模式切换、响应效果与回答质量。
  8. 登录 + 反馈 → 使用示例账号登录、填写反馈、查看可视化统计（需启动后端）。

---

如果你愿意，我可以在下一步帮助你：
- 直接为语文 / 美术 / 科学等学科撰写几套完整的“滚灯课程项目”案例，并填入 `content/resources.json`；
- 或者按论文结构帮你从 README 中提炼出“系统设计”“功能模块”“AI 应用”等章节的文字说明。
