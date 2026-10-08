{ pkgs, ... }:

let
  manifest = builtins.fromJSON (builtins.readFile ./package.json);
  engines = manifest.devEngines;

  nodeMajor = builtins.head (builtins.splitVersion engines.runtime.version);
  pnpmMajor = builtins.head (builtins.splitVersion engines.packageManager.version);

  node = pkgs."nodejs-slim_${nodeMajor}";
  pnpm = pkgs."pnpm_${pnpmMajor}".override {
    nodejs-slim = node;
  };
in
{
  languages.javascript = {
    enable = true;
    package = node;
    corepack.enable = false;
    lsp.enable = false;

    pnpm = {
      enable = true;
      package = pnpm;
      install.enable = false;
    };
  };

  tasks."embed:install".exec = "${pnpm}/bin/pnpm install --frozen-lockfile";
}
