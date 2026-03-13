import React from 'react'
import VideoPlayer from '../components/VideoPlayer'
import type { VideoSource } from '../types/content'

type LearningModule = 'module1' | 'module2' | 'module3' | 'module4'
type Stage = 'video' | 'timeline' | 'lantern'
type Module2Page = 'appearance' | 'principle'
type Module3Page = 'basic' | 'decompose' | 'technique' | 'practice'
type Module4Page = 'why' | 'how'

type TimelineItem = {
  id: string
  period: string
  title: string
  summary: string
  points: string[]
}

type LanternFact = {
  id: string
  keyword: string
  title: string
  detail: string
}

type StructurePart = {
  id: string
  keyword: string
  title: string
  summary: string
  detail: string
  points: string[]
  hotSpot: { x: number; y: number }
}

type PrincipleItem = {
  id: string
  keyword: string
  title: string
  summary: string
  points: string[]
}

type ActionStep = {
  title: string
  detail: string
}

type ActionItem = {
  id: string
  keyword: string
  title: string
  gif: string
  summary: string
  points: string[]
  steps: ActionStep[]
}

type TechniqueItem = {
  id: string
  keyword: string
  title: string
  summary: string
  checkpoints: string[]
}

type Module4QuizItem = {
  id: string
  q: string
  options: string[]
  correct: number
  explain: string
}

type Module4QAItem = {
  id: string
  q: string
  a: string
}

const learningModules: { id: LearningModule; title: string; subtitle: string }[] = [
  { id: 'module1', title: '模块一：认识临平滚灯', subtitle: '文化导入' },
  { id: 'module2', title: '模块二：滚灯的奥秘', subtitle: '结构与原理' },
  { id: 'module3', title: '模块三：滚灯动作课堂', subtitle: '核心教学' },
  { id: 'module4', title: '模块四：我是非遗小传承人', subtitle: '价值升华' }
]

const stages: { id: Stage; title: string; subtitle: string }[] = [
  { id: 'video', title: '开场视频', subtitle: '文化导入' },
  { id: 'timeline', title: '滚动时间轴', subtitle: '起源与发展' },
  { id: 'lantern', title: '点击灯笼', subtitle: '知识点互动' }
]

const handbookKeywords = [
  '临平滚灯',
  '余杭滚灯',
  '滚灯简介',
  '滚灯历史',
  '滚灯起源',
  '滚灯发展',
  '滚灯民俗文化',
  '滚灯灯会',
  '滚灯节庆文化',
  '滚灯文化意义',
  '滚灯非遗价值',
  '滚灯国家级非遗'
]

const introVideoSources: VideoSource[] = [
  { label: '1080p', src: '/videos/placeholder_1080p.mp4' },
  { label: '720p', src: '/videos/placeholder_720p.mp4' },
  { label: '480p', src: '/videos/placeholder_480p.mp4' }
]

const timelineItems: TimelineItem[] = [
  {
    id: 'origin',
    period: '民间源流',
    title: '滚灯起源与早期形态',
    summary: '滚灯起源于江南灯彩与民间灯舞传统，在节庆巡游和乡里庆典中形成“灯随人走、灯随鼓动”的表演样式。',
    points: ['关键词：滚灯起源', '关键词：滚灯简介', '关键词：滚灯历史']
  },
  {
    id: 'regional',
    period: '地域成形',
    title: '临平滚灯与余杭滚灯',
    summary: '在余杭地区长期传播后，临平滚灯形成更清晰的地方风格，动作、鼓点和队形都体现出本地审美与生活节律。',
    points: ['关键词：临平滚灯', '关键词：余杭滚灯', '地域文化持续塑造表演风格']
  },
  {
    id: 'festival',
    period: '节庆实践',
    title: '灯会场景与民俗表达',
    summary: '滚灯常见于元宵灯会、春节巡演和社区庆典，既有观赏性，也承载祈福、联谊和乡土记忆。',
    points: ['关键词：滚灯灯会', '关键词：滚灯节庆文化', '关键词：滚灯民俗文化']
  },
  {
    id: 'development',
    period: '当代发展',
    title: '教学化与活态传承',
    summary: '通过社团、校园课程与展演活动，滚灯发展从“节庆表演”延伸为“教学资源”，让学生可学、可练、可展示。',
    points: ['关键词：滚灯发展', '关键词：滚灯文化意义', '形成课堂与社区联动']
  },
  {
    id: 'heritage',
    period: '保护提升',
    title: '非遗价值与系统保护',
    summary: '滚灯作为非遗项目被持续整理和传播，强调工艺、动作、礼俗与地方记忆的整体保护，体现传统文化的当代价值。',
    points: ['关键词：滚灯非遗价值', '关键词：滚灯国家级非遗', '建立“传承人+教育+展示”机制']
  }
]

const lanternFacts: LanternFact[] = [
  {
    id: 'fact-01',
    keyword: '临平滚灯',
    title: '地方名片',
    detail: '临平滚灯是临平地区辨识度很高的民间灯舞形式，兼具表演性、参与性和社区凝聚力。'
  },
  {
    id: 'fact-02',
    keyword: '余杭滚灯',
    title: '区域谱系',
    detail: '临平滚灯可放在“余杭滚灯”这一更大的区域文化脉络中理解，便于学生建立文化地图。'
  },
  {
    id: 'fact-03',
    keyword: '滚灯简介',
    title: '一眼认识',
    detail: '滚灯以灯体滚动、翻转、抛接和队形变换为主要看点，常与锣鼓节奏配合呈现。'
  },
  {
    id: 'fact-04',
    keyword: '滚灯历史',
    title: '历史脉络',
    detail: '从乡村节庆到城市展演，滚灯历史体现了民间艺术在社会环境变化中的自我调适。'
  },
  {
    id: 'fact-05',
    keyword: '滚灯起源',
    title: '源于民间',
    detail: '滚灯起源与民间灯彩、社火活动、祈福仪式关系密切，属于生活中自然生长的艺术。'
  },
  {
    id: 'fact-06',
    keyword: '滚灯发展',
    title: '不断更新',
    detail: '滚灯发展不仅体现在动作创新，也体现在进校园、进课程、进数字媒体等传播方式上。'
  },
  {
    id: 'fact-07',
    keyword: '滚灯民俗文化',
    title: '礼俗载体',
    detail: '滚灯民俗文化连接“人、节日、社区”，让学生看到传统文化与日常生活的关系。'
  },
  {
    id: 'fact-08',
    keyword: '滚灯灯会',
    title: '节日舞台',
    detail: '在滚灯灯会中，观众不仅观看表演，也会参与互动，形成“共同庆祝”的公共文化空间。'
  },
  {
    id: 'fact-09',
    keyword: '滚灯节庆文化',
    title: '节庆表达',
    detail: '滚灯节庆文化通过热闹的仪式感，强化“辞旧迎新、祈福纳吉”的集体情绪与身份认同。'
  },
  {
    id: 'fact-10',
    keyword: '滚灯文化意义',
    title: '意义层次',
    detail: '滚灯文化意义包含审美教育、地方认同、代际沟通与传统价值观的传递。'
  },
  {
    id: 'fact-11',
    keyword: '滚灯非遗价值',
    title: '活态保护',
    detail: '滚灯非遗价值在于“活态传承”：既保护传统技艺，也支持它在当代教学场景中继续使用。'
  },
  {
    id: 'fact-12',
    keyword: '滚灯国家级非遗',
    title: '保护级别',
    detail: '“滚灯国家级非遗”关键词可引导学生理解：非遗保护不仅是“保存”，更是有组织的传承与传播。'
  }
]

const module2Keywords = [
  '滚灯结构',
  '滚灯组成',
  '滚灯灯架',
  '滚灯灯面',
  '滚灯灯芯',
  '滚灯制作材料',
  '滚灯制作工艺',
  '滚灯内部结构',
  '滚灯滚动原理',
  '滚灯平衡原理',
  '滚灯重心设计',
  '滚灯防火结构'
]

const module2Pages: { id: Module2Page; title: string; subtitle: string }[] = [
  { id: 'appearance', title: '第1页：滚灯长什么样', subtitle: '点击式结构图' },
  { id: 'principle', title: '第2页：滚灯为什么能滚', subtitle: '原理互动' }
]

const structureParts: StructurePart[] = [
  {
    id: 'frame',
    keyword: '滚灯灯架',
    title: '灯架：滚灯结构的骨架',
    summary: '灯架决定了滚灯整体形态与承重能力，是滚灯组成中的核心支撑。',
    detail: '传统灯架常用竹篾编制，讲究“轻、韧、稳”。这种结构既能承受滚动时的冲击，也方便表演中的提、转、抛动作。',
    points: ['关键词：滚灯结构', '关键词：滚灯组成', '关键词：滚灯制作材料'],
    hotSpot: { x: 50, y: 33 }
  },
  {
    id: 'surface',
    keyword: '滚灯灯面',
    title: '灯面：图案与保护层',
    summary: '灯面是观众最直观看到的部分，承担装饰与外层缓冲作用。',
    detail: '灯面可使用纸、纱、绸等材料，通过贴糊与绘纹样体现地方审美。灯面与灯架结合后，可形成更稳定的外壳层。',
    points: ['关键词：滚灯灯面', '关键词：滚灯制作工艺', '关键词：滚灯民俗文化'],
    hotSpot: { x: 72, y: 49 }
  },
  {
    id: 'wick',
    keyword: '滚灯灯芯',
    title: '灯芯：光源与视觉焦点',
    summary: '灯芯为滚灯提供光效，是夜间表演中强化“灯动”效果的关键。',
    detail: '现代教学场景常采用更安全的电光源，既保留视觉效果，也更符合课堂与活动中的安全规范。',
    points: ['关键词：滚灯灯芯', '关键词：滚灯防火结构', '关键词：滚灯内部结构'],
    hotSpot: { x: 50, y: 51 }
  },
  {
    id: 'inner',
    keyword: '滚灯内部结构',
    title: '内部结构：层级组合',
    summary: '滚灯内部结构常由骨架、固定点、光源与连接件组成。',
    detail: '内部结构决定滚动过程中的受力传导路径。布局合理时，旋转更顺、晃动更小，学生更容易理解“结构决定运动表现”。',
    points: ['关键词：滚灯内部结构', '关键词：滚灯滚动原理', '关键词：滚灯平衡原理'],
    hotSpot: { x: 28, y: 52 }
  },
  {
    id: 'materials',
    keyword: '滚灯制作材料',
    title: '制作材料：轻量且耐用',
    summary: '常见材料包括竹篾、木条、纸绸、线绳和安全光源组件。',
    detail: '选材通常遵循“轻便、抗冲击、易修复”的原则，既方便表演又降低维护成本，适合课堂手工制作与展示。',
    points: ['关键词：滚灯制作材料', '关键词：滚灯制作工艺', '关键词：滚灯组成'],
    hotSpot: { x: 36, y: 72 }
  },
  {
    id: 'fire',
    keyword: '滚灯防火结构',
    title: '防火结构：安全优先',
    summary: '防火结构是滚灯在当代教学和展演中不可忽视的设计部分。',
    detail: '通过隔热层、阻燃材料和电光源替代明火，可显著降低风险。课堂讲解时可结合“安全改造”展示传统工艺的当代转化。',
    points: ['关键词：滚灯防火结构', '关键词：滚灯灯芯', '关键词：滚灯非遗价值'],
    hotSpot: { x: 61, y: 73 }
  }
]

const principleItems: PrincipleItem[] = [
  {
    id: 'roll',
    keyword: '滚灯滚动原理',
    title: '圆弧接触 + 连续受力',
    summary: '滚灯与地面接触点持续变化，在推力和惯性共同作用下前进。',
    points: ['接触面越顺滑，滚动越连续', '灯体越轻，启动更容易，但要兼顾稳定性', '动作节奏与滚动速度密切相关']
  },
  {
    id: 'balance',
    keyword: '滚灯平衡原理',
    title: '力矩平衡 + 动态纠偏',
    summary: '表演者通过手部微调和身体重心变化，让灯体在运动中保持平衡。',
    points: ['左右摆幅越小，轨迹越稳定', '旋转时平衡依赖快速纠偏', '多人配合时需要统一节奏与方向']
  },
  {
    id: 'center',
    keyword: '滚灯重心设计',
    title: '重心尽量靠近几何中心',
    summary: '重心设计决定了滚灯抗倾倒能力，是“为什么能滚稳”的核心因素。',
    points: ['重心偏移过大时更容易抖动或倾倒', '内部配重可以用于修正重心', '课堂可用滑块模拟重心变化']
  },
  {
    id: 'craft',
    keyword: '滚灯制作工艺',
    title: '工艺影响运动表现',
    summary: '从编架、贴面到固定光源，每一步制作工艺都直接影响滚动效果。',
    points: ['骨架圆整度影响滚动流畅度', '连接件牢固度影响耐久性', '外层材料厚度影响重量分布']
  }
]

const module3Keywords = [
  '滚灯动作',
  '滚灯基础动作',
  '滚灯动作体系',
  '滚灯动作分解',
  '滚灯动作步骤',
  '滚灯技术要领',
  '滚灯动作控制',
  '滚灯身体协调',
  '滚灯步伐配合'
]

const module3Pages: { id: Module3Page; title: string; subtitle: string }[] = [
  { id: 'basic', title: '第1页：基础动作', subtitle: '动作GIF' },
  { id: 'decompose', title: '第2页：动作分解', subtitle: '点击步骤' },
  { id: 'technique', title: '第3页：技术要领', subtitle: '控制与协调' },
  { id: 'practice', title: '第4页：动作练习', subtitle: '动作小游戏' }
]

const actionItems: ActionItem[] = [
  {
    id: 'ground-roll',
    keyword: '地面滚灯',
    title: '地面滚灯（基础入门）',
    gif: '/images/handbook/handbook-action-ground-roll-01.png',
    summary: '强调“灯随步走”，通过稳定推滚建立滚灯动作的基本节奏。',
    points: ['关键词：滚灯基础动作', '关键词：滚灯动作控制', '关键词：滚灯步伐配合'],
    steps: [
      { title: '步骤1：预备站姿', detail: '双脚与肩同宽，膝关节微屈，手臂自然放松。' },
      { title: '步骤2：低位推灯', detail: '手臂前送配合前脚迈步，控制灯体贴地滚动。' },
      { title: '步骤3：步伐跟进', detail: '每一步都与灯体移动同步，避免追灯或踩灯节奏。' },
      { title: '步骤4：收势稳灯', detail: '减速时下沉重心，控制灯体平稳停在身前。' }
    ]
  },
  {
    id: 'hand-spin',
    keyword: '手持旋灯',
    title: '手持旋灯（上肢控制）',
    gif: '/images/handbook/handbook-action-hand-spin-01.png',
    summary: '通过腕部与前臂协同发力，让滚灯在手持状态保持旋转稳定。',
    points: ['关键词：滚灯动作体系', '关键词：滚灯技术要领', '关键词：滚灯动作控制'],
    steps: [
      { title: '步骤1：握持定位', detail: '保持手腕中立，灯杆握点稳定在手掌中段。' },
      { title: '步骤2：腕部起旋', detail: '以小幅度、连续腕力带动灯体起旋。' },
      { title: '步骤3：肩肘配合', detail: '肩肘跟随旋转方向，减少抖动和偏摆。' },
      { title: '步骤4：换向回正', detail: '在转向前先降速，再反向发力，确保动作连贯。' }
    ]
  },
  {
    id: 'around-body',
    keyword: '绕身滚灯',
    title: '绕身滚灯（空间路线）',
    gif: '/images/handbook/handbook-action-around-body-01.jpg',
    summary: '围绕身体轴线完成灯体绕行，重点是路线清晰与身体协调。',
    points: ['关键词：滚灯动作分解', '关键词：滚灯身体协调', '关键词：滚灯步伐配合'],
    steps: [
      { title: '步骤1：确定轨迹', detail: '先在心中建立“前侧-侧后-后侧-回前”的绕行路线。' },
      { title: '步骤2：侧步让位', detail: '通过交叉步与侧并步给灯体留出运动空间。' },
      { title: '步骤3：躯干转向', detail: '腰腹带动身体转向，视线跟随灯体移动。' },
      { title: '步骤4：回位衔接', detail: '回到正面站位并自然衔接下一个动作。' }
    ]
  },
  {
    id: 'throw-catch',
    keyword: '抛接滚灯',
    title: '抛接滚灯（节奏控制）',
    gif: '/images/handbook/handbook-action-throw-catch-01.jpg',
    summary: '通过“抛点高度 + 接点时机”控制动作风险，属于进阶训练内容。',
    points: ['关键词：滚灯动作步骤', '关键词：滚灯技术要领', '关键词：滚灯动作控制'],
    steps: [
      { title: '步骤1：预判落点', detail: '抛灯前先确认落点区域和身体移动方向。' },
      { title: '步骤2：小幅起抛', detail: '先练低抛，保持灯体旋转轴线稳定。' },
      { title: '步骤3：目光锁灯', detail: '视线始终跟灯，提前进入接灯位。' },
      { title: '步骤4：缓冲接灯', detail: '接灯瞬间手臂后撤缓冲，避免硬接失衡。' }
    ]
  },
  {
    id: 'combo',
    keyword: '组合动作',
    title: '组合动作（课堂展示）',
    gif: '/images/handbook/handbook-action-combo-01.jpg',
    summary: '把多个单项动作按节拍串联，形成完整的滚灯动作体系展示。',
    points: ['关键词：滚灯动作', '关键词：滚灯动作体系', '关键词：滚灯步伐配合'],
    steps: [
      { title: '步骤1：确定顺序', detail: '建议按“地面滚灯-手持旋灯-绕身-抛接”安排组合。' },
      { title: '步骤2：节拍标记', detail: '为每段动作设定固定拍数，便于集体同步。' },
      { title: '步骤3：转场衔接', detail: '在动作交界处加入过渡步，保证连贯观感。' },
      { title: '步骤4：完整呈现', detail: '按音乐或口令完成一轮连贯组合展示。' }
    ]
  }
]

const techniqueItems: TechniqueItem[] = [
  {
    id: 'control',
    keyword: '滚灯动作控制',
    title: '动作控制：稳、准、连',
    summary: '控制核心是“发力稳定、方向准确、动作连贯”。',
    checkpoints: ['起势不抢拍', '转向不丢轴', '收势不失稳']
  },
  {
    id: 'coordination',
    keyword: '滚灯身体协调',
    title: '身体协调：手眼身步一致',
    summary: '滚灯不是单靠手臂，必须做到视线、上肢、躯干和步伐同步。',
    checkpoints: ['目光跟灯', '核心收紧', '步伐与节拍一致']
  },
  {
    id: 'footwork',
    keyword: '滚灯步伐配合',
    title: '步伐配合：路线与节奏',
    summary: '步伐决定动作空间，节奏决定动作质量，是课堂训练的重点。',
    checkpoints: ['前进后退步幅均匀', '侧移时重心不漂移', '转场时先稳后快']
  }
]

const practiceTargetOrder = actionItems.map(item => item.id)

const module4Keywords = [
  '非遗保护',
  '非遗传承',
  '非遗文化',
  '非遗进校园',
  '传统文化教育',
  '文化认同',
  '文化自信',
  '地方文化保护',
  '青少年传承'
]

const module4Pages: { id: Module4Page; title: string; subtitle: string }[] = [
  { id: 'why', title: '第1页：为什么要保护非遗', subtitle: '小测试 + 互动问答' },
  { id: 'how', title: '第2页：我们可以怎么传承', subtitle: '传承宣言' }
]

const module4QuizItems: Module4QuizItem[] = [
  {
    id: 'q1',
    q: '为什么说“非遗进校园”很重要？',
    options: ['能让传统文化只停留在展览馆', '让青少年传承成为日常学习的一部分', '仅用于节庆表演，不进课堂'],
    correct: 1,
    explain: '非遗进校园把非遗文化转化为可持续的传统文化教育场景。'
  },
  {
    id: 'q2',
    q: '保护地方非遗最核心的价值是什么？',
    options: ['提升短期流量', '建立文化认同与文化自信', '只保留外观，不保留技艺'],
    correct: 1,
    explain: '地方文化保护不仅保留“物”，更保留社区记忆与身份认同。'
  },
  {
    id: 'q3',
    q: '下面哪项更符合“青少年传承”？',
    options: ['只看不学', '学动作、懂意义、能讲给别人听', '只在考试前突击了解'],
    correct: 1,
    explain: '青少年传承强调参与、理解、表达三位一体。'
  }
]

const module4QAItems: Module4QAItem[] = [
  {
    id: 'qa1',
    q: '非遗保护是不是“把传统锁在过去”？',
    a: '不是。非遗保护强调活态传承，要在当代生活中继续使用、继续教学、继续创新。'
  },
  {
    id: 'qa2',
    q: '为什么要重视地方文化保护？',
    a: '地方文化承载了社区记忆和历史经验，保护它就是保护我们“从哪里来”的文化线索。'
  },
  {
    id: 'qa3',
    q: '小学生参与非遗传承有什么意义？',
    a: '青少年是未来传承主体，越早建立文化认同，越能形成长期稳定的文化自信。'
  }
]

const module4ActionOptions = [
  '参加一次滚灯社团或校园展演',
  '向家人讲解滚灯的文化意义',
  '记录一次家乡非遗活动并分享',
  '设计一份“非遗进校园”小提案'
]

export default function H5Handbook() {
  const [activeModule, setActiveModule] = React.useState<LearningModule>('module1')

  const [activeStage, setActiveStage] = React.useState<Stage>('video')
  const [activeTimelineIndex, setActiveTimelineIndex] = React.useState(0)
  const [activeFactId, setActiveFactId] = React.useState<string>(lanternFacts[0].id)

  const [activeModule2Page, setActiveModule2Page] = React.useState<Module2Page>('appearance')
  const [activeStructureId, setActiveStructureId] = React.useState<string>(structureParts[0].id)
  const [activePrincipleId, setActivePrincipleId] = React.useState<string>(principleItems[0].id)
  const [centerOffset, setCenterOffset] = React.useState(0)

  const [activeModule3Page, setActiveModule3Page] = React.useState<Module3Page>('basic')
  const [activeActionId, setActiveActionId] = React.useState<string>(actionItems[0].id)
  const [activeStepIndex, setActiveStepIndex] = React.useState(0)
  const [activeTechniqueId, setActiveTechniqueId] = React.useState<string>(techniqueItems[0].id)
  const [practiceSequence, setPracticeSequence] = React.useState<string[]>([])
  const [practiceResult, setPracticeResult] = React.useState<'idle' | 'success' | 'fail'>('idle')

  const [activeModule4Page, setActiveModule4Page] = React.useState<Module4Page>('why')
  const [module4QuizAnswers, setModule4QuizAnswers] = React.useState<Record<string, number>>({})
  const [activeModule4QAId, setActiveModule4QAId] = React.useState(module4QAItems[0].id)
  const [selectedHeritageActions, setSelectedHeritageActions] = React.useState<string[]>([])
  const [heritageDeclaration, setHeritageDeclaration] = React.useState('')
  const [declarationSubmitted, setDeclarationSubmitted] = React.useState(false)

  const timelineRef = React.useRef<HTMLDivElement | null>(null)
  const timelineItemRefs = React.useRef<Array<HTMLLIElement | null>>([])

  const activeTimeline = timelineItems[activeTimelineIndex]
  const activeFact = lanternFacts.find(item => item.id === activeFactId) ?? lanternFacts[0]
  const activeStructure = structureParts.find(item => item.id === activeStructureId) ?? structureParts[0]
  const activePrinciple = principleItems.find(item => item.id === activePrincipleId) ?? principleItems[0]
  const activeAction = actionItems.find(item => item.id === activeActionId) ?? actionItems[0]
  const activeTechnique = techniqueItems.find(item => item.id === activeTechniqueId) ?? techniqueItems[0]
  const activeStep = activeAction.steps[activeStepIndex] ?? activeAction.steps[0]
  const activeModule4QA = module4QAItems.find(item => item.id === activeModule4QAId) ?? module4QAItems[0]

  const handleTimelineScroll = React.useCallback(() => {
    const container = timelineRef.current
    if (!container) return

    const marker = container.scrollTop + 32
    let nearest = 0
    let nearestDistance = Number.POSITIVE_INFINITY

    timelineItemRefs.current.forEach((node, index) => {
      if (!node) return
      const distance = Math.abs(node.offsetTop - marker)
      if (distance < nearestDistance) {
        nearest = index
        nearestDistance = distance
      }
    })

    setActiveTimelineIndex(nearest)
  }, [])

  React.useEffect(() => {
    if (activeModule !== 'module1' || activeStage !== 'timeline') return
    handleTimelineScroll()
  }, [activeModule, activeStage, handleTimelineScroll])

  React.useEffect(() => {
    setActiveStepIndex(0)
  }, [activeActionId])

  React.useEffect(() => {
    setDeclarationSubmitted(false)
  }, [heritageDeclaration, selectedHeritageActions])

  function setStageByIndex(index: number) {
    const next = stages[index]
    if (!next) return
    setActiveStage(next.id)
  }

  function setModule2PageByIndex(index: number) {
    const next = module2Pages[index]
    if (!next) return
    setActiveModule2Page(next.id)
  }

  function setModule3PageByIndex(index: number) {
    const next = module3Pages[index]
    if (!next) return
    setActiveModule3Page(next.id)
  }

  function setModule4PageByIndex(index: number) {
    const next = module4Pages[index]
    if (!next) return
    setActiveModule4Page(next.id)
  }

  function appendPracticeAction(actionId: string) {
    setPracticeResult('idle')
    setPracticeSequence(prev => {
      if (prev.includes(actionId)) return prev
      return [...prev, actionId]
    })
  }

  function resetPractice() {
    setPracticeSequence([])
    setPracticeResult('idle')
  }

  function checkPracticeSequence() {
    if (practiceSequence.length !== practiceTargetOrder.length) {
      setPracticeResult('fail')
      return
    }

    const passed = practiceTargetOrder.every((actionId, index) => practiceSequence[index] === actionId)
    setPracticeResult(passed ? 'success' : 'fail')
  }

  function onModule4QuizAnswer(questionId: string, optionIndex: number) {
    setModule4QuizAnswers(prev => {
      if (questionId in prev) return prev
      return { ...prev, [questionId]: optionIndex }
    })
  }

  function toggleHeritageAction(action: string) {
    setSelectedHeritageActions(prev => {
      if (prev.includes(action)) {
        return prev.filter(item => item !== action)
      }
      return [...prev, action]
    })
  }

  function submitDeclaration() {
    setDeclarationSubmitted(heritageDeclaration.trim().length > 0 && selectedHeritageActions.length > 0)
  }

  const currentStageIndex = stages.findIndex(stage => stage.id === activeStage)
  const canMovePrev = currentStageIndex > 0
  const canMoveNext = currentStageIndex < stages.length - 1

  const currentModule2PageIndex = module2Pages.findIndex(page => page.id === activeModule2Page)
  const canMoveModule2Prev = currentModule2PageIndex > 0
  const canMoveModule2Next = currentModule2PageIndex < module2Pages.length - 1

  const currentModule3PageIndex = module3Pages.findIndex(page => page.id === activeModule3Page)
  const canMoveModule3Prev = currentModule3PageIndex > 0
  const canMoveModule3Next = currentModule3PageIndex < module3Pages.length - 1

  const currentModule4PageIndex = module4Pages.findIndex(page => page.id === activeModule4Page)
  const canMoveModule4Prev = currentModule4PageIndex > 0
  const canMoveModule4Next = currentModule4PageIndex < module4Pages.length - 1

  const module4AnsweredCount = Object.keys(module4QuizAnswers).length
  const module4QuizScore = module4QuizItems.reduce((score, question) => {
    return score + (module4QuizAnswers[question.id] === question.correct ? 1 : 0)
  }, 0)

  const centerOffsetAbs = Math.abs(centerOffset)
  const stabilityLabel = centerOffsetAbs <= 8 ? '稳定滚动' : centerOffsetAbs <= 18 ? '可滚动但易偏移' : '高风险倾倒'
  const stabilityClass = centerOffsetAbs <= 8
    ? 'text-jade-700 bg-jade-50 border-jade-200'
    : centerOffsetAbs <= 18
      ? 'text-gold-700 bg-gold-50 border-gold-300'
      : 'text-brand-700 bg-brand-50 border-brand-300'

  return (
    <div className="space-y-6 animate-fade-in dark:[&_.card]:!bg-white">
      <section className="card p-4 md:p-5">
        <p className="text-xs uppercase tracking-wider text-brand-600 mb-2">H5 互动手册</p>
        <h1 className="text-2xl md:text-3xl font-bold mb-4">互动课件模式</h1>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {learningModules.map(module => {
            const active = module.id === activeModule
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => setActiveModule(module.id)}
                className={`rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                  active
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gold-200 bg-white text-ink-700 hover:border-gold-300 hover:bg-gold-50/40'
                }`}
              >
                <div className="text-sm font-semibold">{module.title}</div>
                <div className="text-xs opacity-80 mt-1">{module.subtitle}</div>
              </button>
            )
          })}
        </div>
      </section>

      {activeModule === 'module1' && (
        <>
          <section className="card overflow-hidden">
            <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-gold-500 p-6 md:p-8 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/80 mb-2">H5 互动手册 · 模块一</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">认识临平滚灯（文化导入）</h2>
              <p className="text-sm md:text-base text-white/90">
                课件目标：让学生知道“滚灯是什么、来自哪里、为什么重要”。
              </p>
            </div>
            <div className="p-5 md:p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-gold-200 bg-gold-50/60 p-4">
                  <h3 className="font-semibold text-ink-900 mb-2">教学目标</h3>
                  <ul className="space-y-1 text-ink-700">
                    <li>1. 说出临平滚灯与余杭滚灯的基本关系。</li>
                    <li>2. 理解滚灯起源、历史与当代发展路径。</li>
                    <li>3. 解释滚灯在节庆民俗和非遗保护中的文化意义。</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-gold-200 bg-white p-4">
                  <h3 className="font-semibold text-ink-900 mb-2">模块关键词</h3>
                  <div className="flex flex-wrap gap-2">
                    {handbookKeywords.map(keyword => (
                      <span key={keyword} className="px-2.5 py-1 rounded-full border border-gold-200 bg-paper text-xs text-ink-700">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                {stages.map(stage => {
                  const active = stage.id === activeStage
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setActiveStage(stage.id)}
                      className={`rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                        active
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gold-200 bg-white text-ink-700 hover:border-gold-300 hover:bg-gold-50/40'
                      }`}
                    >
                      <div className="text-sm font-semibold">{stage.title}</div>
                      <div className="text-xs opacity-80 mt-1">{stage.subtitle}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          {activeStage === 'video' && (
            <section className="space-y-4">
              <div className="card p-5 md:p-6">
                <h3 className="text-xl font-semibold mb-2">开场视频导入</h3>
                <p className="text-sm text-ink-600 mb-4">
                  建议先播放 60-90 秒导入视频，呈现“灯会场景 + 动作特写 + 提问引导”。
                </p>
                <VideoPlayer sources={introVideoSources} poster="/images/handbook/handbook-intro-poster-01.png" />
              </div>
              <div className="card p-4 md:p-5 text-sm">
                <h3 className="font-semibold mb-2">观看任务</h3>
                <ul className="space-y-1 text-ink-700">
                  <li>1. 视频中滚灯出现在哪些节庆场景？</li>
                  <li>2. 你观察到了哪些动作与队形变化？</li>
                  <li>3. 为什么说它不仅是表演，也是文化记忆？</li>
                </ul>
              </div>
            </section>
          )}

          {activeStage === 'timeline' && (
            <section className="grid gap-4 lg:grid-cols-5">
              <article className="card p-5 lg:col-span-2">
                <p className="text-xs uppercase tracking-wider text-brand-600 mb-2">当前时间节点</p>
                <h3 className="text-xl font-semibold mb-1">{activeTimeline.title}</h3>
                <p className="text-sm text-ink-500 mb-3">{activeTimeline.period}</p>
                <p className="text-sm text-ink-700 leading-relaxed mb-3">{activeTimeline.summary}</p>
                <div className="space-y-2">
                  {activeTimeline.points.map(point => (
                    <p key={point} className="text-xs rounded border border-gold-200 bg-gold-50/60 px-2.5 py-1.5 text-ink-700">
                      {point}
                    </p>
                  ))}
                </div>
              </article>

              <article className="card p-5 lg:col-span-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">滚动时间轴</h3>
                  <span className="text-xs text-ink-500">向下滚动查看完整发展线索</span>
                </div>
                <div
                  ref={timelineRef}
                  onScroll={handleTimelineScroll}
                  className="max-h-[420px] overflow-y-auto pr-2"
                >
                  <ol className="relative ml-3 border-l border-gold-200">
                    {timelineItems.map((item, index) => {
                      const active = activeTimelineIndex === index
                      return (
                        <li
                          key={item.id}
                          ref={node => {
                            timelineItemRefs.current[index] = node
                          }}
                          className="relative mb-5 ml-5"
                        >
                          <span
                            className={`absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 ${
                              active ? 'border-brand-600 bg-brand-500' : 'border-gold-400 bg-white'
                            }`}
                          />
                          <div
                            className={`rounded-lg border p-3 transition-colors ${
                              active
                                ? 'border-brand-300 bg-brand-50/80'
                                : 'border-gold-200 bg-white'
                            }`}
                          >
                            <p className="text-xs text-ink-500 mb-1">{item.period}</p>
                            <h4 className="text-base font-semibold text-ink-900 mb-1">{item.title}</h4>
                            <p className="text-sm text-ink-700">{item.summary}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              </article>
            </section>
          )}

          {activeStage === 'lantern' && (
            <section className="space-y-4">
              <div className="card p-5 md:p-6">
                <h3 className="text-xl font-semibold mb-2">点击灯笼出现小知识</h3>
                <p className="text-sm text-ink-600 mb-4">
                  选择一个灯笼关键词，系统会点亮并展示对应知识点。适合课堂快问快答或分组任务。
                </p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {lanternFacts.map(item => {
                    const active = item.id === activeFact.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveFactId(item.id)}
                        className={`group relative aspect-square rounded-full border-2 p-3 text-left transition-all ${
                          active
                            ? 'border-brand-600 bg-gradient-to-b from-brand-300 via-brand-500 to-brand-700 text-white shadow-traditional-lg'
                            : 'border-brand-300 bg-gradient-to-b from-brand-200 via-brand-300 to-brand-500 text-white hover:-translate-y-1'
                        }`}
                      >
                        <span className="absolute left-1/2 top-1 h-2 w-8 -translate-x-1/2 rounded-full bg-gold-300/80" />
                        <span className="mt-4 block text-[11px] uppercase tracking-wide text-white/85">tap</span>
                        <span className="mt-1 block text-sm font-semibold leading-tight">{item.keyword}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <article className="card p-5 md:p-6 animate-fade-in">
                <p className="text-xs uppercase tracking-wider text-brand-600 mb-2">已点亮</p>
                <h3 className="text-lg font-semibold mb-1">{activeFact.keyword} · {activeFact.title}</h3>
                <p className="text-sm text-ink-700 leading-relaxed">{activeFact.detail}</p>
              </article>
            </section>
          )}

          <section className="card p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-500">课件流程控制</p>
                <p className="text-sm font-semibold text-ink-800">
                  当前步骤：{currentStageIndex + 1} / {stages.length}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline"
                  disabled={!canMovePrev}
                  onClick={() => setStageByIndex(currentStageIndex - 1)}
                >
                  上一步
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!canMoveNext}
                  onClick={() => setStageByIndex(currentStageIndex + 1)}
                >
                  下一步
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {activeModule === 'module2' && (
        <>
          <section className="card overflow-hidden">
            <div className="bg-gradient-to-r from-ink-800 via-ink-700 to-jade-600 p-6 md:p-8 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/80 mb-2">H5 互动手册 · 模块二</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">滚灯的奥秘（结构与原理）</h2>
              <p className="text-sm md:text-base text-white/90">
                课件目标：让学生理解“滚灯为什么能滚、结构是怎样的”。
              </p>
            </div>
            <div className="p-5 md:p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-gold-200 bg-gold-50/60 p-4">
                  <h3 className="font-semibold text-ink-900 mb-2">教学目标</h3>
                  <ul className="space-y-1 text-ink-700">
                    <li>1. 识别滚灯结构与滚灯组成的关键部件。</li>
                    <li>2. 解释滚灯滚动原理、滚灯平衡原理与重心设计关系。</li>
                    <li>3. 理解滚灯制作工艺与滚灯防火结构的安全价值。</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-gold-200 bg-white p-4">
                  <h3 className="font-semibold text-ink-900 mb-2">模块关键词</h3>
                  <div className="flex flex-wrap gap-2">
                    {module2Keywords.map(keyword => (
                      <span key={keyword} className="px-2.5 py-1 rounded-full border border-gold-200 bg-paper text-xs text-ink-700">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {module2Pages.map(page => {
                  const active = page.id === activeModule2Page
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => setActiveModule2Page(page.id)}
                      className={`rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                        active
                          ? 'border-jade-500 bg-jade-50 text-jade-700'
                          : 'border-gold-200 bg-white text-ink-700 hover:border-gold-300 hover:bg-gold-50/40'
                      }`}
                    >
                      <div className="text-sm font-semibold">{page.title}</div>
                      <div className="text-xs opacity-80 mt-1">{page.subtitle}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          {activeModule2Page === 'appearance' && (
            <section className="grid gap-4 lg:grid-cols-5">
              <article className="card p-5 lg:col-span-3">
                <div className="mb-3">
                  <h3 className="text-xl font-semibold">点击式结构图：滚灯长什么样</h3>
                  <p className="text-sm text-ink-600">
                    点击图中的热点，查看滚灯灯架、滚灯灯面、滚灯灯芯等部位说明。
                  </p>
                </div>

                <div className="relative mx-auto aspect-square w-full max-w-[460px]">
                  <div className="absolute inset-8 rounded-full border-4 border-gold-400 bg-gradient-to-b from-brand-200 to-brand-500 shadow-traditional" />
                  <div className="absolute inset-[18%] rounded-full border-2 border-gold-200 bg-gradient-to-b from-white/70 to-brand-100/40" />
                  <div className="absolute left-1/2 top-[14%] h-10 w-20 -translate-x-1/2 rounded-full border border-gold-300 bg-gold-100/70" />
                  <div className="absolute left-1/2 top-[46%] h-12 w-12 -translate-x-1/2 rounded-full border-2 border-gold-500 bg-amber-200/70" />
                  {structureParts.map(part => {
                    const active = part.id === activeStructure.id
                    return (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => setActiveStructureId(part.id)}
                        className={`absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 text-xs font-semibold shadow-md transition-transform ${
                          active
                            ? 'border-jade-700 bg-jade-500 text-white scale-110'
                            : 'border-white bg-brand-500 text-white hover:scale-105'
                        }`}
                        style={{ left: `${part.hotSpot.x}%`, top: `${part.hotSpot.y}%` }}
                        aria-label={`查看${part.keyword}`}
                      >
                        {part.keyword.replace('滚灯', '').slice(0, 2)}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {structureParts.map(part => {
                    const active = part.id === activeStructure.id
                    return (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => setActiveStructureId(part.id)}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          active
                            ? 'border-jade-500 bg-jade-50 text-jade-700'
                            : 'border-gold-200 bg-white text-ink-700 hover:bg-gold-50'
                        }`}
                      >
                        {part.keyword}
                      </button>
                    )
                  })}
                </div>
              </article>

              <article className="card p-5 lg:col-span-2">
                <p className="text-xs uppercase tracking-wider text-jade-700 mb-2">当前结构点</p>
                <h3 className="text-lg font-semibold mb-1">{activeStructure.title}</h3>
                <p className="text-sm text-ink-600 mb-3">{activeStructure.summary}</p>
                <p className="text-sm text-ink-700 leading-relaxed mb-3">{activeStructure.detail}</p>
                <div className="space-y-2 mb-4">
                  {activeStructure.points.map(point => (
                    <p key={point} className="text-xs rounded border border-gold-200 bg-gold-50/60 px-2.5 py-1.5 text-ink-700">
                      {point}
                    </p>
                  ))}
                </div>
                <div className="rounded-lg border border-gold-200 bg-white p-3">
                  <p className="text-xs text-ink-500 mb-2">滚灯制作工艺（课堂简版）</p>
                  <ol className="space-y-1 text-sm text-ink-700">
                    <li>1. 编制灯架并检查受力点。</li>
                    <li>2. 贴合灯面并完成图案装饰。</li>
                    <li>3. 安装灯芯/电光源并加固内部结构。</li>
                    <li>4. 添加防火结构与安全隔离层。</li>
                  </ol>
                </div>
              </article>
            </section>
          )}

          {activeModule2Page === 'principle' && (
            <section className="space-y-4">
              <article className="card p-5">
                <h3 className="text-xl font-semibold mb-2">原理互动：滚灯为什么能滚</h3>
                <p className="text-sm text-ink-600 mb-4">
                  先点击原理卡片，再拖动重心滑块观察稳定性变化。
                </p>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {principleItems.map(item => {
                    const active = item.id === activePrinciple.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActivePrincipleId(item.id)}
                        className={`rounded-lg border-2 p-3 text-left transition-colors ${
                          active
                            ? 'border-jade-500 bg-jade-50 text-jade-700'
                            : 'border-gold-200 bg-white text-ink-700 hover:border-gold-300 hover:bg-gold-50/40'
                        }`}
                      >
                        <p className="text-xs mb-1 opacity-80">{item.keyword}</p>
                        <p className="text-sm font-semibold">{item.title}</p>
                      </button>
                    )
                  })}
                </div>
              </article>

              <section className="grid gap-4 lg:grid-cols-5">
                <article className="card p-5 lg:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-jade-700 mb-2">当前原理</p>
                  <h3 className="text-lg font-semibold mb-2">{activePrinciple.title}</h3>
                  <p className="text-sm text-ink-700 mb-3">{activePrinciple.summary}</p>
                  <div className="space-y-2">
                    {activePrinciple.points.map(point => (
                      <p key={point} className="text-xs rounded border border-gold-200 bg-gold-50/60 px-2.5 py-1.5 text-ink-700">
                        {point}
                      </p>
                    ))}
                  </div>
                </article>

                <article className="card p-5 lg:col-span-3">
                  <h3 className="text-lg font-semibold mb-2">滚灯重心设计模拟</h3>
                  <p className="text-sm text-ink-600 mb-4">
                    滑块越接近中心，滚灯平衡原理越容易满足；偏移越大，越容易出现抖动和倾倒。
                  </p>

                  <div className="rounded-lg border border-gold-200 bg-white p-4">
                    <div className="relative h-44 overflow-hidden rounded-lg border border-gold-100 bg-gradient-to-b from-paper to-gold-50">
                      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gold-400/80" />
                      <div className="absolute bottom-8 left-8 right-8 h-1 rounded bg-ink-700/70" />
                      <div
                        className="absolute bottom-9 h-20 w-20 -translate-x-1/2 rounded-full border-4 border-brand-500 bg-brand-300/70 transition-all"
                        style={{
                          left: `calc(50% + ${centerOffset}px)`,
                          transform: `translateX(-50%) rotate(${centerOffset / 5}deg)`
                        }}
                      />
                      <div
                        className="absolute h-3 w-3 -translate-x-1/2 rounded-full bg-ink-900 transition-all"
                        style={{ left: `calc(50% + ${centerOffset}px)`, top: '55%' }}
                      />
                    </div>

                    <div className="mt-4">
                      <label htmlFor="center-slider" className="text-sm text-ink-700">
                        重心偏移（模拟值）
                      </label>
                      <input
                        id="center-slider"
                        type="range"
                        min={-30}
                        max={30}
                        value={centerOffset}
                        onChange={e => setCenterOffset(Number(e.target.value))}
                        className="mt-2 w-full accent-brand-500"
                      />
                      <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
                        <span>左偏</span>
                        <span>{centerOffset}</span>
                        <span>右偏</span>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 inline-flex rounded-lg border px-3 py-2 text-sm font-semibold ${stabilityClass}`}>
                    稳定性判断：{stabilityLabel}
                  </div>
                </article>
              </section>
            </section>
          )}

          <section className="card p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-500">模块二页码控制</p>
                <p className="text-sm font-semibold text-ink-800">
                  当前页面：{currentModule2PageIndex + 1} / {module2Pages.length}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline"
                  disabled={!canMoveModule2Prev}
                  onClick={() => setModule2PageByIndex(currentModule2PageIndex - 1)}
                >
                  上一页
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!canMoveModule2Next}
                  onClick={() => setModule2PageByIndex(currentModule2PageIndex + 1)}
                >
                  下一页
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {activeModule === 'module3' && (
        <>
          <section className="card overflow-hidden">
            <div className="bg-gradient-to-r from-brand-700 via-ink-700 to-brand-500 p-6 md:p-8 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/80 mb-2">H5 互动手册 · 模块三</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">滚灯动作课堂（核心教学）</h2>
              <p className="text-sm md:text-base text-white/90">
                课件目标：让学生掌握滚灯基本动作和技术要领，完成分解学习到组合练习的闭环。
              </p>
            </div>
            <div className="p-5 md:p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-gold-200 bg-gold-50/60 p-4">
                  <h3 className="font-semibold text-ink-900 mb-2">教学目标</h3>
                  <ul className="space-y-1 text-ink-700">
                    <li>1. 认识滚灯动作体系中的代表动作与训练顺序。</li>
                    <li>2. 按步骤完成滚灯动作分解，理解技术要领。</li>
                    <li>3. 在动作练习中落实动作控制、身体协调与步伐配合。</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-gold-200 bg-white p-4">
                  <h3 className="font-semibold text-ink-900 mb-2">模块关键词</h3>
                  <div className="flex flex-wrap gap-2">
                    {module3Keywords.map(keyword => (
                      <span key={keyword} className="px-2.5 py-1 rounded-full border border-gold-200 bg-paper text-xs text-ink-700">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {module3Pages.map(page => {
                  const active = page.id === activeModule3Page
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => setActiveModule3Page(page.id)}
                      className={`rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                        active
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gold-200 bg-white text-ink-700 hover:border-gold-300 hover:bg-gold-50/40'
                      }`}
                    >
                      <div className="text-sm font-semibold">{page.title}</div>
                      <div className="text-xs opacity-80 mt-1">{page.subtitle}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          {activeModule3Page === 'basic' && (
            <section className="grid gap-4 xl:grid-cols-5">
              <article className="card p-5 xl:col-span-3">
                <h3 className="text-xl font-semibold mb-2">基础动作（动作GIF）</h3>
                <p className="text-sm text-ink-600 mb-4">点击动作卡片，查看该动作的训练目标与课堂提示。</p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {actionItems.map(action => {
                    const active = action.id === activeAction.id
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => setActiveActionId(action.id)}
                        className={`rounded-lg border-2 p-3 text-left transition-colors ${
                          active
                            ? 'border-brand-400 bg-brand-50'
                            : 'border-gold-200 bg-white hover:border-gold-300 hover:bg-gold-50/40'
                        }`}
                      >
                        <img src={action.gif} alt={`${action.keyword} 动作GIF占位`} className="mb-2 h-28 w-full rounded object-cover" />
                        <p className="text-xs text-ink-500 mb-1">{action.keyword}</p>
                        <p className="text-sm font-semibold text-ink-900">{action.title}</p>
                      </button>
                    )
                  })}
                </div>
              </article>

              <article className="card p-5 xl:col-span-2">
                <p className="text-xs uppercase tracking-wider text-brand-600 mb-2">当前动作</p>
                <h3 className="text-lg font-semibold mb-2">{activeAction.title}</h3>
                <p className="text-sm text-ink-700 mb-3">{activeAction.summary}</p>
                <div className="space-y-2">
                  {activeAction.points.map(point => (
                    <p key={point} className="text-xs rounded border border-gold-200 bg-gold-50/60 px-2.5 py-1.5 text-ink-700">
                      {point}
                    </p>
                  ))}
                </div>
              </article>
            </section>
          )}

          {activeModule3Page === 'decompose' && (
            <section className="space-y-4">
              <article className="card p-5">
                <h3 className="text-xl font-semibold mb-2">动作分解（点击步骤）</h3>
                <p className="text-sm text-ink-600 mb-4">先选择动作，再点击步骤按钮逐条学习。</p>
                <div className="flex flex-wrap gap-2">
                  {actionItems.map(action => {
                    const active = action.id === activeAction.id
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => setActiveActionId(action.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          active
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-gold-200 bg-white text-ink-700 hover:bg-gold-50'
                        }`}
                      >
                        {action.keyword}
                      </button>
                    )
                  })}
                </div>
              </article>

              <section className="grid gap-4 lg:grid-cols-5">
                <article className="card p-5 lg:col-span-3">
                  <p className="text-sm font-semibold text-ink-800 mb-3">{activeAction.title}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeAction.steps.map((step, idx) => {
                      const active = idx === activeStepIndex
                      return (
                        <button
                          key={step.title}
                          type="button"
                          onClick={() => setActiveStepIndex(idx)}
                          className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                            active
                              ? 'border-brand-400 bg-brand-50'
                              : 'border-gold-200 bg-white hover:bg-gold-50/40'
                          }`}
                        >
                          <p className="text-xs text-ink-500">步骤 {idx + 1}</p>
                          <p className="text-sm font-medium text-ink-900">{step.title}</p>
                        </button>
                      )
                    })}
                  </div>
                </article>

                <article className="card p-5 lg:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-brand-600 mb-2">步骤讲解</p>
                  <h3 className="text-lg font-semibold mb-2">{activeStep.title}</h3>
                  <p className="text-sm text-ink-700 leading-relaxed">{activeStep.detail}</p>
                </article>
              </section>
            </section>
          )}

          {activeModule3Page === 'technique' && (
            <section className="grid gap-4 lg:grid-cols-5">
              <article className="card p-5 lg:col-span-3">
                <h3 className="text-xl font-semibold mb-2">技术要领</h3>
                <p className="text-sm text-ink-600 mb-4">围绕动作控制、身体协调、步伐配合建立评价标准。</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {techniqueItems.map(item => {
                    const active = item.id === activeTechnique.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTechniqueId(item.id)}
                        className={`rounded-lg border-2 p-3 text-left transition-colors ${
                          active
                            ? 'border-brand-400 bg-brand-50'
                            : 'border-gold-200 bg-white hover:border-gold-300 hover:bg-gold-50/40'
                        }`}
                      >
                        <p className="text-xs text-ink-500 mb-1">{item.keyword}</p>
                        <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                      </button>
                    )
                  })}
                </div>
              </article>

              <article className="card p-5 lg:col-span-2">
                <p className="text-xs uppercase tracking-wider text-brand-600 mb-2">当前要领</p>
                <h3 className="text-lg font-semibold mb-2">{activeTechnique.title}</h3>
                <p className="text-sm text-ink-700 mb-3">{activeTechnique.summary}</p>
                <div className="space-y-2">
                  {activeTechnique.checkpoints.map(point => (
                    <p key={point} className="text-xs rounded border border-gold-200 bg-gold-50/60 px-2.5 py-1.5 text-ink-700">
                      {point}
                    </p>
                  ))}
                </div>
              </article>
            </section>
          )}

          {activeModule3Page === 'practice' && (
            <section className="space-y-4">
              <article className="card p-5">
                <h3 className="text-xl font-semibold mb-2">动作练习（动作小游戏）</h3>
                <p className="text-sm text-ink-600 mb-4">
                  玩法：按课堂建议顺序点击动作，完成“动作接龙”。顺序正确即可通关。
                </p>

                <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
                  {actionItems.map(action => {
                    const selected = practiceSequence.includes(action.id)
                    return (
                      <button
                        key={action.id}
                        type="button"
                        disabled={selected}
                        onClick={() => appendPracticeAction(action.id)}
                        className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          selected
                            ? 'cursor-not-allowed border-jade-400 bg-jade-50 text-jade-700'
                            : 'border-gold-200 bg-white text-ink-700 hover:bg-gold-50/40'
                        }`}
                      >
                        {action.keyword}
                      </button>
                    )
                  })}
                </div>
              </article>

              <section className="grid gap-4 lg:grid-cols-5">
                <article className="card p-5 lg:col-span-3">
                  <p className="text-sm font-semibold text-ink-800 mb-2">你的动作顺序</p>
                  {practiceSequence.length === 0 ? (
                    <p className="text-sm text-ink-500">还未开始，请先点击上方动作按钮。</p>
                  ) : (
                    <ol className="space-y-2">
                      {practiceSequence.map((actionId, index) => {
                        const action = actionItems.find(item => item.id === actionId)
                        if (!action) return null
                        return (
                          <li key={actionId} className="rounded border border-gold-200 bg-white px-3 py-2 text-sm text-ink-700">
                            {index + 1}. {action.keyword}
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </article>

                <article className="card p-5 lg:col-span-2">
                  <p className="text-sm font-semibold text-ink-800 mb-2">操作区</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      className="btn"
                      disabled={practiceSequence.length !== practiceTargetOrder.length}
                      onClick={checkPracticeSequence}
                    >
                      检查顺序
                    </button>
                    <button type="button" className="btn-outline" onClick={resetPractice}>重新开始</button>
                  </div>
                  {practiceResult !== 'idle' && (
                    <p
                      className={`rounded border px-3 py-2 text-sm ${
                        practiceResult === 'success'
                          ? 'border-jade-300 bg-jade-50 text-jade-700'
                          : 'border-brand-300 bg-brand-50 text-brand-700'
                      }`}
                    >
                      {practiceResult === 'success' ? '通关成功：动作顺序正确。' : '顺序不正确，再试一次。'}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-ink-500">
                    课堂建议顺序：地面滚灯 → 手持旋灯 → 绕身滚灯 → 抛接滚灯 → 组合动作
                  </p>
                </article>
              </section>
            </section>
          )}

          <section className="card p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-500">模块三页码控制</p>
                <p className="text-sm font-semibold text-ink-800">
                  当前页面：{currentModule3PageIndex + 1} / {module3Pages.length}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline"
                  disabled={!canMoveModule3Prev}
                  onClick={() => setModule3PageByIndex(currentModule3PageIndex - 1)}
                >
                  上一页
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!canMoveModule3Next}
                  onClick={() => setModule3PageByIndex(currentModule3PageIndex + 1)}
                >
                  下一页
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {activeModule === 'module4' && (
        <>
          <section className="card overflow-hidden">
            <div className="bg-gradient-to-r from-jade-700 via-ink-700 to-brand-600 p-6 md:p-8 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/80 mb-2">H5 互动手册 · 模块四</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">我是非遗小传承人（价值升华）</h2>
              <p className="text-sm md:text-base text-white/90">
                课件目标：让学生理解“为什么要保护非遗”，并形成可执行的传承行动。
              </p>
            </div>
            <div className="p-5 md:p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-gold-200 bg-gold-50/60 p-4">
                  <h3 className="font-semibold text-ink-900 mb-2">教学目标</h3>
                  <ul className="space-y-1 text-ink-700">
                    <li>1. 理解非遗保护、非遗传承与非遗文化的现实意义。</li>
                    <li>2. 在互动问答与小测试中建立文化认同与文化自信。</li>
                    <li>3. 结合非遗进校园场景，提出青少年传承的行动承诺。</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-gold-200 bg-white p-4">
                  <h3 className="font-semibold text-ink-900 mb-2">模块关键词</h3>
                  <div className="flex flex-wrap gap-2">
                    {module4Keywords.map(keyword => (
                      <span key={keyword} className="px-2.5 py-1 rounded-full border border-gold-200 bg-paper text-xs text-ink-700">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {module4Pages.map(page => {
                  const active = page.id === activeModule4Page
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => setActiveModule4Page(page.id)}
                      className={`rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                        active
                          ? 'border-jade-500 bg-jade-50 text-jade-700'
                          : 'border-gold-200 bg-white text-ink-700 hover:border-gold-300 hover:bg-gold-50/40'
                      }`}
                    >
                      <div className="text-sm font-semibold">{page.title}</div>
                      <div className="text-xs opacity-80 mt-1">{page.subtitle}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          {activeModule4Page === 'why' && (
            <section className="space-y-4">
              <article className="card p-5">
                <h3 className="text-xl font-semibold mb-2">互动问答：为什么要保护非遗</h3>
                <p className="text-sm text-ink-600 mb-4">
                  点击问题查看答案，理解地方文化保护与传统文化教育的关系。
                </p>
                <div className="grid gap-3 lg:grid-cols-5">
                  <div className="lg:col-span-2 space-y-2">
                    {module4QAItems.map(item => {
                      const active = item.id === activeModule4QA.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveModule4QAId(item.id)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                            active
                              ? 'border-jade-500 bg-jade-50 text-jade-700'
                              : 'border-gold-200 bg-white text-ink-700 hover:bg-gold-50/40'
                          }`}
                        >
                          {item.q}
                        </button>
                      )
                    })}
                  </div>
                  <div className="lg:col-span-3 rounded-lg border border-gold-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-wider text-jade-700 mb-2">当前解答</p>
                    <p className="text-sm font-semibold text-ink-900 mb-2">{activeModule4QA.q}</p>
                    <p className="text-sm text-ink-700 leading-relaxed">{activeModule4QA.a}</p>
                  </div>
                </div>
              </article>

              <article className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold">小测试：非遗保护认知检测</h3>
                  <p className="text-xs text-ink-500">得分 {module4QuizScore} / {module4QuizItems.length}</p>
                </div>
                <div className="space-y-3">
                  {module4QuizItems.map((question, qIndex) => {
                    const answer = module4QuizAnswers[question.id]
                    const answered = answer !== undefined
                    return (
                      <div key={question.id} className="rounded-lg border border-gold-200 bg-white p-3">
                        <p className="text-sm font-semibold text-ink-900 mb-2">{qIndex + 1}. {question.q}</p>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {question.options.map((option, optionIndex) => {
                            const isSelected = answer === optionIndex
                            const isCorrect = optionIndex === question.correct
                            return (
                              <button
                                key={option}
                                type="button"
                                disabled={answered}
                                onClick={() => onModule4QuizAnswer(question.id, optionIndex)}
                                className={`rounded border px-3 py-2 text-left text-sm transition-colors ${
                                  answered && isSelected && isCorrect
                                    ? 'border-jade-400 bg-jade-50 text-jade-700'
                                    : answered && isSelected && !isCorrect
                                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                                      : 'border-gold-200 bg-white text-ink-700 hover:bg-gold-50/40'
                                } ${answered ? 'cursor-not-allowed' : ''}`}
                              >
                                {option}
                              </button>
                            )
                          })}
                        </div>
                        {answered && (
                          <p className="mt-2 text-xs text-ink-600">
                            解析：{question.explain}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
                <p className="mt-3 text-xs text-ink-500">
                  当前完成：{module4AnsweredCount} / {module4QuizItems.length} 题
                </p>
              </article>
            </section>
          )}

          {activeModule4Page === 'how' && (
            <section className="grid gap-4 lg:grid-cols-5">
              <article className="card p-5 lg:col-span-3">
                <h3 className="text-xl font-semibold mb-2">传承宣言：我们可以怎么传承</h3>
                <p className="text-sm text-ink-600 mb-4">
                  选择你的传承行动，并写下“我是非遗小传承人”宣言。
                </p>
                <div className="space-y-2 mb-4">
                  {module4ActionOptions.map(action => {
                    const checked = selectedHeritageActions.includes(action)
                    return (
                      <button
                        key={action}
                        type="button"
                        onClick={() => toggleHeritageAction(action)}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          checked
                            ? 'border-jade-500 bg-jade-50 text-jade-700'
                            : 'border-gold-200 bg-white text-ink-700 hover:bg-gold-50/40'
                        }`}
                      >
                        {checked ? '已选：' : '选择：'}{action}
                      </button>
                    )
                  })}
                </div>
                <label htmlFor="heritage-declaration" className="text-sm font-medium text-ink-800">
                  我的传承宣言
                </label>
                <textarea
                  id="heritage-declaration"
                  value={heritageDeclaration}
                  onChange={e => setHeritageDeclaration(e.target.value)}
                  placeholder="示例：我愿意每周练习滚灯动作，并向同学分享滚灯背后的非遗文化故事。"
                  className="input mt-2 min-h-28"
                />
                <div className="mt-3 flex gap-2">
                  <button type="button" className="btn" onClick={submitDeclaration}>生成传承卡</button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      setSelectedHeritageActions([])
                      setHeritageDeclaration('')
                    }}
                  >
                    清空
                  </button>
                </div>
              </article>

              <article className="card p-5 lg:col-span-2">
                <p className="text-xs uppercase tracking-wider text-jade-700 mb-2">传承卡预览</p>
                <div className="rounded-lg border border-gold-200 bg-gradient-to-b from-paper to-gold-50 p-4">
                  <p className="text-sm font-semibold text-ink-900 mb-2">我是非遗小传承人</p>
                  <p className="text-xs text-ink-500 mb-2">行动清单</p>
                  {selectedHeritageActions.length === 0 ? (
                    <p className="text-xs text-ink-500 mb-3">请先选择至少一项行动。</p>
                  ) : (
                    <ul className="mb-3 space-y-1">
                      {selectedHeritageActions.map(action => (
                        <li key={action} className="text-xs text-ink-700">- {action}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-ink-500 mb-1">我的宣言</p>
                  <p className="text-sm text-ink-800 min-h-16">
                    {heritageDeclaration.trim() || '请填写你的传承宣言。'}
                  </p>
                </div>
                {declarationSubmitted && (
                  <p className="mt-3 rounded border border-jade-300 bg-jade-50 px-3 py-2 text-sm text-jade-700">
                    宣言已生成：你已完成“非遗小传承人”挑战。
                  </p>
                )}
              </article>
            </section>
          )}

          <section className="card p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-500">模块四页码控制</p>
                <p className="text-sm font-semibold text-ink-800">
                  当前页面：{currentModule4PageIndex + 1} / {module4Pages.length}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-outline"
                  disabled={!canMoveModule4Prev}
                  onClick={() => setModule4PageByIndex(currentModule4PageIndex - 1)}
                >
                  上一页
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!canMoveModule4Next}
                  onClick={() => setModule4PageByIndex(currentModule4PageIndex + 1)}
                >
                  下一页
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
