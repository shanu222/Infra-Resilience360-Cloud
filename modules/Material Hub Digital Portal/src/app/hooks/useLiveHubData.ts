import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HubInventory, MaterialEntry, MaterialHub } from '../data/types';
import { mockHubs, mockInventory } from '../data/mockData';
import { getHubSeedQuantity, MATERIAL_HUB_SEED_ROWS } from '../data/materialHubCatalog';
import { listHubs, listMaterialEntries } from '../services/materialHubService';
import { isSupabaseConfigured, supabase } from '../services/supabase';

type LiveHubDataState = {
  hubs: MaterialHub[];
  entries: MaterialEntry[];
  inventory: HubInventory[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const byUpdatedDateDesc = (left: string, right: string) => {
  const a = new Date(left).getTime();
  const b = new Date(right).getTime();
  return b - a;
};

function deriveHubMetrics(entries: MaterialEntry[]): Pick<MaterialHub, 'stockPercentage' | 'damagePercentage' | 'status'> {
  if (entries.length === 0) {
    return {
      stockPercentage: 0,
      damagePercentage: 0,
      status: 'critical',
    };
  }

  const totalStockPercentage = entries.reduce((sum, item) => sum + item.percentageRemaining, 0);
  const totalDamaged = entries.reduce((sum, item) => sum + item.damaged, 0);
  const totalGross = entries.reduce((sum, item) => sum + item.opening + item.received, 0);

  const stockPercentage = Math.round(totalStockPercentage / entries.length);
  const damagePercentage = totalGross > 0 ? Math.round((totalDamaged / totalGross) * 100) : 0;

  const status: MaterialHub['status'] =
    stockPercentage >= 75 && damagePercentage <= 10
      ? 'ready'
      : stockPercentage >= 50 && damagePercentage <= 20
        ? 'moderate'
        : 'critical';

  return {
    stockPercentage,
    damagePercentage,
    status,
  };
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function createVirtualEntry(hub: MaterialHub, itemName: string, hubQuantity: number, totalQuantity: number): MaterialEntry {
  const safeTotal = Math.max(0, totalQuantity);
  const safeHubQty = Math.max(0, hubQuantity);
  const percentageRemaining = safeTotal > 0 ? Math.round((safeHubQty / safeTotal) * 100) : 0;

  return {
    id: `virtual-${hub.id}-${slugify(itemName)}`,
    hubId: hub.id,
    name: itemName,
    unit: 'units',
    opening: safeHubQty,
    received: 0,
    issued: 0,
    closing: safeHubQty,
    damaged: 0,
    percentageRemaining,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mergeEntriesWithSeedData(hubsList: MaterialHub[], allEntries: MaterialEntry[]) {
  const merged: MaterialEntry[] = [...allEntries];

  hubsList.forEach((hub) => {
    const hubEntries = merged.filter((entry) => entry.hubId === hub.id);
    if (hubEntries.length > 0) {
      return;
    }

    MATERIAL_HUB_SEED_ROWS.forEach((row) => {
      merged.push(createVirtualEntry(hub, row.item_name, getHubSeedQuantity(row, hub.location), row.total_quantity));
    });
  });

  return merged;
}

export function useLiveHubData(): LiveHubDataState {
  const [hubs, setHubs] = useState<MaterialHub[]>([]);
  const [entries, setEntries] = useState<MaterialEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const reloadInFlightRef = useRef(false);

  const reload = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (reloadInFlightRef.current) {
      return;
    }

    reloadInFlightRef.current = true;

    const shouldShowLoader = !silent || !hasLoadedOnceRef.current;
    if (shouldShowLoader) {
      setIsLoading(true);
    }
    if (!silent) {
      setError(null);
    }

    try {
      if (!isSupabaseConfigured) {
        const fallbackEntries: MaterialEntry[] = mockInventory.flatMap((inventoryItem) =>
          inventoryItem.materials.map((entry) => ({
            id: entry.id,
            hubId: inventoryItem.hubId,
            name: entry.name,
            unit: entry.unit,
            opening: entry.opening,
            received: entry.received,
            issued: entry.issued,
            closing: entry.closing,
            damaged: entry.damaged,
            percentageRemaining: entry.percentageRemaining,
            createdAt: inventoryItem.lastUpdated,
            updatedAt: inventoryItem.lastUpdated,
          })),
        );

        const fallbackHubs: MaterialHub[] = mockHubs.map((hub) => {
          const hubEntries = fallbackEntries.filter((entry) => entry.hubId === hub.id);
          const metrics = deriveHubMetrics(hubEntries);

          return {
            id: hub.id,
            name: hub.name,
            location: hub.location,
            district: hub.district,
            latitude: hub.coordinates[0],
            longitude: hub.coordinates[1],
            capacity: hub.capacity,
            status: metrics.status,
            stockPercentage: metrics.stockPercentage,
            damagePercentage: metrics.damagePercentage,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });

        setHubs(fallbackHubs);
        setEntries(fallbackEntries);
        return;
      }

      const [nextHubs, nextEntries] = await Promise.all([listHubs(), listMaterialEntries()]);
      const nextEntriesWithSeedData = mergeEntriesWithSeedData(nextHubs, nextEntries);

      const nextHubsWithDerivedMetrics = nextHubs.map((hub) => {
        const hubEntries = nextEntriesWithSeedData.filter((entry) => entry.hubId === hub.id);
        const metrics = deriveHubMetrics(hubEntries);
        return {
          ...hub,
          status: metrics.status,
          stockPercentage: metrics.stockPercentage,
          damagePercentage: metrics.damagePercentage,
        };
      });

      setHubs(nextHubsWithDerivedMetrics);
      setEntries(nextEntriesWithSeedData);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load live data.';
      setError(message);
    } finally {
      hasLoadedOnceRef.current = true;
      reloadInFlightRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const channel = supabase
      .channel('material-hubs-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'material_hubs' }, () => {
        void reload({ silent: true });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hub_material_entries' }, () => {
        void reload({ silent: true });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reload]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const timer = window.setInterval(() => {
      void reload({ silent: true });
    }, 60000);

    return () => {
      window.clearInterval(timer);
    };
  }, [reload]);

  const inventory = useMemo<HubInventory[]>(() => {
    return hubs.map((hub) => {
      const hubEntries = entries
        .filter((entry) => entry.hubId === hub.id)
        .sort((left, right) => left.name.localeCompare(right.name));

      const lastUpdated = hubEntries
        .map((entry) => entry.updatedAt ?? entry.createdAt ?? new Date().toISOString())
        .sort(byUpdatedDateDesc)[0] ?? (hub.updatedAt ?? hub.createdAt ?? new Date().toISOString());

      return {
        hubId: hub.id,
        hubName: hub.name,
        materials: hubEntries,
        lastUpdated,
      };
    });
  }, [hubs, entries]);

  return { hubs, entries, inventory, isLoading, error, reload };
}
