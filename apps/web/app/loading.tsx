import { LoadingGrid } from "../components/state-panels";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-4 w-28 rounded-full bg-slate-900" />
        <div className="h-14 w-full max-w-xl rounded-3xl bg-slate-900" />
        <div className="h-6 w-full max-w-3xl rounded-2xl bg-slate-900" />
      </div>
      <LoadingGrid />
    </div>
  );
}
