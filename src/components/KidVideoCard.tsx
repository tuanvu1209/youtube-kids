import Image from "next/image";
import Link from "next/link";
import { formatDuration } from "@/lib/constants";

export default function KidVideoCard({
  href,
  title,
  thumbnailUrl,
  durationSec,
  channelTitle,
}: {
  href: string;
  title: string;
  thumbnailUrl: string;
  durationSec: number;
  channelTitle: string;
}) {
  return (
    <Link
      href={href}
      className="group w-64 shrink-0 rounded-3xl bg-surface/90 p-3 shadow-md transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative overflow-hidden rounded-2xl">
        <Image
          src={thumbnailUrl}
          alt={title}
          width={320}
          height={180}
          unoptimized
          className="aspect-video w-full object-cover transition group-hover:scale-105"
        />
        {durationSec > 0 && (
          <span className="absolute bottom-2 right-2 rounded-lg bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-white">
            {formatDuration(durationSec)}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center text-5xl opacity-0 transition group-hover:opacity-100">
          ▶️
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug">{title}</p>
      <p className="text-xs text-muted">{channelTitle}</p>
    </Link>
  );
}
