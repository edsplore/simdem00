export const buildPathWithWorkspace = (
  basePath: string,
  workspaceId?: string | null,
  timeZone?: string | null
): string => {
  const params = new URLSearchParams();

  if (workspaceId) {
    params.set('workspace_id', workspaceId);
  }

  if (timeZone) {
    params.set('timeZone', timeZone);
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
};
