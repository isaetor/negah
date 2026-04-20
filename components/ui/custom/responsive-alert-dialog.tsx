"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../alert-dialog";
import { Button } from "../button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../drawer";

const ResponsiveAlertDialogContext = React.createContext<{
  isMobile: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>({
  isMobile: false,
});

export function ResponsiveAlertDialog({
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

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;

  const lastOpenRef = React.useRef(open);
  const [currentOpen, setCurrentOpen] = React.useState(open);
  const [isSwitching, setIsSwitching] = React.useState(false);

  React.useEffect(() => {
    if (!isSwitching) {
      setCurrentOpen(open);
    }
    lastOpenRef.current = open;
  }, [open, isSwitching]);

  React.useEffect(() => {
    if (lastOpenRef.current && !isSwitching) {
      setIsSwitching(true);
      setCurrentOpen(true);

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

  if (isSwitching) {
    return (
      <ResponsiveAlertDialogContext.Provider
        value={{ isMobile, open: currentOpen, onOpenChange: handleOpenChange }}
      >
        <div style={{ display: "contents" }}>{children}</div>
      </ResponsiveAlertDialogContext.Provider>
    );
  }

  if (isMobile) {
    return (
      <ResponsiveAlertDialogContext.Provider
        value={{
          isMobile: true,
          open: currentOpen,
          onOpenChange: handleOpenChange,
        }}
      >
        <Drawer open={currentOpen} onOpenChange={handleOpenChange}>
          {children}
        </Drawer>
      </ResponsiveAlertDialogContext.Provider>
    );
  }

  return (
    <ResponsiveAlertDialogContext.Provider
      value={{
        isMobile: false,
        open: currentOpen,
        onOpenChange: handleOpenChange,
      }}
    >
      <AlertDialog open={currentOpen} onOpenChange={handleOpenChange}>
        {children}
      </AlertDialog>
    </ResponsiveAlertDialogContext.Provider>
  );
}

export function ResponsiveAlertDialogTrigger({
  children,
  asChild,
  ...props
}: React.ComponentProps<typeof AlertDialogTrigger>) {
  const { isMobile, onOpenChange, open } = React.useContext(
    ResponsiveAlertDialogContext,
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
    <AlertDialogTrigger asChild={asChild} onClick={handleClick} {...props}>
      {children}
    </AlertDialogTrigger>
  );
}

export function ResponsiveAlertDialogContent({
  className,
  size = "default",
  children,
  showDrawerHandle = true,
  ...props
}: React.ComponentProps<typeof AlertDialogContent> & {
  showDrawerHandle?: boolean;
}) {
  const { isMobile } = React.useContext(ResponsiveAlertDialogContext);

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
    <AlertDialogContent size={size} className={className} {...props}>
      {children}
    </AlertDialogContent>
  );
}

export function ResponsiveAlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile } = React.useContext(ResponsiveAlertDialogContext);

  if (isMobile) {
    return <DrawerHeader className={className} {...props} />;
  }

  return <AlertDialogHeader className={className} {...props} />;
}

export function ResponsiveAlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogMedia>) {
  const { isMobile } = React.useContext(ResponsiveAlertDialogContext);

  if (isMobile) {
    return (
      <div
        data-slot="responsive-alert-dialog-media"
        className={className}
        {...props}
      />
    );
  }

  return <AlertDialogMedia className={className} {...props} />;
}

export function ResponsiveAlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogTitle>) {
  const { isMobile } = React.useContext(ResponsiveAlertDialogContext);

  if (isMobile) {
    return <DrawerTitle className={className} {...props} />;
  }

  return <AlertDialogTitle className={className} {...props} />;
}

export function ResponsiveAlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogDescription>) {
  const { isMobile } = React.useContext(ResponsiveAlertDialogContext);

  if (isMobile) {
    return <DrawerDescription className={className} {...props} />;
  }

  return <AlertDialogDescription className={className} {...props} />;
}

export function ResponsiveAlertDialogFooter({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  const { isMobile } = React.useContext(ResponsiveAlertDialogContext);

  if (isMobile) {
    return (
      <DrawerFooter className={cn(className, "grid grid-cols-3")} {...props}>
        {children}
        {showCloseButton && (
          <ResponsiveAlertDialogCancel asChild>
            <Button variant="outline" className="col-span-1">
              انصراف
            </Button>
          </ResponsiveAlertDialogCancel>
        )}
      </DrawerFooter>
    );
  }

  return (
    <AlertDialogFooter className={className} {...props}>
      {showCloseButton && (
        <ResponsiveAlertDialogCancel asChild>
          <Button variant="outline">انصراف</Button>
        </ResponsiveAlertDialogCancel>
      )}
      {children}
    </AlertDialogFooter>
  );
}

export function ResponsiveAlertDialogAction({
  children,
  variant = "default",
  size = "default",
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogAction>) {
  const { isMobile, onOpenChange } = React.useContext(
    ResponsiveAlertDialogContext,
  );

  const handleClick = React.useCallback(() => {
    onOpenChange?.(false);
  }, [onOpenChange]);

  if (isMobile) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <AlertDialogAction
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {children}
    </AlertDialogAction>
  );
}

function ResponsiveAlertDialogCancel({
  children,
  variant = "outline",
  size = "sm",
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogCancel>) {
  const { isMobile, onOpenChange } = React.useContext(
    ResponsiveAlertDialogContext,
  );

  const handleClick = React.useCallback(() => {
    onOpenChange?.(false);
  }, [onOpenChange]);

  if (isMobile) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <AlertDialogCancel
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {children}
    </AlertDialogCancel>
  );
}
