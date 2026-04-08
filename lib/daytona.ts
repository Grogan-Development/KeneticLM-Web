import { Daytona, CreateSandboxBaseParams, Sandbox } from "@daytonaio/sdk";

let daytonaInstance: Daytona | null = null;

function getDaytona(): Daytona {
  if (!daytonaInstance) {
    const apiKey = process.env.DAYTONA_API_KEY;
    const serverUrl = process.env.DAYTONA_SERVER_URL || "https://app.daytona.io/api";
    const target = process.env.DAYTONA_TARGET || "us";

    if (!apiKey) {
      throw new Error("DAYTONA_API_KEY is required");
    }

    daytonaInstance = new Daytona({
      apiKey,
      serverUrl,
      target,
    });
  }
  return daytonaInstance;
}

export async function createSandbox(params?: Partial<CreateSandboxBaseParams>) {
  const sandbox = await getDaytona().create({
    language: "typescript",
    ...params,
  });
  return sandbox;
}

export async function getSandbox(id: string) {
  const sandbox = await getDaytona().get(id);
  return sandbox;
}

export async function listSandboxes() {
  const sandboxes = await getDaytona().list();
  return sandboxes;
}

export async function removeSandbox(sandbox: Sandbox) {
  await getDaytona().delete(sandbox);
}
