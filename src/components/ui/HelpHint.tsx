import { HelpCircle } from "lucide-react";

/** Small "?" icon that shows an explanatory tooltip on hover (native `title`, so it
 * works everywhere with no extra JS) -- for a field whose purpose isn't obvious from
 * its label alone. */
export function HelpHint({ text }: { text: string }) {
  return (
    <span title={text} className="inline-flex shrink-0 cursor-help align-middle text-zinc-400 hover:text-zinc-600">
      <HelpCircle className="h-3.5 w-3.5" />
    </span>
  );
}
