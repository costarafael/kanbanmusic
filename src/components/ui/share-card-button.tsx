"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface ShareCardButtonProps {
  cardId: string;
  boardId: string;
}

export function ShareCardButton({ cardId, boardId }: ShareCardButtonProps) {
  const [copied, setCopied] = useState(false);

  const generateCardUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/b/${boardId}?card=${cardId}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareUrl = generateCardUrl();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={() => copyToClipboard(shareUrl)}
          className="flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Link copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy card link</span>
            </>
          )}
        </DropdownMenuItem>
        
        {/* Web Share API if available */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <DropdownMenuItem 
            onClick={() => {
              navigator.share({
                title: 'Card Link',
                url: shareUrl,
              }).catch(err => console.log('Error sharing:', err));
            }}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Share card</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}