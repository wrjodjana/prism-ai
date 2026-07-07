import Entry from "~/components/updates/entry";

export default function Updates() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-center items-center px-4 py-4">
        <h1 className="text-4xl font-medium">Product Updates</h1>
      </div>
      <div className="flex flex-col gap-4 px-4">
        <Entry text="hello" tag="new" summary="hello" />
      </div>
    </div>
  );
}
