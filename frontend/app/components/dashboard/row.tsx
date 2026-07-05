import Pill from "./row/pill";
import Middle from "./row/middle";

type prStatus = "open" | "merged" | "closed";

interface RowProps {
  status: prStatus;
  title: string;
  id: number;
  author: string;
  time: string;
}

export default function Row({ status, title, id, author, time }: RowProps) {
  return (
    <div className="flex flex-col gap-2 border border-black rounded-md px-4 py-3">
      <div className="flex flex-row items-center gap-4">
        <div className="w-16 shrink-0">
          <Pill status={status} />
        </div>
        <div className="min-w-0 flex-1">
          <Middle title={title} id={id} author={author} time={time} />
        </div>
      </div>
    </div>
  );
}
