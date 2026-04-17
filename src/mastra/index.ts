
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { CloudflareDeployer } from '@mastra/deployer-cloudflare';
import { D1Store } from '@mastra/cloudflare-d1';
import { env } from 'cloudflare:workers';

import { routeAgent } from './agents/route-agent';

export const mastra = new Mastra({
  agents: { routeAgent },
  storage: new D1Store({
    id: 'route-agent-storage',
    binding: (env as Record<string, unknown>).D1Database as D1Database,
  }),
  deployer: new CloudflareDeployer({
    scope: process.env.CLOUDFLARE_ACCOUNT_ID!,
    name: 'route-agent',
    d1_databases: [
      {
        binding: 'D1Database',
        database_name: 'route-agent-db',
        database_id: '8f4e9a80-2cdd-4381-81cd-3b62ecfce88b',
      },
    ],
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
