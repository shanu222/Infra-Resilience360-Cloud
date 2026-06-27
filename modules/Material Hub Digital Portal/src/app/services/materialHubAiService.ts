import type { HubInventory, MaterialHub } from '../data/types';
import { buildApiTargets } from '@resilience/api-base';

export type AiHubOperation = {
  action: 'create' | 'update' | 'delete';
  hubId: string | null;
  hubName: string | null;
  name: string | null;
  location: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  status: MaterialHub['status'] | null;
  stockPercentage: number | null;
  damagePercentage: number | null;
};

export type AiEntryOperation = {
  action: 'create' | 'update' | 'delete';
  entryId: string | null;
  hubId: string | null;
  hubName: string | null;
  name: string | null;
  unit: string | null;
  opening: number | null;
  received: number | null;
  issued: number | null;
  damaged: number | null;
};

export type AiMaterialHubResponse = {
  model: string;
  analyzedAt: string;
  summary: string;
  confidence: number;
  risks: string[];
  hubOperations: AiHubOperation[];
  entryOperations: AiEntryOperation[];
};

const buildAiApiTargets = (path: string) => {
  return buildApiTargets(path);
};

const parseErrorMessage = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => null);
    return String(payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`);
  }

  const text = await response.text().catch(() => '');
  const compact = text.replace(/\s+/g, ' ').trim();

  if (compact) {
    return compact.slice(0, 220);
  }

  return `Request failed with status ${response.status}.`;
};

export async function requestAiMaterialHubPlan(params: {
  instruction: string;
  documentFile: File | null;
  hubs: MaterialHub[];
  inventory: HubInventory[];
}) {
  const targets = buildAiApiTargets('/api/material-hubs/ai-agent');
  const failures: string[] = [];

  for (const endpoint of targets) {
    const formData = new FormData();
    formData.append('instruction', params.instruction);
    formData.append('hubs', JSON.stringify(params.hubs));
    formData.append('inventory', JSON.stringify(params.inventory));

    if (params.documentFile) {
      formData.append('document', params.documentFile);
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const message = await parseErrorMessage(response);
        failures.push(`${endpoint} -> ${message}`);
        continue;
      }

      const payload = await response.json().catch(() => null);
      if (!payload || typeof payload !== 'object') {
        failures.push(`${endpoint} -> Invalid JSON response from AI endpoint.`);
        continue;
      }

      return payload as AiMaterialHubResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error while contacting AI endpoint.';
      failures.push(`${endpoint} -> ${message}`);
    }
  }

  throw new Error(`AI agent request failed. ${failures.join(' | ')}`);
}

