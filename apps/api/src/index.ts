import { createApp } from './app';
import { env } from './shared/config/env';

function main(): void {
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`api listening on port ${env.PORT}`);
  });
}

main();
