import { BrowserWindow } from "electron";
import { createRequire } from "module";
import { pathToFileURL } from "url";
import type { ModelConfig } from "../../../../types/model.js";
import AISettingsService from "../../services/AISettingsService.js";
import { ipcMainHandle } from "../../util.js";

// Create require function for ES module context
const require = createRequire(import.meta.url);

// Map to track running Eko automation tasks
const runningEkoTasks = new Map<string, any>();

interface EkoAutomationOptions {
  taskId: string;
  prompt: string;
  modelConfig?: ModelConfig;
}

interface EkoAutomationResult {
  success: boolean;
  message: string;
  result?: any;
  error?: string;
  logs?: string[];
}

/**
 * Run Eko automation task
 * This handler executes browser automation using the Eko framework
 */
async function runEkoAutomationTask(
  options: EkoAutomationOptions,
  mainWindow: BrowserWindow | null,
): Promise<EkoAutomationResult> {
  const { taskId, prompt, modelConfig } = options;
  const logs: string[] = [];

  try {
    // Import Eko modules - use CJS for eko-nodejs to avoid require() issues
    const { Eko } = await import("@eko-ai/eko");

    // Import the CommonJS version of eko-nodejs to avoid ES module require issues
    const ekoNodejsPath = require.resolve("@eko-ai/eko-nodejs");
    const ekoNodejsCjsPath = ekoNodejsPath.replace(
      /index\.esm\.js$/,
      "index.cjs",
    );
    // Convert Windows path to file:// URL for ES module import
    const ekoNodejsCjsUrl = pathToFileURL(ekoNodejsCjsPath).href;
    const ekoNodejsModule = await import(ekoNodejsCjsUrl);
    const BrowserAgent =
      ekoNodejsModule.BrowserAgent || ekoNodejsModule.default?.BrowserAgent;

    if (!BrowserAgent) {
      throw new Error("BrowserAgent not found in @eko-ai/eko-nodejs module");
    }

    logs.push(`[EKO] Initializing Eko framework for task: ${taskId}`);
    logs.push(`[EKO] Prompt: ${prompt}`);

    // Get AI settings if no model config provided
    let activeModelConfig = modelConfig;
    if (!activeModelConfig) {
      const retrievedConfig = await AISettingsService.getActiveSettings();
      if (retrievedConfig) {
        activeModelConfig = retrievedConfig;
        logs.push(
          `[EKO] Using active AI model: ${activeModelConfig.provider} - ${activeModelConfig.model}`,
        );
      }
    }

    // Validate model configuration
    if (!activeModelConfig || !activeModelConfig.apiKey) {
      return {
        success: false,
        message:
          "No API key configured. Please set up your AI model in AI Settings.",
        logs,
      };
    }

    // Configure LLM for Eko
    const llms: any = {
      default: {
        provider: activeModelConfig.provider,
        model: activeModelConfig.model,
        apiKey: activeModelConfig.apiKey,
      },
    };

    // Add baseURL for providers that need it
    if (activeModelConfig.baseUrl) {
      llms.default.config = {
        baseURL: activeModelConfig.baseUrl,
      };
    }

    logs.push(
      `[EKO] LLM Configuration: ${activeModelConfig.provider} - ${activeModelConfig.model}`,
    );

    // Initialize agents
    const agents = [new BrowserAgent()];
    logs.push(`[EKO] Initialized BrowserAgent`);

    // Create Eko instance
    const eko = new Eko({ llms, agents });
    logs.push(`[EKO] Eko instance created successfully`);

    // Store the running task
    runningEkoTasks.set(taskId, { eko, startTime: Date.now() });

    // Send initial logs to frontend
    if (mainWindow) {
      mainWindow.webContents.send("eko-automation-log", {
        taskId,
        logs,
      });
    }

    logs.push(`[EKO] Starting automation execution...`);

    // Execute the automation
    const result = await eko.run(prompt);

    logs.push(`[EKO] Automation completed successfully`);
    logs.push(`[EKO] Result: ${JSON.stringify(result, null, 2)}`);

    // Clean up
    runningEkoTasks.delete(taskId);

    return {
      success: true,
      message: "Eko automation completed successfully",
      result,
      logs,
    };
  } catch (error: any) {
    logs.push(`[EKO] Error: ${error.message}`);
    logs.push(`[EKO] Stack: ${error.stack}`);

    // Clean up on error
    runningEkoTasks.delete(taskId);

    return {
      success: false,
      message: `Eko automation failed: ${error.message}`,
      error: error.message,
      logs,
    };
  }
}

/**
 * Stop a running Eko automation task
 */
async function stopEkoAutomationTask(
  taskId: string,
): Promise<{ success: boolean; message: string }> {
  const task = runningEkoTasks.get(taskId);

  if (!task) {
    return {
      success: false,
      message: `No running Eko task found with ID: ${taskId}`,
    };
  }

  try {
    // TODO: Implement proper cancellation when Eko supports it
    runningEkoTasks.delete(taskId);

    return {
      success: true,
      message: `Eko task ${taskId} stopped`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to stop Eko task: ${error.message}`,
    };
  }
}

/**
 * Register Eko automation IPC handlers
 */
export function registerEkoAutomationHandlers(
  mainWindow: BrowserWindow | null,
) {
  ipcMainHandle("runEkoAutomation", async (options: EkoAutomationOptions) => {
    return runEkoAutomationTask(options, mainWindow);
  });

  ipcMainHandle("stopEkoAutomation", async (taskId: string) => {
    return stopEkoAutomationTask(taskId);
  });
}
