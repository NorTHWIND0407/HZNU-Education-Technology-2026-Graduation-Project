# 部署与重启操作手册（手动 Push + 服务器更新）

适用场景：
- 你在本地改完代码后，手动 `git push`
- 服务器再 `clone`（首次）或 `pull`（后续）
- 然后重新启动线上服务

---

## 1. 本地：手动 Push

```bash
cd /你的本地项目目录
git add -A
git commit -m "chore: deploy update"
git push Main main
```

---

## 2. 服务器：拉取最新代码

```bash
# 登录服务器
ssh root@你的服务器IP
```

### 2.1 首次部署（服务器还没有项目目录）

```bash
git clone https://github.com/NorTHWIND0407/HZNU-Education-Technology-2026-Graduation-Project.git
cd HZNU-Education-Technology-2026-Graduation-Project
```

### 2.2 后续部署（服务器已有项目目录）

```bash
cd HZNU-Education-Technology-2026-Graduation-Project
git pull Main main
```

---

## 3. 服务器：安装依赖并构建

```bash
# 前端
corepack enable
pnpm install
pnpm build

# 后端
cd server
npm ci
npm run db:init
cd ..
```

### 3.1 数据库文件说明（SQLite）

- 默认数据库文件：`server/data/feedback.db`。
- 该文件保存登录会话、用户与反馈统计数据，发布后不会因为重启 `pm2` 而丢失。
- 建议发布前备份一次数据库：

```bash
cp server/data/feedback.db server/data/feedback.db.bak.$(date +%Y%m%d-%H%M%S)
```

- 需要恢复时（先停后端，再覆盖数据库文件）：

```bash
cp server/data/feedback.db.bak.20260312-153000 server/data/feedback.db
pm2 restart lantern-api --update-env
```

---

## 4. 服务器：启动/重启服务

推荐使用 `pm2` 管理后端。

### 4.1 首次启动后端

```bash
pm2 start server/index.js --name lantern-api
pm2 save
pm2 startup
```

### 4.2 后续每次发布后重启后端

```bash
pm2 restart lantern-api --update-env
```

### 4.3 前端（Nginx 托管 dist）

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. 中间是否要关闭之前已运行的前后端进程？

结论：

1. 后端如果是 `pm2` 跑的：不需要手动 kill，直接 `pm2 restart lantern-api`。  
2. 后端如果是 `node index.js` 手工跑的：需要先停掉旧进程，否则会端口冲突（默认 `3001`）。  
3. 生产前端如果由 `nginx` 托管：不需要运行 `pnpm dev`，也不需要停“前端开发进程”（生产本来就不该跑它）。  
4. 如果你当前服务器上确实开着 `pnpm dev`（默认 `5173`）：建议停止，避免资源浪费与混淆。  

---

## 6. 常用排查命令

```bash
# 查看 pm2 进程
pm2 ls
pm2 logs lantern-api --lines 100

# 查看端口占用
ss -lntp | grep -E ':(80|443|3001|5173)\b'

# 检查 nginx 状态
systemctl status nginx
```

---

## 7. 推荐发布顺序（每次更新）

1. 本地 `git push Main main`  
2. 服务器 `git pull Main main`  
3. 服务器备份 `server/data/feedback.db`（建议）  
4. 服务器重新安装依赖（如有变更），执行 `pnpm build` 与 `cd server && npm run db:init`  
5. `pm2 restart lantern-api --update-env`  
6. `sudo systemctl reload nginx`  

---

## 8. 一键部署脚本（推荐）

仓库根目录已提供 `deploy.sh`，默认面向如下目录：

- 项目目录：`/home/ubuntu/HZNU-Education-Technology-2026-Graduation-Project`
- 静态目录：`/var/www/culture`
- 后端进程：`pm2` 的 `lantern-api`（找不到则尝试 `systemd` 的 `hznu-backend`）

在服务器执行：

```bash
cd /home/ubuntu/HZNU-Education-Technology-2026-Graduation-Project
bash deploy.sh
```

脚本会自动完成：

1. `git fetch + reset --hard + git lfs pull`  
2. `npm ci --prefix server`（后端依赖）  
3. `npm ci && npm run build`（前端构建）  
4. 同步 `dist/` 到 `/var/www/culture/`  
5. 同步 `content/` 到 `/var/www/culture/content/`  
6. 同步部署时注入的 `VOLCENGINE_*` 到 `server/.env`  
7. 重启后端（优先 pm2，其次 systemd，最后 nohup 兜底）  
8. `nginx -t` 和 `nginx reload`  
9. 健康检查（前端资源 + 后端 + AI 路由）  

可选环境变量：

```bash
REMOTE_NAME=origin BRANCH_NAME=main WEB_ROOT=/var/www/culture bash deploy.sh
```

---

## 9. GitHub Actions 自动部署（push main 自动执行）

仓库已提供工作流：`.github/workflows/deploy.yml`。  
触发条件：`push main` 或手动 `workflow_dispatch`。

你需要在 GitHub 仓库 `Settings -> Secrets and variables -> Actions` 中配置：

- `PROD_SSH_HOST`：服务器 IP 或域名
- `PROD_SSH_USER`：SSH 用户（建议 `ubuntu`）
- `PROD_SSH_KEY`：对应私钥（多行完整内容）
- `PROD_SSH_PORT`：SSH 端口（如 `22`）
- `PROD_VOLCENGINE_API_KEY`：后端 AI 密钥
- `PROD_VOLCENGINE_ENDPOINT_ID`：后端 AI 端点 ID
- `PROD_VOLCENGINE_MODEL`：后端 AI 模型（可选，建议 `Doubao-1.5-pro-256k`）

工作流执行逻辑：

```bash
cd /home/ubuntu/HZNU-Education-Technology-2026-Graduation-Project
bash deploy.sh
```

说明：

- `server/.env` 在仓库中被忽略，不会随 `git push` 同步。
- 现在 `deploy.sh` 会在运行时读取 Actions 注入的 `VOLCENGINE_*`，自动写入/更新服务器 `server/.env`，再重启后端。
- 如果服务器未配置 pm2/systemd，`deploy.sh` 会自动使用 nohup 启动 `server/index.js`，避免“代码更新但后端仍是旧进程”。

---

## 10. 密钥泄漏防护（CI）

仓库新增工作流：`.github/workflows/secret-guard.yml`。

- 触发：`push` / `pull_request`
- 检查项：
  - 私钥片段（如 `BEGIN OPENSSH PRIVATE KEY`）
  - 非模板文件中的 `VOLCENGINE_API_KEY` / `VITE_VOLCENGINE_API_KEY` 赋值
- 脚本：`scripts/security/guard-secrets.sh`
