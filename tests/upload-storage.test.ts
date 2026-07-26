import assert from "node:assert/strict";
import path from "path";
import {
  brandingAssetUrl,
  brandingFilePath,
  brandingFilenameFromUrl,
  brandingStorageDirectory
} from "../src/lib/upload-storage";

const previous = process.env.UPLOAD_STORAGE_DIR;
process.env.UPLOAD_STORAGE_DIR = path.resolve("tmp", "persistent-uploads-test");

assert.equal(brandingStorageDirectory(), path.resolve("tmp", "persistent-uploads-test", "branding"));
assert.equal(brandingAssetUrl("logo-test.png"), "/api/uploads/branding/logo-test.png");
assert.equal(brandingFilenameFromUrl("/api/uploads/branding/avatar-test.jpg"), "avatar-test.jpg");
assert.equal(brandingFilenameFromUrl("/uploads/branding/avatar-old.jpg"), "avatar-old.jpg");
assert.equal(brandingFilenameFromUrl("/api/uploads/branding/../../secret"), null);
assert.equal(brandingFilePath("../secret"), null);

if (previous === undefined) delete process.env.UPLOAD_STORAGE_DIR;
else process.env.UPLOAD_STORAGE_DIR = previous;

console.log("Persistent upload storage tests passed");
