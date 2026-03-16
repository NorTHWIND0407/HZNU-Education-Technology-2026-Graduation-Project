import express from 'express'
import { nanoid } from 'nanoid'
import { existsSync, mkdirSync, writeFileSync, createReadStream, statSync } from 'fs'
import { dirname, extname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { ResourceDB, SessionDB } from '../db/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const serverRoot = join(__dirname, '..')
const uploadRoot = resolve(serverRoot, './data/uploads/resources')
const MAX_UPLOAD_SIZE = 20 * 1024 * 1024
const INFO_TECH_SUBJECT = '信息科技'

const SUBJECT_EN = {
  语文: 'Chinese Language',
  数学: 'Mathematics',
  英语: 'English',
  科学: 'Science',
  信息科技: 'Information Technology',
  美术: 'Art',
  音乐: 'Music'
}

const router = express.Router()

function ensureUploadDir() {
  if (!existsSync(uploadRoot)) {
    mkdirSync(uploadRoot, { recursive: true })
  }
}

function normalizeUrlForResponse(url, apiBase) {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/api/')) return `${apiBase}${url}`
  return url
}

function normalizeResourceOutput(item, apiBase) {
  return {
    ...item,
    files: (item.files || []).map(file => ({
      ...file,
      previewUrl: normalizeUrlForResponse(file.previewUrl, apiBase),
      downloadUrl: normalizeUrlForResponse(file.downloadUrl, apiBase)
    }))
  }
}

function parseKeywords(input) {
  if (!input) return []
  if (Array.isArray(input)) {
    return input.map(k => String(k).trim()).filter(Boolean)
  }
  return String(input)
    .split(/[,，\s]+/)
    .map(k => k.trim())
    .filter(Boolean)
}

function extensionFromMime(mimeType = '') {
  const map = {
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'text/markdown': 'md',
    'application/zip': 'zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/vnd.ms-powerpoint': 'ppt',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp'
  }
  return map[mimeType] || ''
}

function decodeBase64ToBuffer(payload) {
  if (!payload || typeof payload !== 'string') {
    throw new Error('文件内容为空')
  }
  const raw = payload.includes(',') ? payload.split(',').pop() : payload
  return Buffer.from(raw || '', 'base64')
}

function isPreviewable(format = '', mimeType = '') {
  const fmt = String(format).toLowerCase()
  const mime = String(mimeType).toLowerCase()
  if (['pdf', 'txt', 'md', 'html', 'htm', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(fmt)) return true
  return mime.startsWith('text/') || mime.startsWith('image/') || mime.includes('pdf')
}

function authOptional(req, _res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    req.user = null
    return next()
  }
  const session = SessionDB.findValid(token)
  if (!session) {
    req.user = null
    return next()
  }
  req.user = {
    id: session.user_id,
    username: session.username,
    role: session.role,
    classId: session.class_id
  }
  next()
}

function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: '需要登录后上传' })
  }
  const session = SessionDB.findValid(token)
  if (!session) {
    return res.status(401).json({ error: 'Invalid session', message: '会话已过期，请重新登录' })
  }
  req.user = {
    id: session.user_id,
    username: session.username,
    role: session.role,
    classId: session.class_id
  }
  next()
}

function teacherRequired(req, res, next) {
  if (!req.user || !['teacher', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden', message: '仅教师或管理员可上传资源' })
  }
  next()
}

function currentApiBase(req) {
  const forwardedProto = req.headers['x-forwarded-proto']
  const protocol = forwardedProto ? String(forwardedProto).split(',')[0] : req.protocol
  return `${protocol}://${req.get('host')}`
}

router.get('/', authOptional, (req, res) => {
  try {
    const { subject } = req.query
    const filters = { status: 'published' }

    if (subject) {
      if (!ResourceDB.isValidSubject(subject)) {
        return res.status(400).json({ error: 'Invalid subject', message: '学科参数不合法' })
      }
      filters.subject = subject
    }

    const apiBase = currentApiBase(req)
    const items = ResourceDB.list(filters).map(item => normalizeResourceOutput(item, apiBase))

    res.json({
      success: true,
      subjects: ResourceDB.subjectCatalog(),
      items
    })
  } catch (err) {
    console.error('[Resources] List error:', err)
    res.status(500).json({ error: 'Failed to fetch resources', message: '获取课程资源失败' })
  }
})

router.post('/upload', authRequired, teacherRequired, (req, res) => {
  try {
    const {
      subject,
      title,
      grade,
      summary,
      keywords,
      fileBase64,
      fileName,
      mimeType,
      fileLabel,
      fileType
    } = req.body || {}

    if (!subject || !ResourceDB.isValidSubject(subject)) {
      return res.status(400).json({ error: 'Invalid subject', message: '请在有效学科中上传' })
    }
    if (subject === INFO_TECH_SUBJECT) {
      return res.status(400).json({ error: 'Invalid subject', message: '信息科技学科为平台内置示例，请上传到其他学科' })
    }
    if (!title || String(title).trim().length < 2) {
      return res.status(400).json({ error: 'Invalid title', message: '标题至少2个字符' })
    }
    if (!fileBase64 || !fileName) {
      return res.status(400).json({ error: 'Invalid file', message: '请上传教案文件' })
    }

    const fileBuffer = decodeBase64ToBuffer(fileBase64)
    if (!fileBuffer.length) {
      return res.status(400).json({ error: 'Invalid file', message: '文件内容为空' })
    }
    if (fileBuffer.length > MAX_UPLOAD_SIZE) {
      return res.status(400).json({ error: 'File too large', message: '文件大小不能超过20MB' })
    }

    const rawExt = extname(String(fileName)).replace('.', '').toLowerCase()
    const format = rawExt || extensionFromMime(mimeType) || 'bin'
    const storedName = `${Date.now()}-${nanoid(10)}.${format}`
    const storedPath = resolve(uploadRoot, storedName)
    ensureUploadDir()
    writeFileSync(storedPath, fileBuffer)

    const resourceId = ResourceDB.createProject({
      subject,
      subject_en: SUBJECT_EN[subject] || null,
      title: String(title).trim(),
      grade: grade ? String(grade).trim() : null,
      summary: summary ? String(summary).trim() : null,
      keywords: parseKeywords(keywords),
      is_system: 0,
      status: 'published',
      created_by: req.user.id
    })

    const insertedFile = ResourceDB.addFile(resourceId, {
      label: fileLabel ? String(fileLabel).trim() : String(fileName),
      type: fileType ? String(fileType).trim() : '教案',
      format,
      preview_url: null,
      download_url: null,
      storage_path: storedPath,
      original_name: String(fileName),
      mime_type: mimeType ? String(mimeType) : null,
      file_size: fileBuffer.length,
      uploaded_by: req.user.id
    })

    const fileDbId = insertedFile.lastInsertRowid
    const previewPath = isPreviewable(format, mimeType) ? `/api/resources/files/${fileDbId}/view` : null
    const downloadPath = `/api/resources/files/${fileDbId}/download`
    ResourceDB.updateFileLinks(fileDbId, previewPath, downloadPath)

    const apiBase = currentApiBase(req)
    const created = ResourceDB.findById(resourceId)

    res.json({
      success: true,
      message: '教案上传成功',
      item: created ? normalizeResourceOutput(created, apiBase) : null
    })
  } catch (err) {
    console.error('[Resources] Upload error:', err)
    res.status(500).json({ error: 'Upload failed', message: '上传失败，请稍后重试' })
  }
})

router.get('/files/:fileId/view', (req, res) => {
  try {
    const fileId = Number(req.params.fileId)
    const file = ResourceDB.findFileById(fileId)
    if (!file || file.resource_status !== 'published') {
      return res.status(404).json({ error: 'Not found', message: '文件不存在' })
    }
    if (!file.storage_path || !existsSync(file.storage_path)) {
      return res.status(404).json({ error: 'Not found', message: '文件已丢失，请重新上传' })
    }

    const stat = statSync(file.storage_path)
    const mime = file.mime_type || 'application/octet-stream'
    const filename = encodeURIComponent(file.original_name || `resource-${fileId}`)

    res.removeHeader('X-Frame-Options')
    res.setHeader('Content-Type', mime)
    res.setHeader('Content-Length', stat.size)
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${filename}`)

    createReadStream(file.storage_path).pipe(res)
  } catch (err) {
    console.error('[Resources] View file error:', err)
    res.status(500).json({ error: 'Failed to open file', message: '在线预览失败' })
  }
})

router.get('/files/:fileId/download', (req, res) => {
  try {
    const fileId = Number(req.params.fileId)
    const file = ResourceDB.findFileById(fileId)
    if (!file || file.resource_status !== 'published') {
      return res.status(404).json({ error: 'Not found', message: '文件不存在' })
    }
    if (!file.storage_path || !existsSync(file.storage_path)) {
      return res.status(404).json({ error: 'Not found', message: '文件已丢失，请重新上传' })
    }

    const filename = file.original_name || `resource-${fileId}`
    res.download(file.storage_path, filename)
  } catch (err) {
    console.error('[Resources] Download file error:', err)
    res.status(500).json({ error: 'Failed to download file', message: '下载失败' })
  }
})

export default router
