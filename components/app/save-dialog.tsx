import { Plus } from "lucide-react";
import { useState } from "react";
import type { MediaType } from "@/generated/prisma/browser";
import { Button } from "../ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "../ui/custom/responsive-dialog";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedPost?: {
    media: {
      height: number | null;
      type: MediaType;
      width: number | null;
      url: string;
    }[];
    id: string;
    title: string | null;
    url: string | null;
  } | null;
  setSelectedPost: (post: Props["selectedPost"]) => void;
};

type Board = {
  id: string;
  name: string;
  icon?: string;
  postCount: number;
};

const SaveDialog = ({
  open,
  setOpen,
  selectedPost,
  setSelectedPost,
}: Props) => {
  const [boards, setBoards] = useState<Board[]>([
    { id: "1", name: "علاقه‌مندی‌ها", postCount: 12 },
    { id: "2", name: "بعدا ببینم", postCount: 5 },
    { id: "3", name: "الهام بخش", postCount: 8 },
  ]);
  const handleSaveToBoard = (boardId: string) => {
    // منطق ذخیره پست در برد مورد نظر
    console.log(`Saving post ${selectedPost?.id} to board ${boardId}`);

    // به‌روزرسانی تعداد پست‌های برد
    setBoards(
      boards.map((board) =>
        board.id === boardId
          ? { ...board, postCount: board.postCount + 1 }
          : board,
      ),
    );

    // بستن دیالوگ و نمایش پیام موفقیت
    setOpen(false);
    setSelectedPost(null);

    // می‌توانید یک toast یا notification هم اضافه کنید
    alert(
      `پست در برد "${boards.find((b) => b.id === boardId)?.name}" ذخیره شد`,
    );
  };
  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>ذخیره در برد</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            انتخاب کنید می‌خواهید این پست را در کدام برد ذخیره کنید
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="flex flex-col gap-2 py-4">
          {boards.map((board) => (
            <button
              type="button"
              key={board.id}
              onClick={() => handleSaveToBoard(board.id)}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors text-right"
            >
              <span className="text-sm text-muted-foreground">
                {board.postCount} پست
              </span>
              <div className="flex items-center gap-3">
                <span className="font-medium">{board.name}</span>
                {board.icon && <span>{board.icon}</span>}
              </div>
            </button>
          ))}
        </div>

        <ResponsiveDialogFooter className="flex-col gap-2">
          <Button
            variant="outline"
            className="w-full"
            // onClick={() => setIsCreateBoardDialogOpen(true)}
          >
            <Plus className="ml-2 h-4 w-4" />
            ساخت برد جدید
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};

export default SaveDialog;
