import type { ReactNode } from "react";

import { Icon } from "@/components/erp/icon";

export function ModulePlaceholder({
  icon,
  title,
  kicker,
  description,
  children,
}: {
  icon: string;
  title: string;
  kicker: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-space-lg px-space-base py-space-lg sm:px-space-lg lg:px-space-xl">
      <div className="flex flex-col gap-space-2xs">
        <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
          {kicker}
        </span>
        <h1 className="font-headline-lg text-headline-lg tracking-tight text-primary">
          {title}
        </h1>
        <p className="max-w-3xl font-body-md text-body-md text-on-surface-variant">{description}</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-space-sm rounded-xl bg-surface-container-lowest p-space-2xl text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-fixed text-primary">
          <Icon name={icon} className="text-[28px]" />
        </div>
        <span className="font-headline-sm text-headline-sm text-on-surface">{title}</span>
        <p className="max-w-md font-body-sm text-body-sm text-on-surface-variant">
          This module is queued in the Operations Core build. The Overview dashboard and the CSV
          Data Hub are live — this screen will follow the same design system.
        </p>
        {children}
      </div>
    </div>
  );
}
