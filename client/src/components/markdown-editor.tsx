import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import { 
  Bold, 
  Italic, 
  Code, 
  Heading1, 
  Quote, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Table 
} from "lucide-react";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  preview?: boolean;
}

export default function MarkdownEditor({ content, onChange, preview = false }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(preview);

  const insertText = (before: string, after: string = "", placeholder: string = "") => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newContent = 
      content.substring(0, start) + 
      before + textToInsert + after + 
      content.substring(end);
    
    onChange(newContent);

    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const toolbarActions = [
    { icon: Bold, action: () => insertText("**", "**", "bold text"), title: "Bold" },
    { icon: Italic, action: () => insertText("*", "*", "italic text"), title: "Italic" },
    { icon: Code, action: () => insertText("`", "`", "code"), title: "Inline Code" },
    { separator: true },
    { icon: Heading1, action: () => insertText("# ", "", "Heading"), title: "Heading 1" },
    { icon: Quote, action: () => insertText("> ", "", "Quote"), title: "Quote" },
    { icon: List, action: () => insertText("- ", "", "List item"), title: "Bullet List" },
    { icon: ListOrdered, action: () => insertText("1. ", "", "List item"), title: "Numbered List" },
    { separator: true },
    { icon: Link, action: () => insertText("[", "](url)", "link text"), title: "Link" },
    { icon: Image, action: () => insertText("![", "](image-url)", "alt text"), title: "Image" },
    { icon: Table, action: () => insertText("| Header |\n|--------|\n| Cell   |", "", ""), title: "Table" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {toolbarActions.map((action, index) => (
              action.separator ? (
                <Separator key={index} orientation="vertical" className="h-6 mx-2" />
              ) : (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={action.action}
                  title={action.title}
                  className="p-2 h-8 w-8"
                >
                  {action.icon && <action.icon className="h-4 w-4" />}
                </Button>
              )
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Markdown</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-sm text-gray-500">Preview</span>
          </div>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="flex-1 overflow-hidden">
        {showPreview ? (
          <div className="h-full overflow-auto p-6 prose prose-gray max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Start writing your documentation..."
            className="h-full resize-none border-none rounded-none text-sm font-mono leading-relaxed p-6 focus-visible:ring-0"
          />
        )}
      </div>
    </div>
  );
}
