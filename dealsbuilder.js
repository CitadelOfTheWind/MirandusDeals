//gets each miranuds building from opensea and calculates the best current price
// in ETH and in GALA for each one, figured out the Gala store price based on
// size and rarity, and then compares those to get a discount amount
// this list is then ordered by discount

const rarityMultiplier = {
  common: 5,
  uncommon: 7,
  rare: 9,
  epic: 15,
  legendary: 30,
};

const sizeMultiplier = {
  "5x5": 25,
  "10x10": 100,
  "10x20": 200,
  "20x20": 400,
  "20x40": 800,
};

const applicableTokens = ["ETH", "GALA", "WETH", "USDC"];

const refKey = "?ref=0x4605ed5eb12cd5d08d24d6ab0ea6c30acf9f2020";

var assetList = [];
var shopIndex = 0;

function getAsset(tokenId) {
  fetch(
    `https://api.opensea.io/api/v1/asset/0xc36cf0cfcb5d905b8b513860db0cfe63f6cf9f5c/${tokenId}/`,
    { method: "GET" }
  )
    .then((response) => response.json())
    .then((json) => {
      assetList = assetList.concat(json);
      // console.log(json);
    })
    .catch((err) => console.error(err));
}

const getLatestAssets = new Promise((resolve, reject) => {
  //return createDealsList(); //for quick testing, don't re-pull data (comment everything below)
  var repeater = setInterval(function () {
    if (shopIndex < shopdata.length) {
      var tokenId = shopdata[shopIndex].token_id;
      getAsset(tokenId);
      shopIndex++;
    } else {
      clearInterval(repeater);
      var dealsList = createDealsList();
      resolve(dealsList);
    }
  }, 2200);
});

function createDealsList() {
  // console.log("making deals");
  var deals = [];
  for (shop in shopdata) {
    if (shopdata[shop].size != "") {
      //var assetShop = tempAssetList.filter( //for quick testing, use saved data
      var assetShop = assetList.filter(
        (asset) => asset.name == shopdata[shop].name
      )[0];
      if (assetShop && assetShop.orders && assetShop.orders.length > 0) {
        var storePrice = getStorePrice(shopdata[shop]);
        var shopPriceData = getShopDataForAllTokens(assetShop, storePrice);
        var dealCard = {
          shop_name: assetShop.name,
          shop_size: shopdata[shop].size,
          shop_rarity: shopdata[shop].rarity,
          shop_image: assetShop.image_url,
          shop_price_data: shopPriceData,
          store_price_usd: storePrice,
          best_discount: getBestDiscount(shopPriceData),
          link: assetShop.permalink + refKey,
        };
        deals.push(dealCard);
      }
    }
  }
  return getBestDeals(deals);
}

function getBestDiscount(shopPriceData) {
  if (shopPriceData.length == 0) return null;
  return Math.max(...shopPriceData.map((data) => data.discount));
}

function getShopDataForAllTokens(shop, storePrice) {
  var shopPriceData = [];
  for (token in applicableTokens) {
    var data = getShopPriceDataForToken(
      shop,
      storePrice,
      applicableTokens[token]
    );
    if (data) {
      shopPriceData.push(data);
    }
  }
  return shopPriceData.sort((a, b) =>
    a.lowest_usd_price < b.lowest_usd_price ? 1 : -1
  );
}

function getShopPriceDataForToken(shop, storePrice, token) {
  if (shop.orders.length == 0) return null;
  var prices = getPricesByToken(shop.orders, token);
  if (prices.length > 0) {
    var lowestPrice = Math.min(...prices);
    var tokenValue = getTokenValue(shop.orders, token);
    var lowestUSDPrice = lowestPrice * tokenValue;
    var discount = (storePrice - lowestUSDPrice) / storePrice;
    return {
      token: token,
      lowest_price: lowestPrice,
      lowest_usd_price: roundTo2Decimals(lowestUSDPrice),
      discount: roundTo2Decimals(discount * 100),
      prices: prices,
      orders: shop.orders,
    };
  }
  // console.log(shop.name);
  return null;
}

function roundTo2Decimals(value) {
  return Math.round(value * 100) / 100;
}

function getBestDeals(deals) {
  var sortedDeals = deals
    .filter((deal) => deal.best_discount != null)
    .sort((a, b) => (a.best_discount < b.best_discount ? 1 : -1));
  return sortedDeals;
}

function getDiscount(best_eth_usd, best_gala_usd, store_price_usd) {
  var discount = 0;
  var token = "";
  if (best_eth_usd <= best_gala_usd || best_gala_usd === NaN) {
    discount = (store_price_usd - best_eth_usd) / store_price_usd;
    token = "ETH";
  } else {
    discount = (store_price_usd - best_gala_usd) / store_price_usd;
    token = "GALA";
  }
  if (discount[0] != NaN) {
    return [Math.round(discount * 10000) / 100, token];
  }
  return [0, "N/A"];
}

function getTokenValue(orders, token) {
  var tokenOrders = orders.filter(
    (order) =>
      order?.payment_token_contract?.symbol == token && order?.side == 1
  );
  if (tokenOrders && tokenOrders.length > 0) {
    return tokenOrders[0].payment_token_contract.usd_price;
  }
  return 0;
}

function getBestPriceByToken(assetShop, token) {
  var prices = getPricesByToken(assetShop.orders, token);
  // console.log(assetShop.name, token, prices);
  if (prices.length > 0) {
    return Math.min(...prices);
  }
  return "9999999999999999999999999";
}

function getPricesByToken(orders, token) {
  var currencyOrders = orders
    .filter(
      (order) =>
        order?.payment_token_contract?.symbol == token && order?.side == 1
    )
    .map(
      (ord) =>
        parseInt(ord.base_price) /
        Math.pow(10, parseInt(ord.payment_token_contract.decimals))
    );
  return currencyOrders;
}

function getStorePrice(shop) {
  if (shop.size != "") {
    // console.log(
    //   shop.size,
    //   sizeMultiplier[shop.size],
    //   shop.rarity,
    //   rarityMultiplier[shop.rarity]
    // );
    return (storePrice =
      sizeMultiplier[shop.size] * rarityMultiplier[shop.rarity]);
  }
  return 0;
}
