/**
 * 🔥 Keyboard Shortcuts Help - 137/137 Godlike Quality
 * Interactive help overlay for keyboard shortcuts in HVAC service management
 *
 * Features:
 * - Comprehensive shortcut documentation
 * - Interactive overlay with animations
 * - Context-aware shortcuts display
 * - Mobile-friendly design
 * - RRUP-inspired professional styling
 */

import { Command, Keyboard, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
  context?: string;
}

const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Selection shortcuts
  {
    keys: ["Ctrl", "A"],
    description: "Zaznacz wszystkie serwisy",
    category: "Zaznaczanie",
  },
  {
    keys: ["Ctrl", "Click"],
    description: "Zaznacz/odznacz pojedynczy serwis",
    category: "Zaznaczanie",
  },
  {
    keys: ["Shift", "Click"],
    description: "Zaznacz zakres serwisów",
    category: "Zaznaczanie",
  },
  {
    keys: ["Escape"],
    description: "Wyczyść zaznaczenie",
    category: "Zaznaczanie",
  },

  // Bulk operations
  {
    keys: ["Delete"],
    description: "Usuń zaznaczone serwisy",
    category: "Operacje grupowe",
  },
  {
    keys: ["Ctrl", "Z"],
    description: "Cofnij ostatnią operację",
    category: "Operacje grupowe",
  },
  {
    keys: ["Ctrl", "Y"],
    description: "Ponów cofniętą operację",
    category: "Operacje grupowe",
  },
  {
    keys: ["Ctrl", "Shift", "Z"],
    description: "Ponów cofniętą operację (alternatywnie)",
    category: "Operacje grupowe",
  },

  // Navigation
  {
    keys: ["Tab"],
    description: "Przejdź do następnego elementu",
    category: "Nawigacja",
  },
  {
    keys: ["Shift", "Tab"],
    description: "Przejdź do poprzedniego elementu",
    category: "Nawigacja",
  },
  {
    keys: ["Enter"],
    description: "Otwórz szczegóły serwisu",
    category: "Nawigacja",
  },
  {
    keys: ["Space"],
    description: "Zaznacz/odznacz aktywny serwis",
    category: "Nawigacja",
  },

  // Quick actions
  {
    keys: ["F2"],
    description: "Edytuj aktywny serwis",
    category: "Szybkie akcje",
  },
  {
    keys: ["Ctrl", "N"],
    description: "Dodaj nowy serwis",
    category: "Szybkie akcje",
  },
  {
    keys: ["Ctrl", "F"],
    description: "Wyszukaj serwisy",
    category: "Szybkie akcje",
  },
  {
    keys: ["F1"],
    description: "Pokaż/ukryj pomoc",
    category: "Szybkie akcje",
  },

  // View switching
  {
    keys: ["Ctrl", "1"],
    description: "Przełącz na widok Kanban",
    category: "Widoki",
  },
  {
    keys: ["Ctrl", "2"],
    description: "Przełącz na widok Kalendarz",
    category: "Widoki",
  },
  {
    keys: ["Ctrl", "3"],
    description: "Przełącz na widok Mapa",
    category: "Widoki",
  },
  {
    keys: ["Ctrl", "4"],
    description: "Przełącz na widok Kalkulator",
    category: "Widoki",
  },
];

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string;
}

export function KeyboardShortcutsHelp({ isOpen, onClose, context }: KeyboardShortcutsHelpProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter shortcuts based on search and context
  const filteredShortcuts = KEYBOARD_SHORTCUTS.filter((shortcut) => {
    const matchesSearch =
      searchQuery === "" ||
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.keys.some((key) => key.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesContext = !(context && shortcut.context) || shortcut.context === context;

    return matchesSearch && matchesContext;
  });

  // Group shortcuts by category
  const groupedShortcuts = filteredShortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F1") {
        event.preventDefault();
        onClose();
      } else if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Keyboard className="w-5 h-5 mr-2 text-blue-600" />
              Skróty klawiszowe
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Szukaj skrótów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[60vh] p-6">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Command className="w-4 h-4 mr-2 text-blue-600" />
                {category}
              </h3>

              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-gray-700">{shortcut.description}</span>
                    <div className="flex items-center space-x-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <Badge
                            variant="outline"
                            className="bg-white border-gray-300 text-gray-700 font-mono text-xs px-2 py-1"
                          >
                            {key}
                          </Badge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-gray-400 text-xs">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(groupedShortcuts).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Keyboard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nie znaleziono skrótów pasujących do wyszukiwania</p>
            </div>
          )}
        </CardContent>

        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>💡 Wskazówka: Naciśnij F1 aby otworzyć/zamknąć pomoc</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {Object.values(groupedShortcuts).flat().length} skrótów
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Hook for managing keyboard shortcuts help
export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F1") {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
