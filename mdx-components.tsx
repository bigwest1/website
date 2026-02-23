import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 className="mdx-h1" {...props} />,
    h2: (props) => <h2 className="mdx-h2" {...props} />,
    h3: (props) => <h3 className="mdx-h3" {...props} />,
    p: (props) => <p className="mdx-p" {...props} />,
    ul: (props) => <ul className="mdx-ul" {...props} />,
    ol: (props) => <ol className="mdx-ol" {...props} />,
    blockquote: (props) => <blockquote className="mdx-quote" {...props} />,
    ...components
  };
}
