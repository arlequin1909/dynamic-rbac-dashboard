import { createApp } from './app';

const _DEFAULT_PORT = 4000;

function main(): void {
  const port = Number(process.env.PORT) || _DEFAULT_PORT;
  const app = createApp();

  app.listen(port, () => {
    console.log(`api listening on port ${port}`);
  });
}

main();
