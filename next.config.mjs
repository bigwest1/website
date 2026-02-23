import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.(md|mdx)$/
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/page-portfolio.html", destination: "/projects", permanent: true },
      { source: "/page-portfolio-detail.html", destination: "/projects/etfo-elementary-teachers-federation-of-ontario", permanent: true },
      { source: "/p-helmsley.html", destination: "/projects/helmsley-charitable-trust", permanent: true },
      { source: "/page-blog.html", destination: "/blog", permanent: true },
      { source: "/page-blog-ai.php", destination: "/blog/ai-ux-tools-play-nice", permanent: true },
      { source: "/page-blog-xd.php", destination: "/blog/adobe-xd-sunset", permanent: true },
      { source: "/page-blog-ai-accessibility.php", destination: "/blog/ai-accessibility-audits", permanent: true },
      { source: "/page-blog-ai-personas.php", destination: "/blog/ai-powered-personas", permanent: true },
      { source: "/page-blog-ai-prototype-figma.php", destination: "/blog/ai-figma-prototyping", permanent: true },
      { source: "/page-blog-ai-remote-test.php", destination: "/blog/ai-remote-usability-testing", permanent: true },
      { source: "/page-blog-ux-ai-automation.php", destination: "/blog/ux-workflow-automation", permanent: true },
      { source: "/page-blog-figma-to-frontend.php", destination: "/blog/figma-to-frontend-handoff", permanent: true },
      { source: "/page-blog-nocode-stack.php", destination: "/blog/no-code-platforms-for-ux", permanent: true },
      { source: "/page-blog-detail.html", destination: "/blog/ai-ux-tools-play-nice", permanent: true },
      { source: "/page-contact.html", destination: "/contact", permanent: true },
      { source: "/view-photos.html", destination: "/about/photos", permanent: true },
      { source: "/index-animation.html", destination: "/lab/animation", permanent: true },
      { source: "/index-boxed.html", destination: "/lab/boxed", permanent: true },
      { source: "/index-image.html", destination: "/lab/image", permanent: true },
      { source: "/index-parallax.html", destination: "/lab/parallax", permanent: true },
      { source: "/index-particles.html", destination: "/lab/particles", permanent: true },
      { source: "/index-ripple.html", destination: "/lab/ripple", permanent: true },
      { source: "/index-routed.html", destination: "/lab/routed", permanent: true },
      { source: "/index-slider.html", destination: "/lab/slider", permanent: true },
      { source: "/index-typed.html", destination: "/lab/typed", permanent: true },
      { source: "/:path*.php", destination: "/", permanent: true }
    ];
  }
};

export default withMDX(nextConfig);
