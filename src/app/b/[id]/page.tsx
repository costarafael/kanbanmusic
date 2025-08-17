"use client";

import { Board } from "@/components/board/Board";
import { use } from "react";

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Board boardId={id} />;
}
