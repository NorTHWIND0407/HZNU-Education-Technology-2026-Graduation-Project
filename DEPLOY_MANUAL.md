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
cd ..
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
3. 服务器重新安装依赖（如有变更）并 `pnpm build`  
4. `pm2 restart lantern-api --update-env`  
5. `sudo systemctl reload nginx`  

