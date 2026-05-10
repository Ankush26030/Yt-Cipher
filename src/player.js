/**
 * YouTube player script identification and URL handling.
 */

import { config } from "./config.js";
import { log } from "./logger.js";

// ─── Player Variants ─────────────────────────────────────────────────────────

export const PlayerVariant = {
  IAS: "IAS",
  IAS_TCC: "IAS_TCC",
  IAS_TCE: "IAS_TCE",
  ES5: "ES5",
  ES6: "ES6",
  ES6_TCC: "ES6_TCC",
  ES6_TCE: "ES6_TCE",
  TV: "TV",
  TV_ES6: "TV_ES6",
  PHONE: "PHONE",
  EMBED: "EMBED",
  HOUSE: "HOUSE",
};

// ─── Variant Details ─────────────────────────────────────────────────────────

class VariantDetail {
  constructor(variant, matchRegex, buildTemplate) {
    this.variant = variant;
    this.matchRegex = matchRegex;
    this.buildTemplate = buildTemplate;
  }

  match(path) {
    const result = path.match(this.matchRegex);
    if (!result) return null;
    return { region: result[1] || null };
  }

  build(region) {
    return this.buildTemplate(region ?? "en_US");
  }
}

const playerVariantDetails = [
  new VariantDetail(PlayerVariant.IAS, /^player_ias\.vflset\/([a-zA-Z_]+)\/base\.js$/, (r) => `player_ias.vflset/${r}/base.js`),
  new VariantDetail(PlayerVariant.IAS_TCC, /^player_ias_tcc\.vflset\/([a-zA-Z_]+)\/base\.js$/, (r) => `player_ias_tcc.vflset/${r}/base.js`),
  new VariantDetail(PlayerVariant.IAS_TCE, /^player_ias_tce\.vflset\/([a-zA-Z_]+)\/base\.js$/, (r) => `player_ias_tce.vflset/${r}/base.js`),
  new VariantDetail(PlayerVariant.ES5, /^player_es5\.vflset\/([a-zA-Z_]+)\/base\.js$/, (r) => `player_es5.vflset/${r}/base.js`),
  new VariantDetail(PlayerVariant.ES6, /^player_es6\.vflset\/([a-zA-Z_]+)\/base\.js$/, (r) => `player_es6.vflset/${r}/base.js`),
  new VariantDetail(PlayerVariant.ES6_TCC, /^player_es6_tcc\.vflset\/([a-zA-Z_]+)\/base\.js$/, (r) => `player_es6_tcc.vflset/${r}/base.js`),
  new VariantDetail(PlayerVariant.ES6_TCE, /^player_es6_tce\.vflset\/([a-zA-Z_]+)\/base\.js$/, (r) => `player_es6_tce.vflset/${r}/base.js`),
  new VariantDetail(PlayerVariant.PHONE, /^player-plasma-ias-phone-([a-zA-Z_]+)\.vflset\/base\.js$/, (r) => `player-plasma-ias-phone-${r}.vflset/base.js`),
  new VariantDetail(PlayerVariant.TV, /^tv-player-ias\.vflset\/tv-player-ias\.js$/, () => `tv-player-ias.vflset/tv-player-ias.js`),
  new VariantDetail(PlayerVariant.TV_ES6, /^tv-player-es6\.vflset\/tv-player-es6\.js$/, () => `tv-player-es6.vflset/tv-player-es6.js`),
  new VariantDetail(PlayerVariant.EMBED, /^player_embed\.vflset\/([a-zA-Z_]+)\/base\.js$/, (r) => `player_ias.vflset/${r}/base.js`),
  new VariantDetail(PlayerVariant.HOUSE, /^house_brand_player\.vflset\/([a-zA-Z_]+)\/base\.js$/, (r) => `house_brand_player.vflset/${r}/base.js`),
];

// ─── PlayerScript Class ──────────────────────────────────────────────────────

export class PlayerScript {
  constructor(id, variant, region) {
    if (id.length !== 8) {
      throw new Error(`Invalid player ID: "${id}". Must be exactly 8 characters.`);
    }
    this.id = id;
    this.variant = variant;
    this.region = region;
  }

  static fromUrl(url) {
    const path = url.startsWith("https") ? new URL(url).pathname : url;
    const pathParts = path.split("/");
    const playerIndex = pathParts.indexOf("player");
    if (playerIndex === -1 || playerIndex + 1 >= pathParts.length) {
      throw new Error(`Invalid player URL: ${url}`);
    }
    const id = pathParts[playerIndex + 1];
    const variantPath = pathParts.slice(playerIndex + 2).join("/");
    for (const detail of playerVariantDetails) {
      const result = detail.match(variantPath);
      if (result) {
        return new PlayerScript(id, detail.variant, result.region);
      }
    }
    throw new Error(`Unknown player variant for URL: ${url}`);
  }

  toUrl() {
    const detail = playerVariantDetails.find((d) => d.variant === this.variant);
    if (!detail) throw new Error(`Cannot build URL for unknown variant: ${this.variant}`);
    const variantPath = detail.build(this.region);
    return `https://www.youtube.com/s/player/${this.id}/${variantPath}`;
  }

  withVariant(variant) {
    return new PlayerScript(this.id, variant, this.region);
  }

  withId(id) {
    return new PlayerScript(id, this.variant, this.region);
  }
}

// ─── Factory with Overrides ──────────────────────────────────────────────────

export function getPlayerScript(playerUrl) {
  let script = PlayerScript.fromUrl(playerUrl);

  if (config.overridePlayerId) {
    log.debug(`Overriding player ID: ${script.id} → ${config.overridePlayerId}`);
    script = script.withId(config.overridePlayerId);
  }

  if (config.overridePlayerVariant) {
    const variant = PlayerVariant[config.overridePlayerVariant];
    if (variant) {
      log.debug(`Overriding player variant: ${script.variant} → ${config.overridePlayerVariant}`);
      script = script.withVariant(variant);
    }
  }

  return script;
}
