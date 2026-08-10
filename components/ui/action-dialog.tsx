"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

const ActionDialogContext = createContext<{ close: () => void }>({ close: () => {} });

export function useActionDialog() {
  return useContext(ActionDialogContext);
}

export function ActionDialog({
  title,
  description,
  triggerLabel,
  triggerVariant = "outline",
  children,
}: {
  title: string;
  description?: string;
  triggerLabel: string;
  triggerVariant?: ButtonProps["variant"];
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && dialog && !dialog.open) dialog.showModal();
  }, [isOpen]);

  return (
    <ActionDialogContext.Provider value={{ close: () => setIsOpen(false) }}>
      <Button
        ref={triggerRef}
        type="button"
        variant={triggerVariant}
        onClick={() => setIsOpen(true)}
      >
        {triggerLabel}
      </Button>
      {isOpen ? (
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className="m-auto max-h-[calc(100vh-2rem)] w-[calc(100%_-_2rem)] max-w-lg rounded-xl border bg-background p-6 text-foreground shadow-lg backdrop:bg-black/50"
          onCancel={(event) => {
            event.preventDefault();
            setIsOpen(false);
          }}
          onClose={() => {
            setIsOpen(false);
            triggerRef.current?.focus();
          }}
        >
          <div
            className="max-h-[calc(100vh-5rem)] overflow-y-auto"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-lg font-semibold">
                  {title}
                </h2>
                {description ? (
                  <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                ) : null}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
            {children}
          </div>
        </dialog>
      ) : null}
    </ActionDialogContext.Provider>
  );
}
