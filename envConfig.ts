interface EnvConfigOptions {
  type?: 'string' | 'number' | 'boolean';
  required?: boolean;
  default?: any;
}

interface EnvConfigSchema {
  [key: string]: EnvConfigOptions;
}

function validateEnvValue(value: string | undefined, options: EnvConfigOptions, key: string): any {
  if (value === undefined) {
    if (options.required && options.default === undefined) {
      throw new Error(`Required environment variable ${key} is missing`);
    }
    return options.default;
  }

  switch (options.type) {
    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Environment variable must be a number`);
      }
      return num;
    case 'boolean':
      return value.toLowerCase() === 'true';
    default:
      return value;
  }
}

function env(schema: EnvConfigSchema) {
  const result: { [key: string]: any } = {};
  
  for (const [key, options] of Object.entries(schema)) {
    result[key] = validateEnvValue(process.env[key], options, key);
  }
  
  return result;
}

export default env({
  NEXT_PUBLIC_SUPABASE_URL: {
    type: 'string',
    required: true,
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    type: 'string',
    required: true,
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    type: 'string',
    required: false,
  },
});
