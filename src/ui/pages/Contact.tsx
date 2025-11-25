import { Github, Globe, Mail, Send } from "lucide-react";
import PageTitle from "../components/PageTitle";

function Contact() {
  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "team@vectoragent.io",
      href: "mailto:team@vectoragent.io",
    },
    {
      icon: Globe,
      label: "Website",
      value: "vectoragent.io",
      href: "https://vectoragent.io",
    },
    {
      icon: Github,
      label: "GitHub",
      value: "github.com/error404ai/VectorAIAgent",
      href: "https://github.com/error404ai/VectorAIAgent",
    },
    {
      icon: Send,
      label: "X (Twitter)",
      value: "@VectorAIAgent",
      href: "https://x.com/VectorAIAgent",
    },
  ];

  const handleOpenLink = (href: string) => {
    window.open(href, "_blank");
  };

  return (
    <div className="flex h-full flex-col select-none">
      <div className="flex-shrink-0">
        <PageTitle title="Contact" />
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="flex gap-3">
          {/* Left Column - Contact Information */}
          <div className="w-full">
            <div className="p-4">
              <h3 className="mb-3 text-sm font-medium text-white">
                Get in Touch
              </h3>
              <div className="space-y-3">
                {contactInfo.map((contact) => (
                  <div
                    key={contact.label}
                    className="flex cursor-pointer items-center gap-3 border border-white/10 bg-black/20 p-3 transition-colors hover:bg-white/10"
                    onClick={() => handleOpenLink(contact.href)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center bg-blue-500/20">
                      <contact.icon size={20} className="text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white/60">
                        {contact.label}
                      </div>
                      <div className="truncate text-white">{contact.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Information */}
            <div className="p-4">
              <h3 className="mb-3 text-sm font-medium text-white">
                Support Hours
              </h3>
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span>9:00 AM - 6:00 PM (UTC)</span>
                </div>
                <div className="flex justify-between">
                  <span>Weekend:</span>
                  <span>Limited support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - About & Quick Actions */}
          <div className="w-full">
            <div className="p-4">
              <h3 className="mb-3 text-sm font-medium text-white">
                About Vector AI Agent
              </h3>
              <div className="space-y-3 text-sm text-white/70">
                <p>
                  Vector AI Agent is an advanced automation tool designed to
                  help you streamline your workflow and automate repetitive
                  tasks using AI-powered browser automation.
                </p>
                <p>
                  Our team is dedicated to providing the best experience for our
                  users. If you have any questions, suggestions, or need
                  support, please don't hesitate to reach out through any of the
                  contact channels listed.
                </p>
              </div>
            </div>

            {/* Response Times */}
            <div className="p-4">
              <h3 className="mb-3 text-sm font-medium text-white">
                Response Times
              </h3>
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span>Within 24-48 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Social Media:</span>
                  <span>Within a few hours</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4">
              <h3 className="mb-3 text-sm font-medium text-white">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    handleOpenLink(
                      "https://github.com/error404ai/VectorAIAgent/blob/main/README.md",
                    )
                  }
                  className="flex flex-col items-center gap-2 border border-white/10 bg-black/20 p-3 text-center transition-colors hover:bg-white/10"
                >
                  <Globe size={20} className="text-blue-400" />
                  <span className="text-xs text-white">Documentation</span>
                </button>
                <button
                  onClick={() =>
                    handleOpenLink(
                      "https://github.com/error404ai/VectorAIAgent/issues",
                    )
                  }
                  className="flex flex-col items-center gap-2 border border-white/10 bg-black/20 p-3 text-center transition-colors hover:bg-white/10"
                >
                  <Mail size={20} className="text-green-400" />
                  <span className="text-xs text-white">Report Issue</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
