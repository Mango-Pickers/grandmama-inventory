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
    <div className="mx-auto flex w-full max-w-360 min-w-0 flex-col gap-5 px-4 py-6 sm:gap-space-lg sm:px-6 sm:py-8 lg:px-space-xl">
      <div className="flex flex-col gap-space-2xs">
        <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
          {kicker}
        </span>
        <h1 className="text-2xl font-semibold text-primary sm:font-headline-lg sm:text-headline-lg">
          {title}
        </h1>
        <p className="max-w-3xl font-body-md text-body-md text-on-surface-variant">{description}</p>
      </div>

      <div className="flex min-h-64 flex-col items-center justify-center gap-space-sm rounded-xl bg-surface-container-lowest p-6 text-center shadow-sm sm:p-10 lg:p-space-2xl">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-primary sm:h-14 sm:w-14">
          <Icon name={icon} className="text-[28px]" />
        </div>
        <span className="font-headline-sm text-headline-sm text-on-surface">{title}</span>
        <p className="max-w-md font-body-sm text-body-sm text-on-surface-variant">
          This area is ready for implementation after its data fields and Firestore workflow are defined.
        </p>
        {children}
      </div>
    </div>
  );
}
