"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

async function fetchArchivedItems() {
  const res = await fetch("/api/boards/archived"); // This route needs to be created
  if (!res.ok) {
    throw new Error("Failed to fetch archived items");
  }
  return res.json();
}

async function restoreItem(item: { id: string; type: "Column" | "Card" }) {
  const { id, type } = item;
  const res = await fetch(`/api/${type.toLowerCase()}s/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to restore ${type}`);
  }
  return res.json();
}

async function deleteItem(item: { id: string; type: "Column" | "Card" }) {
  const { id, type } = item;
  const res = await fetch(`/api/${type.toLowerCase()}s/${id}`,
    {
      method: "DELETE",
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to delete ${type}`);
  }
  return res.json();
}

export function TrashView() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["archived"],
    queryFn: fetchArchivedItems,
  });

  const { mutate: restore } = useMutation({ 
    mutationFn: restoreItem, 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived"] });
      queryClient.invalidateQueries({ queryKey: ["board"] });
    }
  });

  const { mutate: deletePermanently } = useMutation({ 
    mutationFn: deleteItem, 
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived"] });
    }
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Trash</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Archived Items</SheetTitle>
        </SheetHeader>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="mt-4">
            <h3 className="font-bold">Columns</h3>
            {data.columns.map((column: any) => (
              <div key={column.id} className="flex justify-between items-center p-2">
                <p>{column.title}</p>
                <div>
                  <Button onClick={() => restore({ id: column.id, type: "Column" })}>Restore</Button>
                  <Button onClick={() => deletePermanently({ id: column.id, type: "Column" })} variant="destructive">Delete</Button>
                </div>
              </div>
            ))}
            <h3 className="font-bold mt-4">Cards</h3>
            {data.cards.map((card: any) => (
              <div key={card.id} className="flex justify-between items-center p-2">
                <p>{card.title}</p>
                <div>
                  <Button onClick={() => restore({ id: card.id, type: "Card" })}>Restore</Button>
                  <Button onClick={() => deletePermanently({ id: card.id, type: "Card" })} variant="destructive">Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
