import { PropsWithChildren } from 'react'

export function Card({ children }: PropsWithChildren) {
  return <div className="card p-4">{children}</div>
}

export function CardGrid({ children }: PropsWithChildren) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
}

