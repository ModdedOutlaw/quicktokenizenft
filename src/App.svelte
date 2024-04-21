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
  } from "./wharf";

  //bootstrap stuff
  import "bootstrap/dist/css/bootstrap.min.css";
  import "jquery";
  import "popper.js";
  import "bootstrap";

  onMount(restore);
  let amount = "1"; // default value for the dropdown
  let amountInMillions = 1; // default value
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

  onMount(() => {
    const unsubscribe = assetsStore.subscribe((value) => {
      assets = value;
    });

    return unsubscribe; // unsubscribe when the component is destroyed
  });

  $: if ($session) {
    get_tokens($session.actor.toString());
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
</script>

<div>
  <div class="container mt-3">
    <main>
      <div class="flex-container">
        <p class="text-center">tokenizednft - quick transfers</p>
        <img
          src="https://theuplift.world/wp-content/uploads/2021/03/The-Uplift.png"
          alt="The Uplift"
          class="icon"
        />
        <img
          src="https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/logos/liftium-tokenizednft.png"
          alt="Liftium Tokenized NFT"
          class="icon"
        />
      </div>
    </main>

    <div class="text-center">
      {#if $session}
        <button class="btn btn-primary" on:click={logout}
          >Logout ({$session.actor})</button
        >
      {:else}
        <button class="btn btn-primary" on:click={login}>Login</button>
      {/if}
    </div>
  </div>

  <div>
    {#if $session}
      <table class="table table-bordered mx-auto rounded-table text-center">
        <thead>
          <tr>
            <th>Token</th>
            <th>Balance</th>
            <!-- Add more columns if needed -->
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>LIFTIUM</td>
            <td>{$tokensStore !== undefined ? $tokensStore : ""}</td>
            <!-- Add more cells if needed -->
          </tr>
        </tbody>
      </table>

      <div class="card border-primary mx-auto rounded-table text-center">
        <div class="card-body">
          <div class="row justify-content-center">
            <div class="col-12 col-md-6 text-center mb-3">
              Receiver of LIFTIUM:
              <input type="text" bind:value={receiver} class="form-control" />
            </div>
          </div>

          <div>
            <div class="row justify-content-center">
              <div class="col-12 col-md-6 text-center mb-3">
                Amount (in millions of LIFTIUM):
                <input
                  type="number"
                  min="1"
                  step="1"
                  bind:value={amountInMillions}
                  class="form-control"
                />
                <button
                  on:click={() =>
                    transfer(
                      receiver,
                      (amountInMillions * 1000000).toFixed(4).toString() +
                        " LIFTIUM"
                    )}
                  >Transfer {formattedAmount}
                  LIFTIUM</button
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card border-primary mx-auto rounded-table text-center">
        <div class="card-body">
          <div class="row justify-content-center">
            <div class="col-12 col-md-6 text-center mb-3">
              Receiver of NFT(s):
              <input type="text" class="form-control" bind:value={receiver} />
            </div>
          </div>
          <div class="text-center mb-3">
            <button
              class="btn btn-sm btn-secondary"
              on:click={() => transferNFT(receiver, selectedAssetIds)}
            >
              TransferNFT(s)
            </button>
          </div>
          <div class="text-center mb-3">
            <button
              class="btn btn-sm btn-secondary"
              on:click={() => get_collection($session.actor.toString())}
            >
              Get 1 MIO asset IDs
            </button>
          </div>

          {#each paginatedAssets as assetId (assetId)}
            <button
              class:selected={selectedAssetIds.includes(assetId)}
              on:click={() => toggleSelection(assetId)}
            >
              <img
                src="https://resizer.atomichub.io/images/v1/preview?ipfs=QmUtXnoGHZ7aUNzEM3fk6LX6j65tXtvP2kQRPvn8NFyhJ5&size=370&output=webp"
                alt=""
                class="button-image"
              />
              {assetId}
            </button>{/each}
        </div>
        <div>
          <button class="btn btn-primary" on:click={() => (currentPage = Math.max(1, currentPage - 1))}
            >Previous</button
          >
          <button class="btn btn-primary"
            on:click={() =>
              (currentPage = Math.min(
                Math.ceil(assets.length / itemsPerPage),
                currentPage + 1
              ))}>Next</button
          >
        </div>
      </div>
    {:else}
      <div></div>
    {/if}
  </div>
</div>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
  .selected {
    background-color: #007bff; /* change to your preferred color */
    color: white;
  }
  .flex-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .icon {
    margin-left: 10px; /* Adjust this value to change the space between the text and the image */
    width: 100px; /* Adjust this value to change the size of the image */
  }

  .rounded-table {
    margin-top: 0.5em;
    margin-left: 30%; /* Add this line */
    margin-right: 30%; /* Add this line */
    width: 40%; /* Add this line */
    border-color: #210051;
  }

  .button-image {
    width: 20px; /* Adjust this value to change the width of the image */
  }
</style>
