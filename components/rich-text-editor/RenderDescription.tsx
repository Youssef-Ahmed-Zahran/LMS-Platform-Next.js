import parse, {
  HTMLReactParserOptions,
  Element,
  domToReact,
} from "html-react-parser";
import type { DOMNode } from "html-react-parser";
import { cn } from "@/lib/utils";

interface RenderDescriptionProps {
  content: string;
  className?: string;
}

const parserOptions: HTMLReactParserOptions = {
  replace(domNode) {
    if (!(domNode instanceof Element)) return;

    const { name, attribs, children } = domNode;

    // Map HTML tags to Tailwind-styled elements
    switch (name) {
      case "h1":
        return (
          <h1 className="text-3xl font-bold tracking-tight mt-6 mb-3 first:mt-0">
            {domToReact(children as DOMNode[], parserOptions)}
          </h1>
        );
      case "h2":
        return (
          <h2 className="text-2xl font-semibold tracking-tight mt-5 mb-2 first:mt-0">
            {domToReact(children as DOMNode[], parserOptions)}
          </h2>
        );
      case "h3":
        return (
          <h3 className="text-xl font-semibold mt-4 mb-2 first:mt-0">
            {domToReact(children as DOMNode[], parserOptions)}
          </h3>
        );
      case "p":
        return (
          <p className="leading-7 [&:not(:first-child)]:mt-3">
            {domToReact(children as DOMNode[], parserOptions)}
          </p>
        );
      case "ul":
        return (
          <ul className="my-4 ml-6 list-disc [&>li]:mt-1.5">
            {domToReact(children as DOMNode[], parserOptions)}
          </ul>
        );
      case "ol":
        return (
          <ol className="my-4 ml-6 list-decimal [&>li]:mt-1.5">
            {domToReact(children as DOMNode[], parserOptions)}
          </ol>
        );
      case "li":
        return (
          <li className="leading-6">
            {domToReact(children as DOMNode[], parserOptions)}
          </li>
        );
      case "strong":
      case "b":
        return (
          <strong className="font-semibold">
            {domToReact(children as DOMNode[], parserOptions)}
          </strong>
        );
      case "em":
      case "i":
        return (
          <em className="italic">
            {domToReact(children as DOMNode[], parserOptions)}
          </em>
        );
      case "a":
        return (
          <a
            href={attribs?.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4 text-primary hover:text-primary/80 transition-colors"
          >
            {domToReact(children as DOMNode[], parserOptions)}
          </a>
        );
      case "blockquote":
        return (
          <blockquote className="mt-4 border-l-4 border-primary/40 pl-4 italic text-muted-foreground">
            {domToReact(children as DOMNode[], parserOptions)}
          </blockquote>
        );
      case "code":
        return (
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
            {domToReact(children as DOMNode[], parserOptions)}
          </code>
        );
      case "pre":
        return (
          <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm">
            {domToReact(children as DOMNode[], parserOptions)}
          </pre>
        );
      case "hr":
        return <hr className="my-6 border-border" />;
      default:
        return undefined; // Let html-react-parser handle the rest
    }
  },
};

/**
 * RenderDescription
 * Safely parses HTML from a rich-text editor and renders it with
 * Tailwind-styled typography components.
 */
export function RenderDescription({
  content,
  className,
}: RenderDescriptionProps) {
  if (!content) return null;

  return (
    <div className={cn("text-sm text-foreground", className)}>
      {parse(content, parserOptions)}
    </div>
  );
}
