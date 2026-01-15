const StorageManager = require("../../src/utils/StorageManager");

describe("StorageManager", () => {
  let storage;
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    storage = new StorageManager("TestApp", "1.0");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Availability Checks & Initialization", () => {
    test("should detect storage availability correctly", () => {
      expect(storage.isAvailable).toBe(true);
      const spySet = jest.spyOn(Storage.prototype, "setItem");
      const spyRemove = jest.spyOn(Storage.prototype, "removeItem");
      const mgr = new StorageManager("NewApp");
      expect(mgr.isAvailable).toBe(true);
      expect(spySet).toHaveBeenCalledWith("__storage_test__", "test");
      expect(spyRemove).toHaveBeenCalledWith("__storage_test__");
    });
    test("should handle storage being unavailable during initialization", () => {
      const spy = jest
        .spyOn(Storage.prototype, "setItem")
        .mockImplementationOnce(() => {
          throw new Error("QuotaExceeded");
        });
      const mgr = new StorageManager("BadStore");
      expect(mgr.isAvailable).toBe(false);
      spy.mockRestore();
    });
    test("_initializeApp should create metadata if missing", () => {
      localStorage.clear();
      new StorageManager("InitApp");
      const metadata = JSON.parse(localStorage.getItem("InitApp__metadata"));
      expect(metadata).toBeDefined();
      expect(metadata.data.entities).toEqual({});
    });
    test("methods should fail gracefully when unavailable", () => {
      storage.isAvailable = false;
      expect(storage.save("key", "val")).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "localStorage tidak tersedia."
      );
      expect(storage.load("key", "default")).toBe("default");
      expect(storage.remove("key")).toBe(false);
      expect(storage.exportData()).toBeNull();
    });
  });

  describe("Error Handling", () => {
    test("save should catch errors and return false", () => {
      storage.isAvailable = true;
      const spySet = jest
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("WriteError");
        });
      expect(storage.save("test", "data")).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Gagal menyimpan"),
        expect.any(Error)
      );
      spySet.mockRestore();
    });
    test("load should catch errors and return default", () => {
      storage.isAvailable = true;
      const spyGet = jest
        .spyOn(Storage.prototype, "getItem")
        .mockImplementation(() => {
          throw new Error("ReadError");
        });
      expect(storage.load("test", "default")).toBe("default");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Gagal memuat"),
        expect.any(Error)
      );
      spyGet.mockRestore();
    });
    test("remove should catch errors and return false", () => {
      storage.isAvailable = true;
      const spyRemove = jest
        .spyOn(Storage.prototype, "removeItem")
        .mockImplementation(() => {
          throw new Error("DeleteError");
        });
      expect(storage.remove("test")).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Gagal menghapus"),
        expect.any(Error)
      );
      spyRemove.mockRestore();
    });
    test("exportData should catch errors and return null", () => {
      storage.isAvailable = true;
      localStorage.setItem("TestApp_1", "{}");
      const spyKey = jest
        .spyOn(Storage.prototype, "key")
        .mockImplementation(() => {
          throw new Error("EnumerationError");
        });
      expect(storage.exportData()).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Gagal mengekspor"),
        expect.any(Error)
      );
      spyKey.mockRestore();
    });
    test("_initializeApp should catch errors", () => {
      const spyGet = jest
        .spyOn(Storage.prototype, "getItem")
        .mockImplementation(() => {
          throw new Error("InitError");
        });
      new StorageManager("FailInitApp");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Gagal inisialisasi storage app:",
        expect.any(Error)
      );
      spyGet.mockRestore();
    });
  });

  describe("Logic Branches & Private Methods", () => {
    test("save should NOT update metadata when saving _metadata itself", () => {
      const spyUpdate = jest.spyOn(storage, "_updateMetadata");
      storage.save("_metadata", { some: "data" });
      expect(spyUpdate).not.toHaveBeenCalled();
    });
    test("_updateMetadata should handle fresh metadata creation", () => {
      const spySave = jest.spyOn(storage, "save");
      jest.spyOn(storage, "load").mockReturnValue(null);
      storage._updateMetadata("user", "now");
      expect(spySave).toHaveBeenCalledWith(
        "_metadata",
        expect.objectContaining({
          entities: expect.objectContaining({ user: expect.anything() }),
        })
      );
    });
    test("_removeFromMetadata should do nothing if metadata missing", () => {
      jest.spyOn(storage, "load").mockReturnValue(null);
      const spySave = jest.spyOn(storage, "save");
      storage._removeFromMetadata("user");
      expect(spySave).not.toHaveBeenCalledWith("_metadata", expect.anything());
    });
    test("exportData should filter keys correctly", () => {
      localStorage.setItem("TestApp_valid", JSON.stringify({ a: 1 }));
      localStorage.setItem("OtherApp_invalid", JSON.stringify({ b: 2 }));
      const result = storage.exportData();
      expect(result.data).toHaveProperty("TestApp_valid");
      expect(result.data).not.toHaveProperty("OtherApp_invalid");
    });
  });
});
