export interface ServerDriveEnv {
  mode: "neon" | "google" | "local-test";
  sessionSecret: string;
  databaseUrl?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRefreshToken?: string;
  googleDriveFolderId?: string;
  testDriveDir?: string;
}

export function getServerEnv(): ServerDriveEnv {
  const sessionSecret = process.env.APP_SESSION_SECRET?.trim() ?? "";
  if (sessionSecret.length < 32) {
    throw new Error("APP_SESSION_SECRET phải có tối thiểu 32 ký tự.");
  }

  const testDriveDir = process.env.NGOCNHU_TEST_DRIVE_DIR?.trim();
  if (testDriveDir) {
    return {
      mode: "local-test",
      sessionSecret,
      testDriveDir,
    };
  }

  const databaseUrl =
    process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim() || "";
  if (databaseUrl) {
    return {
      mode: "neon",
      sessionSecret,
      databaseUrl,
    };
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  const googleRefreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim() ?? "";
  const googleDriveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() ?? "";

  if (
    googleClientId &&
    googleClientSecret &&
    googleRefreshToken &&
    googleDriveFolderId
  ) {
    return {
      mode: "google",
      sessionSecret,
      googleClientId,
      googleClientSecret,
      googleRefreshToken,
      googleDriveFolderId,
    };
  }

  throw new Error(
    "Thiếu cấu hình lưu trữ: cần biến môi trường DATABASE_URL (Neon PostgreSQL) và APP_SESSION_SECRET (>= 32 ký tự).",
  );
}
