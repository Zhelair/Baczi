interface Props {
  score: number  // 1-5
}

const COLORS = ['', 'text-red-500', 'text-orange-400', 'text-zinc-400', 'text-amber-400', 'text-green-400']

export default function StarRating({ score }: Props) {
  return (
    <span className={`${COLORS[score] ?? COLORS[3]}`}>
      {'★'.repeat(score)}{'☆'.repeat(5 - score)}
    </span>
  )
}
