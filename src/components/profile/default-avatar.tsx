import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  /** 例: h-11 w-11 */
  className?: string;
};

function resolvePx(className?: string): number {
  if (!className) return 40;
  if (className.includes("h-14")) return 56;
  if (className.includes("h-13")) return 52;
  if (className.includes("h-12")) return 48;
  if (className.includes("h-11")) return 44;
  if (className.includes("h-9")) return 36;
  return 40;
}

/** プロフィール写真未設定時の汎用アバター */
export function DefaultAvatar({ className }: Props) {
  const px = resolvePx(className);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full",
        "h-10 w-10",
        className,
      )}
      aria-hidden
    >
      <Image
        src="/default-avatar.png"
        alt=""
        width={px}
        height={px}
        sizes={`${px}px`}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
