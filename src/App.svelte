<script lang="ts">
  import { onMount } from "svelte";
  import {
    login,
    logout,
    restore,
    session,
    get_info,
    transfer,
    transferNFT,
    get_collection,
    get_tokens,
    assetsStore,
    tokensStore,
    liftTransactionId,
    mioTransactionId,
    nftAssets,
    get_upliftium_hi_data,
    get_mining_rates,
    minerInfo,
  } from "./wharf";

  //bootstrap stuff
  import "bootstrap/dist/css/bootstrap.min.css";
  import "jquery";
  import "popper.js";
  import "bootstrap";

  import "@neftyblocks/blends";
  import { Contract } from "@wharfkit/contract";

  onMount(restore);

  let amountInMillions = 0; // default value
  $: formattedAmount = new Intl.NumberFormat().format(
    amountInMillions * 1000000
  );

  let receiver = "tokenizednft"; // default value for the text input
  let account = "";

  let assets = [];
  let selectedAssetIds = [];
  let balances = null; // default value

  let currentPage = 1;
  const itemsPerPage = 10;

  let pool_data = [];
  let upliftium_hi_array = [];

  let nft_1Million_price = 0;
  let nft_10Million_price = 0;
  let nft_100Million_price = 0;

  let nft_1Million_saleid = "";
  let nft_10Million_saleid = "";
  let nft_100Million_saleid = "";

  let nft_1Million_imgid = "";
  let nft_10Million_imgid = "";
  let nft_100Million_imgid = "";

  async function fetchData() {
    const response = await fetch("./data/pools.json");

    pool_data = await response.json();

    const response_1Mil_price = await fetch(
      "https://wax.api.atomicassets.io/atomicmarket/v1/sales/templates?symbol=WAX&collection_name=upliftium.hi&template_id=235703&page=1&limit=1&order=desc&sort=price"
    );
    let Million_price = await response_1Mil_price.json();
    if (Million_price.data && Million_price.data[0]) {
      nft_1Million_price = (
        parseInt(Million_price.data[0].listing_price) / 100000000
      ).toFixed(2);
      nft_1Million_saleid = Million_price.data[0].sale_id;

      nft_1Million_imgid = Million_price.data[0].assets[0].data.img;
    }

    const response_10Mil_price = await fetch(
      "https://wax.api.atomicassets.io/atomicmarket/v1/sales/templates?symbol=WAX&collection_name=upliftium.hi&template_id=583334&page=1&limit=1&order=desc&sort=price"
    );
    let TenMillion_price = await response_10Mil_price.json();
    if (TenMillion_price.data && TenMillion_price.data[0]) {
      nft_10Million_price = (
        parseInt(TenMillion_price.data[0].listing_price) / 100000000
      ).toFixed(2);
      nft_10Million_saleid = TenMillion_price.data[0].sale_id;
      nft_10Million_imgid = TenMillion_price.data[0].assets[0].data.img;
    }

    const response_100Mil_price = await fetch(
      "https://wax.api.atomicassets.io/atomicmarket/v1/sales/templates?symbol=WAX&collection_name=upliftium.hi&template_id=583323&page=1&limit=1&order=desc&sort=price"
    );
    let HundoMillion_price = await response_100Mil_price.json();
    if (HundoMillion_price.data && HundoMillion_price.data[0]) {
      nft_100Million_price = (
        parseInt(HundoMillion_price.data[0].listing_price) / 100000000
      ).toFixed(2);
      nft_100Million_saleid = HundoMillion_price.data[0].sale_id;
      nft_100Million_imgid = HundoMillion_price.data[0].assets[0].data.img;
    }

    if (Array.isArray(pool_data.payload)) {
      upliftium_hi_array = pool_data.payload
        .map((item) => {
          if (item.label === "1 Mio Crystallized Upliftium") {
            return {
              name: item.label,
              tick_rate: Number(item.size_per_tick_per_asset),
              asset_count: item.asset_count,
              low_price: nft_1Million_price,
              low_price_id: nft_1Million_saleid,
              img: nft_1Million_imgid,
            };
          }
          if (item.label === "10 Mio Crystallized Upliftium") {
            return {
              name: item.label,
              tick_rate: Number(item.size_per_tick_per_asset),
              asset_count: item.asset_count,
              low_price: nft_10Million_price,
              low_price_id: nft_10Million_saleid,
              img: nft_10Million_imgid,
            };
          }
          if (item.label === "100 Mio Crystallized Upliftium") {
            return {
              name: item.label,
              tick_rate: Number(item.size_per_tick_per_asset),
              asset_count: item.asset_count,
              low_price: nft_100Million_price,
              low_price_id: nft_100Million_saleid,
              img: nft_100Million_imgid,
            };
          }
        })
        .filter(Boolean); // Remove undefined items
    }
  }

  // Call fetchData when the component is first rendered
  onMount(fetchData);

  onMount(() => {
    const unsubscribe = assetsStore.subscribe((value) => {
      assets = value;
    });

    return unsubscribe; // unsubscribe when the component is destroyed
  });

  $: if ($session) {
    get_tokens($session.actor.toString());
    get_collection($session.actor.toString());
    get_upliftium_hi_data($session.actor.toString());
    get_mining_rates();
    //get_uplift();
  }

  $: paginatedAssets = assets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  function toggleSelection(assetId) {
    if (selectedAssetIds.includes(assetId)) {
      selectedAssetIds = selectedAssetIds.filter((id) => id !== assetId);
    } else {
      selectedAssetIds = [...selectedAssetIds, assetId];
    }
    console.log(selectedAssetIds);
  }

  var s = document.createElement("script");
  s.type = "text/javascript";
  s.async = true;
  s.src = "https://js.tebex.io/v/1.0.0.js";
  var head = document.getElementsByTagName("head")[0];
  head.appendChild(s);
</script>

<body>
  <div class="container">
    <div class="row">
      <div class="col" >
        <div class="text-left">
          {#if $session}
            <div>
              <button
                class="btn"
                style="background-color: rgba(6, 255, 255, 0.2); border: 1px solid rgba(6, 255, 255); padding:2px;"
                on:click={logout}
              >
                Logout ({$session.actor})
              </button>
            </div>
            <div style="font-size: 10px;">
              {$tokensStore !== undefined
                ? new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(Number($tokensStore))
                : ""} LIFTIUM
            </div>
            <div style="font-size: 10px;">
              {#if $nftAssets[0] !== undefined}
                {$nftAssets[0].name} NFTs = {$nftAssets[0].amount}
              {/if}
            </div>
            <div style="font-size: 10px;">
              {#if $nftAssets[1] !== undefined}
                {$nftAssets[1].name} NFTs = {$nftAssets[1].amount}
              {/if}
            </div>
            <div style="font-size: 10px;">
              {#if $nftAssets[2] !== undefined}
                {$nftAssets[2].name} NFTs = {$nftAssets[2].amount}
              {/if}
            </div>
          {:else}
            <button
              class="btn"
              style="background-color: rgba(6, 255, 255, 0.5); border: 1px solid rgba(6, 255, 255); padding:2px;"
              on:click={login}
            >
              Login
            </button>
          {/if}
        </div>
      </div>
      <div class="col mt-3 text-center">
        <img
          src="./img/liftium-tokenizednft.png"
          alt="TokenizedNFT"
          class="icon"
        />
        TokenizedNFT Quick Send
        <img
          src="./img/QmUtXnoGHZ7aUNzEM3fk6LX6j65tXtvP2kQRPvn8NFyhJ5.jpg"
          alt="TokenizedNFT"
          class="icon2"
        />
      </div>
      <div class="col">
        <div class="text-right">
            <div class="col text-center mt-4 mx-2"  style="font-size: 0.7em;">
             
              {#if Array.isArray(upliftium_hi_array)}
                {#each upliftium_hi_array as item (item.name)}
                  {#if item.img != ""}
                    <div>
                      <img
                        src={"https://atomichub-ipfs.com/ipfs/" + item.img}
                        alt={item.name}
                        class="icon3"
                      />
                      {item.name}
                      
                        <a
                          href={"https://wax.atomichub.io/market/sale/wax-mainnet/100-Million-Crystallized-Upliftium---UpliftWorld-Official_" +
                            item.low_price_id}>{item.low_price} WAX</a
                        > 
                    
                    </div>
                  {/if}
                {/each}
              {/if}
            </div>
          
        </div>
      </div>
    </div>

    <div
      style="border-top: 3px solid rgb(255, 65, 198);"
      class="container mt-3 mb-3"
    >
      {#if $session}
        <div class="card-deck">
          <div
            style="font-family: 'Merriweather Sans', sans-serif; font-weight: 800;"
            class="row justify-content-center"
          >
            Convert LIFTIUM to NFT
          </div>

          <div style="border-bottom: 3px solid rgb(255, 65, 198);">
            <div class="row justify-content-center">
              <div class="col-12 col-md-6 text-center mb-3">
                <button
                  class="btn"
                  style="padding:2px;background-color: rgba(255, 65, 198, 0.2); border: 1px solid rgba(255, 65, 198);"
                  on:click={() => {
                    location.reload();
                  }}
                >
                  <i class="fas fa-sync"></i>
                </button>
                <strong>STEP 1:</strong> Select Amount (in millions of LIFTIUM):
                <div class="d-flex justify-content-center">
                  <div class="input-group justify-content-center">
                    <button
                      class="btn"
                      style="padding:8px;background-color: rgba(255, 65, 198, 0.2); border: 1px solid rgba(255, 65, 198);"
                      on:click={() =>
                        (amountInMillions = Math.max(0, amountInMillions - 1))}
                      ><strong>-</strong></button
                    >
                    <div style="width: min-content;">
                      <input
                        type="text"
                        style="width: 6ch;"
                        bind:value={amountInMillions}
                        class="form-control text-center"
                        readonly
                      />
                    </div>
                    <button
                      class="btn"
                      style="padding:7px;background-color: rgba(255, 65, 198, 0.2); border: 1px solid rgba(255, 65, 198);"
                      on:click={() => (amountInMillions += 1)}
                      ><strong>+</strong></button
                    >
                  </div>
                </div>
                <div class="d-flex justify-content-center">
                  Receiver of LIFTIUM:
                </div>
                <div class="d-flex justify-content-center">
                  <div class="col-4">
                    <input
                      type="text"
                      class="form-control text-center"
                      bind:value={receiver}
                      readonly
                    />
                  </div>
                </div>
                <div class="text-center mt-2">
                  <button
                    class="btn"
                    style="padding:2px;background-color: rgba(255, 65, 198, 0.2); border: 1px solid rgba(255, 65, 198);"
                    on:click={() => {
                      if (
                        Number.isInteger(amountInMillions) &&
                        amountInMillions * 1000000 <= Number($tokensStore) &&
                        amountInMillions > 0
                      ) {
                        transfer(
                          receiver,
                          (amountInMillions * 1000000).toFixed(4).toString() +
                            " LIFTIUM"
                        );
                      } else {
                        alert("Please enter a valid amount");
                      }
                    }}
                  >
                    <strong>STEP 2: </strong> Transfer {formattedAmount}
                    LIFTIUM to {receiver}
                  </button>
                </div>
                {#if $liftTransactionId !== ""}
                  <div
                    class="alert alert-info text-center mt-2 w-100"
                    style="word-wrap: break-word;"
                    role="alert"
                  >
                    Transaction ID: {$liftTransactionId}
                  </div>
                {/if}
              </div>
            </div>
          </div>
          <div
            style="font-family: 'Merriweather Sans', sans-serif; font-weight: 800;"
            class="row justify-content-center mb-2"
          >
            Convert NFT to LIFTIUM
          </div>
          <div class="text-center">
            <button
              class="btn"
              style="padding:2px;background-color: rgba(255, 65, 198, 0.2); border: 1px solid rgba(255, 65, 198);"
              on:click={() => {
                location.reload();
              }}
            >
              <i class="fas fa-sync"></i>
            </button>
            <strong>STEP 1:</strong> Select 1 MIO asset IDs
          </div>

          <div
            style="display: flex; flex-wrap: wrap; justify-content: space-around;"
          >
            {#each paginatedAssets as assetId (assetId)}
              <button
                class:selected={selectedAssetIds.includes(assetId)}
                on:click={() => toggleSelection(assetId)}
                style="text-align: center; font-size: 0.8rem; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 1em;"
              >
                <img
                  src="./img/QmUtXnoGHZ7aUNzEM3fk6LX6j65tXtvP2kQRPvn8NFyhJ5.jpg"
                  alt=""
                  class="button-image"
                />
                <span>{assetId}</span>
              </button>
            {/each}
          </div>
        </div>
        {#if assets.length > 10}
          <div class="d-flex justify-content-center mx-2 mb-3">
            <div class="col-auto">
              <button
                class="btn"
                style="padding:2px;background-color: rgba(255, 65, 198, 0.2); border: 1px solid rgba(255, 65, 198);"
                on:click={() => (currentPage = Math.max(1, currentPage - 1))}
              >
                &larr;
              </button>
            </div>
            <div class="col-auto">
              <button
                class="btn"
                style="padding:2px;background-color: rgba(255, 65, 198, 0.2); border: 1px solid rgba(255, 65, 198);"
                on:click={() =>
                  (currentPage = Math.min(
                    Math.ceil(assets.length / itemsPerPage),
                    currentPage + 1
                  ))}
              >
                &rarr;
              </button>
            </div>
          </div>
        {/if}
        <div class="row justify-content-center">
          <div class="col-12 col-md-6 text-center mb-2">
            Receiver of NFT(s):
            <div class="d-flex justify-content-center">
              <div class="col-4">
                <input
                  type="text"
                  class="form-control text-center"
                  bind:value={receiver}
                  readonly
                />
              </div>
            </div>
          </div>
        </div>
        <div class="text-center mb-3">
          <button
            class="btn"
            style="padding:2px;background-color: rgba(255, 65, 198, 0.2); border: 1px solid rgba(255, 65, 198);"
            on:click={() => {
              if (selectedAssetIds.length > 0) {
                transferNFT(receiver, selectedAssetIds);
              }
            }}
          >
            <strong>STEP 2:</strong> Transfer {selectedAssetIds.length} MIO assets
            to tokenizednft
          </button>
        </div>
        {#if $mioTransactionId !== ""}
          <div
            class="alert alert-info text-center mt-2 w-100"
            style="word-wrap: break-word;"
            role="alert"
          >
            Transaction ID: {$mioTransactionId}
          </div>
        {/if}

        <div
          class="row justify-content-center"
          style="background-color: black; border-top: 3px solid rgb(255, 65, 198);"
        >
          <div class="col-12 col-md-6 text-center mb-3">
            <div>
              <iframe
                title="Alcor Exchange"
                style="margin-top: 20px;"
                width="340"
                height="459"
                src="https://alcor.exchange/swap-widget?market=moddedwax.gm&input=LIFTIUM-tokenizednft&output=KEK-waxpepetoken"
              ></iframe>
            </div>
          </div>
        </div>
      {:else}
        <div
          class="row justify-content-center"
          style="background-color: black; border-top: 3px solid rgb(255, 65, 198);"
        >
          <div class="col-12 col-md-6 text-center mb-3">
            <div>
              <iframe
                title="Alcor Exchange"
                style="margin-top: 20px;"
                width="340"
                height="459"
                src="https://alcor.exchange/swap-widget?market=moddedwax.gm&input=LIFTIUM-tokenizednft&output=KEK-waxpepetoken"
              ></iframe>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div></body
>

<style>
  .selected {
    background-color: #210051; /* change to your preferred color */
    color: white;
  }

  .icon {
    width: 50px; /* Adjust this value to change the size of the image */
  }
  .icon2 {
    width: 30px; /* Adjust this value to change the size of the image */
  }
  .icon3 {
    width: 15px; /* Adjust this value to change the size of the image */
  }

  .button-image {
    width: 20px; /* Adjust this value to change the width of the image */
  }
  body {
    padding: 0 !important;
    margin: 0 !important;
    color: #210051;
    font-family: "Mulish", sans-serif;
  }

  .navbar {
    padding: 0 !important;
  }
  .container {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
</style>
