export function resolvePageFilePath(page: {
  collectivePath: string;
  filePath: string;
  fileName: string;
}): string {
  return [page.collectivePath, page.filePath, page.fileName].filter((part) => part !== "").join("/");
}
