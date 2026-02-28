import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

const COLORS = ['#e76f51','#2a9d8f','#e9c46a','#264653','#f4a261']

export function ChartLine({ data }: { data: any[] }) {
  // TODO: 真实字段映射示例：data[].time -> X 轴；data[].score -> 线条数值
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Line dataKey="score" stroke="#e76f51" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function ChartPie({ data }: { data: any[] }) {
  // TODO: 真实字段映射示例：data[].label -> 类别；data[].value -> 比例
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" outerRadius={80}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function ChartBar({ data }: { data: any[] }) {
  // TODO: 真实字段映射示例：data[].module -> 模块名；data[].usage -> 使用次数
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <XAxis dataKey="module" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="usage" fill="#2a9d8f" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ChartRadar({ data }: { data: any[] }) {
  // TODO: 真实字段映射示例：data[].aspect -> 维度；data[].score -> 分数 1-5
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="aspect" />
        <PolarRadiusAxis />
        <Radar dataKey="score" stroke="#264653" fill="#264653" fillOpacity={0.6} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  )
}

