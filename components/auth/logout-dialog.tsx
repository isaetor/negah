import { Loader2, LogOut } from "lucide-react";
import { useTransition } from "react";
import { Logout } from "@/actions/auth";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/components/ui/custom/responsive-alert-dialog";
import { Button } from "../ui/button";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const LogoutDialog = ({ open, setOpen }: Props) => {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await Logout();
      setOpen(false);
    });
  };
  return (
    <ResponsiveAlertDialog open={open} onOpenChange={setOpen}>
      <ResponsiveAlertDialogContent>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>
            از حساب کاربری خارج می‌شوید؟
          </ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            با این کار از حساب کاربری خود خارج می‌شوید و برای دسترسی مجدد باید
            دوباره وارد شوید.
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>
        <ResponsiveAlertDialogFooter>
          <Button
            variant="outlineDestructive"
            size="sm"
            className="col-span-2 md:w-40"
            onClick={handleLogout}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <LogOut />
                <span>خروج از حساب کاربری</span>
              </>
            )}
          </Button>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogContent>
    </ResponsiveAlertDialog>
  );
};

export default LogoutDialog;
