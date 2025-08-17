"use client";

import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

async function createBoard() {
  const res = await fetch("/api/boards", { method: "POST" });
  if (!res.ok) {
    throw new Error("Failed to create board");
  }
  return res.json();
}

export default function Home() {
  const router = useRouter();
  const { mutate, isPending } = useMutation({
    mutationFn: createBoard,
    onSuccess: (data) => {
      router.push(`/b/${data.id}`);
    },
  });

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Kanban MSC</h1>
        <p className="text-lg text-gray-600 mb-8">A Trello-like Kanban board with integrated audio players.</p>
        <Button onClick={() => mutate()} disabled={isPending}>
          {isPending ? "Creating..." : "Create a New Board"}
        </Button>
      </div>
    </div>
  );
}