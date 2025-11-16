import {
  ChevronRight,
  Clock,
  Edit2,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useAutomationStore } from "../stores/AutomationStore";

interface PromptSidebarProps {
  onPromptSelect: (prompt: string) => void;
  isOpen: boolean;
  onClose: () => void;
  activeTab: "history" | "saved";
  // currentPrompt removed: saving current prompt is no longer supported
  toggleRef?: React.RefObject<HTMLDivElement | null>;
}

const PromptSidebar: React.FC<PromptSidebarProps> = ({
  onPromptSelect,
  isOpen,
  onClose,
  activeTab,

  toggleRef,
}) => {
  const {
    promptHistory,
    savedPrompts,
    deleteSavedPrompt,
    savePrompt,
    clearHistory,
    deleteFromHistory,
  } = useAutomationStore();

  // Dialog/state grouped objects to reduce many useState calls
  const [editState, setEditState] = useState<{
    open: boolean;
    id: string | null;
    name: string;
    text: string;
  }>({ open: false, id: null, name: "", text: "" });

  const [saveState, setSaveState] = useState<{
    open: boolean;
    name: string;
    text: string;
  }>({ open: false, name: "", text: "" });

  const [createState, setCreateState] = useState<{
    open: boolean;
    name: string;
    text: string;
  }>({ open: false, name: "", text: "" });
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!isOpen || !sidebarRef.current || !target) return;

      if (toggleRef && toggleRef.current) {
        if (toggleRef.current.contains(target as Node)) return;
      }

      if (!sidebarRef.current.contains(target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, toggleRef]);

  // Open edit dialog for a saved prompt
  const handleOpenEditDialog = (promptItem: {
    id: string;
    name: string;
    prompt: string;
  }) => {
    setEditState({
      open: true,
      id: promptItem.id,
      name: promptItem.name,
      text: promptItem.prompt,
    });
  };

  const handleConfirmEdit = () => {
    if (!editState.id) return;
    if (editState.name.trim() && editState.text.trim()) {
      // replace the existing saved prompt
      deleteSavedPrompt(editState.id);
      savePrompt(editState.name.trim(), editState.text.trim());
      setEditState({ open: false, id: null, name: "", text: "" });
    }
  };

  const handleCancelEditDialog = () => {
    setEditState({ open: false, id: null, name: "", text: "" });
  };

  const handleSaveFromHistory = (prompt: string) => {
    setSaveState({ open: true, name: "", text: prompt });
  };

  const handleConfirmSave = () => {
    if (saveState.name.trim() && saveState.text.trim()) {
      savePrompt(saveState.name.trim(), saveState.text.trim());
      setSaveState({ open: false, name: "", text: "" });
    }
  };

  const handleCancelSave = () => {
    setSaveState({ open: false, name: "", text: "" });
  };

  const handleCreateNew = () => {
    setCreateState({ open: true, name: "", text: "" });
  };

  const handleConfirmCreate = () => {
    if (createState.name.trim() && createState.text.trim()) {
      savePrompt(createState.name.trim(), createState.text.trim());
      setCreateState({ open: false, name: "", text: "" });
    }
  };

  const handleCancelCreate = () => {
    setCreateState({ open: false, name: "", text: "" });
  };

  // Reset dialog/internal state when switching tabs (history <-> saved)
  useEffect(() => {
    // Close any open dialogs or edits when tab changes
    setSaveState({ open: false, name: "", text: "" });
    setCreateState({ open: false, name: "", text: "" });
    // Reset edit dialog state so it doesn't persist across tabs
    setEditState({ open: false, id: null, name: "", text: "" });
  }, [activeTab]);

  // Always render the sidebar so we can animate open/close using Tailwind
  return (
    <div
      ref={sidebarRef}
      aria-hidden={!isOpen}
      className={`absolute top-0 right-12 z-10 flex h-full w-80 transform flex-col border-l border-white/10 bg-black/20 backdrop-blur-md transition-all duration-200 ease-in-out ${
        isOpen
          ? "pointer-events-auto translate-x-0 opacity-100"
          : "pointer-events-none translate-x-full opacity-0"
      }`}
    >
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-white/10 px-3">
        <div className="flex items-center gap-2">
          {activeTab === "history" ? (
            <Clock className="h-4 w-4 text-white/70" />
          ) : (
            <Star className="h-4 w-4 text-white/70" />
          )}
          <h2 className="text-sm font-medium text-white">
            {activeTab === "history" ? "Prompt History" : "Saved Prompts"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "history" && promptHistory.length > 0 && (
            <button
              onClick={() => clearHistory()}
              className="flex items-center gap-1 bg-red-500 px-2 py-0.5 text-xs text-white transition-colors hover:bg-red-600"
              title="Clear all history"
            >
              <Trash2 className="h-3 w-3" />
              Clear All
            </button>
          )}
          {activeTab === "saved" && (
            <>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-1 bg-blue-500 px-2 py-0.5 text-xs text-white transition-colors hover:bg-blue-600"
                title="Create new prompt"
              >
                <Plus className="h-3 w-3" />
                Create New
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "history" ? (
          <div className="space-y-2 p-3">
            {promptHistory.length === 0 ? (
              <div className="py-6 text-center text-white/50">
                <Clock className="mx-auto mb-2 h-10 w-10 opacity-30" />
                <p>No prompt history yet</p>
              </div>
            ) : (
              promptHistory.map((item) => (
                <div
                  key={item.id}
                  className="group border border-white/10 bg-black/30 p-2 transition-colors hover:bg-black/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => onPromptSelect(item.prompt)}
                    >
                      <p className="mb-1 line-clamp-2 text-xs text-white/90">
                        {item.prompt}
                      </p>
                      <p className="text-xs text-white/50">
                        {new Date(item.usedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleSaveFromHistory(item.prompt)}
                        className="flex h-5 w-5 items-center justify-center text-blue-400 hover:bg-blue-400/20"
                        title="Save this prompt"
                      >
                        <Save className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteFromHistory(item.id)}
                        className="flex h-5 w-5 items-center justify-center text-red-400 hover:bg-red-400/20"
                        title="Delete this prompt"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onPromptSelect(item.prompt)}
                        className="flex h-5 w-5 items-center justify-center text-white/50 hover:bg-white/10 hover:text-white"
                        title="Use this prompt"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {savedPrompts.length === 0 ? (
              <div className="py-6 text-center text-white/50">
                <Star className="mx-auto mb-2 h-10 w-10 opacity-30" />
                <p>No saved prompts yet</p>
              </div>
            ) : (
              savedPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="group border border-white/10 bg-black/30 p-2 transition-colors hover:bg-black/40"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3
                      className="flex-1 cursor-pointer text-sm font-medium text-white/90"
                      onClick={() => onPromptSelect(prompt.prompt)}
                    >
                      {prompt.name}
                    </h3>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleOpenEditDialog(prompt)}
                        className="flex h-5 w-5 items-center justify-center text-white/50 hover:bg-white/10 hover:text-white"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteSavedPrompt(prompt.id)}
                        className="flex h-5 w-5 items-center justify-center text-red-400 hover:bg-red-400/20"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p
                    className="line-clamp-2 cursor-pointer text-xs text-white/70"
                    onClick={() => onPromptSelect(prompt.prompt)}
                  >
                    {prompt.prompt}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    {new Date(prompt.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Save Prompt Dialog */}
      {saveState.open && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/50 px-2 backdrop-blur-sm"
          onClick={handleCancelSave}
        >
          <div
            className="sat w-96 bg-gradient-to-br from-blue-900 via-blue-500 to-blue-950 p-3 px-3 ring-1 ring-white/5 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-sm font-medium text-white">Save Prompt</h3>
            <div className="space-y-2">
              <input
                type="text"
                value={saveState.name}
                onChange={(e) =>
                  setSaveState((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="Enter a name for this prompt"
                className="w-full border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
                autoFocus
              />
              <div className="text-sm text-white/70">
                <p className="text-sm font-medium">Prompt:</p>
                <div className="mt-1 max-h-28 overflow-y-auto border border-white/10 bg-black/40 p-1 text-sm">
                  {saveState.text}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleConfirmSave}
                  disabled={!saveState.name.trim()}
                  className="flex-1 bg-blue-500 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-white/60"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelSave}
                  className="flex-1 bg-red-600 py-1 text-sm text-white transition-colors hover:bg-red-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Prompt Dialog */}
      {editState.open && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/50 px-2 backdrop-blur-sm"
          onClick={handleCancelEditDialog}
        >
          <div
            className="w-96 bg-gradient-to-br from-blue-900 via-blue-500 to-blue-950 p-3 px-3 ring-1 ring-white/5 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-sm font-medium text-white">Edit Prompt</h3>
            <div className="space-y-2">
              <input
                type="text"
                value={editState.name}
                onChange={(e) =>
                  setEditState((s) => ({ ...s, name: e.target.value }))
                }
                placeholder="Enter a name for this prompt"
                className="w-full border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
                autoFocus
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">
                  Prompt Content
                </label>
                <textarea
                  rows={6}
                  value={editState.text}
                  onChange={(e) =>
                    setEditState((s) => ({ ...s, text: e.target.value }))
                  }
                  className="w-full resize-none border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
                />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleConfirmEdit}
                  disabled={!editState.name.trim() || !editState.text.trim()}
                  className="flex-1 bg-blue-500 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-white/60"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEditDialog}
                  className="flex-1 bg-red-600 py-1 text-sm text-white transition-colors hover:bg-red-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Prompt Dialog */}
      {createState.open && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/50 px-2 backdrop-blur-sm"
          onClick={handleCancelCreate}
        >
          <div
            className="w-96 bg-gradient-to-br from-blue-900 via-blue-500 to-blue-950 p-3 px-3 ring-1 ring-white/5 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-sm font-medium text-white">
              Create New Prompt
            </h3>
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">
                  Prompt Name
                </label>
                <input
                  type="text"
                  value={createState.name}
                  onChange={(e) =>
                    setCreateState((s) => ({ ...s, name: e.target.value }))
                  }
                  placeholder="Enter a name for this prompt"
                  className="w-full border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-white/70">
                  Prompt Content
                </label>
                <textarea
                  rows={5}
                  value={createState.text}
                  onChange={(e) =>
                    setCreateState((s) => ({ ...s, text: e.target.value }))
                  }
                  placeholder="Enter your prompt content here..."
                  className="w-full resize-none border border-white/20 bg-black/40 px-2 py-1 text-sm text-white placeholder-white/50 focus:border-white/40 focus:outline-none"
                />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleConfirmCreate}
                  disabled={
                    !createState.name.trim() || !createState.text.trim()
                  }
                  className="flex-1 bg-blue-500 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-white/60"
                >
                  Create
                </button>
                <button
                  onClick={handleCancelCreate}
                  className="flex-1 bg-red-600 py-1 text-sm text-white transition-colors hover:bg-red-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptSidebar;
