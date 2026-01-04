import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
import type { AIModelProvider, ModelConfig } from "../../../types/model.js";
import { BROWSER_PATHS } from "../constants.js";

interface AISettings {
  activeProvider: AIModelProvider;
  selectedProvider: AIModelProvider;
  configs: Record<AIModelProvider, ModelConfig>;
  fileUploadDirectory?: string;
}

interface BrowserSettings {
  useSystemBrowser: boolean;
  systemBrowserPath: string;
  defaultUrl: string;
  selectedProfile: string;
  availableProfiles: string[];
}

interface ChromiumStatus {
  isInstalled: boolean;
  version?: string;
  installPath?: string;
  lastChecked?: Date;
}

interface SolanaWallet {
  id: string;
  name: string;
  publicKey: string;
  secretKeyEncrypted: string;
  balance: number;
  profileId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WalletSettings {
  wallets: SolanaWallet[];
}

interface AppSettings {
  ai: AISettings;
  browser: BrowserSettings;
  chromium: ChromiumStatus;
  wallets: WalletSettings;
  agent?: {
    wait_between_actions?: number;
  };
}

export default class SettingsFileManager {
  private static settingsPath: string = path.join(
    app.getPath("userData"),
    "settings.json",
  );

  private static defaultSettings: AppSettings = {
    ai: {
      activeProvider: "openai",
      selectedProvider: "openai",
      configs: {
        openai: {
          provider: "openai",
          model: "gpt-4o",
          apiKey: "",
          temperature: 0.7,
          maxTokens: 4096,
        },
        anthropic: {
          provider: "anthropic",
          model: "claude-3-5-sonnet-20241022",
          apiKey: "",
          temperature: 0.7,
          maxTokens: 4096,
        },
        google: {
          provider: "google",
          model: "gemini-2.0-flash-exp",
          apiKey: "",
          temperature: 0.7,
          maxTokens: 4096,
        },
        deepseek: {
          provider: "deepseek",
          model: "deepseek-chat",
          apiKey: "",
          baseUrl: "https://api.deepseek.com/v1",
          temperature: 0.7,
          maxTokens: 4096,
        },
        openrouter: {
          provider: "openrouter",
          model: "moonshotai/kimi-k2",
          apiKey: "",
          baseUrl: "https://openrouter.ai/api/v1",
          temperature: 0.7,
          maxTokens: 4096,
          useVision: false,
        },
        groq: {
          provider: "groq",
          model: "meta-llama/llama-4-maverick-17b-128e-instruct",
          apiKey: "",
          baseUrl: "https://api.groq.com/openai/v1",
          temperature: 0.7,
          maxTokens: 4096,
        },
        ollama: {
          provider: "ollama",
          model: "llama3.1",
          apiKey: "",
          baseUrl: "http://localhost:11434/v1",
          temperature: 0.7,
          maxTokens: 4096,
        },
        azure: {
          provider: "azure",
          model: "gpt-4o",
          apiKey: "",
          baseUrl: "https://YOUR_RESOURCE_NAME.openai.azure.com",
          temperature: 0.7,
          maxTokens: 4096,
        },
        "aws-bedrock": {
          provider: "aws-bedrock",
          model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
          apiKey: "",
          temperature: 0.7,
          maxTokens: 4096,
        },
        "aws-anthropic": {
          provider: "aws-anthropic",
          model: "anthropic.claude-3-5-sonnet-20241022-v2:0",
          apiKey: "",
          temperature: 0.7,
          maxTokens: 4096,
        },
      },
      fileUploadDirectory: "",
    },
    browser: {
      useSystemBrowser: true, // Default to system browser
      systemBrowserPath: BROWSER_PATHS.WINDOWS_CHROME, // Default Chrome path
      defaultUrl: "https://www.google.com",
      selectedProfile: "default_profile",
      availableProfiles: ["default_profile"],
    },
    chromium: {
      isInstalled: false,
    },
    wallets: {
      wallets: [],
    },
  };

  static loadSettings(): AppSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, "utf-8");
        const settings = JSON.parse(data) as AppSettings;

        // Merge with defaults to ensure all properties exist
        return {
          ...this.defaultSettings,
          ...settings,
          ai: {
            ...this.defaultSettings.ai,
            ...settings.ai,
            configs: {
              ...this.defaultSettings.ai.configs,
              ...settings.ai?.configs,
            },
          },
          browser: {
            ...this.defaultSettings.browser,
            ...settings.browser,
          },
          chromium: {
            ...this.defaultSettings.chromium,
            ...settings.chromium,
          },
          wallets: {
            ...this.defaultSettings.wallets,
            ...settings.wallets,
          },
        };
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }

    return this.defaultSettings;
  }

  static saveSettings(settings: AppSettings): void {
    try {
      const settingsDir = path.dirname(this.settingsPath);
      if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
      }

      fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  }

  static getAISettings(): AISettings {
    return this.loadSettings().ai;
  }

  static saveAISettings(aiSettings: Partial<AISettings>): void {
    const settings = this.loadSettings();
    settings.ai = { ...settings.ai, ...aiSettings };
    this.saveSettings(settings);
  }

  static getBrowserSettings(): BrowserSettings {
    return this.loadSettings().browser;
  }

  static saveBrowserSettings(browserSettings: Partial<BrowserSettings>): void {
    const settings = this.loadSettings();
    settings.browser = { ...settings.browser, ...browserSettings };
    this.saveSettings(settings);
  }

  static getChromiumStatus(): ChromiumStatus {
    return this.loadSettings().chromium;
  }

  static saveChromiumStatus(chromiumStatus: Partial<ChromiumStatus>): void {
    const settings = this.loadSettings();
    settings.chromium = { ...settings.chromium, ...chromiumStatus };
    this.saveSettings(settings);
  }

  // Agent settings helpers
  static getAgentSettings(): {
    wait_between_actions?: number;
    enable_ai_rules?: boolean;
  } {
    const settings = this.loadSettings();
    return settings.agent || {};
  }

  static saveAgentSettings(agentSettings: {
    wait_between_actions?: number;
    enable_ai_rules?: boolean;
  }): void {
    const settings = this.loadSettings();
    settings.agent = { ...settings.agent, ...agentSettings };
    this.saveSettings(settings);
  }

  // Wallet settings helpers
  static getWalletSettings(): WalletSettings {
    return this.loadSettings().wallets;
  }

  static saveWalletSettings(walletSettings: Partial<WalletSettings>): void {
    const settings = this.loadSettings();
    settings.wallets = { ...settings.wallets, ...walletSettings };
    this.saveSettings(settings);
  }
}
