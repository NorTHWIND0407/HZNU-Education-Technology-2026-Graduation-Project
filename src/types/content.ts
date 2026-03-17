export type Entry = {
  id: string
  title: string
  desc: string
  media?: string
  ts?: string
  keywords?: string[]
}

export type Lesson = {
  id: string
  title: string
  thumb: string
  clip: string
  beats: number
  steps: string[]
  summary?: string
  durationHint?: string
}

export type HandbookQuiz = {
  q: string
  a: string[]
  correct: number
}

export type Chapter = {
  id: string
  title: string
  svg?: string
  audio?: string
  quiz?: HandbookQuiz[]
}

export type ResourceFile = {
  id: string
  label: string
  type: string
  format?: string
  previewUrl?: string
  downloadUrl: string
}

export type CourseResource = {
  id: string
  subject: string
  subjectEn?: string
  title: string
  grade?: string
  summary?: string
  keywords?: string[]
  files: ResourceFile[]
}

export type VideoSource = {
  label: string
  src: string
}

export type MicrodocClip = {
  id: string
  title: string
  poster?: string
  sources?: VideoSource[]
  iframeSrc?: string
  iframeTitle?: string
}
