import ExitPinButton from "@/components/ExitPinButton";

export default function KidHeader({
  avatar,
  name,
  remainingMin,
  limitMin,
}: {
  avatar: string;
  name: string;
  remainingMin: number;
  limitMin: number;
}) {
  const percent = Math.max(0, Math.min(100, (remainingMin / limitMin) * 100));

  return (
    <header className="sticky top-0 z-20 border-b border-white/20 bg-brand/90 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <span className="text-3xl">{avatar}</span>
        <div>
          <div className="text-lg font-bold" style={{ fontFamily: "var(--font-baloo)" }}>
            Chào {name}!
          </div>
          <div className="text-xs text-white/80">Chỉ có video bố mẹ đã chọn thôi nhé</div>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden sm:block">
            <div className="mb-1 text-right text-xs text-white/90">
              Còn {remainingMin} phút hôm nay
            </div>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-sun" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <ExitPinButton />
        </div>
      </div>
    </header>
  );
}
