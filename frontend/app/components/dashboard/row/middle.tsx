interface MiddleProps {
  title: string;
  id: number;
  author: string;
  time: string;
}

export default function Middle({ title, id, author, time }: MiddleProps) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-black">{title}</p>
      <p className="truncate text-sm text-gray-400">
        #{id} · opened by {author} · {time}
      </p>
    </div>
  );
}
