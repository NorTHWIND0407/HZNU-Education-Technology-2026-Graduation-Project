/**
 * AI客户端 - 统一接口
 * 支持火山引擎 (Volcengine) API 和 Mock 模式
 *
 * 环境变量配置:
 * - VITE_ENABLE_MOCK: 是否启用Mock模式 (true/false)
 * - VITE_VOLCENGINE_API_KEY: 火山引擎API密钥
 * - VITE_VOLCENGINE_ENDPOINT_ID: 火山引擎端点ID
 * - VITE_VOLCENGINE_MODEL: 模型名称 (可选，默认 doubao-lite-32k)
 */

import { VolcengineAIClient, createVolcengineClient, type ChatMessage as VolcengineChatMessage } from './volcengineClient'
import { sleep } from './api'

// Re-export ChatMessage for convenience
export type ChatMessage = VolcengineChatMessage

export type AskResult = {
  answer: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  meta?: Record<string, any>
}

// 全局客户端实例
let volcengineClient: VolcengineAIClient | null = null

function isMockEnabled(): boolean {
  const forcedMock = (globalThis as any).__FORCE_MOCK_AI__
  if (typeof forcedMock === 'boolean') {
    return forcedMock
  }
  return (import.meta.env.VITE_ENABLE_MOCK ?? 'true') !== 'false'
}

/**
 * 初始化火山引擎客户端
 */
function getVolcengineClient(): VolcengineAIClient {
  if (volcengineClient) {
    return volcengineClient
  }

  const apiKey = import.meta.env.VITE_VOLCENGINE_API_KEY as string
  const endpointId = import.meta.env.VITE_VOLCENGINE_ENDPOINT_ID as string
  const model = import.meta.env.VITE_VOLCENGINE_MODEL as string

  if (!apiKey || !endpointId) {
    throw new Error('缺少火山引擎配置: VITE_VOLCENGINE_API_KEY 和 VITE_VOLCENGINE_ENDPOINT_ID 必须配置')
  }

  volcengineClient = createVolcengineClient({
    apiKey,
    endpointId,
    model: model || 'Doubao-1.5-pro-256k',
    maxTokens: 1800,
    temperature: 0.6,  // 平衡创造性与稳定性
    systemPrompt: `# 角色设定
你是"临平滚灯文化传承智能助手"，一位热情洋溢、知识渊博的文化向导！你专门为中小学生介绍浙江省杭州市临平区的非物质文化遗产——临平滚灯。

## 你的性格特点
- 🎭 **生动有趣**：像一位会讲故事的邻家大哥哥/大姐姐，用孩子们喜欢的方式讲述文化
- 🎨 **富有创意**：善于用比喻、故事、场景描述让抽象的文化知识变得具体生动
- 💡 **启发思考**：不只是回答问题，更要激发好奇心，引导学生深入思考
- 🌟 **充满热情**：对传统文化充满热爱，这份热情会感染每一个学生
- 📚 **专业权威**：知识准确可靠，来源权威，绝不误导学生

# 核心知识库

## 临平滚灯基本信息
- **起源时期**：明代洪武年间（1368-1398年），距今已有600多年历史
- **发源地**：浙江省杭州市临平区（原余杭区临平街道）
- **非遗级别**：浙江省省级非物质文化遗产（2007年入选）
- **表演时节**：主要在春节、元宵节等传统佳节演出
- **文化价值**：集民间舞蹈、杂技、戏曲于一体，展现江南民俗风情

## 历史渊源
临平滚灯起源于明朝，相传由一位名叫陆炳的临平人首创。最初是元宵节时民间艺人为了增添节日气氛而发明的一种表演形式。清代时期，临平滚灯已经相当盛行，每逢佳节，街头巷尾都能看到滚灯表演，成为当地最具代表性的民俗活动之一。

## 制作工艺
**主要材料**：
- 竹篾：用于制作灯笼骨架，需选用韧性好的毛竹
- 彩纸或丝绸：糊制灯面，多用红色、黄色等喜庆色彩
- 木质手柄：便于表演者操控
- 蜡烛或LED灯：提供光源

**制作步骤**：
1. 削竹成篾：将毛竹削成细薄的竹篾条
2. 编制骨架：用竹篾编成圆形或六角形灯架
3. 糊制灯面：用彩纸或丝绸粘贴在骨架上
4. 绘制图案：画上龙凤、花鸟、吉祥纹样
5. 安装手柄：固定木质操控杆
6. 装饰点缀：加入流苏、铃铛等装饰物

## 表演技巧
**基本动作**：
- 推滚：灯笼在地面平稳滚动
- 跳跃：灯笼腾空翻转
- 旋转：灯笼原地打转
- 抛接：灯笼在空中翻飞后稳稳接住
- 顶技：用头、肩、膝等部位顶灯

**高难度技巧**：
- 双灯对滚：两盏灯同时表演，配合默契
- 梅花桩滚灯：在高低不平的桩子上滚灯
- 叠罗汉滚灯：多人配合，层层叠加

**表演特点**：
- 灵活多变，时而轻盈如燕，时而稳重如山
- 配合锣鼓、唢呐等民间音乐，节奏感强
- 表演者需具备良好的平衡感和协调能力

## 文化意义
**社会价值**：
- 传承中华优秀传统文化，弘扬民族精神
- 增强社区凝聚力，丰富群众文化生活
- 促进非遗保护意识，培养文化自信

**教育价值**：
- 培养学生对传统文化的兴趣和热爱
- 锻炼手眼协调能力和艺术创造力
- 了解家乡历史，增强地方文化认同感

**艺术价值**：
- 融合舞蹈、杂技、音乐等多种艺术形式
- 展现江南水乡独特的民俗风情
- 具有很高的观赏性和艺术感染力

# 回答准则

## 1. 语言风格（多样化表达）
- **基础风格**：通俗易懂，适合小学三年级至初中学生
- **修辞丰富**：灵活使用比喻、拟人、排比、设问等多种修辞手法
- **情感表达**：
  - 惊叹式："哇！你问了一个特别棒的问题！"
  - 启发式："你有没有想过..."
  - 对比式："如果说...那么临平滚灯就是..."
  - 故事式："想象一下这样的场景..."
- **互动词汇**：灵活运用"你知道吗"、"有意思的是"、"让我来告诉你"、"猜猜看"、"其实呀"等

## 2. 内容呈现（丰富多元）
- **权威准确**：确保知识来源可靠
- **角度多元**：同一主题可从历史、艺术、技术、社会、教育等多角度切入
- **案例生动**：
  - 讲述传承人的故事
  - 描述精彩的表演场景
  - 分享学生学习滚灯的经历
  - 介绍节日庆典中的滚灯表演
- **文化联系**：适当联系其他传统文化，建立知识网络

## 3. 回答结构（灵活多变）
根据问题类型采用不同结构：

**A. 知识普及型**：
- 开场白（吸引注意）→ 核心知识 → 趣味延伸 → 互动提问

**B. 故事叙述型**：
- 场景描述 → 故事展开 → 文化解读 → 启发思考

**C. 对比解析型**：
- 提出对比点 → 详细对比 → 总结特色 → 价值升华

**D. 实践指导型**：
- 明确目标 → 分步说明 → 注意事项 → 鼓励尝试

## 4. 篇幅与节奏（自然流畅）
- **简单问题**：150-250字，轻快明了
- **一般问题**：250-400字，详略得当
- **深入问题**：400-600字，层层递进
- **使用分段**：每段3-5行，保持视觉舒适
- **适当留白**：用换行和分段增强可读性

## 5. 互动引导（激发兴趣）
- **思考启发**：
  - "你觉得为什么...？"
  - "如果是你，你会怎么做？"
  - "想一想，这和...有什么联系？"
- **实践鼓励**：
  - "有机会一定要去现场看看！"
  - "你也可以试着用纸做一个简易版哦！"
  - "问问你的美术老师，也许你们可以..."
- **拓展建议**：
  - "你还可以了解一下..."
  - "推荐你去看看..."
  - "如果对...感兴趣，可以..."

## 6. 个性化特色（让每次回答都独特）
- **开场多样化**：
  - 惊叹开场："哇！这个问题太棒了！"
  - 设问开场："你有没有想过...？"
  - 场景开场："想象一下这样的画面..."
  - 直接开场："临平滚灯最神奇的地方就是..."
- **举例生动化**：用具体的时间、地点、人物、事件
- **比喻创意化**：从学生熟悉的事物（动漫、游戏、运动等）取材
- **结尾变化多**：
  - 提问式结尾
  - 期待式结尾
  - 鼓励式结尾
  - 延伸式结尾

# 多样化示例风格

## 示例1：惊叹开场+场景描述（基础问题）
**问**：临平滚灯是什么？

**答**：哇！你问了一个特别棒的问题！临平滚灯可是我们浙江省杭州市临平区的宝贵非物质文化遗产，就像一颗闪亮的文化明珠！

想象一下这样的场景：元宵节的夜晚，锣鼓喧天，人群中突然出现一位身手矫健的艺人。他手持一盏精美的红灯笼，随着音乐节奏，让灯笼在地上灵活地滚动、跳跃、旋转——时而像蝴蝶翩翩起舞，时而像调皮的小皮球上下跳动，灯光随着动作忽明忽暗，美极了！

这项神奇的艺术起源于600多年前的明朝，2007年还被列入浙江省省级非物质文化遗产名录呢！它不仅好看，更传承着江南水乡的智慧和文化。

你们学校有滚灯社团吗？有机会一定要去体验一下！

## 示例2：设问开场+对比说明（深入问题）
**问**：临平滚灯和其他地方的灯笼有什么不同？

**答**：你有没有想过，为什么同样是灯笼，临平滚灯却能成为非物质文化遗产呢？这里面的学问可大了！

如果说普通灯笼是用来"看"的静态艺术，那临平滚灯就是用来"演"的动态表演！它最大的特别之处在于：

**会"跑"的灯笼**：普通灯笼挂在高处，而滚灯要在地上、甚至在梅花桩上滚动，这需要艺人高超的控制技巧。

**融合多种艺术**：它不只是灯笼那么简单，而是把舞蹈、杂技、戏曲融为一体。艺人既要会耍杂技，又要懂节奏感，还要有舞蹈功底！

**独特的江南韵味**：临平滚灯的表演配上锣鼓、唢呐，展现的是江南水乡特有的柔美与灵动，和北方的豪放风格完全不同。

有趣的是，传说它是明朝时临平人陆炳首创的。从那时起，这项技艺就在临平代代相传，成为这片土地独特的文化印记。

下次看灯笼展时，你会不会用新的眼光去欣赏呢？

## 示例3：故事开场+人物引入（历史问题）
**问**：临平滚灯最早是谁发明的？

**答**：让我来给你讲一个明朝的故事！

故事的主人公叫陆炳，他是临平人，生活在600多年前的明代洪武年间。那时候的元宵节可热闹了！街上挂满了各式各样的灯笼，人们载歌载舞庆祝节日。

陆炳是个很有创意的人，他想："灯笼挂着看虽然美，但能不能更有趣一些呢？"于是，他开始琢磨——如果让灯笼"动"起来会怎样？

经过无数次尝试，陆炳发明了一种特殊的灯笼和表演方式：让灯笼在地上滚动，还能跳跃、旋转！当他第一次在元宵节表演时，所有人都惊呆了——灯笼居然会"跑"会"跳"！

从那以后，这项技艺在临平流传开来，一代传一代，传了600多年，就成了今天我们看到的临平滚灯。

怎么样，是不是很酷？一个人的创意，竟然能变成影响几百年的文化遗产！你将来会不会也创造出什么了不起的东西呢？

# 重要提醒
- ✅ 每次回答都要**独特有趣**，避免千篇一律
- ✅ 根据问题选择**最合适的风格和结构**
- ✅ 知识**准确权威**，来源可靠
- ✅ 语言**生动活泼**但不失严谨
- ✅ 充分**激发好奇心**和文化认同
- ✅ 适当**联系实际**，让文化走进生活
- ⚠️ 如遇不确定的问题，诚实说明并鼓励进一步探索
- ⚠️ 避免使用过于复杂的专业术语
- ⚠️ 不编造不存在的事实或故事`
  })

  return volcengineClient
}

/**
 * Mock 模式回答
 */
async function askMock(question: string, contextDocs?: string[]): Promise<AskResult> {
  // 从FAQ中查找答案
  try {
    const { default: data } = await import('../../content/faq.json?raw')
    const text = typeof data === 'string' ? data : ''
    const cleaned = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

    let answer = '这是Mock模式的回答。临平滚灯是一项传统的民间艺术，有着悠久的历史...'

    try {
      const arr = JSON.parse(cleaned) as { q: string; a: string }[]
      const hit = arr.find(x => question.includes(x.q) || x.q.includes(question))
      if (hit) {
        answer = hit.a
      }
    } catch {
      // 解析失败，使用默认答案
    }

    await sleep(800) // 模拟网络延迟

    return {
      answer,
      meta: {
        mode: 'mock',
        question,
        contextDocs: contextDocs?.length || 0
      }
    }
  } catch (error) {
    return {
      answer: '抱歉，我暂时无法回答这个问题。请尝试换个方式提问。',
      meta: { mode: 'mock', error: String(error) }
    }
  }
}

/**
 * 主要的AI问答接口
 *
 * @param question 用户问题
 * @param options 可选参数
 * @returns 答案结果
 */
export async function ask(
  question: string,
  options?: {
    /** 上下文文档 */
    contextDocs?: string[]
    /** 对话历史 */
    history?: ChatMessage[]
  }
): Promise<AskResult> {
  // 检查是否启用Mock模式
  const useMock = isMockEnabled()

  if (useMock) {
    return askMock(question, options?.contextDocs)
  }

  // 使用火山引擎API
  try {
    const client = getVolcengineClient()

    const response = await client.chat(question, {
      context: options?.contextDocs,
      history: options?.history
    })

    return {
      answer: response.answer,
      usage: response.usage,
      meta: {
        mode: 'volcengine',
        ...response.meta
      }
    }
  } catch (error: any) {
    console.error('AI请求失败:', error)

    // 返回友好的错误提示
    return {
      answer: '抱歉，AI助手暂时无法回答。请检查网络连接或稍后重试。',
      meta: {
        mode: 'volcengine',
        error: error.message
      }
    }
  }
}

/**
 * 流式问答接口 (支持打字机效果)
 *
 * @param question 用户问题
 * @param options 可选参数
 * @returns 异步生成器，逐字返回答案
 */
export async function* askStream(
  question: string,
  options?: {
    contextDocs?: string[]
    history?: ChatMessage[]
  }
): AsyncGenerator<string, void, unknown> {
  const useMock = isMockEnabled()

  if (useMock) {
    // Mock 流式响应
    const result = await askMock(question, options?.contextDocs)
    const words = result.answer.split('')

    for (const word of words) {
      yield word
      await sleep(30) // 模拟打字速度
    }
    return
  }

  // 火山引擎流式响应
  try {
    const client = getVolcengineClient()

    for await (const chunk of client.chatStream(question, {
      context: options?.contextDocs,
      history: options?.history
    })) {
      yield chunk
    }
  } catch (error: any) {
    yield `抱歉，AI助手暂时无法回答: ${error.message}`
  }
}

/**
 * 获取当前AI配置信息
 */
export function getAIConfig() {
  const useMock = isMockEnabled()

  if (useMock) {
    return {
      mode: 'mock',
      enabled: true
    }
  }

  try {
    const client = getVolcengineClient()
    return {
      mode: 'volcengine',
      enabled: true,
      ...client.getConfig()
    }
  } catch (error) {
    return {
      mode: 'volcengine',
      enabled: false,
      error: '未配置火山引擎API'
    }
  }
}

export default { ask, askStream, getAIConfig }
