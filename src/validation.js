/**
 * Request body validation.
 */

const signatureSchema = {
  player_url: (val) => typeof val === "string" && val.length > 0,
};

const stsSchema = {
  player_url: (val) => typeof val === "string" && val.length > 0,
};

const resolveUrlSchema = {
  player_url: (val) => typeof val === "string" && val.length > 0,
  stream_url: (val) => typeof val === "string" && val.length > 0,
};

function validateObject(obj, schema) {
  const errors = [];
  for (const key in schema) {
    if (!obj.hasOwnProperty(key) || !schema[key](obj[key])) {
      errors.push(`'${key}' is missing or invalid`);
    }
  }
  return { isValid: errors.length === 0, errors };
}

export function withValidation(handler) {
  return async (ctx) => {
    let schema;
    if (ctx.pathname === "/decrypt_signature") {
      schema = signatureSchema;
    } else if (ctx.pathname === "/get_sts") {
      schema = stsSchema;
    } else if (ctx.pathname === "/resolve_url") {
      schema = resolveUrlSchema;
    } else {
      return handler(ctx);
    }

    const { isValid, errors } = validateObject(ctx.body, schema);
    if (!isValid) {
      return { status: 400, body: { error: `Invalid request body: ${errors.join(", ")}` } };
    }

    return handler(ctx);
  };
}
