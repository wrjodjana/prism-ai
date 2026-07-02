import Pill from "./row/pill";
import Middle from "./row/middle";

type PRStatus = "open" | "merged" | "closed";

interface RowProps {
  status: PRStatus;
  title: string;
  id: number;
  author: string;
  time: string;
}

export default function Row({ status, title, id, author, time }: RowProps) {
  return (
    <div className="flex flex-row items-center gap-4 border border-gray-200 rounded-md px-4 py-3">
      <div className="w-16 shrink-0s">
        <Pill status={status} />
      </div>
      <Middle title={title} id={id} author={author} time={time} />
    </div>
  );
}
