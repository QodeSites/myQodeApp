import { tokenStorage } from "@/api/auth/tokenStorage";
import { api } from "@/api/axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

/* ============================
   Types
============================ */

interface ClientData {
  clientid: string;
  clientcode: string;
  email: string;
  clientname: string;
  mobile: string;
  holderName?: string;
  relation?: string;
  head_of_family?: boolean;
  groupid?: string;
  groupname?: string;
  clienttype: string;
}

interface ClientContextType {
  clients: ClientData[];
  selectedClientCode: string;
  selectedClientId: string;
  selectedClientMobile: string;
  selectedClientName: string;
  selectedClientHolderName: string;
  selectedClientType: string;
  selectedEmailClient: string;
  isHeadOfFamily: boolean;
  loading: boolean;
  unauthorized: boolean;
  setSelectedClient: (clientCode: string) => Promise<void>;
  refresh: () => Promise<void>;
  setSelectedEmailClient: (email: string) => void;
  setSelectedClientType: (type: string) => void;
  clearAllClientData?: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

/* ============================
   AsyncStorage helpers
============================ */

const STORAGE_KEYS = {
  code: "selectedClientCode",
  id: "selectedClientId",
  email: "selectedEmailClient",
  mobile: "selectedClientMobile",
  name: "selectedClientName",
  type: "selectedClientType",
  holderName: "selectedClientHolderName",
};

async function getClientStorage(
  keys: (keyof typeof STORAGE_KEYS)[]
) {
  try {
    const results = await AsyncStorage.multiGet(
      keys.map((k) => STORAGE_KEYS[k])
    );
    const entries: Record<string, string> = {};
    results.forEach(([key, value]) => {
      if (value != null) entries[key] = value;
    });
    return entries;
  } catch {
    return {};
  }
}

async function clearClientStorage() {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
}

async function setClientStorage(
  obj: Partial<Record<keyof typeof STORAGE_KEYS, string>>
) {
  const items = Object.entries(obj).map(
    ([k, v]) =>
      [STORAGE_KEYS[k as keyof typeof STORAGE_KEYS], v ?? ""] as [
        string,
        string
      ]
  );
  if (items.length) await AsyncStorage.multiSet(items);
}

/* ============================
   Provider
============================ */

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [selectedClientCode, setSelectedClientCode] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedClientType, setSelectedClientType] = useState("");
  const [selectedEmailClient, setSelectedEmailClient] = useState("");
  const [selectedClientMobile, setSelectedClientMobile] = useState("");
  const [selectedClientName, setSelectedClientName] = useState("");
  const [selectedClientHolderName, setSelectedClientHolderName] = useState("");
  const [isHeadOfFamily, setIsHeadOfFamily] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const initialized = useRef(false);

  /* ============================
     Core logic
  ============================ */

  // Exposed function to clear all stored data AND empty context state
  const clearAllClientData = async () => {
    setClients([]);
    setSelectedClientCode("");
    setSelectedClientId("");
    setSelectedClientType("");
    setSelectedEmailClient("");
    setSelectedClientMobile("");
    setSelectedClientName("");
    setSelectedClientHolderName("");
    setIsHeadOfFamily(false);
    setLoading(false);
    setUnauthorized(false);
    await clearClientStorage();
  };

  const clearSelectedClient = async () => {
    setClients([]);
    setSelectedClientCode("");
    setSelectedClientId("");
    setSelectedClientType("");
    setSelectedEmailClient("");
    setSelectedClientMobile("");
    setSelectedClientName("");
    setSelectedClientHolderName("");
    setIsHeadOfFamily(false);
    await clearClientStorage();
  };

  const updateSelectedClient = async (client: ClientData) => {
    setSelectedClientCode(client.clientcode);
    setSelectedClientId(client.clientid);
    setSelectedEmailClient(client.email);
    setSelectedClientMobile(client.mobile);
    setSelectedClientName(client.clientname);
    setSelectedClientType(client.clienttype);
    setSelectedClientHolderName(client.holderName || client.clientname);

    await setClientStorage({
      code: client.clientcode,
      id: client.clientid,
      email: client.email,
      mobile: client.mobile,
      name: client.clientname,
      type: client.clienttype,
      holderName: client.holderName || client.clientname,
    });
  };

  const fetchClientData = async () => {
    try {
      setLoading(true);
      setUnauthorized(false);

      const res = await api.get("/api/auth/client-data", {
        withCredentials: true,
      });

      const data = res.data;
      setIsHeadOfFamily(!!data.isHeadOfFamily);

      let availableClients: ClientData[] = [];

      if (data.isHeadOfFamily && data.family?.length) {
        availableClients = data.family.map((m: any) => ({
          clientid: m.clientid,
          clientcode: m.clientcode,
          email: m.email,
          clientname: m.clientname || m.holderName,
          mobile: m.mobile,
          holderName: m.holderName,
          relation: m.relation,
          head_of_family: m.head_of_family,
          groupid: m.groupid,
          groupname: m.groupname,
          clienttype: m.clienttype ?? "",
        }));
      } else if (data.clients?.length) {
        availableClients = data.clients.map((c: any) => ({
          clientid: c.clientid,
          clientcode: c.clientcode,
          email: c.email,
          clientname: c.clientname,
          mobile: c.mobile,
          holderName: c.clientname,
          relation: "Individual Account",
          head_of_family: !!c.head_of_family,
          groupid: c.groupid,
          groupname: c.groupname,
          clienttype: c.clienttype ?? "",
        }));
      }

      setClients(availableClients);

      if (!availableClients.length) {
        await clearSelectedClient();
        return;
      }

      const storage = await getClientStorage(["code", "id"]);
      let selected =
        availableClients.find(
          (c) =>
            c.clientcode === storage[STORAGE_KEYS.code] &&
            c.clientid === storage[STORAGE_KEYS.id]
        ) ||
        (data.isHeadOfFamily
          ? availableClients.find((c) => c.head_of_family)
          : availableClients[0]) ||
        availableClients[0];

      await updateSelectedClient(selected);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setUnauthorized(true);
        tokenStorage.clearAccess();
      }
      await clearSelectedClient();
    } finally {
      setLoading(false);
    }
  };

  /* ============================
     One-time init (CRITICAL FIX)
  ============================ */

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchClientData();
  }, []);

  /* ============================
     Public API
  ============================ */

  const setSelectedClient = async (clientCode: string) => {
    const client = clients.find((c) => c.clientcode === clientCode);
    if (client) await updateSelectedClient(client);
  };

  const refresh = async () => {
    await fetchClientData();
  };

  const value: ClientContextType = {
    clients,
    selectedClientCode,
    selectedClientId,
    selectedClientMobile,
    selectedClientName,
    selectedClientHolderName,
    selectedClientType,
    selectedEmailClient,
    isHeadOfFamily,
    loading,
    unauthorized,
    setSelectedClient,
    refresh,
    setSelectedEmailClient,
    setSelectedClientType,
    clearAllClientData, // optional on context type
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
}

/* ============================
   Exposed Clear All Data Function
============================ */

// This clears AsyncStorage and should also signal context to clear state on next mount.
export async function clearAllClientData() {
  await clearClientStorage();
}

/* ============================
   Hook
============================ */

export function useClient() {
  const ctx = useContext(ClientContext);
  if (!ctx) {
    throw new Error("useClient must be used within ClientProvider");
  }
  return ctx;
}
