var pageDeals = [];
var filteredDeals = [];
var loading = true;
var deployPath = "https://citadelofthewind.com/wp-content/mirandusdeals/"; //"";

const tokenIcons = {
  GALA:
    "https://lh3.googleusercontent.com/1DcP21E8JYH0YEvBF9HD2R4LrK742KQGJyumV5kJkAxRp2wEdOcQrvsVJmUIaNJMVkFKyxSMLZRVA-sBGfCnoEDD=s48",
  ETH: `${deployPath}/images/ethereumicon.png`,
  WETH: "",
  USDC:
    "https://lh3.googleusercontent.com/PxC_K0Y22A1Xs0CeVknf4YUSxSqH_1bPCG0a4uD7WRkwbbtinqryjDEvoTYSbBFDXXTliuyo38-Y_ecNUEj0fMimQA=s32",
};

function initialize() {
  renderLoading();
  renderFilters(applicableTokens, "Token");
  renderFilters(Object.keys(sizeMultiplier), "Size");
  renderFilters(Object.keys(rarityMultiplier), "Rarity");
  updateDealsData();
}

function updateDealsData() {
  getLatestAssets.then((deals) => {
    loading = false;
    pageDeals = deals;
    filteredDeals = pageDeals;
    renderCards();
    $("#Refresh").show();
  });
}

function refresh() {
  renderLoading();
  updateDealsData();
}

function renderLoading() {
  $("#Refresh").hide();
  $("#DealsList")[0].innerHTML = `
  <div class="d-flex justify-content-center">
    Getting OpenSea data... this will take a couple minutes
  </div>
  <div class="d-flex justify-content-center">
    <div class="spinner-border text-primary" role="status">
        <span class="sr-only"></span>
    </div>
  </div>`;
}

function renderCards() {
  $("#DealsList")[0].innerHTML = "";
  for (deal in filteredDeals) {
    if (deal == 0) {
      //top deal
      renderDealCard(filteredDeals[deal]);
    } else {
      renderDealCard(filteredDeals[deal]);
    }
  }
}

function filterPageDeals() {
  console.log($("#Token").val());
  var tokenFilter = $("#Token").val();
  var sizeFilter = $("#Size").val();
  var rarityFilter = $("#Rarity").val();
  filteredDeals = pageDeals;

  if (tokenFilter != "All") {
    filteredDeals = pageDeals.filter((deal) => {
      if (deal.shop_price_data && deal.shop_price_data.length > 0)
        var dealTokens = deal.shop_price_data.map((data) => data.token);
      return dealTokens.includes(tokenFilter);
    });
  }
  if (sizeFilter != "All") {
    filteredDeals = filteredDeals.filter((deal) => {
      return deal.shop_size && sizeFilter == deal.shop_size;
    });
  }
  if (rarityFilter != "All") {
    filteredDeals = filteredDeals.filter((deal) => {
      return deal.shop_size && rarityFilter == deal.shop_rarity;
    });
  }
  console.log("filtered", filteredDeals);
  renderCards();
}

function renderDealCard(dealCard) {
  $("#DealsList")[0].innerHTML += `<div class="card">
  <div class="row cardtitle">
    <div class="col-12">${dealCard.shop_name}</div>
  </div>
  <div class="row">
    <div class="col-2"><img style="width:100%" src="${
      dealCard.shop_image
    }"/></div>
    <div class="col-5">${dealCard.shop_price_data
      .map((priceData) => {
        return `<div class="row"><div class="col-12"><img src="${
          tokenIcons[priceData.token]
        }" width="16" height="16" />: <span class="cardpricelabel">${
          priceData.lowest_price
        }</span> ($${priceData.lowest_usd_price})</div></div>`;
      })
      .join("")}
      <div class="row"><div class="col-12">_
      </div></div>
        <div class="row"><div class="col-12"><span class="cardpricelabel">Gala Store Price: </span> $${
          dealCard.store_price_usd
        }</div></div>
    </div>
    <div class="col-5 carddiscount justify-content-center">${
      dealCard.best_discount > 0
        ? `${dealCard.best_discount}% off`
        : `${0 - dealCard.best_discount}% over`
    }</div>
  </div>
  
  <a href="${dealCard.link}" class="stretched-link" target="_blank"></a>
</div>`;
}

function renderFilters(options, name) {
  console.log(name, $(`#${name}`));
  var filter = $(`#${name}`)[0];
  filter.innerHTML = "<option>All</option>";
  for (option in options) {
    filter.innerHTML += `<option>${options[option]}</option>`;
  }
}
