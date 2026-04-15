import type {
  AssetImportRequest,
  AssetImportResult,
  ExecutionRequest,
  ExecutionResult,
  IntegrationDefinition,
  IntegrationHealth,
  PackagingBridgeResult,
  PackagingRequest,
  ToolHealthCheck,
  ToolPathDefinition
} from "./models";

export interface ToolPathProvider {
  listToolPaths(): Promise<ToolPathDefinition[]>;
  getToolPath(toolId: string): Promise<ToolPathDefinition | null>;
  setToolPath(toolId: string, executablePath: string | null): Promise<ToolPathDefinition>;
}

export interface AssetImportBridge {
  canImport(assetPath: string): boolean;
  importAsset(request: AssetImportRequest): Promise<AssetImportResult>;
}

export interface ExecutionBridge {
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}

export interface PackagingBridge {
  buildReleaseCandidate(request: PackagingRequest): Promise<PackagingBridgeResult>;
}

export interface ToolHealthChecker {
  checkTool(tool: ToolPathDefinition): Promise<ToolHealthCheck>;
  checkIntegration(
    integration: IntegrationDefinition,
    tools: ToolPathDefinition[],
  ): Promise<IntegrationHealth>;
}
