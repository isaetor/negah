"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "../dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../drawer";

// Context for sharing state with subcomponents
const ResponsiveDialogContext = React.createContext<{
  isMobile: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>({
  isMobile: false,
});

export function ResponsiveDialog({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = React.useState(false);

  // پشتیبانی از حالت controlled و uncontrolled
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  // ذخیره آخرین state باز بودن برای جلوگیری از بسته شدن ناگهانی
  const lastOpenRef = React.useRef(open);
  const [currentOpen, setCurrentOpen] = React.useState(open);
  const [isSwitching, setIsSwitching] = React.useState(false);

  // وقتی open تغییر می‌کند، currentOpen را به‌روز کن
  React.useEffect(() => {
    if (!isSwitching) {
      setCurrentOpen(open);
    }
    lastOpenRef.current = open;
  }, [open, isSwitching]);

  // وقتی سایز صفحه تغییر می‌کند، اگر دیالوگ باز بود، آن را بسته نگه دار
  React.useEffect(() => {
    if (lastOpenRef.current && !isSwitching) {
      // اگر دیالوگ باز بود و سایز صفحه عوض شد، آن را بسته نگه می‌داریم
      setIsSwitching(true);
      setCurrentOpen(true);

      // بعد از یک تیک، سوئیچینگ را تمام کن
      const timeout = setTimeout(() => {
        setIsSwitching(false);
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [isSwitching]);

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!isSwitching) {
        setCurrentOpen(newOpen);
        onOpenChange(newOpen);
      }
    },
    [onOpenChange, isSwitching],
  );

  // اگر در حال سوئیچ هستیم، فقط یک wrapper خالی برگردان
  if (isSwitching) {
    return (
      <ResponsiveDialogContext.Provider
        value={{ isMobile, open: currentOpen, onOpenChange: handleOpenChange }}
      >
        <div style={{ display: "contents" }}>{children}</div>
      </ResponsiveDialogContext.Provider>
    );
  }

  if (isMobile) {
    return (
      <ResponsiveDialogContext.Provider
        value={{
          isMobile: true,
          open: currentOpen,
          onOpenChange: handleOpenChange,
        }}
      >
        <Drawer open={currentOpen} onOpenChange={handleOpenChange}>
          {children}
        </Drawer>
      </ResponsiveDialogContext.Provider>
    );
  }

  return (
    <ResponsiveDialogContext.Provider
      value={{
        isMobile: false,
        open: currentOpen,
        onOpenChange: handleOpenChange,
      }}
    >
      <Dialog open={currentOpen} onOpenChange={handleOpenChange}>
        {children}
      </Dialog>
    </ResponsiveDialogContext.Provider>
  );
}

export function ResponsiveDialogTrigger({
  children,
  asChild,
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  const { isMobile, onOpenChange, open } = React.useContext(
    ResponsiveDialogContext,
  );

  const handleClick = React.useCallback(() => {
    onOpenChange?.(!open);
  }, [onOpenChange, open]);

  if (isMobile) {
    return (
      <DrawerTrigger asChild={asChild} onClick={handleClick} {...props}>
        {children}
      </DrawerTrigger>
    );
  }

  return (
    <DialogTrigger asChild={asChild} onClick={handleClick} {...props}>
      {children}
    </DialogTrigger>
  );
}

export function ResponsiveDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogContent> & {
  showDrawerHandle?: boolean;
}) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);
  const showDrawerHandle = props.showDrawerHandle ?? true;

  if (isMobile) {
    return (
      <DrawerContent
        isShowHandel={showDrawerHandle}
        className={className}
        {...props}
      >
        {children}
      </DrawerContent>
    );
  }

  return (
    <DialogContent className={className} {...props}>
      {children}
    </DialogContent>
  );
}

export function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return <DrawerHeader className={className} {...props} />;
  }

  return <DialogHeader className={className} {...props} />;
}

export function ResponsiveDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return <DrawerTitle className={className} {...props} />;
  }

  return <DialogTitle className={className} {...props} />;
}

export function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return <DrawerDescription className={className} {...props} />;
  }

  return <DialogDescription className={className} {...props} />;
}

export function ResponsiveDialogFooter({
  className,
  showCloseButton = true,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  const { isMobile } = React.useContext(ResponsiveDialogContext);

  if (isMobile) {
    return (
      <DrawerFooter className={cn(className, "grid grid-cols-3")} {...props}>
        {children}
        {showCloseButton && (
          <ResponsiveDialogClose asChild>
            <Button variant="outline" className="col-span-1">
              انصراف
            </Button>
          </ResponsiveDialogClose>
        )}
      </DrawerFooter>
    );
  }

  return (
    <DialogFooter className={className} {...props}>
      {showCloseButton && (
        <ResponsiveDialogClose asChild>
          <Button variant="outline">انصراف</Button>
        </ResponsiveDialogClose>
      )}
      {children}
    </DialogFooter>
  );
}

function ResponsiveDialogClose({
  children,
  asChild,
  ...props
}: React.ComponentProps<typeof DialogClose>) {
  const { isMobile, onOpenChange } = React.useContext(ResponsiveDialogContext);

  const handleClick = React.useCallback(() => {
    onOpenChange?.(false);
  }, [onOpenChange]);

  if (isMobile) {
    return (
      <DrawerClose asChild={asChild} onClick={handleClick} {...props}>
        {children}
      </DrawerClose>
    );
  }

  return (
    <DialogClose asChild={asChild} onClick={handleClick} {...props}>
      {children}
    </DialogClose>
  );
}

export { DialogPortal as ResponsiveDialogPortal };
