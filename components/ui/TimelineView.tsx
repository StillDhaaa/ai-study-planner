"use client";

type ScheduleItem = {
  waktu: string;
  kegiatan: string;
  tipe: string;
};

type TimelineProps = {
  items: ScheduleItem[];
};

export function TimelineView({ items }: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className="border-foreground/20 from-foreground/10 to-foreground/5 flex flex-col items-center justify-center rounded-2xl border bg-linear-to-br p-8 backdrop-blur-xl">
        <p className="text-muted-foreground text-center text-sm">
          Belum ada jadwal. Mulai percakapan dengan AI untuk membuat jadwal
          belajar Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <TimelineItem
          key={index}
          item={item}
          isLastItem={index === items.length - 1}
        />
      ))}
    </div>
  );
}

function TimelineItem({
  item,
  isLastItem,
}: {
  item: ScheduleItem;
  isLastItem: boolean;
}) {
  const isBreak = item.tipe === "istirahat" || item.tipe === "break";
  const isFocus = item.tipe === "fokus" || item.tipe === "focus";

  return (
    <div className="group border-foreground/10 dark:from-foreground/5 hover:border-foreground/20 dark:hover:from-foreground/10 flex items-start gap-4 rounded-lg border bg-linear-to-r from-white/20 to-transparent p-4 transition-all duration-300 ease-in-out hover:from-white/30">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div
          className={`h-4 w-4 rounded-full border-2 transition-all ${
            isFocus
              ? "border-primary bg-primary/30"
              : isBreak
                ? "border-amber-500 bg-amber-500/30"
                : "border-foreground/30 bg-foreground/5"
          }`}
        />
        {!isLastItem && (
          <div className="dark:from-foreground/20 mt-2 h-8 w-0.5 bg-linear-to-b from-black/30 to-transparent" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* Time */}
        <div className="mb-1 flex items-center gap-2">
          <p className="text-primary text-sm font-semibold">{item.waktu}</p>
          {isFocus && (
            <span className="bg-primary/20 text-primary inline-block rounded-full px-2 py-0.5 text-xs font-medium">
              🎯 Fokus
            </span>
          )}
          {isBreak && (
            <span className="inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-500">
              ☕ Istirahat
            </span>
          )}
        </div>

        {/* Activity */}
        <p className="text-foreground text-sm leading-relaxed">
          {item.kegiatan}
        </p>
      </div>
    </div>
  );
}
