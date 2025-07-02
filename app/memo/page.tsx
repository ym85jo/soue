"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader as DialogHeaderUI,
  DialogTitle as DialogTitleUI,
  DialogFooter as DialogFooterUI,
  DialogClose,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

export default function MemoPage() {
  const [memo, setMemo] = useLocalStorage<string>("memo", "");
  const [draftMemo, setDraftMemo] = useState(memo);
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // textarea 자동 포커스
  const handleFocus = () => {
    textareaRef.current?.focus();
  };

  // 저장 버튼 클릭 시
  const handleSave = () => {
    setMemo(draftMemo);
    toast.success("저장 되었습니다");
  };

  // 초기화 버튼 클릭 시
  const handleReset = () => {
    setMemo("");
    setDraftMemo("");
    setOpen(false);
    setTimeout(handleFocus, 100); // 초기화 후 포커스
  };

  // memo가 바뀌면 draftMemo도 동기화
  useEffect(() => {
    setDraftMemo(memo);
  }, [memo]);

  return (
    <div
      className="p-6 max-w-[920px] mx-auto min-h-screen flex flex-col"
      style={{ minHeight: "calc(100vh - 140px)" }} // 헤더 64px, 푸터 56px
    >
      <h1 className="text-2xl">메모장</h1>
      <div className="mt-4 flex flex-col w-full flex-1">
        <Card className="w-full max-w-2xl mx-auto flex flex-col flex-1">
          <CardHeader>
            <CardTitle>메모</CardTitle>
            <CardAction>
              <div className="flex gap-2">
                <button
                  className="text-xs px-3 py-1 modern-border-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                  type="button"
                  onClick={handleSave}
                >
                  저장
                </button>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <button
                      className="text-xs px-3 py-1 modern-border-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                      type="button"
                    >
                      초기화
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeaderUI>
                      <DialogTitleUI>메모를 초기화할까요?</DialogTitleUI>
                    </DialogHeaderUI>
                    <p className="text-sm text-muted-foreground">
                      작성한 모든 메모가 삭제됩니다. 이 작업은 되돌릴 수
                      없습니다.
                    </p>
                    <DialogFooterUI>
                      <DialogClose asChild>
                        <button
                          className="px-4 py-2 modern-border-sm bg-gray-200 hover:bg-gray-300 text-gray-700"
                          type="button"
                        >
                          취소
                        </button>
                      </DialogClose>
                      <button
                        className="px-4 py-2 modern-border-sm bg-red-500 hover:bg-red-600 text-white"
                        type="button"
                        onClick={handleReset}
                      >
                        초기화
                      </button>
                    </DialogFooterUI>
                  </DialogContent>
                </Dialog>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <Textarea
              ref={textareaRef}
              className="w-full h-full resize-none flex-1"
              placeholder="여기에 메모를 입력하세요..."
              value={draftMemo}
              onChange={(e) => setDraftMemo(e.target.value)}
              spellCheck={false}
              autoFocus
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
