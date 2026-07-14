interface FilterButtonProps {
  tag: string;
  isActive: boolean;
  onClick: () => void;
}

export default function FilterButton({ tag, isActive, onClick }: FilterButtonProps) {
  return (
    <div>
      <button className={`w-20  h-10 border border-black rounded-md px-3 py-2 hover:text-black ${isActive ? "text-black" : "text-gray-400"}`} onClick={onClick}>
        {tag}
      </button>
    </div>
  );
}
