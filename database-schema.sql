-- ============================================
-- 临平滚灯反馈系统数据库设计
-- Database Schema for Linping Rolling Lantern Feedback System
-- ============================================

-- 用户表 (Users)
-- 存储学生和教师的基本信息
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,         -- 用户名（学号或工号）
  display_name VARCHAR(100) NOT NULL,           -- 显示名称
  role VARCHAR(20) NOT NULL CHECK(role IN ('student', 'teacher', 'admin')), -- 角色
  grade VARCHAR(50),                            -- 年级（学生）或任教科目（教师）
  class_id VARCHAR(50),                         -- 班级ID
  school_id VARCHAR(50),                        -- 学校ID
  avatar_url VARCHAR(255),                      -- 头像URL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active BOOLEAN DEFAULT 1,                  -- 是否激活
  metadata TEXT                                 -- JSON格式的额外信息
);

-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_class ON users(class_id);

-- ============================================
-- 会话表 (Sessions) - 用于简单的session管理
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,   -- Session令牌
  expires_at DATETIME NOT NULL,                 -- 过期时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),                       -- IP地址
  user_agent TEXT,                              -- 浏览器信息
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- ============================================
-- 反馈表 (Feedbacks)
-- 存储学生和教师提交的反馈
CREATE TABLE feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                     -- 提交用户ID
  role VARCHAR(20) NOT NULL,                    -- 提交者角色（冗余字段，便于查询）
  feedback_type VARCHAR(50) NOT NULL,           -- 反馈类型：lesson, module, general, bug

  -- 基本信息
  class_id VARCHAR(50),                         -- 班级ID
  grade VARCHAR(50),                            -- 年级

  -- 模块使用情况
  modules_used TEXT,                            -- JSON数组：使用的模块列表
  lesson_id VARCHAR(50),                        -- 关联的课程ID

  -- 自我评估（学生）
  understanding_score INTEGER CHECK(understanding_score BETWEEN 1 AND 5), -- 理解度 1-5
  interest_score INTEGER CHECK(interest_score BETWEEN 1 AND 5),           -- 兴趣度 1-5
  difficulty_score INTEGER CHECK(difficulty_score BETWEEN 1 AND 5),       -- 难度 1-5
  difficulty_aspects TEXT,                      -- JSON数组：觉得困难的方面

  -- 教师评估
  teaching_effectiveness INTEGER CHECK(teaching_effectiveness BETWEEN 1 AND 5), -- 教学效果
  student_engagement INTEGER CHECK(student_engagement BETWEEN 1 AND 5),         -- 学生参与度
  technical_issues TEXT,                        -- 技术问题描述

  -- 开放性反馈
  open_comment TEXT,                            -- 开放性意见
  suggestions TEXT,                             -- 改进建议

  -- 额外数据
  rating INTEGER CHECK(rating BETWEEN 1 AND 5), -- 总体评分
  tags TEXT,                                    -- JSON数组：标签
  attachments TEXT,                             -- JSON数组：附件URL

  -- 管理字段
  status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'resolved', 'archived')),
  reviewed_by INTEGER,                          -- 审阅人
  reviewed_at DATETIME,                         -- 审阅时间
  admin_notes TEXT,                             -- 管理员备注

  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 创建索引
CREATE INDEX idx_feedbacks_user ON feedbacks(user_id);
CREATE INDEX idx_feedbacks_type ON feedbacks(feedback_type);
CREATE INDEX idx_feedbacks_status ON feedbacks(status);
CREATE INDEX idx_feedbacks_created ON feedbacks(created_at);
CREATE INDEX idx_feedbacks_class ON feedbacks(class_id);

-- ============================================
-- 学习进度表 (Learning Progress)
-- 追踪学生的学习进度
CREATE TABLE learning_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  module_name VARCHAR(50) NOT NULL,             -- 模块名称
  lesson_id VARCHAR(50),                        -- 课程ID

  -- 进度数据
  completed BOOLEAN DEFAULT 0,                  -- 是否完成
  completion_rate INTEGER DEFAULT 0,            -- 完成率 0-100
  time_spent INTEGER DEFAULT 0,                 -- 花费时间（秒）
  attempts INTEGER DEFAULT 0,                   -- 尝试次数

  -- 分数
  score INTEGER,                                -- 得分
  max_score INTEGER,                            -- 满分

  -- 时间戳
  started_at DATETIME,
  completed_at DATETIME,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, module_name, lesson_id)
);

CREATE INDEX idx_progress_user ON learning_progress(user_id);
CREATE INDEX idx_progress_module ON learning_progress(module_name);

-- ============================================
-- 互动记录表 (Interactions)
-- 记录用户与系统的互动行为
CREATE TABLE interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL,             -- 操作类型：view, click, submit, search, etc.
  module_name VARCHAR(50),                      -- 模块名称
  target_id VARCHAR(100),                       -- 目标ID（课程、问题等）
  target_type VARCHAR(50),                      -- 目标类型

  -- 操作数据
  action_data TEXT,                             -- JSON格式的操作数据
  duration INTEGER,                             -- 持续时间（秒）

  -- 元数据
  session_id VARCHAR(255),                      -- 会话ID
  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_interactions_user ON interactions(user_id);
CREATE INDEX idx_interactions_type ON interactions(action_type);
CREATE INDEX idx_interactions_created ON interactions(created_at);

-- ============================================
-- AI问答记录表 (AI Q&A History)
-- 存储AI问答的历史记录
CREATE TABLE ai_qa_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  question TEXT NOT NULL,                       -- 用户问题
  answer TEXT,                                  -- AI回答

  -- 上下文
  context_docs TEXT,                            -- JSON数组：相关文档
  module_context VARCHAR(50),                   -- 模块上下文

  -- 评价
  helpful_rating INTEGER CHECK(helpful_rating BETWEEN 1 AND 5), -- 有用性评分
  user_feedback TEXT,                           -- 用户反馈

  -- 技术指标
  response_time INTEGER,                        -- 响应时间（毫秒）
  tokens_used INTEGER,                          -- 使用的token数
  model_version VARCHAR(50),                    -- 模型版本

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_qa_user ON ai_qa_history(user_id);
CREATE INDEX idx_ai_qa_created ON ai_qa_history(created_at);

-- ============================================
-- 微纪录片评论/点赞表 (Microdoc Comments & Likes)
-- 存储微纪录片页面评论区内容与点赞计数
CREATE TABLE microdoc_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clip_id VARCHAR(80) NOT NULL,                -- 微纪录片视频ID（如 clip-01）
  user_id INTEGER,                             -- 登录用户ID（匿名可为空）
  username VARCHAR(80),                        -- 冗余用户名
  display_name VARCHAR(120) NOT NULL,          -- 显示名称（用户名或游客名）
  content TEXT NOT NULL,                       -- 评论内容
  visitor_id VARCHAR(80),                      -- 匿名访客ID
  is_deleted BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_microdoc_comments_clip ON microdoc_comments(clip_id);
CREATE INDEX idx_microdoc_comments_created ON microdoc_comments(created_at);

CREATE TABLE microdoc_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clip_id VARCHAR(80) NOT NULL,                -- 微纪录片视频ID
  actor_key VARCHAR(120) NOT NULL,             -- 点赞主体唯一键（user:1 / visitor:xxx）
  user_id INTEGER,                             -- 登录用户ID（匿名可为空）
  visitor_id VARCHAR(80),                      -- 匿名访客ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(clip_id, actor_key)
);

CREATE INDEX idx_microdoc_likes_clip ON microdoc_likes(clip_id);

-- ============================================
-- 课程资源表 (Course Resources)
-- 存储学科资源项目与上传文件元数据
CREATE TABLE course_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_key VARCHAR(120) UNIQUE,            -- 系统内置资源键
  subject VARCHAR(30) NOT NULL,                -- 学科：语文/数学/英语/科学/信息科技/美术/音乐
  subject_en VARCHAR(80),
  title VARCHAR(255) NOT NULL,
  grade VARCHAR(60),
  summary TEXT,
  keywords TEXT,                               -- JSON数组
  is_system BOOLEAN DEFAULT 0,                 -- 是否平台内置资源
  status VARCHAR(20) DEFAULT 'published' CHECK(status IN ('draft', 'pending', 'published', 'rejected')),
  created_by INTEGER,                          -- 上传人
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_course_resources_subject ON course_resources(subject);
CREATE INDEX idx_course_resources_status ON course_resources(status);

CREATE TABLE resource_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id INTEGER NOT NULL,
  label VARCHAR(255) NOT NULL,
  type VARCHAR(60) NOT NULL,                   -- 教案/课件/活动单/任务书等
  format VARCHAR(30),                          -- pdf/docx/txt...
  preview_url TEXT,                            -- 在线预览链接
  download_url TEXT,                           -- 下载链接
  storage_path TEXT,                           -- 服务器存储路径（上传文件）
  original_name VARCHAR(255),
  mime_type VARCHAR(120),
  file_size INTEGER,
  uploaded_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resource_id) REFERENCES course_resources(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_resource_files_resource ON resource_files(resource_id);

-- ============================================
-- 统计聚合视图 (Aggregated Statistics Views)
-- 用于快速查询统计数据

-- 模块使用统计
CREATE VIEW v_module_usage_stats AS
SELECT
  module_name,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_visits,
  AVG(completion_rate) as avg_completion,
  SUM(time_spent) as total_time_spent
FROM learning_progress
GROUP BY module_name;

-- 用户活跃度统计
CREATE VIEW v_user_activity_stats AS
SELECT
  u.id as user_id,
  u.username,
  u.role,
  u.class_id,
  COUNT(DISTINCT lp.module_name) as modules_accessed,
  COUNT(f.id) as feedbacks_submitted,
  COUNT(i.id) as total_interactions,
  MAX(i.created_at) as last_activity
FROM users u
LEFT JOIN learning_progress lp ON u.id = lp.user_id
LEFT JOIN feedbacks f ON u.id = f.user_id
LEFT JOIN interactions i ON u.id = i.user_id
GROUP BY u.id;

-- 班级表现统计
CREATE VIEW v_class_performance AS
SELECT
  class_id,
  grade,
  COUNT(DISTINCT user_id) as student_count,
  AVG(understanding_score) as avg_understanding,
  AVG(interest_score) as avg_interest,
  AVG(rating) as avg_rating,
  COUNT(*) as total_feedbacks
FROM feedbacks
WHERE role = 'student' AND class_id IS NOT NULL
GROUP BY class_id, grade;

-- ============================================
-- 触发器 (Triggers)

-- 自动更新 updated_at 字段
CREATE TRIGGER update_feedbacks_timestamp
AFTER UPDATE ON feedbacks
BEGIN
  UPDATE feedbacks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_microdoc_comments_timestamp
AFTER UPDATE ON microdoc_comments
BEGIN
  UPDATE microdoc_comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================
-- 初始化数据 (Sample Data)

-- 插入管理员账户
INSERT INTO users (username, display_name, role, grade, class_id) VALUES
('admin', '系统管理员', 'admin', NULL, NULL),
('t301', 't301', 'teacher', '3年级', 'class_301'),
('s30101', 's30101', 'student', '3年级', 'class_301'),
('s30102', 's30102', 'student', '3年级', 'class_301');

-- 插入示例反馈数据
INSERT INTO feedbacks (
  user_id, role, feedback_type, class_id, grade, modules_used,
  understanding_score, interest_score, difficulty_score,
  open_comment, rating, status, created_at
) VALUES
(3, 'student', 'lesson', 'class_301', '3年级', '["lessons", "microdoc"]',
 4, 5, 3, '我觉得滚灯很有趣，但是有些动作比较难学', 4, 'pending', datetime('now', '-2 days')),
(4, 'student', 'lesson', 'class_301', '3年级', '["lessons", "webar"]',
 3, 4, 4, '希望能有更多的视频教学', 4, 'pending', datetime('now', '-1 day'));

-- ============================================
-- 常用查询示例 (Common Queries)

-- 1. 获取某个班级的最新反馈
-- SELECT * FROM feedbacks
-- WHERE class_id = 'class_301'
-- ORDER BY created_at DESC LIMIT 10;

-- 2. 统计各模块的平均评分
-- SELECT
--   json_extract(value, '$') as module,
--   AVG(rating) as avg_rating,
--   COUNT(*) as feedback_count
-- FROM feedbacks, json_each(feedbacks.modules_used)
-- GROUP BY module;

-- 3. 获取学生学习进度概览
-- SELECT
--   u.display_name,
--   lp.module_name,
--   lp.completion_rate,
--   lp.score,
--   lp.last_accessed
-- FROM users u
-- JOIN learning_progress lp ON u.id = lp.user_id
-- WHERE u.role = 'student'
-- ORDER BY lp.last_accessed DESC;

-- 4. 实时统计图表数据
-- 按时间统计反馈数量（用于折线图）
-- SELECT
--   DATE(created_at) as date,
--   COUNT(*) as count,
--   AVG(rating) as avg_rating
-- FROM feedbacks
-- WHERE created_at >= datetime('now', '-30 days')
-- GROUP BY DATE(created_at)
-- ORDER BY date;

-- 5. 兴趣度分布（用于饼图）
-- SELECT
--   interest_score as score,
--   COUNT(*) as count
-- FROM feedbacks
-- WHERE interest_score IS NOT NULL
-- GROUP BY interest_score;
