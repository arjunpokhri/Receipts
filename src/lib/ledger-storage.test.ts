import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isValidLedgerItem,
  parseStoredLedger,
  loadLedgerFromStorage,
  saveLedgerToStorage,
  clearLedgerStorage,
  RECEIPTS_LEDGER_STORAGE_KEY,
  RECEIPTS_SELECTED_ITEM_KEY,
} from "./ledger-storage.ts";
import { SAMPLE_PROJECT, type AgreementItem } from "./sample-data.ts";

describe("Ledger Storage & Persistence", () => {
  const sampleLiveItem: AgreementItem = {
    id: "live-test-123",
    claim: "Client agrees to slide-out navigation drawer for $650",
    evidenceQuote: "we agree to proceed with the slide-out menu drawer at the quoted $650 addition",
    speaker: "Elena Vance",
    timestamp: "Oct 12, 2026, 11:15 AM",
    commitmentType: "prices",
    speechAct: "acceptance",
    status: "proposed",
    explanation: "Added from live correspondence with source attached.",
    sourceThreadId: "live-extraction",
    sourceText: "Hi Marcus, we agree to proceed with the slide-out menu drawer at the quoted $650 addition.",
    quoteVerified: true,
  };

  describe("Item Validation (isValidLedgerItem)", () => {
    it("returns true for a valid sample ledger item", () => {
      assert.equal(isValidLedgerItem(SAMPLE_PROJECT.initialItems[0]), true);
    });

    it("returns true for a valid live extracted item with sourceText attached", () => {
      assert.equal(isValidLedgerItem(sampleLiveItem), true);
    });

    it("returns false for null, primitives, or empty objects", () => {
      assert.equal(isValidLedgerItem(null), false);
      assert.equal(isValidLedgerItem(undefined), false);
      assert.equal(isValidLedgerItem("string"), false);
      assert.equal(isValidLedgerItem(123), false);
      assert.equal(isValidLedgerItem({}), false);
    });

    it("returns false if required string fields are missing or not strings", () => {
      assert.equal(isValidLedgerItem({ ...sampleLiveItem, id: "" }), false);
      assert.equal(isValidLedgerItem({ ...sampleLiveItem, claim: 123 }), false);
      assert.equal(isValidLedgerItem({ ...sampleLiveItem, status: null }), false);
      assert.equal(isValidLedgerItem({ ...sampleLiveItem, evidenceQuote: undefined }), false);
    });

    it("returns false if optional fields have wrong types", () => {
      assert.equal(isValidLedgerItem({ ...sampleLiveItem, sourceText: 123 }), false);
      assert.equal(isValidLedgerItem({ ...sampleLiveItem, quoteVerified: "yes" }), false);
      assert.equal(isValidLedgerItem({ ...sampleLiveItem, confirmedAt: true }), false);
    });
  });

  describe("JSON Parsing & Fallback (parseStoredLedger)", () => {
    it("returns null for null, undefined, or empty string inputs", () => {
      assert.equal(parseStoredLedger(null), null);
      assert.equal(parseStoredLedger(""), null);
      assert.equal(parseStoredLedger("   "), null);
    });

    it("returns null for malformed JSON syntax", () => {
      assert.equal(parseStoredLedger("{ bad json ["), null);
      assert.equal(parseStoredLedger("undefined"), null);
    });

    it("returns null for non-array JSON objects or empty arrays", () => {
      assert.equal(parseStoredLedger(JSON.stringify({ some: "object" })), null);
      assert.equal(parseStoredLedger(JSON.stringify([])), null);
      assert.equal(parseStoredLedger(JSON.stringify("a string")), null);
    });

    it("successfully parses valid items and preserves all fields including sourceText", () => {
      const items = [SAMPLE_PROJECT.initialItems[0], sampleLiveItem];
      const json = JSON.stringify(items);
      const parsed = parseStoredLedger(json);

      assert.ok(parsed);
      assert.equal(parsed.length, 2);
      assert.equal(parsed[0].id, SAMPLE_PROJECT.initialItems[0].id);
      assert.equal(parsed[1].id, "live-test-123");
      assert.equal(parsed[1].sourceText, sampleLiveItem.sourceText);
      assert.equal(parsed[1].quoteVerified, true);
    });

    it("filters out invalid items and keeps valid ones", () => {
      const itemsWithCorrupted = [
        sampleLiveItem,
        { broken: "item", without: "required fields" },
        SAMPLE_PROJECT.initialItems[1],
      ];
      const parsed = parseStoredLedger(JSON.stringify(itemsWithCorrupted));

      assert.ok(parsed);
      assert.equal(parsed.length, 2);
      assert.equal(parsed[0].id, "live-test-123");
      assert.equal(parsed[1].id, SAMPLE_PROJECT.initialItems[1].id);
    });

    it("returns null if all items in array are invalid", () => {
      const allInvalid = [{ a: 1 }, { b: 2 }];
      assert.equal(parseStoredLedger(JSON.stringify(allInvalid)), null);
    });
  });

  describe("Browser Storage Mock Operations", () => {
    // In Node.js environment, window is undefined by default
    it("returns null when window or localStorage is undefined", () => {
      assert.equal(loadLedgerFromStorage(), null);
      assert.equal(saveLedgerToStorage([sampleLiveItem]), false);
    });

    it("reads and writes faithfully when localStorage is available", () => {
      const mockStorage: Record<string, string> = {};
      const fakeLocalStorage = {
        getItem: (key: string) => mockStorage[key] ?? null,
        setItem: (key: string, val: string) => {
          mockStorage[key] = val;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
      };

      // Temporarily mock global window
      const originalWindow = (globalThis as Record<string, unknown>).window;
      (globalThis as Record<string, unknown>).window = {
        localStorage: fakeLocalStorage,
      };

      try {
        const testItems = [sampleLiveItem, ...SAMPLE_PROJECT.initialItems];
        const saveOk = saveLedgerToStorage(testItems, "live-test-123");
        assert.equal(saveOk, true);

        // Load back
        const loaded = loadLedgerFromStorage();
        assert.ok(loaded);
        assert.equal(loaded.items.length, testItems.length);
        assert.equal(loaded.selectedId, "live-test-123");
        assert.equal(loaded.items[0].id, "live-test-123");
        assert.equal(loaded.items[0].sourceText, sampleLiveItem.sourceText);

        // Verify key names
        assert.ok(mockStorage[RECEIPTS_LEDGER_STORAGE_KEY]);
        assert.equal(mockStorage[RECEIPTS_SELECTED_ITEM_KEY], "live-test-123");

        // Clear
        clearLedgerStorage();
        assert.equal(mockStorage[RECEIPTS_LEDGER_STORAGE_KEY], undefined);
        assert.equal(mockStorage[RECEIPTS_SELECTED_ITEM_KEY], undefined);
        assert.equal(loadLedgerFromStorage(), null);
      } finally {
        (globalThis as Record<string, unknown>).window = originalWindow;
      }
    });

    it("handles localStorage write exceptions gracefully without throwing", () => {
      const errorLocalStorage = {
        getItem: () => {
          throw new Error("SecurityError: blocked storage");
        },
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
        removeItem: () => {},
      };

      const originalWindow = (globalThis as Record<string, unknown>).window;
      (globalThis as Record<string, unknown>).window = {
        localStorage: errorLocalStorage,
      };

      try {
        assert.equal(loadLedgerFromStorage(), null);
        assert.equal(saveLedgerToStorage([sampleLiveItem]), false);
      } finally {
        (globalThis as Record<string, unknown>).window = originalWindow;
      }
    });
  });
});
