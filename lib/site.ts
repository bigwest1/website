export const siteConfig = {
  name: "Jesse Westlund",
  title: "Jesse Westlund | UX Designer, Strategist, and Interaction Specialist",
  description:
    "A creative, modern UX portfolio blending strategy, interaction design, and product thinking. Explore work, process, and stories that showcase why Jesse Westlund is the UX designer teams trust.",
  url: "https://www.jessewestlund.com",
  linkedin: "https://www.linkedin.com/in/jessewestlund/",
  email: "jwestlund@jessewestlund.com",
  phone: "+1 (952) 457-5635",
  location: "Savage, Minnesota"
};

export const primaryNav = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
] as const;

export const resourceLinks = [
  {
    href: "/Jesse_Westlund_UX_Designer_Resume.pdf",
    label: "Resume PDF"
  },
  {
    href: "/Jesse_Westlund_UX_Designer_Resume.docx",
    label: "Resume Word"
  }
] as const;
