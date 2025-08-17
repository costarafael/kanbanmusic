"use client";

import { useState, useEffect } from "react";

interface RichTextEditorProps {
  content: object | string;
  onChange: (content: object) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [textValue, setTextValue] = useState("");

  // Convert content to string format for display
  useEffect(() => {
    try {
      if (!content) {
        setTextValue("");
        return;
      }

      if (typeof content === "string") {
        setTextValue(content);
        return;
      }

      // If content is an object (from Yoopta or other formats), try to extract text
      if (typeof content === "object" && content !== null) {
        // Try to extract text from Yoopta format
        const keys = Object.keys(content);
        if (keys.length > 0) {
          const firstBlock = content[keys[0] as keyof typeof content];
          if (typeof firstBlock === "object" && firstBlock !== null && 'children' in firstBlock) {
            const children = (firstBlock as any).children;
            if (Array.isArray(children) && children.length > 0 && children[0] && 'text' in children[0]) {
              setTextValue(children[0].text || "");
              return;
            }
          }
        }
        // Fallback: convert object to JSON string
        setTextValue(JSON.stringify(content));
      } else {
        setTextValue("");
      }
    } catch (error) {
      console.warn('Error parsing content:', error);
      setTextValue("");
    }
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTextValue(newValue);
    
    // Convert back to object format for compatibility
    const contentObject = {
      "paragraph-1": {
        id: "paragraph-1",
        type: "paragraph",
        children: [{ text: newValue }],
        props: {},
      },
    };
    
    onChange(contentObject);
  };

  return (
    <div className="border rounded-md min-h-[200px]">
      <textarea
        value={textValue}
        onChange={handleChange}
        placeholder="Digite a descrição do card..."
        className="w-full min-h-[200px] border-none resize-none p-4 outline-none focus:ring-0"
        style={{
          width: "100%",
          minHeight: "200px",
        }}
      />
    </div>
  );
}
