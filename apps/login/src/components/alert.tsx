import { ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { clsx } from "clsx";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  type?: AlertType;
};

export enum AlertType {
  ALERT,
  INFO,
}

const yellow =
  "border-state-alert-light-color/40 dark:border-state-alert-dark-color/20 bg-state-alert-light-background text-state-alert-light-color dark:bg-state-alert-dark-background dark:text-state-alert-dark-color";
// const red =
//   "border-state-error-light-color/40 dark:border-state-error-dark-color/20 bg-state-error-light-background text-state-error-light-color dark:bg-state-error-dark-background dark:text-state-error-dark-color";
const neutral = "border-divider-light dark:border-divider-dark bg-black/5 text-gray-600 dark:bg-white/10 dark:text-gray-200";

export function Alert({ children, type = AlertType.ALERT }: Props) {
  return (
    <div
      className={clsx("flex scroll-px-40 flex-row items-center justify-center rounded-md border py-2 pr-2", {
        [yellow]: type === AlertType.ALERT,
        [neutral]: type === AlertType.INFO,
      })}
    >
      {type === AlertType.ALERT && <ExclamationTriangleIcon className="mr-2 ml-2 h-5 w-5 flex-shrink-0" />}
      {type === AlertType.INFO && <InformationCircleIcon className="mr-2 ml-2 h-5 w-5 flex-shrink-0" />}
      <span className="w-full text-sm">{children}</span>
    </div>
  );
}
