import type { ModelConfig } from "./model";

export interface AutomationRuntimeOptions {
  useWallet?: boolean;
  walletId?: string;
  walletPublicKey?: string;
  walletSecretEnv?: string;
  walletSecretKey?: string;
  fileUploadDirectory?: string;
}

export interface AutomationStepData {
  step_number: number;
  action_type: string;
  action_description: string;
  result?: string;
  timestamp?: string;
  duration_seconds?: number;
  success?: boolean;
  error?: string;
}

export interface AutomationResultData {
  success: boolean;
  message: string;
  task_id?: string;
  prompt?: string;
  model?: string;
  provider?: string;
  start_time?: string;
  end_time?: string;
  duration_seconds?: number;
  total_steps?: number;
  total_actions?: number;
  urls_visited?: string[];
  errors?: string[];
  steps?: AutomationStepData[];
  final_result?: string;
}

export type IpcChannelMap = {
  selectUploadDirectory: {
    args: [];
    return: {
      canceled: boolean;
      path?: string;
    };
  };
  console: {
    args: [text: string];
    return: void;
  };
  runBrowserAutomation: {
    args: [
      prompt: string,
      modelConfig?: ModelConfig,
      options?: AutomationRuntimeOptions,
    ];
    return: {
      success: boolean;
      message: string;
      logs?: string[];
      cdpPort?: number;
    };
  };
  runBrowserAutomationTask: {
    args: [
      taskId: string,
      profile: string,
      prompt: string,
      modelConfig?: ModelConfig,
      options?: AutomationRuntimeOptions,
    ];
    return: {
      success: boolean;
      message: string;
      logs?: string[];
      cdpPort?: number;
      automationData?: AutomationResultData;
    };
  };
  stopBrowserAutomation: {
    args: [];
    return: {
      success: boolean;
      message: string;
    };
  };
  stopBrowserAutomationTask: {
    args: [taskId: string];
    return: {
      success: boolean;
      message: string;
    };
  };
  openBrowser: {
    args: [
      url?: string,
      useSystemBrowser?: boolean,
      systemBrowserPath?: string,
    ];
    return: {
      success: boolean;
      message: string;
      logs?: string[];
    };
  };
  openBrowserWithProfile: {
    args: [
      url?: string,
      profileName?: string,
      useSystemBrowser?: boolean,
      browserPath?: string,
    ];
    return: {
      success: boolean;
      message: string;
    };
  };
  browserAutomationLog: {
    args: [log: string | { taskId?: string; log: string }];
    return: void;
  };
  browserAutomationError: {
    args: [error: string | { taskId?: string; error: string }];
    return: void;
  };
  minimizeWindow: {
    args: [];
    return: void;
  };
  closeWindow: {
    args: [];
    return: void;
  };
  getAISettings: {
    args: [];
    return: Array<{
      id: number;
      provider: string;
      is_active: boolean;
      model: string;
      api_key: string;
      base_url?: string;
      temperature: number;
      max_tokens: number;
      createdAt: string;
      updatedAt: string;
    }>;
  };
  saveAISettings: {
    args: [
      {
        activeProvider: AIModelProvider;
        configs: Record<
          AIModelProvider,
          {
            provider: AIModelProvider;
            model: string;
            apiKey: string;
            baseUrl?: string;
            temperature: number;
            maxTokens: number;
            useVision?: boolean;
          }
        >;
        fileUploadDirectory?: string;
      },
    ];
    return: { success: boolean; message?: string };
  };
  getBrowserSettings: {
    args: [];
    return: {
      useSystemBrowser: boolean;
      systemBrowserPath?: string;
      defaultUrl: string;
      availableProfiles?: string[];
      browserProfiles?: Record<
        string,
        {
          profiles: string[];
          browser_path: string;
          browser_name: string;
        }
      >;
      chromiumInstalled?: boolean;
      chromiumVersion?: string;
      chromiumInstallPath?: string;
    };
  };
  saveBrowserSettings: {
    args: [
      {
        useSystemBrowser: boolean;
        systemBrowserPath?: string;
        defaultUrl: string;
        availableProfiles?: string[];
        browserProfiles?: Record<
          string,
          {
            profiles: string[];
            browser_path: string;
            browser_name: string;
          }
        >;
        chromiumInstalled?: boolean;
        chromiumVersion?: string;
        chromiumInstallPath?: string;
      },
    ];
    return: { success: boolean; message?: string };
  };
  getBrowserProfiles: {
    args: [];
    return: Record<
      string,
      {
        profiles: string[];
        browser_path: string;
        browser_name: string;
      }
    >;
  };
  createBrowserProfile: {
    args: [profileName: string, browserPath: string];
    return: { success: boolean; message?: string };
  };
  updateAvailableProfiles: {
    args: [profiles: string[]];
    return: { success: boolean; message?: string };
  };
  deleteBrowserProfile: {
    args: [profileName: string, browserPath?: string];
    return: { success: boolean; message?: string };
  };
  deleteAllBrowserProfiles: {
    args: [];
    return: { success: boolean; message?: string };
  };
  checkChromiumStatus: {
    args: [];
    return: {
      isInstalled: boolean;
      version?: string;
      installPath?: string;
    };
  };
  installChromium: {
    args: [];
    return: {
      success: boolean;
      message: string;
      progress?: number;
    };
  };
  uninstallChromium: {
    args: [];
    return: {
      success: boolean;
      message: string;
    };
  };
  getAgentSettings: {
    args: [];
    return: { wait_between_actions?: number; enable_ai_rules?: boolean };
  };
  saveAgentSettings: {
    args: [{ wait_between_actions?: number; enable_ai_rules?: boolean }];
    return: { success: boolean; message?: string };
  };
  // Wallet management
  getWallets: {
    args: [];
    return: {
      success: boolean;
      wallets?: Array<{
        id: string;
        name: string;
        publicKey: string;
        secretKeyEncrypted: string;
        balance: number;
        profileId: string | null;
        createdAt: string;
        updatedAt: string;
      }>;
      message?: string;
    };
  };
  generateWallet: {
    args: [name: string];
    return: {
      success: boolean;
      wallet?: {
        id: string;
        name: string;
        publicKey: string;
        secretKeyEncrypted: string;
        balance: number;
        profileId: string | null;
        createdAt: string;
        updatedAt: string;
      };
      message?: string;
    };
  };
  updateWalletBalance: {
    args: [walletId: string, rpcUrl?: string];
    return: {
      success: boolean;
      balance?: number;
      message?: string;
    };
  };
  deleteWallet: {
    args: [walletId: string];
    return: { success: boolean; message?: string };
  };
  setWalletProfile: {
    args: [walletId: string, profileId: string | null];
    return: { success: boolean; message?: string };
  };
  updateWalletName: {
    args: [walletId: string, name: string];
    return: { success: boolean; message?: string };
  };
  // Eko automation
  runEkoAutomation: {
    args: [
      {
        taskId: string;
        prompt: string;
        modelConfig?: ModelConfig;
      },
    ];
    return: {
      success: boolean;
      message: string;
      result?: any;
      error?: string;
      logs?: string[];
    };
  };
  stopEkoAutomation: {
    args: [taskId: string];
    return: {
      success: boolean;
      message: string;
    };
  };
};

export type IpcUnsubscribe = () => void;

export type IpcRendererAPI = {
  [K in keyof IpcChannelMap]: (
    ...args: IpcChannelMap[K]["args"]
  ) => Promise<IpcChannelMap[K]["return"]>;
};

// Extended API that includes event listeners
export type ExtendedIpcRendererAPI = IpcRendererAPI & {
  onTabsUpdated: (
    callback: (tabsData: { tabs: Tab[]; activeTabId: string | null }) => void,
  ) => IpcUnsubscribe;
  onBrowserAutomationLog: (
    callback: (log: string | { taskId?: string; log: string }) => void,
  ) => IpcUnsubscribe;
  onBrowserAutomationError: (
    callback: (error: string | { taskId?: string; error: string }) => void,
  ) => IpcUnsubscribe;
};

export interface Window {
  electronAPI: ExtendedIpcRendererAPI;
}
