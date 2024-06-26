import { Chains, Session, SessionKit } from "@wharfkit/session";
import { WebRenderer } from "@wharfkit/web-renderer";
import { writable, type Writable } from "svelte/store";
import { WalletPluginCloudWallet } from "@wharfkit/wallet-plugin-cloudwallet";
import { WalletPluginAnchor } from "@wharfkit/wallet-plugin-anchor";
import { TransactPluginResourceProvider } from "@wharfkit/transact-plugin-resource-provider";
import { APIClient, Transaction, UInt64Type, UInt64, Serializer } from "@wharfkit/antelope";
import { Contract } from "./contract";
import { ContractKit } from "@wharfkit/contract";
import { AccountKit } from "@wharfkit/account";
import Account from "@wharfkit/contract";

interface Balance {
  currency: string;
  contract: string;
  amount: string;
  decimals: string;
}

type Configuration = Balance[];

interface ResponseData {
  account: string;
  assets: string;
}

interface CollectionData {
  success: boolean;
  data: {
    contract: string;
    collection_name: string;
    name: string;
    img: string;
    author: string;
    allow_notify: boolean;
    authorized_accounts: string[];
    notify_accounts: string[];
    market_fee: number;
    nestedData: {
      img: string;
      url: string;
      name: string;
      description: string;
    };
    created_at_time: string;
    created_at_block: string;
  };
  query_time: number;
}

interface UpliftiumHiData {
  account: string;
  templates: {
    template_id: string;
    assets: string;
  }[];
}

// Define the UpliftiumMiner type
type UpliftiumMiner = {
  name: string;
  assets: any;
  burned: any;
};

//const accountKit = new AccountKit(Chains.WAX);

const client = new APIClient({
  url: "https://api.waxsweden.org/",
});

const client2 = new APIClient({
  url: "https://wax.api.atomicassets.io/",
});

const clientWaxLight = new APIClient({
  url: "https://wax.light-api.net/",
});

const clientUplift = new APIClient({
  url: "https://tools.theuplift.world/",
});

const wcw = new WalletPluginCloudWallet();
const anchor = new WalletPluginAnchor();
// The blockchain(s) this application is deployed on

const chains = [Chains.WAX];

const contract = new Contract({ client: client });

const skoptions = {
  transactPlugins: [new TransactPluginResourceProvider()],
};

// Create a new session kit instance
export const sessionKit = new SessionKit(
  {
    appName: "quicktokenizenft",
    chains,
    ui: new WebRenderer(),
    walletPlugins: [wcw, anchor],
  },
  skoptions
);

// Storage for the current user session
export let session: Writable<Session | undefined> = writable();
export let upliftium_image: Writable<Session | string> = writable();
export let upliftium_hi_data: Writable<Session | UpliftiumHiData> = writable();
export let assetsStore = writable([]);
export let tokensStore: Writable<Session | string> = writable();

export const liftTransactionId = writable("");
export const mioTransactionId = writable("");
export const nftAssets = writable([]);
export const minerInfo = writable([]);

export async function transfer(name: string, quantity: string) {
  let sessionValue: Session | undefined;
  session.subscribe((value) => (sessionValue = value));
  console.log(sessionValue.permissionLevel);
  const transactionArguments = {
    action: {
      account: "tokenizednft",
      name: "transfer",
      authorization: [sessionValue.permissionLevel],

      data: {
        from: sessionValue.permissionLevel.actor.toString(),
        to: name,
        quantity: quantity,
        memo: "LIFTIUM Transfer",
      },
    },
  };
  if (sessionValue) {
    let response = await sessionValue.transact(transactionArguments);
    console.log(response.response);
    console.log("STATUS = " + response.response.processed.receipt.status);
    console.log("TX_id = " + response.response.transaction_id);
    liftTransactionId.set(response.response.transaction_id);
  } else {
    console.error("No session available");
  }
}

export async function transferNFT(name: string, assetID: UInt64Type) {
  let sessionValue: Session | undefined;
  session.subscribe((value) => (sessionValue = value));
  console.log(sessionValue.permissionLevel);
  const transactionArguments = {
    action: {
      account: "atomicassets",
      name: "transfer",
      authorization: [sessionValue.permissionLevel],
      data: {
        from: sessionValue.permissionLevel.actor.toString(),
        to: name,
        asset_ids: assetID,
        memo: "Upliftium NFT transfer",
      },
    },
  };
  if (sessionValue) {
    let response = await sessionValue.transact(transactionArguments);
    console.log(response.response);
    console.log("STATUS = " + response.response.processed.receipt.status);
    console.log("TX_id = " + response.response.transaction_id);
    mioTransactionId.set(response.response.transaction_id);
  } else {
    console.error("No session available");
  }
}

// A function that performs the login and sets the session variable

export async function login() {
  const response = await sessionKit.login();

  if (response.session) {
    session.set(response.session);
  }
  window.location.reload();
}
// A function that performs the logout and clears the session variable
export async function logout() {
  await sessionKit.logout();
  session.set(undefined);
  upliftium_image.set(undefined);
  localStorage.clear();
}
// A function that performs the restore and sets the session variable
export async function restore() {
  session.set(await sessionKit.restore());
  const img = localStorage.getItem("upliftium_img");
  upliftium_image.set(img);
}

export async function get_upliftium_hi_data(name: string) {
  const upliftium_collection_response = await client2.call({
    path: "/atomicassets/v1/accounts/" + name + "/upliftium.hi",
  });

  const collectionData = upliftium_collection_response as {
    data: UpliftiumHiData;
  };

  let asset_list = collectionData.data.templates
    .filter((template) =>
      ["235703", "583334", "583323"].includes(template.template_id)
    )
    .map((template) => {
      let name;
      switch (template.template_id) {
        case "235703":
          name = "1 Million";
          break;
        case "583334":
          name = "10 Million";
          break;
        case "583323":
          name = "100 Million";
          break;
      }
      return {
        name,
        amount: template.assets,
      };
    });
  //console.log(asset_list);
  nftAssets.set(asset_list);
}

export async function get_mining_rates() {
  const upliftium_collection_response_10s = await client2.call({
    path: "/atomicassets/v1/templates/upliftium.hi/583334/stats",
  });
  const upliftium_collection_response_100s = await client2.call({
    path: "/atomicassets/v1/templates/upliftium.hi/583323/stats",
  });
  const upliftium_collection_response_1s = await client2.call({
    path: "/atomicassets/v1/templates/upliftium.hi/235703/stats",
  });
  //console.log(client2.v1.assets.collection_name("upliftium.hi"));
  //console.log(upliftium_collection_response_1s.data);
  //console.log(upliftium_collection_response_10s.data);
  //console.log(upliftium_collection_response_100s.data);
  let up_d_1 = Serializer.objectify(upliftium_collection_response_1s.data);
//console.log(up_d_1);
// Create the UpliftiumMiner objects
const upliftiumMiner1: UpliftiumMiner = {
  name: '1 Million NFT',
  assets: upliftium_collection_response_1s.data.assets,
  burned: upliftium_collection_response_1s.data.burned, // replace with actual data if available
};

const upliftiumMiner10: UpliftiumMiner = {
  name: '10 Million NFT',
  assets: upliftium_collection_response_10s.data.assets,
  burned: upliftium_collection_response_10s.data.burned, // replace with actual data if available
};

const upliftiumMiner100: UpliftiumMiner = {
  name: '100 Million NFT',
  assets: upliftium_collection_response_100s.data.assets,
  burned: upliftium_collection_response_100s.data.burned, // replace with actual data if available
};
// Store the objects in an array
const upliftiumMiners: UpliftiumMiner[] = [upliftiumMiner1, upliftiumMiner10, upliftiumMiner100];

minerInfo.set(upliftiumMiners);
//console.log(upliftiumMiners);
}

export async function get_collection(name: string) {
  const upliftium_collection_response = await client2.call({
    path: "/atomicassets/v1/accounts/" + name + "/upliftium.hi",
  });

  const owner_collection_response = await client2.call({
    path:
      "/atomicassets/v1/assets/?collection_name=upliftium.hi&owner=" +
      name +
      "&page=1&limit=1000&order=desc&sort=asset_id",
  });

  //console.log(upliftium_collection_response);

  //console.log(owner_collection_response);

  const collectionData = upliftium_collection_response as {
    data: UpliftiumHiData;
  };

  //console.log(collectionData.data.templates);

  //

  //console.log(asset_list);
  //nftassets.set(asset_list);
  // Assuming response is your response object array
  const assetIds = owner_collection_response.data
    .filter((item) => item.template.template_id === "235703")
    .map((item) => item.asset_id);
  //console.log(assetIds);
  assetsStore.set(assetIds); // update the store with the first 20 assets
}

export async function get_info(name: string) {
  const response = await client2.call({
    path: "/atomicassets/v1/accounts" + "?owner=" + name,
  });

  const upliftium_collection_response = await client2.call({
    path: "/atomicassets/v1/collections/upliftium.hi",
  });

  const responseData = response as { data: ResponseData[] };

  console.log(
    "ACCOUNT " +
      responseData.data[0].account +
      " HAS " +
      responseData.data[0].assets +
      " ASSETS!"
  );

  const collectionData = upliftium_collection_response as {
    data: CollectionData;
  };
  console.log(collectionData.data.data.img);
  upliftium_image.set(collectionData.data.data.img);
  localStorage.setItem("upliftium_img", collectionData.data.data.img);
}

//'https://wax.blokcrafters.io/v2/state/get_tokens?account=modded.gm'
//api/topholders/CHAIN/CONTRACT/TOKEN/NUM
////tokenbalance/CHAIN/ACCOUNT/CONTRACT/TOKEN
export async function get_tokens(name: string) {
  const response = await clientWaxLight.call({
    path: "/api/tokenbalance/wax/" + name + "/tokenizednft/LIFTIUM",
  });
  //console.log(typeof response);
  // Convert response to a number
  const responseNumber = Number(response);

  // Convert the number to a string
  const responseString = responseNumber.toString();
  tokensStore.set(responseString);
  //console.log(responseNumber);
  //console.log(responseString);

  // Search through response.balances array

  //console.log(tokenizedNft);
}
