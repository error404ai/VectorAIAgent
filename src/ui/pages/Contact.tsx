import { Github, Globe, Mail, MessageSquare, Send } from "lucide-react";
import Card from "../components/Card";
import PageTitle from "../components/PageTitle";

function Contact() {
  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "support@vectoraiagent.com",
      href: "mailto:support@vectoraiagent.com",
    },
    {
      icon: Globe,
      label: "Website",
      value: "www.vectoragent.io",
      href: "https://www.vectoragent.io",
    },
    {
      icon: Github,
      label: "GitHub",
      value: "github.com/error404ai/VectorAIAgent",
      href: "https://github.com/error404ai/VectorAIAgent",
    },
    {
      icon: Send,
      label: "Telegram",
      value: "@vectoraiagent",
      href: "https://t.me/vectoraiagent",
    },
    {
      icon: MessageSquare,
      label: "Discord",
      value: "discord.gg/vectoraiagent",
      href: "https://discord.gg/vectoraiagent",
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Contact Information */}
          <Card>
            <h3 className="mb-4 text-lg font-medium text-white">
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
                    <div className="text-sm text-white/60">{contact.label}</div>
                    <div className="truncate text-white">{contact.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* About Section */}
          <Card>
            <h3 className="mb-4 text-lg font-medium text-white">
              About Vector AI Agent
            </h3>
            <div className="space-y-4 text-sm text-white/70">
              <p>
                Vector AI Agent is an advanced automation tool designed to help
                you streamline your workflow and automate repetitive tasks using
                AI-powered browser automation.
              </p>
              <p>
                Our team is dedicated to providing the best experience for our
                users. If you have any questions, suggestions, or need support,
                please don't hesitate to reach out through any of the contact
                channels listed.
              </p>
              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 font-medium text-white">Support Hours</h4>
                <p>Monday - Friday: 9:00 AM - 6:00 PM (UTC)</p>
                <p>Weekend: Limited support via Discord</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <h4 className="mb-2 font-medium text-white">Response Time</h4>
                <p>Email: Within 24-48 hours</p>
                <p>Discord/Telegram: Within a few hours</p>
              </div>
            </div>
          </Card>

          {/* Quick Links */}
          <Card className="lg:col-span-2">
            <h3 className="mb-4 text-lg font-medium text-white">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button
                onClick={() =>
                  handleOpenLink(
                    "https://github.com/error404ai/VectorAIAgent/blob/main/README.md",
                  )
                }
                className="flex flex-col items-center gap-2 border border-white/10 bg-black/20 p-4 transition-colors hover:bg-white/10"
              >
                <Globe size={24} className="text-blue-400" />
                <span className="text-sm text-white">Documentation</span>
              </button>
              <button
                onClick={() =>
                  handleOpenLink(
                    "https://github.com/error404ai/VectorAIAgent/issues",
                  )
                }
                className="flex flex-col items-center gap-2 border border-white/10 bg-black/20 p-4 transition-colors hover:bg-white/10"
              >
                <MessageSquare size={24} className="text-green-400" />
                <span className="text-sm text-white">Report Issue</span>
              </button>
              <button
                onClick={() =>
                  handleOpenLink(
                    "https://github.com/error404ai/VectorAIAgent/releases",
                  )
                }
                className="flex flex-col items-center gap-2 border border-white/10 bg-black/20 p-4 transition-colors hover:bg-white/10"
              >
                <Github size={24} className="text-purple-400" />
                <span className="text-sm text-white">Releases</span>
              </button>
              <button
                onClick={() =>
                  handleOpenLink(
                    "https://github.com/error404ai/VectorAIAgent/blob/main/CONTRIBUTING.md",
                  )
                }
                className="flex flex-col items-center gap-2 border border-white/10 bg-black/20 p-4 transition-colors hover:bg-white/10"
              >
                <Send size={24} className="text-orange-400" />
                <span className="text-sm text-white">Contribute</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Contact;
