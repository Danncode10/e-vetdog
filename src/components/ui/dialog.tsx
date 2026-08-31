"use client";

import * as React from "react";

type DialogProps = {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function Dialog({ children, open, onOpenChange }: DialogProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none bg-background/80 backdrop-blur-sm p-4 flex items-center justify-center border-0 outline-none open:flex"
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </dialog>
  );
}